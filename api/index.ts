import express from 'express';

const app = express();
app.use(express.json());

interface ItunesTrackItem {
  trackId: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  primaryGenreName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
}

function mapItunesItemToTrack(item: ItunesTrackItem) {
  const highResArtwork = item.artworkUrl100
    ? item.artworkUrl100.replace('100x100bb', '600x600bb')
    : '';
  const rawPreview = item.previewUrl || '';
  const proxiedAudio = rawPreview
    ? `/api/music/audio-proxy?url=${encodeURIComponent(rawPreview)}`
    : '';
  const fullDurationSec = item.trackTimeMillis
    ? Math.max(30, Math.round(item.trackTimeMillis / 1000))
    : 210;
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024;

  return {
    id: `itunes_${item.trackId}`,
    itunesId: item.trackId,
    title: item.trackName || 'Tanpa Judul',
    artist: item.artistName || 'Artis',
    album: item.collectionName || 'Single',
    genre: item.primaryGenreName || 'Pop',
    durationSec: fullDurationSec,
    previewDurationSec: 30,
    coverUrl: highResArtwork,
    audioUrl: proxiedAudio,
    rawPreviewUrl: rawPreview,
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: Number.isFinite(year) ? year : 2024,
    playsCount: Math.floor(50000 + (item.trackId % 900000)),
    lyrics: [],
  };
}

const DIRECT_PHRASE_CORRECTIONS: Array<[RegExp, string]> = [
  [/\b(shela|shila|seila|sela|sheilla|shilla)\s*(on)?\s*7?\b/gi, 'Sheila On 7'],
  [/\bsheilaon7\b/gi, 'Sheila On 7'],
  [/\bdewa19\b/gi, 'Dewa 19'],
  [/\b(st12|st\s*12)\b/gi, 'ST12'],
  [/\b(420|fourtwenty|fortwenty|fourtwenti)\b/gi, 'Fourtwnty'],
  [/\b(bernadia|bernadiya|bernadyaa|bernada)\b/gi, 'Bernadya'],
  [/\b(hinda|hindya|hindiaa)\b/gi, 'Hindia'],
  [/\b(dongkr|dongkerr|donker)\b/gi, 'Dongker'],
  [/\b(perungu|prungu|perungguu)\b/gi, 'Perunggu'],
  [/\b(juicy\s*lucy|juicyluicy|juicy\s*luici|juici\s*luicy)\b/gi, 'Juicy Luicy'],
  [/\b(peter\s*pan|piterpan|peterpen)\b/gi, 'Peterpan'],
  [/\b(nadine\s*amizah|nadin\s*amisah|nadin\s*amiza)\b/gi, 'Nadin Amizah'],
  [/\b(riski\s*febian|rizki\s*febian|risky\s*febian)\b/gi, 'Rizky Febian'],
  [/\b(maliq|malik\s*d\s*essential|maliq\s*dessentials)\b/gi, "Maliq & D'Essentials"],
  [/\b(jansen|the\s*jensen|the\s*janssen)\b/gi, 'The Jansen'],
  [/\b(feast|fest)\b/gi, '.Feast'],
  [/\b(pamungks|pamungkas)\b/gi, 'Pamungkas'],
  [/\b(mahallini|mahalinii|mahalni)\b/gi, 'Mahalini'],
  [/\b(sepia|sephiaa|sepiah)\b/gi, 'Sephia'],
  [/\b(efaluasi|evalusi)\b/gi, 'Evaluasi'],
  [/\b(untungya|untungny)\b/gi, 'Untungnya'],
  [/\b(kangn|kngn)\b/gi, 'Kangen'],
];

function smartCorrectQuery(rawQuery: string): string {
  let q = rawQuery.trim().replace(/\s+/g, ' ');
  if (!q) return q;
  q = q.replace(/([a-zA-Z]{3,})(\d+)/g, '$1 $2');
  for (const [pattern, replacement] of DIRECT_PHRASE_CORRECTIONS) {
    q = q.replace(pattern, replacement);
  }
  return q;
}

