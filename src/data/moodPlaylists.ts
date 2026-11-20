import type { Playlist } from '../types/music';
import type { Track } from '../types/music';

// Kurasi mood — 8 kartu mood di halaman Cari kini membuka playlist beneran
// (bukan pencarian), pola yang sama seperti playlist bawaan Shoegaze v65.
// Semua videoId terverifikasi via oEmbed (judul + channel cocok) pada
// 20 Nov 2026: 14 lagu di-resolve ulang satu-per-satu dengan jeda 6 detik
// (retry lambat — resolve batch sebelumnya kena throttle YouTube dan
// mengembalikan None), 5 lagu dari resolve batch pertama, 9 lagu dari
// videoId yang sudah dikenal. Satu lagu boleh muncul di 1-2 mood yang
// cocok, supaya tiap playlist berisi 6-7 lagu, bukan cuma 2.

const COVERS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop',
];

let coverIdx = 0;
function t(
  id: string,
  title: string,
  artist: string,
  album: string,
  genre: string,
  durationSec: number,
  youtubeVideoId: string,
  releaseYear: number,
  playsCount: number,
): Track {
  const coverUrl = COVERS[coverIdx++ % COVERS.length];
  return {
    id,
    title,
    artist,
    album,
    genre,
    durationSec,
    coverUrl,
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId,
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear,
    playsCount,
    lyrics: [],
  };
}

