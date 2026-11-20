// remoteAudioApi — resolves a track to a direct audio URL via the user's
// own backend.
//
// The backend only returns a direct link to an .mp3/.m4a file. No YouTube
// scraping or extraction happens here (or anywhere in this app).
//
// Swap REMOTE_AUDIO_API_BASE_URL to the real backend domain in production.
// NOTE: the placeholder domain api.mallsound.local does NOT resolve on the
// public internet — fetch will fail (network error) until the real backend
// is live and the constant below is updated. The PlayerManager treats
// that as "Lagu tidak tersedia di server" (toast) instead of crashing.
export const REMOTE_AUDIO_API_BASE_URL =
  'https://api.mallsound.local/v1/get-stream';

export interface RemoteStreamResult {
  streamUrl: string;
  title: string;
  artist: string;
  artwork?: string;
}

export class RemoteAudioUnavailableError extends Error {
  constructor(message = 'Lagu tidak tersedia di server') {
    super(message);
    this.name = 'RemoteAudioUnavailableError';
  }
}

export interface ResolveTrackInput {
  youtubeVideoId?: string | null;
  id: string;
}

/**
 * GET {REMOTE_AUDIO_API_BASE_URL}?id={videoId}
 * Success (200): { success: true, data: { streamUrl, title, artist, artwork } }
 * Throws RemoteAudioUnavailableError on: network failure, HTTP 404,
 * non-OK status, success === false, or a missing streamUrl.
 */
export async function resolveTrackUrl(
  track: ResolveTrackInput
): Promise<RemoteStreamResult> {
  const id = track.youtubeVideoId || track.id;
  let res: Response;
  try {
    res = await fetch(
      `${REMOTE_AUDIO_API_BASE_URL}?id=${encodeURIComponent(id)}`
    );
  } catch {
    // DNS / network failure (e.g. the placeholder .local domain is not live yet).
    throw new RemoteAudioUnavailableError();
  }
  if (res.status === 404) throw new RemoteAudioUnavailableError();
  if (!res.ok) throw new RemoteAudioUnavailableError();
  const json: unknown = await res.json().catch(() => null);
  const data = (json as { data?: Record<string, unknown> } | null)?.data;
  const success = (json as { success?: unknown } | null)?.success;
  if (success !== true || typeof data?.streamUrl !== 'string' || !data.streamUrl) {
    throw new RemoteAudioUnavailableError();
  }
  return {
    streamUrl: data.streamUrl,
    title: typeof data.title === 'string' ? data.title : '',
    artist: typeof data.artist === 'string' ? data.artist : '',
    artwork: typeof data.artwork === 'string' ? data.artwork : undefined,
  };
}