async function fetchItunesSearch(queryTerm: string, limit: number) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    queryTerm
  )}&country=ID&media=music&entity=song&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: ItunesTrackItem[] };
  return (data.results || [])
    .filter((item) => Boolean(item.trackId && item.trackName && item.previewUrl))
    .map(mapItunesItemToTrack);
}

app.get('/api/music/search', async (req, res) => {
  try {
    const rawQuery = String(req.query.q || 'Sheila On 7').trim();
    const limit = Math.min(40, Math.max(5, Number(req.query.limit) || 28));
    const correctedQuery = smartCorrectQuery(rawQuery);

    const [primaryTracks, rawTracks] = await Promise.all([
      fetchItunesSearch(correctedQuery, limit),
      correctedQuery.toLowerCase() !== rawQuery.toLowerCase()
        ? fetchItunesSearch(rawQuery, Math.min(12, limit))
        : Promise.resolve([]),
    ]);

    const mergedMap = new Map<string, ReturnType<typeof mapItunesItemToTrack>>();
    for (const t of [...primaryTracks, ...rawTracks]) {
      if (!mergedMap.has(t.id)) {
        mergedMap.set(t.id, t);
      }
    }

    res.json({
      tracks: Array.from(mergedMap.values()).slice(0, limit),
      correctedQuery:
        correctedQuery.toLowerCase() !== rawQuery.toLowerCase() ? correctedQuery : null,
    });
  } catch (err) {
    console.error('Vercel search error:', err);
    res.status(500).json({ error: 'Failed to search music catalog', tracks: [] });
  }
});

app.get('/api/music/lookup', async (req, res) => {
  try {
    const rawIds = String(req.query.ids || '')
      .split(',')
      .map((s) => s.replace('itunes_', '').trim())
      .filter((s) => /^\d+$/.test(s))
      .slice(0, 50);

    if (rawIds.length === 0) {
      res.json({ tracks: [] });
      return;
    }

    const url = `https://itunes.apple.com/lookup?id=${rawIds.join(',')}&country=ID`;
    const response = await fetch(url);
    if (!response.ok) {
      res.json({ tracks: [] });
      return;
    }
    const data = (await response.json()) as { results?: ItunesTrackItem[] };
    const tracks = (data.results || [])
      .filter((item) => Boolean(item.trackId && item.trackName && item.previewUrl))
      .map(mapItunesItemToTrack);

    res.json({ tracks });
  } catch {
    res.json({ tracks: [] });
  }
});