export const MOOD_TRACKS: Track[] = [
  // --- Santai & Rileks ---
  t('mood_tulus_hati_hati', 'Hati-Hati di Jalan', 'Tulus', 'Manusia', 'Pop Indonesia', 245, '_N6vSc_mT6I', 2022, 850000000),
  t('mood_sal_gala', 'Gala Bunga Matahari', 'Sal Priadi', 'Gala Bunga Matahari (Single)', 'Pop Indonesia', 245, 'AQpEIZ8dNcU', 2024, 420000000),
  t('mood_fourtwnty_zona', 'Zona Nyaman', 'Fourtwnty', 'Filosofi Kopi 2 (OST)', 'Pop Indonesia', 245, 'OnfYLBNvrPw', 2017, 380000000),
  t('mood_payung_akad', 'Akad', 'Payung Teduh', 'Ruang Tunggu', 'Pop Indonesia', 270, 'viW0M5R2BLo', 2017, 520000000),
  t('mood_tulus_monokrom', 'Monokrom', 'Tulus', 'Monokrom', 'Pop Indonesia', 250, 'ma4sO59mcC4', 2016, 310000000),
  t('mood_danilla_ada', 'Ada di Sana', 'Danilla', 'Telisik', 'Pop Indonesia', 240, '-tQLT6gcjNY', 2014, 95000000),
  t('mood_bernadya_satu_bulan', 'Satu Bulan', 'Bernadya', 'Sialnya, Hidup Harus Tetap Berjalan', 'Pop Indonesia', 200, 'yjnSX_iUFVo', 2024, 290000000),
  // --- Fokus & Kerja ---
  t('mood_hindia_secukupnya', 'Secukupnya', 'Hindia', 'Menari dengan Bayangan', 'Pop Indonesia', 260, 'wnAKxtEi78c', 2019, 340000000),
  t('mood_nadin_taruh', 'Taruh', 'Nadin Amizah', 'Selamat Ulang Tahun', 'Pop Indonesia', 230, 'Vrp2Be-RVVM', 2020, 210000000),
  // --- Semangat & Energi ---
  t('mood_sheila_melompat', 'Melompat Lebih Tinggi', 'Sheila On 7', 'Pejantan Tangguh', 'Rock Indonesia', 200, 'ab9LL48USIU', 2004, 180000000),
  t('mood_dmasiv_jangan_menyerah', 'Jangan Menyerah', "D'Masiv", 'Perubahan', 'Rock Indonesia', 250, 'mTp-OxfkCao', 2008, 260000000),
  t('mood_jamrud_surti', 'Surti Tejo', 'Jamrud', 'Ningrat', 'Rock Indonesia', 280, '0DQVH-vgHfs', 2000, 150000000),
  t('mood_wali_cari_jodoh', 'Cari Jodoh', 'Wali', 'Cari Jodoh', 'Pop Indonesia', 200, 'dERdrEKmOHE', 2009, 220000000),
  t('mood_dongker_bertaruh', 'Bertaruh Pada Api', 'Dongker', 'Bertaruh Pada Api (Single)', 'Rock Indonesia', 200, 'fjAFcewRl64', 2023, 45000000),
  t('mood_tenxi_garam', 'Garam dan Madu', 'Tenxi, Naykilla & Jemsii', 'Garam & Madu (Single)', 'Pop Indonesia', 200, 'k0ubS6BhHu4', 2025, 310000000),
  // --- Galau & Sendu ---
  t('mood_dewa_pupus', 'Pupus', 'Dewa 19', 'Cintailah Cinta', 'Rock Indonesia', 270, 'VQ-qjEV1m6M', 2002, 290000000),
  t('mood_gigi_11_januari', '11 Januari', 'Gigi', 'Raihlah Kemenangan', 'Rock Indonesia', 260, 'o9PicvdxNnY', 2004, 170000000),
  t('mood_raisa_kali_kedua', 'Kali Kedua', 'Raisa', 'Heart to Heart', 'Pop Indonesia', 240, 'Lr1Ls5Xs4wQ', 2013, 190000000),
  t('mood_sheila_sephia', 'Sephia', 'Sheila On 7', 'Kisah Klasik Untuk Masa Depan', 'Rock Indonesia', 280, '9LtjmpnQXLQ', 2000, 240000000),
  t('mood_feast_peradaban', 'Peradaban', '.Feast', 'Multiverses', 'Rock Indonesia', 300, 'qf1W5iIRTe8', 2017, 88000000),
  t('mood_dongker_tuhan', 'Tuhan di Reruntuh Kota', 'Dongker', 'Tuhan di Reruntuh Kota (Single)', 'Rock Indonesia', 240, 'hzu_5lUQFk8', 2023, 30000000),
  // --- Pesta & Ceria ---
  t('mood_tenxi_kasih', 'Kasih Aba-Aba', 'Naykilla, Tenxi & Jemsii', 'Kasih Aba-Aba (Single)', 'Pop Indonesia', 190, 'vDSUmX2zOGk', 2025, 260000000),
  t('mood_sheila_dan', 'Dan', 'Sheila On 7', 'Pejantan Tangguh', 'Rock Indonesia', 250, 'dGcGbF4ex5o', 2004, 210000000),
  // --- Nostalgia Hangat ---
  t('mood_peterpan_semua', 'Semua Tentang Kita', 'Peterpan', 'Bintang di Surga', 'Rock Indonesia', 290, 'hhn-nGSuenM', 2004, 330000000),
  t('mood_slank_terlalu_manis', 'Terlalu Manis', 'Slank', 'Kampungan', 'Rock Indonesia', 280, 'dVFyo8pCr8c', 1991, 200000000),
  t('mood_padi_sobat', 'Sobat', 'Padi', 'Lain Dunia', 'Rock Indonesia', 270, 'ASskyLrKoCM', 1999, 160000000),
  t('mood_dewa_kangen', 'Kangen', 'Dewa 19', 'Terbaik Terbaik', 'Rock Indonesia', 280, 'tQkEG30xYxA', 1995, 230000000),
  // --- Jalan Santai / Trip ---
  t('mood_dongker_lautan', 'Lautan Bunga Warna Terang', 'Dongker', 'Lautan Bunga Warna Terang (Single)', 'Rock Indonesia', 240, 'ETLJ1ZgtvM0', 2023, 25000000),
];

