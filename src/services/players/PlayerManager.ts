// PlayerManager (v52) — picks the playback backend per track and owns
// the queue advance + the background defer rule.
//
// Source selection: a track with audiusTrackId plays through AudiusPlayer
// (<audio>, background-capable); anything else goes through YouTubePlayer
// (the existing two-player / flip / watchdog flow, untouched).
//
// The defer rule — the point of this layer:
//   when a track ends or Next is pressed, if the tab is hidden AND the
//   player for the NEXT track cannot start while hidden
//   (supportsBackground === false), do NOT start it now. Park it and
//   start it when the tab becomes visible again. A background-capable
//   player (Audius) starts immediately even while hidden.
//
// The manager does NOT own React state. App injects its callbacks through
// PlayerManagerApi (read live via a ref so closures never go stale), and
// App syncs the manager's queue whenever its own queue / current track
// changes. The manager's 'ended' wiring: both players' 'ended' events
// are forwarded here, and next() is the single advance choke point.
import { dbg } from '../debugLog';
import type { Track } from '../../types/music';
import type { MusicPlayer, PlayerTrack } from './MusicPlayer';
import { toPlayerTrack } from './MusicPlayer';
import type { YouTubePlayer } from './YouTubePlayer';
import type { AudiusPlayer } from './AudiusPlayer';

export type PlayerSource = 'audius' | 'youtube';

export type RepeatModeValue = 'off' | 'all' | 'one';

export interface PlayerManagerApi {
  /** Start a track through App's existing selection machinery (YT path). */
  selectTrack: (track: Track) => void;
  /** App starts an Audius track: update App state, then the manager loads + plays it. */
  startAudiusTrack: (track: Track) => void;
  /** Restart the current track from 0 (repeat-one / prev within 4 s). */
  restartCurrent: () => void;
  /** Current playback position in seconds (prev restart check). */
  getCurrentTimeSec: () => number;
  /** True when shuffle is on (manager picks a random next/prev). */
  getShuffle: () => boolean;
  /** Current repeat mode. */
  getRepeatMode: () => RepeatModeValue;
  /** Current track (for logging / replay detection). */
  getCurrentTrack: () => Track | null;
}

export class PlayerManager {
  private queue: Track[] = [];
  private index = -1;
  private pendingTrack: Track | null = null;
  private consecutiveErrors = 0;
  private currentTrack: Track | null = null;

