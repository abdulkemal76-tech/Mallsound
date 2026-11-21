import type { Track } from '../types/music';
import { MOOD_TRACKS } from './moodPlaylists';
import { GENRE_TRACKS } from './genrePlaylists';

// Rekomendasi Beranda (v85) — daftar lagu viral yang diacak dan berganti.
// Pool = lagu-lagu paling banyak diputar (playsCount) dari katalog yang
// sudah terverifikasi videoId-nya (mood + genre). 35 lagu Indonesia
// teratas + 5 lagu internasional/K-Pop teratas, total 40. Beranda
// menampilkan 25 di antaranya, diacak (seed harian — stabil seharian,
// berganti tiap hari) dan bisa diacak ulang lewat tombol Acak.
// Semua videoId di sini sudah terverifikasi oEmbed saat kurasi mood/genre
// (v67/v72/v82), jadi tidak perlu resolve baru.

// 35 lagu Indonesia teratas berdasarkan playsCount (genre 'Indonesia').
const INDO_RECOMMENDED_IDS: string[] = [
  'mood_tulus_hati_hati',
  'mood_payung_akad',
  'mood_sal_gala',
  'mood_mahalini_sial',
  'mood_fourtwnty_zona',
  'mood_siti_lagi_syantik',
  'mood_hindia_secukupnya',
  'mood_peterpan_semua',
  'mood_tulus_monokrom',
  'mood_tenxi_garam',
  'mood_peterpan_bintang',
  'mood_happy_rungkad',
  'mood_bernadya_satu_bulan',
  'mood_dewa_pupus',
  'mood_nadin_bertaut',
  'mood_tenxi_kasih',
  'mood_peterpan_yang_terdalam',
  'mood_nidji_laskar',
  'mood_sheila_sephia',
  'mood_dewa_kangen',
  'mood_wali_cari_jodoh',
  'mood_noah_separuh',
  'mood_nadin_taruh',
  'mood_sheila_dan',
  'mood_slank_terlalu_manis',
  'mood_andra_sempurna',
  'mood_tulus_pamit',
  'mood_ayu_alamat_palsu',
  'mood_raisa_kali_kedua',
  'mood_sheila_anugerah',
  'mood_sheila_melompat',
  'mood_tulus_manusia_kuat',
  'mood_dewa_takkan_ada',
  'mood_gigi_11_januari',
  'mood_padi_sobat',
];

// 5 lagu internasional/K-Pop teratas berdasarkan playsCount.
const INTL_RECOMMENDED_IDS: string[] = [
  'genre_john_legend_all_of_me',
  'genre_alan_walker_faded',
  'genre_chainsmokers_closer',
  'genre_bts_dynamite',
  'genre_eminem_lose_yourself',
];

const RECOMMENDED_IDS = [...INDO_RECOMMENDED_IDS, ...INTL_RECOMMENDED_IDS];

// Jumlah lagu rekomendasi yang ditampilkan di Beranda (permintaan pengguna: 25).
export const RECOMMENDED_SHOW_COUNT = 25;

// Pool rekomendasi: Track lengkap (urut playsCount — Indo dulu, lalu intl).
// Lagu yang id-nya tidak ketemu di katalog dilewati (defensif).
export const RECOMMENDED_POOL: Track[] = (() => {
  const byId = new Map<string, Track>();
  for (const t of [...MOOD_TRACKS, ...GENRE_TRACKS]) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  const pool: Track[] = [];
  for (const id of RECOMMENDED_IDS) {
    const t = byId.get(id);
    if (t && t.youtubeVideoId) pool.push(t);
  }
  return pool;
})();
