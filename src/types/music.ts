export type GenreType =
  | 'Indie Senja'
  | 'Lo-Fi Beats'
  | 'Synthwave'
  | 'Akustik'
  | 'Eksperimental'
  | 'Pop Alternatif';

export interface LyricLine {
  timeSec: number;
  text: string;
}

export interface SynthComposition {
  bpm: number;
  rootNote: number; // MIDI note
  chordProgression: number[][]; // Array of chords (MIDI offsets from root)
  melodyPattern: (number | null)[]; // 16-step melody offsets
  bassPattern: (number | null)[]; // 16-step bass offsets
  waveType: OscillatorType;
  padFilterCutoff: number;
  drumStyle: 'indie' | 'lofi' | 'synthwave' | 'acoustic';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: GenreType | string;
  durationSec: number;
  previewDurationSec?: number;
  coverUrl: string;
  audioUrl: string; // '/api/music/audio-proxy?url=...' or 'synth://...' or Blob URL
  rawPreviewUrl?: string;
  youtubeVideoId?: string | null;
  bitrateLabel: string;
  releaseYear: number;
  playsCount: number;
  lyrics: LyricLine[];
  synthConfig?: SynthComposition;
  isCustom?: boolean;
  ownerId?: string;
  ownerName?: string;
}

export type PlaylistCoverTheme = 'amber' | 'emerald' | 'indigo' | 'rose' | 'slate';

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverTheme: PlaylistCoverTheme;
  trackIds: string[];
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EqualizerBand {
  frequency: number;
  label: string;
  gainDb: number;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  description: string;
  gains: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
}

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_featured_album_1794914759219.jpg';
export const COVER_INDIE_SENJA = '/src/assets/images/cover_indie_senja_1794914758586.jpg';
export const COVER_MIDNIGHT_SYNTH = '/src/assets/images/cover_midnight_synth_1794914758604.jpg';
export const COVER_ACOUSTIC_DAWN = '/src/assets/images/cover_acoustic_dawn_1794914761206.jpg';

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  {
    id: 'flat',
    name: 'Studio Flat',
    description: 'Respons frekuensi murni tanpa pewarnaan',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'analog-warmth',
    name: 'Analog Senja',
    description: 'Sub-bass hangat dan vokal mid-range lembut',
    gains: [4.5, 3.0, 1.0, -1.0, 1.5],
  },
  {
    id: 'midnight-bass',
    name: 'Midnight Sub',
    description: 'Dorongan frekuensi rendah dalam untuk synthwave & lo-fi',
    gains: [6.5, 4.0, -1.5, 2.0, 3.5],
  },
  {
    id: 'vocal-clarity',
    name: 'Akustik Jernih',
    description: 'Fokus artikulasi petikan gitar dan vokal intim',
    gains: [-2.0, 0.5, 3.5, 4.5, 2.5],
  },
];

