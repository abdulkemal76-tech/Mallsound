import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// ============================================================================
// SMART TYPO-TOLERANT & FUZZY SEARCH ENGINE
// ============================================================================
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

const KNOWN_MUSIC_VOCABULARY = [
  'sheila', 'dewa', 'hindia', 'bernadya', 'perunggu', 'dongker', 'jansen', 'lomba', 'sihir',
  'adams', 'tulus', 'juicy', 'luicy', 'noah', 'peterpan', 'nadin', 'amizah', 'fourtwnty',
  'payung', 'teduh', 'mahalini', 'pamungkas', 'maliq', 'barasuara', 'feast', 'reality', 'club',
  'padi', 'kahitna', 'slank', 'chrisye', 'sal', 'priadi', 'coldplay', 'arctic', 'monkeys',
  'oasis', 'yoasobi', 'ungu', 'armada', 'wali', 'virgoun', 'last', 'child', 'revenge',
  'lyodra', 'tiara', 'andini', 'rizky', 'febian', 'raisa', 'isyana', 'rossa', 'afgan',
  'cokelat', 'kotak', 'jamrud', 'gigi', 'radja', 'kangen', 'ada', 'band', 'let', 'to',
  'kerispatih', 'sore', 'efek', 'rumah', 'kaca', 'danilla', 'ardhito', 'pramono', 'kunto',
  'aji', 'idgitaf', 'ghea', 'indrawari', 'raissa', 'anggiani', 'bilal', 'indrajaya',
  'sephia', 'dan', 'pejantan', 'tangguh', 'kisah', 'klasik', 'seberapa', 'pantas', 'anugerah',
  'terindah', 'risalah', 'hati', 'pupus', 'separuh', 'nafas', 'kamulah', 'satu', 'satunya',
  'roman', 'picisan', 'evaluasi', 'secukupnya', 'cincin', 'membasuh', 'mata', 'air',
  'untungnya', 'bumi', 'masih', 'berputar', 'bulan', 'lampu', 'kuning', 'kata', 'mereka',
  'ini', 'berlebihan', 'sialan', 'tampar', 'lantas', 'monokrom', 'hati', 'jalan', 'interaksi',
  'manusia', 'kuat', 'gajah', 'sepatu', 'ruang', 'sendiri', 'bertaut', 'rayuan', 'perempuan',
  'gila', 'sorai', 'zona', 'nyaman', 'fana', 'merah', 'jambu', 'hitam', 'putih', 'akad',
  'sial', 'melawan', 'restu', 'sisa', 'rasa', 'mati', 'matian', 'bawa', 'dia', 'kembali',
  'penyesalan', 'kelahiran', 'bertaruh', 'pada', 'api', 'biar', 'menjadi', 'kenangan',
  '33x', 'kalibata', '2012', 'tarot', 'nina', 'komang', 'lesung', 'pipi', 'gala', 'bunga',
  'matahari', 'cantik', 'cerita', 'cinta', 'andai', 'dia', 'tahu', 'mungkin', 'nanti',
  'menghapus', 'jejakmu', 'semua', 'tentang', 'kita', 'bintang', 'di', 'surga', 'yang',
  'terdalam', '쿠', 'yellow', 'fix', 'you', 'viva', 'la', 'vida', 'wonderwall', 'dont',
  'look', 'back', 'in', 'anger', 'creep', 'bohemian', 'rhapsody', 'smells', 'like', 'teen',
  'spirit', 'numb', 'in', 'the', 'end', 'bruno', 'mars', 'taylor', 'swift',
];

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

function collapseRepeatedChars(word: string): string {
  return word.replace(/(.)\1{2,}/g, '$1$1').replace(/([bcdfghjklmnpqrstvwxyz])\1+/gi, '$1');
}