app.get('/api/music/audio-proxy', async (req, res) => {
  try {
    const targetUrl = String(req.query.url || '');
    if (
      !targetUrl.startsWith('https://') ||
      (!targetUrl.includes('itunes.apple.com') && !targetUrl.includes('mzstatic.com'))
    ) {
      res.status(400).send('Invalid audio stream URL');
      return;
    }

    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const upstream = await fetch(targetUrl, { headers });
    res.status(upstream.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mp4');
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch {
    res.status(500).send('Audio stream proxy error');
  }
});

app.get('/api/music/yt', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${q} official audio lirik`
    )}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    const html = await response.text();
    const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const uniqueIds: string[] = [];
    for (const m of matches) {
      if (m[1] && !uniqueIds.includes(m[1])) {
        uniqueIds.push(m[1]);
      }
      if (uniqueIds.length >= 8) break;
    }

    res.json({
      videoId: uniqueIds[0] || null,
      candidates: uniqueIds,
    });
  } catch {
    res.json({ videoId: null, candidates: [] });
  }
});

app.get('/api/music/lyrics', async (req, res) => {
  try {
    const track = String(req.query.track || '').trim();
    const artist = String(req.query.artist || '').trim();
    const durationSec = Number(req.query.duration) || 200;

    if (!track) {
      res.json({ lyrics: [] });
      return;
    }

    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(
      `${artist} ${track}`.trim()
    )}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MallSound/2.5 (https://mallz12.my.id)' },
    });

    if (!response.ok) {
      res.json({ lyrics: [] });
      return;
    }

    const results = (await response.json()) as Array<{
      syncedLyrics?: string | null;
      plainLyrics?: string | null;
    }>;

    if (!Array.isArray(results) || results.length === 0) {
      res.json({ lyrics: [] });
      return;
    }

    const bestWithSynced = results.find((r) => Boolean(r.syncedLyrics));
    if (bestWithSynced?.syncedLyrics) {
      const lines = bestWithSynced.syncedLyrics.split('\n');
      const parsed: Array<{ timeSec: number; text: string }> = [];
      const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/;

      for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
          const text = match[4].trim();
          if (text) {
            parsed.push({
              timeSec: Number((mins * 60 + secs + ms / 1000).toFixed(2)),
              text,
            });
          }
        }
      }

      if (parsed.length > 0) {
        res.json({ lyrics: parsed, synced: true });
        return;
      }
    }

    const bestPlain = results.find((r) => Boolean(r.plainLyrics));
    if (bestPlain?.plainLyrics) {
      const rawLines = bestPlain.plainLyrics
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const step = Math.max(4, Math.floor((durationSec - 10) / Math.max(1, rawLines.length)));
      const parsed = rawLines.map((text, idx) => ({
        timeSec: idx * step,
        text,
      }));
      res.json({ lyrics: parsed, synced: false });
      return;
    }

    res.json({ lyrics: [] });
  } catch {
    res.json({ lyrics: [] });
  }
});

app.get('/api/playlist/import', async (req, res) => {
  try {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) {
      res.status(400).json({ error: 'URL playlist tidak boleh kosong' });
      return;
    }

    interface Candidate {
      title: string;
      artist: string;
      youtubeId?: string;
    }

    let playlistTitle = 'Playlist Impor';
    const candidates: Candidate[] = [];

    // --- 1. SPOTIFY PLAYLIST IMPORT ---
    if (rawUrl.includes('spotify.com/playlist/')) {
      const match = rawUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = match ? match[1] : '';

      if (!playlistId) {
        res.status(400).json({ error: 'ID playlist Spotify tidak valid' });
        return;
      }

      try {
        const embedRes = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        });

        if (embedRes.ok) {
          const html = await embedRes.text();
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
          if (nextDataMatch) {
            try {
              const nextData = JSON.parse(nextDataMatch[1]);
              const entity = nextData?.props?.pageProps?.state?.data?.entity;
              if (entity) {
                if (entity.name) playlistTitle = entity.name;
                const trackList = entity.trackList || [];
                for (const t of trackList) {
                  if (t.name || t.title) {
                    candidates.push({
                      title: t.name || t.title,
                      artist: t.subtitle || t.artist || '',
                    });
                  }
                  if (candidates.length >= 35) break;
                }
              }
            } catch (e) {
              console.warn('Spotify next data parse error:', e);
            }
          }
        }
      } catch (err) {
        console.warn('Spotify embed fetch failed, trying oEmbed:', err);
      }

      // Fallback: oEmbed for title
      if (playlistTitle === 'Playlist Impor') {
        try {
          const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(rawUrl)}`);
          if (oembedRes.ok) {
            const oembedJson = await oembedRes.json() as { title?: string };
            if (oembedJson.title) playlistTitle = oembedJson.title;
          }
        } catch {
          // ignore
        }
      }
    }
    // --- 2. YOUTUBE / YOUTUBE MUSIC PLAYLIST IMPORT ---
    else if (rawUrl.includes('youtube.com/') || rawUrl.includes('youtu.be/')) {
      const listMatch = rawUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const listId = listMatch ? listMatch[1] : '';

      if (!listId) {
        res.status(400).json({ error: 'ID playlist YouTube tidak ditemukan dalam URL' });
        return;
      }

      try {
        const ytRes = await fetch(`https://www.youtube.com/playlist?list=${listId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });

        if (ytRes.ok) {
          const html = await ytRes.text();
          const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/);
          if (titleMatch && titleMatch[1]) {
            playlistTitle = titleMatch[1].trim();
          }

          // Extract video title and videoId
          const trackMatches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})".*?"title":{"runs":\[{"text":"([^"]+)"}\]/g)];
          const seen = new Set<string>();

          for (const m of trackMatches) {
            const videoId = m[1];
            const title = m[2];
            if (videoId && title && !seen.has(videoId)) {
              seen.add(videoId);
              // Clean up YouTube title: often "Artist - Title" or "Title (Official Video)"
              let cleanArtist = '';
              let cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
              if (cleanTitle.includes(' - ')) {
                const parts = cleanTitle.split(' - ');
                cleanArtist = parts[0].trim();
                cleanTitle = parts.slice(1).join(' - ').trim();
              }
              candidates.push({
                title: cleanTitle || title,
                artist: cleanArtist,
                youtubeId: videoId,
              });
              if (candidates.length >= 35) break;
            }
          }
        }
      } catch (err) {
        console.warn('YouTube playlist fetch failed:', err);
      }
    } else {
      res.status(400).json({ error: 'URL tidak didukung. Harap gunakan URL Spotify atau YouTube Music.' });
      return;
    }

    if (candidates.length === 0) {
      res.status(404).json({ error: 'Tidak ada lagu yang dapat diekstrak dari tautan ini. Pastikan playlist bersifat publik.' });
      return;
    }

    // --- Search iTunes in batches for rich metadata and audio previews ---
    const finalTracks: Array<ReturnType<typeof mapItunesItemToTrack>> = [];
    const batchSize = 5;

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const searchPromises = batch.map(async (c) => {
        const queryTerm = `${c.artist} ${c.title}`.trim();
        try {
          const results = await fetchItunesSearch(queryTerm, 1);
          if (results.length > 0) {
            const trk = results[0];
            if (c.youtubeId) {
              trk.youtubeVideoId = c.youtubeId;
            }
            return trk;
          }
        } catch {
          // ignore error
        }

        // Fallback track if not found on iTunes
        return {
          id: `imported_${c.youtubeId || Math.random().toString(36).substring(2, 9)}`,
          itunesId: 0,
          title: c.title,
          artist: c.artist || 'Artis',
          album: playlistTitle,
          genre: 'Pop',
          durationSec: 210,
          previewDurationSec: 30,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
          audioUrl: '',
          rawPreviewUrl: '',
          youtubeVideoId: c.youtubeId || null,
          bitrateLabel: '256kbps YT Audio',
          releaseYear: new Date().getFullYear(),
          playsCount: 15000,
          lyrics: [],
        };
      });

      const resolved = await Promise.all(searchPromises);
      finalTracks.push(...resolved);
    }

    res.json({
      title: playlistTitle,
      tracks: finalTracks,
    });
  } catch (err) {
    console.error('Playlist import error:', err);
    res.status(500).json({ error: 'Gagal memproses import playlist' });
  }
});

app.get('/api/download/mallsound-launcher', (req, res) => {
  const hostUrl = String(req.query.url || 'https://mallz12.my.id');
  const htmlContent = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#09090b" />
  <title>MallSound — Peluncur Aplikasi Musik</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; background: #09090b; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
    .bar { height: 44px; background: #09090b; border-bottom: 1px solid #27272a; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
    .brand { font-weight: 800; font-size: 15px; color: #fbbf24; }
    .btn { background: #f59e0b; color: #09090b; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; }
    iframe { width: 100%; height: calc(100% - 44px); border: none; background: #09090b; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="brand">MallSound (${hostUrl})</span>
    <a class="btn" href="${hostUrl}" target="_blank" rel="noopener">Buka Layar Penuh ↗</a>
  </div>
  <iframe src="${hostUrl}" allow="autoplay; encrypted-media; fullscreen; clipboard-write"></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="MallSound-App-Launcher.html"');
  res.send(htmlContent);
});

export default app;
