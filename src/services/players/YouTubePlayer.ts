// YouTubePlayer — MusicPlayer adapter around the EXISTING YouTube flow.
//
// It does NOT reimplement any YouTube logic. App.tsx already drives the
// two YouTubeMusicPlayer instances purely through React state
// (videoId / candidates / isPlaying / seekRequest) and receives events
// through their props (onEnded / onFallbackToPreview / onStateChange).
// This adapter only translates the MusicPlayer interface into those
// state updates, and App forwards the existing prop callbacks into it
// via notifyEnded()/notifyError().
//
// supportsBackground = false: a YouTube video cannot START while its tab
// is hidden on mobile (proven v45-v51). PlayerManager uses this flag to
// defer a YouTube track until the tab is visible again.
import { dbg } from '../debugLog';
import type { MusicPlayer, PlayerTrack } from './MusicPlayer';

export interface YouTubePlayerHooks {
  /** App's setCurrentYtVideoId. */
  setVideoId: (id: string | null) => void;
  /** App's setCurrentYtCandidates. */
  setCandidates: (ids: string[]) => void;
  /** App's setIsPlaying. */
  setPlaying: (playing: boolean) => void;
  /** App's ytSeekRequest setter (sec + nonce). */
  requestSeek?: (sec: number) => void;
}

export class YouTubePlayer implements MusicPlayer {
  readonly supportsBackground = false;
  private endedCbs: Array<() => void> = [];
  private errorCbs: Array<(err: unknown) => void> = [];
  private current: PlayerTrack | null = null;

  constructor(private hooks: YouTubePlayerHooks) {}

  load(track: PlayerTrack): void {
    this.current = track;
    const id = track.youtubeVideoId || null;
    if (!id) {
      dbg(`adapter: YouTubePlayer load "${track.title}" — no youtubeVideoId`);
      this.errorCbs.forEach((cb) => cb(new Error('no youtubeVideoId')));
      return;
    }
    dbg(`adapter: YouTubePlayer load "${track.title}" -> ${id}`);
    this.hooks.setVideoId(id);
    this.hooks.setCandidates(
      track.candidateIds && track.candidateIds.length > 0 ? track.candidateIds : [id]
    );
  }

  play(): void {
    this.hooks.setPlaying(true);
  }

  pause(): void {
    this.hooks.setPlaying(false);
  }

  seek(sec: number): void {
    this.hooks.requestSeek?.(sec);
  }

  on(event: 'ended', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  on(event: string, cb: (...args: unknown[]) => void): void {
    if (event === 'ended') this.endedCbs.push(cb as () => void);
    else if (event === 'error') this.errorCbs.push(cb as (err: unknown) => void);
  }

  /**
   * Called by App from the existing YouTubeMusicPlayer onEnded prop
   * (active player only). The underlying watchdog / cue / ENDED detection
   * inside YouTubeMusicPlayer.tsx is untouched.
   */
  notifyEnded(): void {
    dbg(`adapter: YouTubePlayer ended "${this.current?.title || '?'}"`);
    this.endedCbs.forEach((cb) => cb());
  }

  /** Called by App from the existing onFallbackToPreview prop (video unavailable). */
  notifyError(err: unknown): void {
    this.errorCbs.forEach((cb) => cb(err));
  }

  getCurrentTrack(): PlayerTrack | null {
    return this.current;
  }
}
