import { LyricLine, Track } from '../types/music';

export interface ArtistQuickItem {
  id: string;
  label: string;
  category: 'Legenda & Band' | 'Indie & Alternatif' | 'Pop & R&B Hits' | 'Global & Asia';
  subtitle: string;
  query: string;
}

export const POPULAR_INDO_ARTISTS: ArtistQuickItem[] = [
  {
    id: 'sheila-on-7',
    label: 'Sheila On 7',
    category: 'Legenda & Band',
    subtitle: 'Pop Rock Klasik Yogyakarta',
    query: 'Sheila On 7',
  },
  {
    id: 'dongker',
    label: 'Dongker',
    category: 'Indie & Alternatif',
    subtitle: 'Punk / Indie Alternatif Bandung',
    query: 'Dongker',
  },
  {
    id: 'dewa-19',
    label: 'Dewa 19',
    category: 'Legenda & Band',
    subtitle: 'Antologi Rock & Balada Legendaris',
    query: 'Dewa 19',
  },
  {
    id: 'hindia',
    label: 'Hindia',
    category: 'Indie & Alternatif',
    subtitle: 'Monolog Alternatif & Lirik Personal',
    query: 'Hindia',
  },
  {
    id: 'bernadya',
    label: 'Bernadya',
    category: 'Pop & R&B Hits',
    subtitle: 'Pop Melankolis & Balada Malam',
    query: 'Bernadya',
  },
  {
    id: 'perunggu',
    label: 'Perunggu',
    category: 'Indie & Alternatif',
    subtitle: 'Rock Pulang Kantor & Ode Kota',
    query: 'Perunggu',
  },
  {
    id: 'the-jansen',
    label: 'The Jansen',
    category: 'Indie & Alternatif',
    subtitle: 'Punk Rock Melodik Bogor',
    query: 'The Jansen',
  },
  {
    id: 'lomba-sihir',
    label: 'Lomba Sihir',
    category: 'Indie & Alternatif',
    subtitle: 'Pop Alternatif Modern Jakarta',
    query: 'Lomba Sihir',
  },
  {
    id: 'the-adams',
    label: 'The Adams',
    category: 'Indie & Alternatif',
    subtitle: 'Power Pop & Indie Rock Klasik',
    query: 'The Adams',
  },
  {
    id: 'tulus',
    label: 'Tulus',
    category: 'Pop & R&B Hits',
    subtitle: 'Pop Jazz Hangat & Harmoni Vokal',
    query: 'Tulus',
  },
  {
    id: 'juicy-luicy',
    label: 'Juicy Luicy',
    category: 'Pop & R&B Hits',
    subtitle: 'Pop Sentimental Bandung',
    query: 'Juicy Luicy',
  },
  {
    id: 'noah',
    label: 'Noah / Peterpan',
    category: 'Legenda & Band',
    subtitle: 'Anthem Band Pop Rock Indonesia',
    query: 'Noah Peterpan',
  },
  {
    id: 'nadin-amizah',
    label: 'Nadin Amizah',
    category: 'Indie & Alternatif',
    subtitle: 'Folk Akustik & Puisi Kamar',
    query: 'Nadin Amizah',
  },
  {
    id: 'fourtwnty',
    label: 'Fourtwnty',
    category: 'Indie & Alternatif',
    subtitle: 'Folk Senja & Akustik Santai',
    query: 'Fourtwnty',
  },
  {
    id: 'payung-teduh',
    label: 'Payung Teduh',
    category: 'Indie & Alternatif',
    subtitle: 'Keroncong Jazz & Sore Teduh',
    query: 'Payung Teduh',
  },
  {
    id: 'mahalini',
    label: 'Mahalini',
    category: 'Pop & R&B Hits',
    subtitle: 'Pop Orkestra & Vokal Kuat',
    query: 'Mahalini',
  },
  {
    id: 'pamungkas',
    label: 'Pamungkas',
    category: 'Indie & Alternatif',
    subtitle: 'Modern Indie Bedroom Pop',
    query: 'Pamungkas',
  },
  {
    id: 'maliq',
    label: "Maliq & D'Essentials",
    category: 'Pop & R&B Hits',
    subtitle: 'Soul, Funk & Groove Jakarta',
    query: "Maliq & D'Essentials",
  },
  {
    id: 'barasuara',
    label: 'Barasuara',
    category: 'Indie & Alternatif',
    subtitle: 'Indie Rock Berenergi Tinggi',
    query: 'Barasuara',
  },
  {
    id: 'feast',
    label: '.Feast',
    category: 'Indie & Alternatif',
    subtitle: 'Rock Alternatif & Kritik Sosial',
    query: '.Feast',
  },
  {
    id: 'reality-club',
    label: 'Reality Club',
    category: 'Indie & Alternatif',
    subtitle: 'Sinematik Indie Pop Rock',
    query: 'Reality Club',
  },
  {
    id: 'padi',
    label: 'Padi Reborn',
    category: 'Legenda & Band',
    subtitle: 'Harmoni Pop Rock Era 2000-an',
    query: 'Padi',
  },
  {
    id: 'kahitna',
    label: 'Kahitna',
    category: 'Legenda & Band',
    subtitle: 'Romansa Pop & Jazz Klasik',
    query: 'Kahitna',
  },
  {
    id: 'slank',
    label: 'Slank',
    category: 'Legenda & Band',
    subtitle: 'Blues Rock & Klasik Potlot',
    query: 'Slank',
  },
  {
    id: 'chrisye',
    label: 'Chrisye',
    category: 'Legenda & Band',
    subtitle: 'Karya Abadi Musik Indonesia',
    query: 'Chrisye',
  },
  {
    id: 'sal-priadi',
    label: 'Sal Priadi',
    category: 'Pop & R&B Hits',
    subtitle: 'Eksplorasi Pop Teatrikal & Lirik',
    query: 'Sal Priadi',
  },
  {
    id: 'coldplay',
    label: 'Coldplay',
    category: 'Global & Asia',
    subtitle: 'Stadium Alternative Rock',
    query: 'Coldplay',
  },
  {
    id: 'arctic-monkeys',
    label: 'Arctic Monkeys',
    category: 'Global & Asia',
    subtitle: 'British Indie & Garage Rock',
    query: 'Arctic Monkeys',
  },
  {
    id: 'oasis',
    label: 'Oasis',
    category: 'Global & Asia',
    subtitle: 'Anthem Britpop Klasik',
    query: 'Oasis',
  },
  {
    id: 'yoasobi',
    label: 'YOASOBI',
    category: 'Global & Asia',
    subtitle: 'J-Pop Elektronik Modern',
    query: 'YOASOBI',
  },
];

