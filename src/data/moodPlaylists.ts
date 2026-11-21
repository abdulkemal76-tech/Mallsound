import type { Playlist } from '../types/music';
import type { Track } from '../types/music';

// Kurasi mood — 8 kartu mood di halaman Cari kini membuka playlist beneran
// (bukan pencarian), pola yang sama seperti playlist bawaan Shoegaze v65.
// Semua videoId terverifikasi via oEmbed (judul + channel cocok) pada
// 20 Nov 2026: 14 lagu di-resolve ulang satu-per-satu dengan jeda 6 detik
// (retry lambat — resolve batch sebelumnya kena throttle YouTube dan
// mengembalikan None), 5 lagu dari resolve batch pertama, 9 lagu dari
// videoId yang sudah dikenal. v72 (21 Nov 2026): 33 lagu unik baru
// ditambahkan, juga terverifikasi oEmbed satu-per-satu dengan jeda 6 detik.
// Satu lagu boleh muncul di 1-2 mood yang cocok, supaya tiap playlist
// berisi 12 lagu. 2 video adalah lyric video channel non-official
// (Danilla "Senja di Ambang Pilu" via IndieTube, Banda Neira
// "Yang Patah Tumbuh..." via Luthfi Pradita) — judul cocok, hasil teratas;
// kalau mati, fallback v60 yang menangani.

