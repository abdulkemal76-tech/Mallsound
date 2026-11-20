// Audius API client (v52) — search + resolve for Audius content.
//
// Uses Audius's own public API (api.audius.co) with app_name=MallSound.
// Stream URLs are built by AudiusPlayer from the same API.
//
// KNOWN LIMIT: Audius's catalog is dominated by independent / electronic
// music. A search for Indonesian pop (e.g. "Sheila On 7 Dan") returns
// empty — so do NOT promise that MallSound's catalog songs exist on
// Audius. AudiusPlayer is useful for Audius content (search / trending),
// not a replacement for the YouTube catalog.
import type { Track } from '../../types/music';
import { dbg } from '../debugLog';

export const AUDIUS_APP_NAME = 'MallSound';
const API_BASE = 'https://api.audius.co/v1';

interface AudiusTrackJson {
  id?: string;
  track_id?: number;
  title?: string;
  duration?: number;
  genre?: string;
  user?: { name?: string; handle?: string };
  artwork?: Record<string, string>;
}

function toTrack(item: AudiusTrackJson): Track | null {
  const audiusId = item.id || (item.track_id != null ? String(item.track_id) : null);
  if (!audiusId || !item.title) return null;
  const artist = item.user?.name || item.user?.handle || 'Audius';
  const cover =
    item.artwork?.['480x480'] ||
    item.artwork?.['1000x1000'] ||
    item.artwork?.['150x150'] ||
    '';
  return {
    id: `audius_${audiusId}`,
    title: item.title,
    artist,
    album: 'Audius',
    genre: item.genre || 'Audius',
    durationSec: Math.max(30, Math.round(item.duration || 180)),
    coverUrl: cover,
    audioUrl: '',
    audiusTrackId: audiusId,
    source: 'audius',
    bitrateLabel: 'Audius · Streaming',
    releaseYear: 2024,
    playsCount: 0,
    lyrics: [],
  };
}

/** Search Audius tracks. Returns [] on any failure (catalog search still works). */
export async function searchAudiusTracks(query: string, limit = 8): Promise<Track[]> {
  const q = (query || '').trim();
  if (!q) return [];
  try {
    const res = await fetch(
      `${API_BASE}/tracks/search?query=${encodeURIComponent(q)}&app_name=${AUDIUS_APP_NAME}&limit=${limit}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items: AudiusTrackJson[] = Array.isArray(data?.data) ? data.data : [];
    return items.map(toTrack).filter((t): t is Track => t !== null);
  } catch (err) {
    dbg(`adapter: Audius search failed for "${q}": ${String(err)}`);
    return [];
  }
}

const resolveCache = new Map<string, string | null>();

/** Best-match Audius track id for a title/artist (cached). Null when not found. */
export async function resolveAudiusTrackId(
  title: string,
  artist: string
): Promise<string | null> {
  const key = `${title} — ${artist}`.toLowerCase();
  if (resolveCache.has(key)) return resolveCache.get(key) ?? null;
  const results = await searchAudiusTracks(`${artist} ${title}`.trim(), 5);
  const needle = (title || '').toLowerCase().trim();
  const best =
    results.find(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (needle !== '' && needle.includes(t.title.toLowerCase()))
    ) ||
    results[0] ||
    null;
  const id = best?.audiusTrackId ?? null;
  resolveCache.set(key, id);
  return id;
}