export interface SearchCatalogResult {
  tracks: Track[];
  correctedQuery: string | null;
}

const CLIENT_TYPO_MAP: Array<[RegExp, string]> = [
  [/\b(shela|shila|seila|sela|sheilla|shilla)\s*(on)?\s*7?\b/gi, 'Sheila On 7'],
  [/\bsheilaon7\b/gi, 'Sheila On 7'],
  [/\bdewa19\b/gi, 'Dewa 19'],
  [/\b(420|fourtwenty|fortwenty|fourtwenti)\b/gi, 'Fourtwnty'],
  [/\b(bernadia|bernadiya|bernadyaa|bernada)\b/gi, 'Bernadya'],
  [/\b(hinda|hindya|hindiaa)\b/gi, 'Hindia'],
  [/\b(dongkr|dongkerr|donker)\b/gi, 'Dongker'],
  [/\b(perungu|prungu|perungguu)\b/gi, 'Perunggu'],
  [/\b(juicy\s*lucy|juicyluicy|juicy\s*luici|juici\s*luicy)\b/gi, 'Juicy Luicy'],
  [/\b(peter\s*pan|piterpan|peterpen)\b/gi, 'Peterpan'],
  [/\b(nadine\s*amizah|nadin\s*amisah|nadin\s*amiza)\b/gi, 'Nadin Amizah'],
  [/\b(riski\s*febian|rizki\s*febian|risky\s*febian)\b/gi, 'Rizky Febian'],
  [/\b(sepia|sephiaa|sepiah)\b/gi, 'Sephia'],
  [/\b(efaluasi|evalusi)\b/gi, 'Evaluasi'],
  [/\b(untungya|untungny)\b/gi, 'Untungnya'],
  [/\b(kangn|kngn)\b/gi, 'Kangen'],
];

export function normalizeClientQuery(raw: string): string {
  let q = raw.trim().replace(/\s+/g, ' ');
  q = q.replace(/([a-zA-Z]{3,})(\d+)/g, '$1 $2');
  for (const [regex, replacement] of CLIENT_TYPO_MAP) {
    q = q.replace(regex, replacement);
  }
  return q;
}

