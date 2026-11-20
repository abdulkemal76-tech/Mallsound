// RemoteAudioPlayer — generic MusicPlayer for an external audio file URL
// (.mp3/.m4a) from the user's own backend (see remoteAudioApi.ts).
//
// It plays through a plain HTML5 <audio> element, so it CAN start while
// the tab is hidden (supportsBackground = true).
//
// SINGLE <audio> INSTANCE: PlayerManager creates ONE <audio> element and
// passes it to BOTH AudiusPlayer and RemoteAudioPlayer via their
// constructors. On track change only the `src` is swapped — a new Audio()
// is never created and the element is never destroyed — so the browser
// treats it as a continuation of the same media session, not a new
// autoplay. Because both players share the element, each one only
// forwards events (ended / error / timeupdate) while it is the ACTIVE
// player (see setActive(), driven by PlayerManager on every switch).
//
// Media Session API: metadata (title/artist/album/artwork) + action
// handlers (play/pause/previoustrack/nexttrack) delegating to App's
// engine-aware handlers, playbackState synced on play/pause/ended.
import { dbg } from '../debugLog';
import type { MusicPlayer, PlayerTrack } from './MusicPlayer';

export interface RemoteTrackMetadata {
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
}

export interface RemoteAudioPlayerOptions {
  /** The single shared <audio> element, created by PlayerManager. */
  audio: HTMLAudioElement;
  /** App's engine-aware handlers (play/pause/next/prev), read live. */
  getPlay: () => void;
  getPause: () => void;
  getNext: () => void;
  getPrev: () => void;
  onTimeUpdate?: (currentSec: number, durationSec: number) => void;
}

export class RemoteAudioPlayer implements MusicPlayer {
  readonly supportsBackground = true;
  private audio: HTMLAudioElement;
  private endedCbs: Array<() => void> = [];
  private errorCbs: Array<(err: unknown) => void> = [];
  private current: PlayerTrack | null = null;
  private currentMeta: RemoteTrackMetadata | null = null;
  private handlersRegistered = false;
  /** Only the active player forwards events from the shared element. */
  private active = false;

  private onEnded = (): void => {
    if (!this.active) return;
    dbg(`adapter: RemoteAudioPlayer ended "${this.currentMeta?.title || this.current?.title || '?'}"`);
    this.setPlaybackState('paused');
    this.endedCbs.forEach((cb) => cb());
  };

  private onError = (): void => {
    if (!this.active) return;
    const err = this.audio.error;
    dbg(
      `adapter: RemoteAudioPlayer error "${this.currentMeta?.title || this.current?.title || '?'}" code=${err?.code ?? '?'}`
    );
    this.errorCbs.forEach((cb) => cb(err));
  };

  private onTimeUpdate = (): void => {
    if (!this.active) return;
    const dur = this.audio.duration || this.current?.durationSec || 0;
    this.opts.onTimeUpdate?.(this.audio.currentTime || 0, dur);
  };

  constructor(private opts: RemoteAudioPlayerOptions) {
    this.audio = opts.audio;
    this.audio.addEventListener('ended', this.onEnded);
    this.audio.addEventListener('error', this.onError);
    this.audio.addEventListener('timeupdate', this.onTimeUpdate);
  }

  /** Only the active player forwards events from the shared <audio>. */
  setActive(active: boolean): void {
    this.active = active;
  }

  isActive(): boolean {
    return this.active;
  }

  /**
   * Primary form (used by PlayerManager): load a resolved stream URL with
   * the metadata from the backend response (falling back to the track's
   * own metadata when the response omits a field).
   */
  load(trackUrl: string, metadata: RemoteTrackMetadata): void;
  /**
   * MusicPlayer form: load a PlayerTrack whose audioUrl already holds a
   * direct audio URL (e.g. a preview / blob URL). Used only when the URL
   * is known without a backend resolve.
   */
  load(track: PlayerTrack): void;
  load(a: string | PlayerTrack, b?: RemoteTrackMetadata): void {
    if (typeof a === 'string') {
      const metadata: RemoteTrackMetadata = b || { title: 'Tanpa Judul', artist: '' };
      this.currentMeta = metadata;
      this.current = null;
      dbg(`adapter: RemoteAudioPlayer load "${metadata.title}" -> ${a}`);
      this.ensureMediaSessionHandlers();
      this.setMetadata(metadata);
      this.audio.src = a;
      try {
        this.audio.load();
      } catch {
        // ignore
      }
      return;
    }
    const track = a;
    this.current = track;
    const url = track.audioUrl || '';
    if (!url) {
      dbg(`adapter: RemoteAudioPlayer load "${track.title}" — no audioUrl`);
      this.errorCbs.forEach((cb) => cb(new Error('no audioUrl')));
      return;
    }
    const metadata: RemoteTrackMetadata = {
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverUrl: track.coverUrl,
    };
    this.currentMeta = metadata;
    dbg(`adapter: RemoteAudioPlayer load "${track.title}" -> ${url}`);
    this.ensureMediaSessionHandlers();
    this.setMetadata(metadata);
    this.audio.src = url;
    try {
      this.audio.load();
    } catch {
      // ignore
    }
  }

  async play(): Promise<void> {
    this.ensureMediaSessionHandlers();
    try {
      await this.audio.play();
      this.setPlaybackState('playing');
    } catch (err) {
      dbg(`adapter: RemoteAudioPlayer play() rejected: ${String(err)}`);
      this.errorCbs.forEach((cb) => cb(err));
    }
  }

  pause(): void {
    try {
      this.audio.pause();
    } catch {
      // ignore
    }
    this.setPlaybackState('paused');
  }

  seek(sec: number): void {
    try {
      this.audio.currentTime = sec;
    } catch {
      // ignore
    }
  }

  getCurrentTimeSec(): number {
    return this.audio.currentTime || 0;
  }

  getDurationSec(): number {
    return this.audio.duration || this.current?.durationSec || 0;
  }

  /** True when a src is loaded (used by App to decide play vs retry). */
  hasSource(): boolean {
    return this.audio.src !== '';
  }

  on(event: 'ended', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  on(event: string, cb: (...args: unknown[]) => void): void {
    if (event === 'ended') this.endedCbs.push(cb as () => void);
    else if (event === 'error') this.errorCbs.push(cb as (err: unknown) => void);
  }

  /** Detach listeners. Does NOT clear the shared element's src — the
   *  PlayerManager owns the element. */
  destroy(): void {
    this.audio.removeEventListener('ended', this.onEnded);
    this.audio.removeEventListener('error', this.onError);
    this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
  }

  private ensureMediaSessionHandlers(): void {
    if (this.handlersRegistered) return;
    if (!('mediaSession' in navigator)) return;
    try {
      const ms = navigator.mediaSession;
      ms.setActionHandler('play', () => this.opts.getPlay());
      ms.setActionHandler('pause', () => this.opts.getPause());
      ms.setActionHandler('previoustrack', () => this.opts.getPrev());
      ms.setActionHandler('nexttrack', () => this.opts.getNext());
      this.handlersRegistered = true;
    } catch {
      // Media Session not supported — not critical
    }
  }

  private setMetadata(meta: RemoteTrackMetadata): void {
    if (!('mediaSession' in navigator)) return;
    try {
      const artwork: MediaImage[] = [];
      if (meta.coverUrl) {
        artwork.push(
          { src: meta.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: meta.coverUrl, sizes: '192x192', type: 'image/jpeg' }
        );
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist,
        album: meta.album || 'MallSound',
        artwork,
      });
    } catch {
      // ignore
    }
  }

  private setPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // ignore
    }
  }
}