function smartCorrectQuery(rawQuery: string): string {
  let q = rawQuery.trim().replace(/\s+/g, ' ');
  if (!q) return q;

  // Separate joined letters and numbers like "dewa19" -> "dewa 19", "sheilaon7" -> "sheilaon 7"
  q = q.replace(/([a-zA-Z]{3,})(\d+)/g, '$1 $2');

  for (const [pattern, replacement] of DIRECT_PHRASE_CORRECTIONS) {
    q = q.replace(pattern, replacement);
  }

  const tokens = q.split(/\s+/);
  const correctedTokens = tokens.map((token) => {
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length < 4 || /^\d+$/.test(clean)) return token;
    if (KNOWN_MUSIC_VOCABULARY.includes(clean)) return token;

    const collapsed = collapseRepeatedChars(clean);
    if (KNOWN_MUSIC_VOCABULARY.includes(collapsed)) {
      return collapsed;
    }

    let bestCandidate = token;
    let bestDist = 99;
    const maxAllowedDist = clean.length >= 7 ? 2 : 1;

    for (const vocabWord of KNOWN_MUSIC_VOCABULARY) {
      if (Math.abs(vocabWord.length - clean.length) > maxAllowedDist) continue;
      // Prefer candidates sharing the same first letter
      const dist = levenshteinDistance(clean, vocabWord);
      const collapsedDist = levenshteinDistance(collapsed, vocabWord);
      const effectiveDist = Math.min(dist, collapsedDist);

      if (
        effectiveDist <= maxAllowedDist &&
        (effectiveDist < bestDist ||
          (effectiveDist === bestDist && vocabWord[0] === clean[0]))
      ) {
        bestDist = effectiveDist;
        bestCandidate = vocabWord;
      }
    }
    return bestCandidate;
  });

  return correctedTokens.join(' ');
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