export const BUILT_IN_TRACKS: Track[] = [
  {
    id: 'itunes_dan_sheila',
    title: 'Dan...',
    artist: 'Sheila On 7',
    album: 'Sheila On 7',
    genre: 'Pop Rock',
    durationSec: 286,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/25/7f/bf257f89-8dcf-4be3-485c-11e0ff0d4850/886444855906.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'Ch3l_Q9PxpQ',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 1999,
    playsCount: 1548200,
    lyrics: [
      { timeSec: 14, text: 'Dan bila esok datang kembali' },
      { timeSec: 21, text: 'Seperti sedia kala di mana kau bisa bercanda' },
      { timeSec: 30, text: 'Dan perlahan kau pun lupakan aku' },
      { timeSec: 38, text: "Mimpi burukmu di mana t'lah kutancapkan duri tajam" },
      { timeSec: 46, text: 'Kaupun menangis, menangis kuluka' },
      { timeSec: 54, text: 'Bedanya bila ku dihasilkan' },
      { timeSec: 62, text: 'Dan caci maki berkawan kita' },
      { timeSec: 78, text: 'Lupakanlah saja diriku' },
      { timeSec: 86, text: 'Bila itu bisa membuatmu kembali bersinar' },
      { timeSec: 96, text: 'Bersiul tenang seperti lumba-lumba' },
    ],
  },
  {
    id: 'trk-senja-pelabuhan',
    title: 'Garis Cahaya di Pelabuhan Lama',
    artist: 'Lentera Kolektif',
    album: 'Monolog Sore Hari',
    genre: 'Indie Senja',
    durationSec: 164,
    coverUrl: COVER_INDIE_SENJA,
    audioUrl: 'synth://senja-pelabuhan',
    bitrateLabel: '24-bit / 96kHz FLAC',
    releaseYear: 2026,
    playsCount: 148920,
    synthConfig: {
      bpm: 88,
      rootNote: 60, // C4
      chordProgression: [
        [0, 4, 7, 11],   // Cmaj7
        [-3, 0, 4, 7],   // Am7
        [-7, -3, 0, 4],  // Fmaj7
        [-5, -1, 2, 7],  // G6
      ],
      melodyPattern: [12, null, 11, 7, null, 9, 7, 4, 7, null, 4, 0, null, 2, 4, null],
      bassPattern: [-12, null, null, -12, null, null, -12, null, -15, null, null, -15, null, -17, null, -19],
      waveType: 'triangle',
      padFilterCutoff: 1450,
      drumStyle: 'indie',
    },
    lyrics: [
      { timeSec: 0, text: 'Instrumental pembuka — deru angin dermaga tua' },
      { timeSec: 12, text: 'Langkah melambat saat lampu jalan mulai menyala' },
      { timeSec: 26, text: 'Bayang beton memanjang di atas air yang tenang' },
      { timeSec: 42, text: 'Kita menyimpan ribuan rencana di saku jaket yang pudar' },
      { timeSec: 58, text: 'Biarkan frekuensi senja ini bicara tanpa tergesa' },
      { timeSec: 76, text: 'Di antara kapal kargo dan langit yang berubah tembaga' },
      { timeSec: 96, text: 'Setiap nada jatuh seperti hujan tipis di kaca jendela' },
      { timeSec: 118, text: 'Tak perlu peta untuk pulang ke ruang yang kita kenal' },
      { timeSec: 140, text: 'Hanya gema synthesizer hangat hingga malam tiba' },
    ],
  },
  {
    id: 'trk-distrik-tengah-malam',
    title: 'Distrik Hujan Pukul Dua',
    artist: 'Raka & Mesin Waktu',
    album: 'Transmisi Nokturnal',
    genre: 'Synthwave',
    durationSec: 192,
    coverUrl: COVER_MIDNIGHT_SYNTH,
    audioUrl: 'synth://distrik-hujan',
    bitrateLabel: '24-bit / 48kHz Studio',
    releaseYear: 2026,
    playsCount: 219450,
    synthConfig: {
      bpm: 108,
      rootNote: 57, // A3
      chordProgression: [
        [0, 3, 7, 10],   // Am7
        [-4, 0, 3, 7],   // Fmaj7
        [-9, -5, -2, 3], // Cmaj7
        [-2, 2, 5, 10],  // G7
      ],
      melodyPattern: [12, 7, 3, 0, 12, 7, 3, 0, 14, 10, 7, 3, 15, 12, 7, 3],
      bassPattern: [-12, -12, -12, -12, -16, -16, -16, -16, -9, -9, -9, -9, -14, -14, -14, -14],
      waveType: 'sawtooth',
      padFilterCutoff: 2100,
      drumStyle: 'synthwave',
    },
    lyrics: [
      { timeSec: 0, text: 'Arpeggio analog menembus kabut aspal basah' },
      { timeSec: 16, text: 'Pantulan neon kuning di genangan trotoar kota' },
      { timeSec: 34, text: 'Radio mobil memutar gelombang dari dekade yang hilang' },
      { timeSec: 52, text: 'Kita melaju melewati jembatan layang tanpa tujuan pasti' },
      { timeSec: 74, text: 'Detak drum mesin menjaga jantung tetap terjaga' },
      { timeSec: 98, text: 'Semua kebisingan siang luruh di balik kaca basah' },
      { timeSec: 124, text: 'Di frekuensi 108 BPM kita menemukan ketenangan' },
      { timeSec: 156, text: 'Transmisi selesai saat fajar mulai mengintip di timur' },
    ],
  },
  {
    id: 'trk-beranda-kayu-jati',
    title: 'Secangkir Kopi di Beranda Jati',
    artist: 'Nadia Pramesti',
    album: 'Catatan Pagi',
    genre: 'Akustik',
    durationSec: 148,
    coverUrl: COVER_ACOUSTIC_DAWN,
    audioUrl: 'synth://beranda-jati',
    bitrateLabel: '16-bit / 44.1kHz PCM',
    releaseYear: 2025,
    playsCount: 94310,
    synthConfig: {
      bpm: 76,
      rootNote: 62, // D4
      chordProgression: [
        [0, 4, 7, 9],    // D6
        [-5, -1, 2, 6],  // Aadd9
        [-3, 0, 4, 7],   // Bm7
        [-7, -3, 0, 4],  // Gmaj7
      ],
      melodyPattern: [9, null, 7, 4, 2, null, 4, 7, 9, null, 11, 9, 7, null, 4, null],
      bassPattern: [-12, null, -5, null, -17, null, -10, null, -15, null, -8, null, -19, null, -12, null],
      waveType: 'sine',
      padFilterCutoff: 1100,
      drumStyle: 'acoustic',
    },
    lyrics: [
      { timeSec: 0, text: 'Petikan hangat di sudut ruang yang disinari matahari pagi' },
      { timeSec: 14, text: 'Uap kopi mengepul pelan di sebelah tumpukan buku lama' },
      { timeSec: 30, text: 'Suara burung di halaman menyatu dengan resonansi kayu' },
      { timeSec: 48, text: 'Hari ini kita mulai tanpa daftar beban yang panjang' },
      { timeSec: 68, text: 'Cukup dengarkan napas pagi dan harmoni sederhana' },
      { timeSec: 92, text: 'Cahaya menembus tirai tipis membentuk pola di lantai' },
      { timeSec: 118, text: 'Semoga hangat ini tinggal sampai petang nanti' },
    ],
  },
  {
    id: 'trk-ruang-rekam-analog',
    title: 'Sesi Analog Studio Empat',
    artist: 'Sora & Kawan Lama',
    album: 'Arsip Pita Magnetik',
    genre: 'Lo-Fi Beats',
    durationSec: 175,
    coverUrl: HERO_BANNER_IMAGE,
    audioUrl: 'synth://studio-empat',
    bitrateLabel: '24-bit / 96kHz Master',
    releaseYear: 2026,
    playsCount: 183600,
    synthConfig: {
      bpm: 82,
      rootNote: 58, // Bb3
      chordProgression: [
        [0, 3, 7, 10],   // Bbm7
        [-2, 2, 5, 9],   // Abmaj7
        [-5, -1, 2, 5],  // Fm7
        [-4, 0, 3, 7],   // Gbmaj7
      ],
      melodyPattern: [10, null, 7, 5, 3, null, 0, null, 7, 5, 3, null, 2, 3, 5, null],
      bassPattern: [-12, null, null, -12, -14, null, null, -14, -17, null, null, -17, -16, null, -14, null],
      waveType: 'triangle',
      padFilterCutoff: 980,
      drumStyle: 'lofi',
    },
    lyrics: [
      { timeSec: 0, text: 'Suara gulungan pita reel-to-reel mulai berputar stabil' },
      { timeSec: 15, text: 'Ketukan lo-fi hangat menemani fokus kerja larut malam' },
      { timeSec: 35, text: 'Jari menari di atas tuts synthesizer Moog kayu' },
      { timeSec: 55, text: 'Tak ada yang perlu dipercepat, semua punya ritmenya' },
      { timeSec: 80, text: 'Harmoni minor ketujuh mengalir lembut di headphone' },
      { timeSec: 110, text: 'Biarkan ide-ide tumbuh di antara jeda ketukan snare' },
      { timeSec: 145, text: 'Putaran pita melambat menutup sesi rekaman malam ini' },
    ],
  },
  {
    id: 'trk-orbit-satelit-sunyi',
    title: 'Orbit Satelit Sunyi',
    artist: 'Vektor Kosmik',
    album: 'Geometri Ruang',
    genre: 'Eksperimental',
    durationSec: 204,
    coverUrl: COVER_MIDNIGHT_SYNTH,
    audioUrl: 'synth://orbit-satelit',
    bitrateLabel: '24-bit / 96kHz Spatial',
    releaseYear: 2026,
    playsCount: 76400,
    synthConfig: {
      bpm: 96,
      rootNote: 64, // E4
      chordProgression: [
        [0, 3, 7, 11],   // Em(maj7)
        [-4, 0, 4, 7],   // Cmaj7#11
        [-7, -3, 0, 4],  // Am9
        [-5, -1, 2, 6],  // B7alt
      ],
      melodyPattern: [11, null, 7, null, 14, 11, null, 7, 12, null, 4, null, 7, 4, 0, null],
      bassPattern: [-12, null, -12, null, -16, null, -16, null, -19, null, -19, null, -17, null, -17, null],
      waveType: 'sine',
      padFilterCutoff: 1650,
      drumStyle: 'synthwave',
    },
    lyrics: [
      { timeSec: 0, text: 'Sinyal telemetri akustik dari orbit rendah bumi' },
      { timeSec: 20, text: 'Melayang tanpa gravitasi di atas kilau lampu benua' },
      { timeSec: 45, text: 'Modulasi filter membuka ruang resonansi baru' },
      { timeSec: 75, text: 'Keheningan angkasa memantulkan gema nada kristal' },
      { timeSec: 115, text: 'Setiap rotasi membawa perspektif yang lebih jernih' },
      { timeSec: 160, text: 'Menjaga keseimbangan di garis batas atmosfer' },
    ],
  },
  {
    id: 'trk-langkah-kota-lama',
    title: 'Langkah Cepat di Kota Lama',
    artist: 'Gelombang Selatan',
    album: 'Antologi Trotoar',
    genre: 'Pop Alternatif',
    durationSec: 158,
    coverUrl: COVER_INDIE_SENJA,
    audioUrl: 'synth://kota-lama',
    bitrateLabel: '24-bit / 48kHz Master',
    releaseYear: 2025,
    playsCount: 132800,
    synthConfig: {
      bpm: 114,
      rootNote: 65, // F4
      chordProgression: [
        [0, 4, 7, 9],    // F6
        [-3, 0, 4, 7],   // Dm7
        [-7, -3, 0, 4],  // Bbmaj7
        [-5, -1, 2, 7],  // C9
      ],
      melodyPattern: [9, 7, 4, 0, 9, 7, 4, null, 12, 9, 7, 4, 7, 4, 2, 0],
      bassPattern: [-12, -12, null, -12, -15, -15, null, -15, -19, -19, null, -19, -17, -17, -15, -14],
      waveType: 'triangle',
      padFilterCutoff: 1850,
      drumStyle: 'indie',
    },
    lyrics: [
      { timeSec: 0, text: 'Ketukan upbeat membuka perjalanan menyusuri koridor kota' },
      { timeSec: 14, text: 'Poster konser lama masih menempel di tembok bata' },
      { timeSec: 32, text: 'Kita bertukar cerita sambil menunggu kereta lewat' },
      { timeSec: 54, text: 'Musik dari toko kaset terdengar sampai ke seberang jalan' },
      { timeSec: 78, text: 'Tak ada alasan untuk berhenti bermimpi sore ini' },
      { timeSec: 108, text: 'Semua warna menyatu dalam langkah yang semakin ringan' },
      { timeSec: 135, text: 'Sampai jumpa di panggung kecil akhir pekan nanti' },
    ],
  },
];