  constructor(
    private youTube: YouTubePlayer,
    private audius: AudiusPlayer,
    private api: PlayerManagerApi
  ) {
    this.youTube.on('ended', () => this.handleEnded());
    this.audius.on('ended', () => this.handleEnded());
    this.youTube.on('error', () => this.handlePlayerError('youtube'));
    this.audius.on('error', () => this.handlePlayerError('audius'));
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  sourceOf(track: Track | PlayerTrack): PlayerSource {
    if (track.audiusTrackId) return 'audius';
    return 'youtube';
  }

  playerFor(track: Track | PlayerTrack): MusicPlayer {
    return this.sourceOf(track) === 'audius' ? this.audius : this.youTube;
  }

  /** App syncs the effective sequence here (current track + what follows it). */
  setQueue(tracks: Track[], currentIndex: number): void {
    this.queue = tracks;
    this.index = currentIndex;
  }

  getQueue(): Track[] {
    return this.queue;
  }

  getIndex(): number {
    return this.index;
  }

  getPendingTrack(): Track | null {
    return this.pendingTrack;
  }

  playTrack(track: Track): void {
    const source = this.sourceOf(track);
    this.currentTrack = track;
    dbg(
      `adapter: playTrack "${track.title}" via ${source} (hidden=${document.hidden})`
    );
    if (source === 'audius') {
      // Stop the YouTube stage first so two sources never sound together.
      // (App's audiusActive state gates the YT players' isPlaying prop.)
      this.api.startAudiusTrack(track);
      this.audius.load(toPlayerTrack(track));
      void this.audius.play();
    } else {
      // YouTube path: App's handleSelectTrack runs the existing flow
      // (flip / pre-roll / watchdog / lyrics) and stops Audius there.
      this.api.selectTrack(track);
    }
    this.consecutiveErrors = 0;
  }

  play(): void {
    const track = this.currentTrack || this.api.getCurrentTrack();
    if (!track) return;
    if (this.sourceOf(track) === 'audius') void this.audius.play();
    else this.youTube.play();
  }

  pause(): void {
    this.audius.pause();
    this.youTube.pause();
  }

  /** Advance to the next track, applying the background defer rule. */
  next(): void {
    const repeat = this.api.getRepeatMode();
    if (repeat === 'one') {
      dbg('adapter: next() — repeat-one, restarting current track');
      this.api.restartCurrent();
      return;
    }
    const nextTrack = this.pickNextTrack();
    if (!nextTrack) {
      // Queue not synced yet (or empty) — nothing to advance to.
      dbg('adapter: next() — manager queue empty, nothing to advance to');
      return;
    }
    this.advanceTo(nextTrack);
  }

  prev(): void {
    if (this.api.getCurrentTimeSec() > 4) {
      dbg('adapter: prev() — >4s in, restarting current track');
      this.api.restartCurrent();
      return;
    }
    const prevTrack = this.pickPrevTrack();
    if (!prevTrack) return;
    this.advanceTo(prevTrack);
  }

  /** Called when the active player's track ends. */
  handleEnded(): void {
    dbg(`adapter: ended received (hidden=${document.hidden})`);
    this.next();
  }

  private pickNextTrack(): Track | null {
    if (this.queue.length === 0) return null;
    if (this.api.getShuffle() && this.queue.length > 1) {
      const candidates = this.queue.filter((_, i) => i !== this.index);
      return candidates[Math.floor(Math.random() * candidates.length)] || null;
    }
    const nextIdx = (this.index + 1) % this.queue.length;
    return this.queue[nextIdx] ?? null;
  }

  private pickPrevTrack(): Track | null {
    if (this.queue.length === 0) return null;
    if (this.api.getShuffle() && this.queue.length > 1) {
      const candidates = this.queue.filter((_, i) => i !== this.index);
      return candidates[Math.floor(Math.random() * candidates.length)] || null;
    }
    const prevIdx = (this.index - 1 + this.queue.length) % this.queue.length;
    return this.queue[prevIdx] ?? null;
  }

  /**
   * The defer rule: a track whose player cannot start while hidden must
   * NOT be started while hidden — it is parked and started when the tab
   * becomes visible. A background-capable player (Audius <audio>) starts
   * immediately, so an Audius track (or an Audius next track) keeps the
   * queue moving in the background.
   */
  private advanceTo(track: Track): void {
    const player = this.playerFor(track);
    if (document.hidden && !player.supportsBackground) {
      this.pendingTrack = track;
      dbg(
        `adapter: DEFER next track "${track.title}" (${this.sourceOf(track)}) — hidden + no background support, waiting for visible`
      );
      return;
    }
    this.pendingTrack = null;
    const idx = this.queue.findIndex((t) => t.id === track.id);
    if (idx !== -1) this.index = idx;
    this.playTrack(track);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible') return;
    if (!this.pendingTrack) return;
    const track = this.pendingTrack;
    this.pendingTrack = null;
    dbg(`adapter: tab visible — starting deferred track "${track.title}"`);
    this.playTrack(track);
  };

  private handlePlayerError(source: string): void {
    this.consecutiveErrors += 1;
    dbg(`adapter: player error (${source}), consecutive=${this.consecutiveErrors}`);
    if (this.consecutiveErrors >= 3) {
      dbg('adapter: too many consecutive player errors, stopping auto-advance');
      this.consecutiveErrors = 0;
      return;
    }
    // Skip to the next track (the defer rule still applies inside next()).
    this.next();
  }

  destroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