async function fetchYouTubeFallbackTracks(queryTerm: string, maxResults = 10) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${queryTerm} official audio`
    )}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    const html = await response.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
    if (!match) return { tracks: [], didYouMean: null as string | null };

    const ytData = JSON.parse(match[1]);
    const contents =
      ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents?.[0]?.itemSectionRenderer?.contents || [];

    let didYouMean: string | null = null;
    const tracks: ReturnType<typeof mapItunesItemToTrack>[] = [];

    for (const item of contents) {
      if (item.didYouMeanRenderer?.correctedQueryEndpoint?.searchEndpoint?.query) {
        didYouMean = String(
          item.didYouMeanRenderer.correctedQueryEndpoint.searchEndpoint.query
        ).replace(/\s*official audio$/i, '');
      }
      if (item.showingResultsForRenderer?.correctedQueryEndpoint?.searchEndpoint?.query) {
        didYouMean = String(
          item.showingResultsForRenderer.correctedQueryEndpoint.searchEndpoint.query
        ).replace(/\s*official audio$/i, '');
      }

      const v = item.videoRenderer;
      if (!v || !v.videoId) continue;

      const rawTitle = String(v.title?.runs?.[0]?.text || 'Lagu');
      const channelName = String(
        v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'Artis'
      ).replace(/\s*-\s*Topic$/i, '');

      // Parse "Artist - Song Title" if formatted with a dash
      let artist = channelName;
      let songTitle = rawTitle
        .replace(/\((official|lirik|lyric|audio|video|mv|hd|hq).*?\)/gi, '')
        .replace(/\[(official|lirik|lyric|audio|video|mv|hd|hq).*?\]/gi, '')
        .trim();

      if (songTitle.includes(' - ')) {
        const parts = songTitle.split(' - ');
        artist = parts[0].trim();
        songTitle = parts.slice(1).join(' - ').trim();
      }

      // Parse duration like "3:45"
      const lengthStr = String(v.lengthText?.simpleText || '3:30');
      const timeParts = lengthStr.split(':').map(Number);
      let durationSec = 210;
      if (timeParts.length === 2 && !Number.isNaN(timeParts[0]) && !Number.isNaN(timeParts[1])) {
        durationSec = timeParts[0] * 60 + timeParts[1];
      } else if (timeParts.length === 3) {
        durationSec = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
      }
      if (durationSec > 900 || durationSec < 45) continue;

      const videoId = String(v.videoId);
      tracks.push({
        id: `yt_${videoId}`,
        itunesId: Math.abs(
          videoId.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0)
        ),
        title: songTitle || rawTitle,
        artist: artist || 'Musisi',
        album: 'YouTube Music Release',
        genre: 'Musik',
        durationSec,
        previewDurationSec: durationSec,
        coverUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        audioUrl: '',
        rawPreviewUrl: '',
        bitrateLabel: 'YT Full Audio',
        releaseYear: 2025,
        playsCount: 150000,
        lyrics: [],
      });

      if (tracks.length >= maxResults) break;
    }

    return { tracks, didYouMean };
  } catch {
    return { tracks: [], didYouMean: null as string | null };
  }
}

// 1. Search Indonesian & Global Music Catalog (Smart Fuzzy & Typo-Tolerant)
app.get('/api/music/search', async (req, res) => {
  try {
    const rawQuery = String(req.query.q || 'Sheila On 7').trim();
    const limit = Math.min(40, Math.max(5, Number(req.query.limit) || 28));
    let correctedQuery = smartCorrectQuery(rawQuery);

    // Query iTunes with smart-corrected query (and raw query in parallel if different)
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

    // If few results found (e.g. heavy typo or indie/underground track), invoke YouTube typo-tolerant search
    if (mergedMap.size < 6) {
      const ytFallback = await fetchYouTubeFallbackTracks(correctedQuery, 12);
      if (ytFallback.didYouMean && ytFallback.didYouMean.toLowerCase() !== correctedQuery.toLowerCase()) {
        correctedQuery = ytFallback.didYouMean;
        const rescuedItunes = await fetchItunesSearch(correctedQuery, limit);
        for (const t of rescuedItunes) {
          if (!mergedMap.has(t.id)) {
            mergedMap.set(t.id, t);
          }
        }
      }
      for (const ytTrack of ytFallback.tracks) {
        if (!mergedMap.has(ytTrack.id) && mergedMap.size < limit) {
          mergedMap.set(ytTrack.id, ytTrack);
        }
      }
    }

    res.json({
      tracks: Array.from(mergedMap.values()).slice(0, limit),
      correctedQuery:
        correctedQuery.toLowerCase() !== rawQuery.toLowerCase() ? correctedQuery : null,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search music catalog', tracks: [] });
  }
});

// 2. Lookup specific saved iTunes track IDs for Playlists & Favorites
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
  } catch (err) {
    console.error('Lookup error:', err);
    res.json({ tracks: [] });
  }
});

// 3. Proxy Audio Stream for CORS-free Web Audio API Equalizer & FFT Visualizer
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
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'audio/mp4'
    );
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Audio proxy error:', err);
    res.status(500).send('Audio stream proxy error');
  }
});

const ytQueryCache = new Map<string, { videoId: string | null; candidates: string[] }>();

// 4. Resolve YouTube Music Video ID for Full-Track Playback
app.get('/api/music/yt', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

    const cacheKey = q.toLowerCase();
    if (ytQueryCache.has(cacheKey)) {
      res.json(ytQueryCache.get(cacheKey));
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

    const payload = {
      videoId: uniqueIds[0] || null,
      candidates: uniqueIds,
    };
    if (uniqueIds.length > 0) {
      ytQueryCache.set(cacheKey, payload);
    }

    res.json(payload);
  } catch (err) {
    console.error('YouTube search error:', err);
    res.json({ videoId: null, candidates: [] });
  }
});

// 5. Fetch Real Synced Lyrics (.lrc) from LRCLIB
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
      headers: { 'User-Agent': 'DengrStudio/1.0 (https://lentera.fun)' },
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
  } catch (err) {
    console.error('Lyrics fetch error:', err);
    res.json({ lyrics: [] });
  }
});

// 6. Explicit Web App Manifest endpoint so /manifest.webmanifest never 404s in any environment
app.get('/manifest.webmanifest', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    id: '/',
    name: 'MallSound — Streaming Musik & Audio Studio',
    short_name: 'MallSound',
    description:
      'Aplikasi streaming musik penuh (Spotify & YouTube Music style) dengan Equalizer 5-Band, Lirik Tersinkronisasi, dan Koleksi Awan.',
    theme_color: '#09090b',
    background_color: '#09090b',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    categories: ['music', 'entertainment', 'multimedia'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });
});

// 7. Direct Downloadable MallSound Standalone Launcher & Android APK Builder Script
app.get('/api/download/mallsound-launcher', (req, res) => {
  const hostUrl = String(req.query.url || `${req.protocol}://${req.get('host')}`);
  const htmlContent = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#09090b" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>MallSound — Peluncur Aplikasi Musik</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; background: #09090b; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
    .bar { height: 44px; background: #09090b; border-bottom: 1px solid #27272a; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
    .brand { font-weight: 800; font-size: 15px; color: #fbbf24; letter-spacing: -0.02em; }
    .btn { background: #f59e0b; color: #09090b; text-decoration: none; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; }
    iframe { width: 100%; height: calc(100% - 44px); border: none; background: #09090b; }
  </style>
</head>
<body>
  <div class="bar">
    <span class="brand">MallSound Studio App</span>
    <a class="btn" href="${hostUrl}" target="_blank" rel="noopener">Buka Layar Penuh ↗</a>
  </div>
  <iframe src="${hostUrl}" allow="autoplay; encrypted-media; fullscreen; clipboard-write"></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="MallSound-App-Launcher.html"');
  res.send(htmlContent);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MallSound Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
