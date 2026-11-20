// PlayerManager (v52) — picks the playback backend per track and owns
// the queue advance + the background defer rule.
//
// Source selection (v52, remote routing):
//   - a track with audiusTrackId -> AudiusPlayer (<audio>, Audius API).
//   - every other track -> RemoteAudioPlayer (<audio>, .mp3 from the
//     user's own backend via resolveTrackUrl — NOT YouTubePlayer).
//   YouTubePlayer stays in the layer (wrapped, not deleted) and the
//   YouTube stage/components stay for the UI, but songs no longer route
//   through it.
//
// SINGLE <audio> INSTANCE: this manager creates ONE <audio> element and
// passes it to AudiusPlayer AND RemoteAudioPlayer via their constructors.
// On track change only the `src` is swapped — a new Audio() is never
// created and the element is never destroyed — so the browser treats it
// as a continuation of the same media session, not a new autoplay. Only
// the active player forwards events from the shared element (setActive).
//
// The defer rule — kept as a guard:
//   when a track ends or Next is pressed, if the tab is hidden AND the
//   player for the NEXT track cannot start while hidden
//   (supportsBackground === false), do NOT start it now. Park it and
//   start it when the tab becomes visible again. With the current routing
//   both players support background, so defer is a fallback, not the
//   normal path.
//
// Error handling (remote backend): if resolveTrackUrl fails (HTTP 404,
// success === false, network error, empty streamUrl) the manager shows
// the "Lagu tidak tersedia di server" toast and STOPS — it does NOT
// chain-advance to the next track. The same applies to an audio-element
// error on a remote track. (Audius errors still skip to the next track,
// as before.)
//
// The manager does NOT own React state. App injects its callbacks through
// PlayerManagerApi (read live via a ref so closures never go stale), and
// App syncs the manager's queue whenever its own queue / current track
// changes. Both players' 'ended' events are forwarded here, and next()
// is the single advance choke point.
import { dbg } from '../debugLog';
import type { Track } from '../../types/music';
import type { MusicPlayer, PlayerTrack } from './MusicPlayer';
import { toPlayerTrack } from './MusicPlayer';
import { YouTubePlayer, type YouTubePlayerHooks } from './YouTubePlayer';
import { AudiusPlayer, type AudiusPlayerOptions } from './AudiusPlayer';
import { RemoteAudioPlayer, type RemoteAudioPlayerOptions } from './RemoteAudioPlayer';
import { resolveTrackUrl, type RemoteStreamResult } from './remoteAudioApi';

export type PlayerSource = 'audius' | 'remote';

export type RepeatModeValue = 'off' | 'all' | 'one';

export interface PlayerManagerApi {
  /** Start a track through App's existing selection machinery (YT path). */
  selectTrack: (track: Track) => void;
  /** App starts an Audius track: update App state, then the manager loads + plays it. */
  startAudiusTrack: (track: Track) => void;
  /** App starts a remote track: update App state (currentTrack, isPlaying,
   *  remoteActive), then the manager resolves the URL and loads + plays it. */
  startRemoteTrack: (track: Track) => void;
  /** Remote track unavailable (resolve failed / audio error): show the
   *  "Lagu tidak tersedia di server" toast and stop (no chain advance). */
  onTrackUnavailable: (track: Track) => void;
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

export interface PlayerManagerConfig {
  youTubeHooks: YouTubePlayerHooks;
  audiusOptions: Omit<AudiusPlayerOptions, 'audio'>;
  remoteOptions: Omit<RemoteAudioPlayerOptions, 'audio'>;
  api: PlayerManagerApi;
}

export class PlayerManager {
  /** The three adapters. The manager owns them (and the shared element). */
  readonly youTube: YouTubePlayer;
  readonly audius: AudiusPlayer;
  readonly remote: RemoteAudioPlayer;

  /** App callbacks (startRemoteTrack / onTrackUnavailable / queue state).
   *  Stored from config.api — every method below reads through this. */
  private api: PlayerManagerApi;

  /** The single shared <audio> element for Audius + Remote. */
  private sharedAudio: HTMLAudioElement;
  /** Which adapter currently owns the shared element / YT stage. */
  private activePlayer: 'audius' | 'remote' | 'youtube' | null = null;

  private queue: Track[] = [];
  private index = -1;
  private pendingTrack: Track | null = null;
  private consecutiveErrors = 0;
  private currentTrack: Track | null = null;
  /** True when the current remote track failed to resolve/load. App uses
   *  this to decide play (resume) vs playTrack (retry) on a play press. */
  remoteFailed = false;

