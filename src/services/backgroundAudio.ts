/**
 * MallSound Background Audio Service
 * Handles:
 * 1. Media Session API — notification/lock screen controls
 * 2. Screen Wake Lock — prevents background tab throttling
 * 3. Visibility change recovery — resume audio when tab regains focus
 * 4. AudioContext keep-alive — silent node to prevent suspension
 */

import { Track } from '../types/music';

type PlaybackAction = () => void;

interface MediaSessionHandlers {
  onPlay: PlaybackAction;
  onPause: PlaybackAction;
  onNextTrack: PlaybackAction;
  onPrevTrack: PlaybackAction;
  onSeekTo?: (sec: number) => void;
}

class BackgroundAudioService {
  private wakeLock: WakeLockSentinel | null = null;
  private silentBuffer: AudioBufferSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private silentCtx: AudioContext | null = null;
  private silentTimerId: number | null = null;
  private silentAudioElement: HTMLAudioElement | null = null;
  private handlers: MediaSessionHandlers | null = null;
  private currentTrack: Track | null = null;
  private isPlaying = false;

  /**
   * Initialize the background service with playback action handlers.
   * Call once on app mount.
   */
  public init(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
    try {
      // 1-second silent PCM WAV looped to hold the OS audio session open on mobile Android & desktop
      this.silentAudioElement = new Audio(
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      );
      this.silentAudioElement.loop = true;
      this.silentAudioElement.volume = 0.001;
    } catch {
      // ignore
    }
    this.registerMediaSessionHandlers();
    this.registerVisibilityHandler();
    this.startSilentAudioKeepAlive();
  }

  /**
   * Update action handlers so closures never become stale
   */
  public updateHandlers(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
  }

  /**
   * Must be called synchronously during user click/touch gesture
   * to unlock Android Chrome audio background permission!
   */
  public ensureAudioActive() {
    try {
      if (this.silentAudioElement) {
        const p = this.silentAudioElement.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
      if (this.silentCtx && this.silentCtx.state === 'suspended') {
        this.silentCtx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
    this.acquireWakeLock();
  }

  /**
   * Register Media Session action handlers for lock screen / notification controls.
   */
  private registerMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;

    const ms = navigator.mediaSession;

    ms.setActionHandler('play', () => {
      this.handlers?.onPlay();
    });

    ms.setActionHandler('pause', () => {
      this.handlers?.onPause();
    });

    ms.setActionHandler('nexttrack', () => {
      this.handlers?.onNextTrack();
    });

    ms.setActionHandler('previoustrack', () => {
      this.handlers?.onPrevTrack();
    });

    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.handlers?.onSeekTo?.(details.seekTime);
      }
    });

    ms.setActionHandler('stop', () => {
      this.handlers?.onPause();
    });
  }

  /**
   * Update the Media Session metadata (track info shown on lock screen).
   */
  public updateNowPlaying(track: Track) {
    this.currentTrack = track;
    if (!('mediaSession' in navigator)) return;

    const artwork: MediaImage[] = [];
    if (track.coverUrl) {
      artwork.push(
        { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
        { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'MallSound',
      artwork,
    });
  }

  /**
   * Update the Media Session playback state shown on lock screen.
   */
  public updatePlaybackState(playing: boolean) {
    this.isPlaying = playing;
    if (playing) {
      try {
        this.silentAudioElement?.play().catch(() => {});
        if (this.silentCtx && this.silentCtx.state === 'suspended') {
          this.silentCtx.resume().catch(() => {});
        }
      } catch {
        // ignore
      }
      this.acquireWakeLock();
    } else {
      try {
        this.silentAudioElement?.pause();
      } catch {
        // ignore
      }
      this.releaseWakeLock();
    }
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }

  /**
   * Update the Media Session position state (progress bar on lock screen).
   */
  public updatePositionState(currentTimeSec: number, durationSec: number, playbackRate = 1) {
    if (!('mediaSession' in navigator)) return;
    if (!Number.isFinite(durationSec) || durationSec <= 0) return;
    if (!Number.isFinite(currentTimeSec)) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: durationSec,
        playbackRate,
        position: Math.min(currentTimeSec, durationSec),
      });
    } catch {
      // Some browsers don't support setPositionState
    }
  }

  /**
   * Acquire a Wake Lock to prevent the browser from throttling audio
   * in background tabs on mobile.
   */
  public async acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      if (this.wakeLock && !this.wakeLock.released) return; // already held
      this.wakeLock = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        // Reacquire wake lock after a tab becomes visible again
        if (this.isPlaying) {
          this.acquireWakeLock();
        }
      });
    } catch {
      // Wake lock not supported or permission denied — not critical
    }
  }

  /**
   * Release Wake Lock when user manually pauses or leaves DJ mode.
   */
  public releaseWakeLock() {
    if (this.wakeLock && !this.wakeLock.released) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  /**
   * Play a completely silent AudioContext loop.
   * This prevents Android Chrome from suspending the AudioContext
   * and killing audio when the screen turns off or the tab is backgrounded.
   */
  private startSilentAudioKeepAlive() {
    if (typeof window === 'undefined') return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx({ sampleRate: 22050 });
    this.silentCtx = ctx;

    const startSilentNode = () => {
      if (ctx.state === 'closed') return;

      // Create 1-second silent buffer
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = 0.001; // Near-silent, not completely 0 to avoid optimization
      source.connect(gain);
      gain.connect(ctx.destination);

      source.loop = false;
      source.start(0);
      source.onended = () => {
        // Restart every second to keep the audio context alive
        this.silentTimerId = window.setTimeout(() => {
          if (this.isPlaying) {
            startSilentNode();
          }
        }, 1000);
      };
    };

    // Only run keep-alive when actively playing
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isPlaying) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(startSilentNode).catch(() => {});
        } else {
          startSilentNode();
        }
      }
    });
  }

  /**
   * Handle page becoming visible again after being backgrounded.
   * Android Chrome sometimes suspends AudioContext when tab is hidden.
   */
  private registerVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Re-acquire wake lock
        if (this.isPlaying) {
          this.acquireWakeLock();
        }

        // Resume any suspended audio contexts
        if (this.silentCtx && this.silentCtx.state === 'suspended') {
          this.silentCtx.resume().catch(() => {});
        }
      }
    });

    // Also handle when app goes to background
    window.addEventListener('blur', () => {
      if (this.isPlaying && this.silentCtx?.state === 'running') {
        // Keep the silent loop running
      }
    });
  }

  /**
   * Stop all background services cleanly.
   */
  public destroy() {
    if (this.silentTimerId !== null) {
      window.clearTimeout(this.silentTimerId);
    }
    this.releaseWakeLock();
    if (this.silentCtx && this.silentCtx.state !== 'closed') {
      this.silentCtx.close().catch(() => {});
    }
  }
}

// Singleton export
export const backgroundAudioService = new BackgroundAudioService();