export async function searchCatalogWithMeta(
  queryStr: string,
  limit = 28
): Promise<SearchCatalogResult> {
  const normalized = normalizeClientQuery(queryStr);
  try {
    const res = await fetch(
      `/api/music/search?q=${encodeURIComponent(queryStr)}&limit=${limit}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return {
          tracks: data.tracks,
          correctedQuery:
            data.correctedQuery ||
            (normalized.toLowerCase() !== queryStr.trim().toLowerCase() ? normalized : null),
        };
      }
    }
  } catch {
    // Fallback to direct iTunes JSON fetch if backend route is busy
  }

  try {
    const isTopHits = /^(top\s*hits\s*indonesia|hits\s*indonesia|lagu\s*hits\s*indonesia)$/i.test(
      normalized
    );
    const searchTarget = isTopHits ? 'Bernadya Sal Priadi' : normalized;
    const directRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        searchTarget
      )}&country=ID&media=music&entity=song&limit=${limit}`
    );
    const data = await directRes.json();
    const tracks = (data.results || [])
      .filter(
        (item: Record<string, unknown>) =>
          Boolean(item.trackId && item.previewUrl) &&
          !String(item.artistName || '').toLowerCase().includes('sandhy') &&
          !String(item.artistName || '').toLowerCase().includes('sondoro')
      )
      .map((item: Record<string, unknown>) => ({
        id: `itunes_${item.trackId}`,
        title: String(item.trackName || 'Tanpa Judul'),
        artist: String(item.artistName || 'Artis'),
        album: String(item.collectionName || 'Single'),
        genre: String(item.primaryGenreName || 'Pop'),
        durationSec: item.trackTimeMillis
          ? Math.max(30, Math.round(Number(item.trackTimeMillis) / 1000))
          : 210,
        previewDurationSec: 30,
        coverUrl: String(item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        audioUrl: String(item.previewUrl || ''),
        rawPreviewUrl: String(item.previewUrl || ''),
        bitrateLabel: '256kbps AAC / YT Full',
        releaseYear: item.releaseDate
          ? new Date(String(item.releaseDate)).getFullYear()
          : 2024,
        playsCount: 120000,
        lyrics: [],
      }));
    return {
      tracks,
      correctedQuery:
        normalized.toLowerCase() !== queryStr.trim().toLowerCase() ? normalized : null,
    };
  } catch {
    return { tracks: [], correctedQuery: null };
  }
}

export async function searchCatalogTracks(queryStr: string, limit = 28): Promise<Track[]> {
  const res = await searchCatalogWithMeta(queryStr, limit);
  return res.tracks;
}

export async function lookupCatalogTracksByIds(trackIds: string[]): Promise<Track[]> {
  const itunesIds = trackIds.filter((id) => id.startsWith('itunes_'));
  if (itunesIds.length === 0) return [];
  try {
    const res = await fetch(
      `/api/music/lookup?ids=${encodeURIComponent(itunesIds.join(','))}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.tracks) ? data.tracks : [];
  } catch {
    return [];
  }
}

export async function fetchTrackLyrics(
  title: string,
  artist: string,
  durationSec: number
): Promise<LyricLine[]> {
  try {
    const res = await fetch(
      `/api/music/lyrics?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(
        artist
      )}&duration=${durationSec}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        return data.lyrics;
      }
    }
  } catch {
    // Fallback to direct LRCLIB CORS API
  }

  try {
    const directUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      `${artist} ${title}`.trim()
    )}`;
    const directRes = await fetch(directUrl);
    if (directRes.ok) {
      const results = (await directRes.json()) as Array<{
        syncedLyrics?: string | null;
        plainLyrics?: string | null;
      }>;
      const bestWithSynced = results.find((r) => Boolean(r.syncedLyrics));
      if (bestWithSynced?.syncedLyrics) {
        const lines = bestWithSynced.syncedLyrics.split('\n');
        const parsed: LyricLine[] = [];
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
        if (parsed.length > 0) return parsed;
      }
    }
  } catch {
    // ignore
  }

  return [
    { timeSec: 0, text: `${title} — ${artist}` },
    { timeSec: 8, text: 'Nikmati alunan musik berkualitas tinggi di MallSound' },
    { timeSec: 18, text: 'Buka ikon Gerigi (Pengaturan) untuk mengatur Equalizer & Studio' },
  ];
}

export const POPULAR_YT_MAP: Record<string, string> = {
  // Verified Official IDs
  'dan': 'dGcGbF4ex5o',
  'dan...': 'dGcGbF4ex5o',
  'satu bulan': 'yjnSX_iUFVo',
  'lantas': 'pagiHshKe_0',
  'rayuan perempuan gila': 'gIsoLyQX7W8',
  'evaluasi': '01WhxHpsOyc',
  'risalah hati': '3NPVxBXRivw',
  'sephia': 'q9C0IAPzNcI',
  'hari bersamanya': '32M1DDVwqeY',
  'dari planet lain': 'eBGIQ7ZuuiU',
  'kangen': 'tQkEG30xYxA',
  'monokrom': 'ma4sO59mcC4',
  'mati muda': 'loPa9ZoesMc',
  'matimuda': 'loPa9ZoesMc',
  'jenny - mati muda': 'loPa9ZoesMc',
  'jenny - matimuda': 'loPa9ZoesMc',
  'berhasil': 'dF5-h001r60',
  'perunggu - berhasil': 'dF5-h001r60',
  '33x': 'U7l0ePjZvxM',
  'perunggu - 33x': 'U7l0ePjZvxM',
  // Dongker (verified via oEmbed — must sit BEFORE 'taruh' below, because
  // "bertaruh" contains "taruh" and the map is matched first-wins).
  'bertaruh pada api': 'fjAFcewRl64',
  'dongker - bertaruh pada api': 'fjAFcewRl64',
  'tuhan di reruntuh kota': 'hzu_5lUQFk8',
  'dongker - tuhan di reruntuh kota': 'hzu_5lUQFk8',
  'lautan bunga warna terang': 'ETLJ1ZgtvM0',
  'lautan bunga warna merah': 'ETLJ1ZgtvM0',
  'dongker - lautan bunga warna terang': 'ETLJ1ZgtvM0',
  'taruh': 'WzR4p549GzE',
  'nadin amizah - taruh': 'WzR4p549GzE',
  // Verified DJ Indo
  'dj ublag': 'ZpKSSG-5s5c',
  'ublag': 'ZpKSSG-5s5c',
  'dj sia sia': '4THHQefmCa4',
  'sia sia mengharap cintamu': '4THHQefmCa4',
  'dj karna su sayang': 'Wyqlqo6xXXQ',
  'dj malam pagi': 'Wola2tvRHIE',
  'malam pagi': 'Wola2tvRHIE',
  'dj tabrak': 'LXpV6FLi4VI',
  'tabrak tabrak masuk': 'LXpV6FLi4VI',
  'dj komang': 'yPn2YsBQKzM',
  'dj sial': 'M0-rGVu200w',
  'dj domba kuring': 'yTKYTZWQvpc',
  'domba kuring': 'yTKYTZWQvpc',
  'dj cikini': '0ZawFnlPLVQ',
  'cikini ke gondangdia': '0ZawFnlPLVQ',
  'dj alay': 'CvcuMr36JOw',
  'alay gaya kaya artis': 'CvcuMr36JOw',
  'dj santri pekok': 'z3XgUiL42OY',
  'santri pekok': 'z3XgUiL42OY',
  'dj stecu': '9CjG0SHQAfs',
  'stecu stecu': '9CjG0SHQAfs',
};

export async function resolveYouTubeVideoId(
  title: string,
  artist: string,
  trackId?: string
): Promise<{ videoId: string | null; candidates: string[] }> {
  if (trackId && trackId.startsWith('yt_')) {
    const directId = trackId.replace(/^yt_/, '');
    if (directId.length === 11) {
      return { videoId: directId, candidates: [directId] };
    }
  }

  // Fast check in verified map
  const cleanTitle = (title || '').toLowerCase().trim();
  let verifiedId: string | null = null;
  for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
    if (cleanTitle === key || cleanTitle.includes(key) || key.includes(cleanTitle)) {
      verifiedId = id;
      break;
    }
  }

  try {
    const q = `${artist} - ${title}`;
    const res = await fetch(`/api/music/yt?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      const apiCandidates: string[] = Array.isArray(data.candidates) ? data.candidates : [];
      const combined = Array.from(new Set([
        ...(verifiedId ? [verifiedId] : []),
        ...(data.videoId ? [data.videoId] : []),
        ...apiCandidates,
      ])).filter(Boolean);

      if (combined.length > 0) {
        return {
          videoId: verifiedId || data.videoId || combined[0],
          candidates: combined,
        };
      }
    }
  } catch (err) {
    console.warn('[resolveYouTubeVideoId] Live search failed:', err);
  }

  if (verifiedId) {
    return { videoId: verifiedId, candidates: [verifiedId] };
  }

  return { videoId: null, candidates: [] };
}