  constructor(config: PlayerManagerConfig) {
    // App callbacks (config.api) — stored once; every method reads via this.api.
    this.api = config.api;
    // ONE <audio> element, shared by AudiusPlayer and RemoteAudioPlayer.
    this.sharedAudio = new Audio();
    this.sharedAudio.preload = 'auto';

    this.youTube = new YouTubePlayer(config.youTubeHooks);
    this.audius = new AudiusPlayer({ ...config.audiusOptions, audio: this.sharedAudio });
    this.remote = new RemoteAudioPlayer({ ...config.remoteOptions, audio: this.sharedAudio });

    this.audius.on('ended', () => this.handleEnded());
    this.remote.on('ended', () => this.handleEnded());
    this.youTube.on('ended', () => this.handleEnded());
    this.audius.on('error', () => this.handlePlayerError('audius'));
    this.remote.on('error', () => this.handlePlayerError('remote'));
    this.youTube.on('error', () => this.handlePlayerError('youtube'));
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  sourceOf(track: Track | PlayerTrack): PlayerSource {
    if (track.audiusTrackId) return 'audius';
    return 'remote';
  }

  playerFor(track: Track | PlayerTrack): MusicPlayer {
    return this.sourceOf(track) === 'audius' ? this.audius : this.remote;
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

  getActivePlayer(): 'audius' | 'remote' | 'youtube' | null {
    return this.activePlayer;
  }

  playTrack(track: Track): void {
    const source = this.sourceOf(track);
    this.currentTrack = track;
    dbg(
      `adapter: playTrack "${track.title}" via ${source} (hidden=${document.hidden})`
    );
    if (source === 'audius') {
      this.setActivePlayer('audius');
      this.api.startAudiusTrack(track);
      this.audius.load(toPlayerTrack(track));
      void this.audius.play();
    } else {
      // Remote (.mp3 from the user's backend). Resolved async; App state
      // is updated immediately (optimistic) and the audio starts once the
      // URL arrives. On failure the toast shows and playback stops.
      this.setActivePlayer('remote');
      void this.startRemote(track);
    }
    this.consecutiveErrors = 0;
  }

  play(): void {
    if (this.activePlayer === 'audius') {
      void this.audius.play();
      return;
    }
    if (this.activePlayer === 'remote') {
      void this.remote.play();
      return;
    }
    if (this.activePlayer === 'youtube') {
      this.youTube.play();
      return;
    }
    const track = this.currentTrack || this.api.getCurrentTrack();
    if (!track) return;
    if (this.sourceOf(track) === 'audius') void this.audius.play();
    else void this.remote.play();
  }

  pause(): void {
    this.audius.pause();
    this.remote.pause();
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

  private setActivePlayer(player: 'audius' | 'remote' | 'youtube'): void {
    this.activePlayer = player;
    // Only the active player forwards events from the shared <audio>.
    this.audius.setActive(player === 'audius');
    this.remote.setActive(player === 'remote');
  }

  /**
   * Remote track start: resolve the .mp3 URL from the user's backend,
   * then load it into the shared <audio> element and play. App state was
   * already updated (optimistic) by api.startRemoteTrack.
   */
  private async startRemote(track: Track): Promise<void> {
    this.remoteFailed = false;
    this.api.startRemoteTrack(track);
    // Stop any Audius audio still on the shared element before swapping src.
    this.audius.pause();
    let resolved: RemoteStreamResult | null = null;
    try {
      resolved = await resolveTrackUrl(track);
    } catch (err) {
      // resolveTrackUrl throws RemoteAudioUnavailableError on 404 /
      // success false / network error / empty streamUrl.
      dbg(`adapter: resolveTrackUrl threw for "${track.title}": ${String(err)}`);
      resolved = null;
    }
    if (!resolved || !resolved.streamUrl) {
      this.remoteFailed = true;
      dbg(`adapter: remote track unavailable "${track.title}"`);
      this.api.onTrackUnavailable(track);
      return;
    }
    const metadata = {
      title: resolved.title || track.title,
      artist: resolved.artist || track.artist,
      album: track.album,
      coverUrl: resolved.artwork || track.coverUrl,
    };
    // Only swap the src of the SAME shared element — never a new Audio().
    this.remote.load(resolved.streamUrl, metadata);
    await this.remote.play();
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
   * becomes visible. A background-capable player (Audius / Remote <audio>)
   * starts immediately, so with the current routing defer is only a
   * fallback guard, not the normal path.
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
    if (source === 'remote') {
      // Remote backend / stream failure: toast and STOP — never chain
      // advance (the next track would fail the same way while the
      // backend is down, spamming toasts).
      this.remoteFailed = true;
      const track = this.currentTrack || this.api.getCurrentTrack();
      if (track) this.api.onTrackUnavailable(track);
      this.consecutiveErrors = 0;
      return;
    }
    if (this.consecutiveErrors >= 3) {
      dbg('adapter: too many consecutive player errors, stopping auto-advance');
      this.consecutiveErrors = 0;
      return;
    }
    // Audius / YouTube error: skip to the next track (defer rule still
    // applies inside next()).
    this.next();
  }

  destroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.audius.destroy();
    this.remote.destroy();
    try {
      this.sharedAudio.pause();
    } catch {
      // ignore
    }
  }
}
