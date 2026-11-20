// AudiusPlayer — MusicPlayer adapter backed by a plain <audio> element.
//
// The stream URL is Audius's own public API:
//   https://api.audius.co/v1/tracks/{id}/stream?app_name=MallSound
// which 302-redirects to a signed audio URL on creatornode.audius.co;
// an <audio> element follows that redirect.
//
// supportsBackground = true: unlike the YouTube IFrame player, an
// <audio> element CAN start while the tab is hidden — that is the whole
// point of this adapter. (It plays Audius content only; the pop-Indonesia
// catalog generally is NOT on Audius — see audiusApi.ts.)
//
// Media Session API is owned here while an Audius track is loaded:
// metadata on load, action handlers (play/pause/previoustrack/nexttrack)
// delegating to App's engine-aware handlers, playbackState synced on
// play/pause/ended. The handlers delegate (they do not call the audio
// element directly) so lock-screen controls keep working after the user
// switches back to a YouTube track.
import { dbg } from '../debugLog';
import type { MusicPlayer, PlayerTrack } from './MusicPlayer';

export const AUDIUS_APP_NAME = 'MallSound';

export function audiusStreamUrl(audiusTrackId: string): string {
  return `https://api.audius.co/v1/tracks/${encodeURIComponent(
    audiusTrackId
  )}/stream?app_name=${AUDIUS_APP_NAME}`;
}

export interface AudiusPlayerOptions {
  /** App's engine-aware handlers (play/pause/next/prev), read live so
   *  lock-screen controls keep working for YouTube tracks too. */
  getPlay: () => void;
  getPause: () => void;
  getNext: () => void;
  getPrev: () => void;
  onTimeUpdate?: (currentSec: number, durationSec: number) => void;
}

export class AudiusPlayer implements MusicPlayer {
  readonly supportsBackground = true;
  private audio: HTMLAudioElement;
  private endedCbs: Array<() => void> = [];
  private errorCbs: Array<(err: unknown) => void> = [];
  private current: PlayerTrack | null = null;
  private handlersRegistered = false;

  constructor(private opts: AudiusPlayerOptions) {
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('ended', () => {
      dbg(`adapter: AudiusPlayer ended "${this.current?.title || '?'}"`);
      // Neutral state until the manager starts the next track (which
      // sets 'playing' again); a deferred YouTube next track must NOT
      // leave the lock screen showing "playing" while silent.
      this.setPlaybackState('paused');
      this.endedCbs.forEach((cb) => cb());
    });

    this.audio.addEventListener('error', () => {
      const err = this.audio.error;
      dbg(
        `adapter: AudiusPlayer error "${this.current?.title || '?'}" code=${err?.code ?? '?'}`
      );
      this.errorCbs.forEach((cb) => cb(err));
    });

    this.audio.addEventListener('timeupdate', () => {
      const dur = this.audio.duration || this.current?.durationSec || 0;
      this.opts.onTimeUpdate?.(this.audio.currentTime || 0, dur);
    });
  }

  load(track: PlayerTrack): void {
    this.current = track;
    const id = track.audiusTrackId;
    if (!id) {
      dbg(`adapter: AudiusPlayer load "${track.title}" — no audiusTrackId`);
      this.errorCbs.forEach((cb) => cb(new Error('no audiusTrackId')));
      return;
    }
    const url = audiusStreamUrl(id);
    dbg(`adapter: AudiusPlayer load "${track.title}" -> ${url}`);
    this.ensureMediaSessionHandlers();
    this.setMetadata(track);
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
      // play() can reject (e.g. no user gesture yet / interrupted load).
      // Report through the 'error' channel so the manager can skip ahead;
      // do not rethrow — callers use `void play()`.
      dbg(`adapter: AudiusPlayer play() rejected: ${String(err)}`);
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

  on(event: 'ended', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  on(event: string, cb: (...args: unknown[]) => void): void {
    if (event === 'ended') this.endedCbs.push(cb as () => void);
    else if (event === 'error') this.errorCbs.push(cb as (err: unknown) => void);
  }

  destroy(): void {
    try {
      this.audio.pause();
    } catch {
      // ignore
    }
    this.audio.removeAttribute('src');
    try {
      this.audio.load();
    } catch {
      // ignore
    }
  }

  private ensureMediaSessionHandlers(): void {
    if (this.handlersRegistered) return;
    if (!('mediaSession' in navigator)) return;
    try {
      const ms = navigator.mediaSession;
      // Delegate to App's handlers (not to this audio element directly)
      // so the same lock-screen buttons work for YouTube tracks too.
      ms.setActionHandler('play', () => this.opts.getPlay());
      ms.setActionHandler('pause', () => this.opts.getPause());
      ms.setActionHandler('previoustrack', () => this.opts.getPrev());
      ms.setActionHandler('nexttrack', () => this.opts.getNext());
      this.handlersRegistered = true;
    } catch {
      // Media Session not supported — not critical
    }
  }

  private setMetadata(track: PlayerTrack): void {
    if (!('mediaSession' in navigator)) return;
    try {
      const artwork: MediaImage[] = [];
      if (track.coverUrl) {
        artwork.push(
          { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' }
        );
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'MallSound · Audius',
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