// Sampul lagu = thumbnail YouTube videonya sendiri (v73): tiap lagu
// sudah punya sampul dari videonya — tidak lagi memakai foto Unsplash
// generik yang sama untuk semua lagu.
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
  const coverUrl = `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`;
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
  // --- Tambahan v72: tiap playlist jadi 12 lagu (33 lagu unik baru) ---
  // Santai & Rileks
  t('mood_nadin_bertaut', 'Bertaut', 'Nadin Amizah', 'Selamat Ulang Tahun', 'Pop Indonesia', 240, 'HyhLsy6b0XI', 2020, 280000000),
  t('mood_tulus_ruang_sendiri', 'Ruang Sendiri', 'Tulus', 'Gajah', 'Pop Indonesia', 240, 'eZgj6pTnNto', 2014, 150000000),
  t('mood_andra_sempurna', 'Sempurna', 'Andra and The Backbone', 'Season 2', 'Rock Indonesia', 260, '_92BBpjIxVE', 2008, 200000000),
  t('mood_glenn_kasih_putih', 'Kasih Putih', 'Glenn Fredly', 'Selamat Pagi, Dunia!', 'Pop Indonesia', 250, 'CVEPAN2eLYg', 2000, 120000000),
  t('mood_letto_ruang_rindu', 'Ruang Rindu', 'Letto', 'Truth, Cry, and Lie', 'Pop Indonesia', 250, '9JS47BC0WXc', 2005, 90000000),
  // Fokus & Kerja
  t('mood_maliq_dia', 'Dia', "Maliq & D'Essentials", '1st', 'Pop Indonesia', 250, 'jssAJes8_wI', 2005, 80000000),
  t('mood_tulus_pamit', 'Pamit', 'Tulus', 'Manusia', 'Pop Indonesia', 240, '3xNp8sjMOiU', 2022, 200000000),
  t('mood_danilla_senja', 'Senja di Ambang Pilu', 'Danilla', 'Lintasan Waktu', 'Pop Indonesia', 240, 'PVjCKlaFCZ8', 2017, 40000000),
  t('mood_banda_yang_patah', 'Yang Patah Tumbuh, Yang Hilang Berganti', 'Banda Neira', 'Yang Patah Tumbuh, Yang Hilang Berganti (Single)', 'Pop Indonesia', 240, 'AhnQzpmVYEU', 2016, 60000000),
  // Semangat & Energi
  t('mood_nidji_laskar', 'Laskar Pelangi', 'Nidji', 'Top Up', 'Pop Indonesia', 270, 'fO1iJqBdXrc', 2008, 250000000),
  t('mood_peterpan_bintang', 'Bintang di Surga', 'Peterpan', 'Bintang di Surga', 'Rock Indonesia', 280, 'Yi-C9okDw3A', 2004, 300000000),
  t('mood_cokelat_bendera', 'Bendera', 'Cokelat', 'Rasa Baru', 'Rock Indonesia', 260, '_fvWUeF0tOU', 2000, 100000000),
  t('mood_tulus_manusia_kuat', 'Manusia Kuat', 'Tulus', 'Monokrom', 'Pop Indonesia', 240, 'LHOh-R00gzI', 2016, 180000000),
  t('mood_noah_separuh', 'Separuh Aku', 'Noah', 'Seperti Seharusnya', 'Rock Indonesia', 270, 'ZyW9eBf2zfI', 2012, 220000000),
  t('mood_peterpan_di_atas_normal', 'Di Atas Normal', 'Peterpan', 'Bintang di Surga', 'Rock Indonesia', 240, 'ZwTAq0PwWKE', 2004, 150000000),
  // Galau & Sendu
  t('mood_mahalini_sial', 'Sial', 'Mahalini', 'Fabula', 'Pop Indonesia', 250, 'QSWYyoF79oE', 2023, 400000000),
  t('mood_ari_hampa', 'Hampa', 'Ari Lasso', 'Keseimbangan', 'Rock Indonesia', 260, 'hTOshUuQNNw', 2003, 130000000),
  t('mood_kerispatih_demi_cinta', 'Demi Cinta', 'Kerispatih', 'Kejujuran Hati', 'Pop Indonesia', 250, 'wlK0erzBlGg', 2005, 110000000),
  t('mood_dewa_takkan_ada', 'Takkan Ada Cinta yang Lain', 'Dewa 19', 'Terbaik Terbaik', 'Rock Indonesia', 270, '_PSPhCCUdZE', 1995, 180000000),
  t('mood_dewa_roman', 'Roman Picisan', 'Dewa 19', 'Laskar Cinta', 'Rock Indonesia', 280, 'N43bVhtyVt4', 2004, 160000000),
  t('mood_sheila_berhenti', 'Berhenti Berharap', 'Sheila On 7', 'Pejantan Tangguh', 'Rock Indonesia', 260, 'nJPnGvWM-n0', 2004, 140000000),
  // Pesta & Ceria
  t('mood_diskoria_chrisye', 'C.H.R.I.S.Y.E', 'Diskoria', 'C.H.R.I.S.Y.E (Single)', 'Pop Indonesia', 240, 'ThYGrYiyvA8', 2022, 50000000),
  t('mood_siti_lagi_syantik', 'Lagi Syantik', 'Siti Badriah', 'Lagi Syantik (Single)', 'Pop Indonesia', 240, 'Tet6_BlStEM', 2018, 350000000),
  t('mood_ayu_alamat_palsu', 'Alamat Palsu', 'Ayu Ting Ting', 'Alamat Palsu (Single)', 'Pop Indonesia', 240, '2NyGDQItpSY', 2014, 200000000),
  t('mood_happy_rungkad', 'Rungkad', 'Happy Asmara', 'Rungkad (Single)', 'Pop Indonesia', 240, 'Tzzdu68zbvQ', 2022, 300000000),
  // Tidur & Tenang
  t('mood_sheila_anugerah', 'Anugerah Terindah yang Pernah Kumiliki', 'Sheila On 7', '07 Des', 'Rock Indonesia', 280, 'gnRCnyC8z0M', 2002, 190000000),
  t('mood_peterpan_yang_terdalam', 'Yang Terdalam', 'Peterpan', 'Bintang di Surga', 'Rock Indonesia', 280, 'CNbmVEEW-mA', 2004, 260000000),
  t('mood_sherina_cinta_pertama', 'Cinta Pertama dan Terakhir', 'Sherina', 'My Life', 'Pop Indonesia', 250, 'DRY81pGMABc', 2002, 100000000),
  t('mood_sheila_pemuja', 'Pemuja Rahasia', 'Sheila On 7', 'Pejantan Tangguh', 'Rock Indonesia', 260, 'fAPeKtnAalc', 2004, 120000000),
  // Nostalgia Hangat
  t('mood_ari_mengejar', 'Mengejar Matahari', 'Ari Lasso', 'Keseimbangan', 'Rock Indonesia', 260, 'FXv02coffR8', 2003, 110000000),
  t('mood_dewa_arjuna', 'Arjuna', 'Dewa 19', 'Laskar Cinta', 'Rock Indonesia', 280, 'EYACy7jELw4', 2004, 150000000),
  t('mood_chrisye_kala', 'Kala Cinta Menggoda', 'Chrisye', 'Kala Cinta Menggoda', 'Pop Indonesia', 270, 'o2jLWzwC4eg', 1997, 90000000),
  // Jalan Santai / Trip
  t('mood_endank_sampai_jumpa', 'Sampai Jumpa', 'Endank Soekamti', 'Sampai Jumpa (Single)', 'Rock Indonesia', 240, '6OMQsYDbbnI', 2015, 60000000),
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
      'mood_nadin_bertaut',
      'mood_tulus_ruang_sendiri',
      'mood_andra_sempurna',
      'mood_glenn_kasih_putih',
      'mood_letto_ruang_rindu',
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
      'mood_nadin_bertaut',
      'mood_tulus_ruang_sendiri',
      'mood_maliq_dia',
      'mood_tulus_pamit',
      'mood_danilla_senja',
      'mood_banda_yang_patah',
    ],
  ),
  playlist(
    'pl_mood_semangat',
    'Semangat & Energi',
    'Nidji, Peterpan, D\'Masiv & more — pompa semangat',
    'rose',
    [
      'mood_sheila_melompat',
      'mood_dmasiv_jangan_menyerah',
      'mood_jamrud_surti',
      'mood_wali_cari_jodoh',
      'mood_dongker_bertaruh',
      'mood_tenxi_garam',
      'mood_nidji_laskar',
      'mood_peterpan_bintang',
      'mood_cokelat_bendera',
      'mood_tulus_manusia_kuat',
      'mood_noah_separuh',
      'mood_peterpan_di_atas_normal',
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
      'mood_mahalini_sial',
      'mood_ari_hampa',
      'mood_kerispatih_demi_cinta',
      'mood_dewa_takkan_ada',
      'mood_dewa_roman',
      'mood_sheila_berhenti',
    ],
  ),
  playlist(
    'pl_mood_pesta',
    'Pesta & Ceria',
    'Wali, Tenxi, Siti Badriah & more — langsung joget',
    'emerald',
    [
      'mood_wali_cari_jodoh',
      'mood_tenxi_garam',
      'mood_tenxi_kasih',
      'mood_sheila_melompat',
      'mood_jamrud_surti',
      'mood_sheila_dan',
      'mood_peterpan_di_atas_normal',
      'mood_peterpan_bintang',
      'mood_diskoria_chrisye',
      'mood_siti_lagi_syantik',
      'mood_ayu_alamat_palsu',
      'mood_happy_rungkad',
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
      'mood_glenn_kasih_putih',
      'mood_andra_sempurna',
      'mood_sheila_anugerah',
      'mood_peterpan_yang_terdalam',
      'mood_sherina_cinta_pertama',
      'mood_sheila_pemuja',
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
      'mood_peterpan_yang_terdalam',
      'mood_ari_hampa',
      'mood_ari_mengejar',
      'mood_dewa_arjuna',
      'mood_chrisye_kala',
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
      'mood_nidji_laskar',
      'mood_ari_mengejar',
      'mood_cokelat_bendera',
      'mood_tulus_manusia_kuat',
      'mood_noah_separuh',
      'mood_endank_sampai_jumpa',
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
