// MallSound player adapter layer (v52).
//
// One interface for every playback backend. The YouTube backend cannot
// START while its tab is hidden on mobile (proven across v45-v51: load,
// cue, mute and watchdog retries are all ignored while hidden). The
// Audius backend plays a plain <audio> element, which CAN start while
// hidden. PlayerManager picks the backend per track and defers a
// non-background track when the tab is hidden.
//
// This layer WRAPS the existing players — it does not rewrite them.
// YouTubeMusicPlayer.tsx keeps its own watchdog / cue / mute logic.
import type { Track } from '../../types/music';

export interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  youtubeVideoId?: string | null;
  audiusTrackId?: string | null;
  /** Direct audio URL when already known (preview / blob URL).
   *  RemoteAudioPlayer.load(track) uses this; the normal remote path
   *  resolves the URL first and calls load(url, metadata) instead. */
  audioUrl?: string | null;
  /** Extra YouTube candidates (used by the two-player flip). */
  candidateIds?: string[];
  coverUrl?: string;
  durationSec?: number;
}

export function toPlayerTrack(track: Track): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    youtubeVideoId: track.youtubeVideoId ?? null,
    audiusTrackId: track.audiusTrackId ?? null,
    audioUrl: track.audioUrl ?? null,
    coverUrl: track.coverUrl,
    durationSec: track.durationSec,
  };
}

export type PlayerEvent = 'ended' | 'error';

export interface MusicPlayer {
  /** True when this backend can START playback while the tab is hidden. */
  readonly supportsBackground: boolean;
  load(track: PlayerTrack): void | Promise<void>;
  play(): void | Promise<void>;
  pause(): void;
  on(event: 'ended', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
}