function playlist(
  id: string,
  title: string,
  description: string,
  coverTheme: Playlist['coverTheme'],
  trackIds: string[],
): Playlist {
  return {
    id,
    title,
    description,
    coverTheme,
    trackIds,
    ownerId: 'mallsound',
    ownerName: 'MallSound',
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const MOOD_PLAYLISTS: Playlist[] = [
  playlist(
    'pl_mood_santai',
    'Santai & Rileks',
    'Tulus, Sal Priadi, Payung Teduh & more — buat sore yang pelan',
    'amber',
    [
      'mood_tulus_hati_hati',
      'mood_sal_gala',
      'mood_fourtwnty_zona',
      'mood_payung_akad',
      'mood_tulus_monokrom',
      'mood_danilla_ada',
      'mood_bernadya_satu_bulan',
    ],
  ),
  playlist(
    'pl_mood_fokus',
    'Fokus & Kerja',
    'Hindia, Nadin Amizah, Tulus & more — teman kerja tanpa distraksi',
    'slate',
    [
      'mood_hindia_secukupnya',
      'mood_tulus_monokrom',
      'mood_bernadya_satu_bulan',
      'mood_danilla_ada',
      'mood_fourtwnty_zona',
      'mood_nadin_taruh',
    ],
  ),
  playlist(
    'pl_mood_semangat',
    'Semangat & Energi',
    "D'Masiv, Jamrud, Sheila On 7 & more — pompa semangat",
    'rose',
    [
      'mood_sheila_melompat',
      'mood_dmasiv_jangan_menyerah',
      'mood_jamrud_surti',
      'mood_wali_cari_jodoh',
      'mood_dongker_bertaruh',
      'mood_tenxi_garam',
    ],
  ),
  playlist(
    'pl_mood_galau',
    'Galau & Sendu',
    'Dewa 19, Raisa, .Feast & more — buat yang lagi sendu',
    'indigo',
    [
      'mood_dewa_pupus',
      'mood_gigi_11_januari',
      'mood_raisa_kali_kedua',
      'mood_sheila_sephia',
      'mood_feast_peradaban',
      'mood_dongker_tuhan',
    ],
  ),
  playlist(
    'pl_mood_pesta',
    'Pesta & Ceria',
    'Wali, Tenxi, Sheila On 7 & more — langsung joget',
    'emerald',
    [
      'mood_wali_cari_jodoh',
      'mood_tenxi_garam',
      'mood_tenxi_kasih',
      'mood_sheila_melompat',
      'mood_jamrud_surti',
      'mood_sheila_dan',
    ],
  ),
  playlist(
    'pl_mood_tidur',
    'Tidur & Tenang',
    'Payung Teduh, Bernadya, Danilla & more — pengantar tidur',
    'slate',
    [
      'mood_payung_akad',
      'mood_bernadya_satu_bulan',
      'mood_danilla_ada',
      'mood_tulus_monokrom',
      'mood_sheila_dan',
      'mood_tulus_hati_hati',
    ],
  ),
  playlist(
    'pl_mood_nostalgia',
    'Nostalgia Hangat',
    'Peterpan, Slank, Padi, Dewa 19 & more — lagu 90-an & 2000-an',
    'amber',
    [
      'mood_peterpan_semua',
      'mood_slank_terlalu_manis',
      'mood_padi_sobat',
      'mood_dewa_kangen',
      'mood_sheila_dan',
      'mood_sheila_sephia',
      'mood_gigi_11_januari',
    ],
  ),
  playlist(
    'pl_mood_perjalanan',
    'Jalan Santai / Trip',
    'Padi, Slank, Dongker & more — soundtrack perjalanan',
    'emerald',
    [
      'mood_padi_sobat',
      'mood_slank_terlalu_manis',
      'mood_dmasiv_jangan_menyerah',
      'mood_dongker_lautan',
      'mood_dewa_kangen',
      'mood_fourtwnty_zona',
    ],
  ),
];

export const MOOD_PLAYLIST_IDS: ReadonlySet<string> = new Set(
  MOOD_PLAYLISTS.map((p) => p.id),
);

/** Kartu mood (id di MOOD_CARDS, src/data/genres.ts) -> playlist bawaan. */
export const MOOD_CARD_TO_PLAYLIST: Record<string, string> = {
  'mood-santai': 'pl_mood_santai',
  'mood-fokus': 'pl_mood_fokus',
  'mood-semangat': 'pl_mood_semangat',
  'mood-galau': 'pl_mood_galau',
  'mood-pesta': 'pl_mood_pesta',
  'mood-tidur': 'pl_mood_tidur',
  'mood-nostalgia': 'pl_mood_nostalgia',
  'mood-perjalanan': 'pl_mood_perjalanan',
};
