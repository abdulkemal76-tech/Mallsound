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

export type RepeatMode = 'off' | 'all' | 'one';

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
    youtubeVideoId: 'dGcGbF4ex5o',
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
    id: 'itunes_satu_bulan',
    title: 'Satu Bulan',
    artist: 'Bernadya',
    album: 'Sialnya, Hidup Harus Tetap Berjalan',
    genre: 'Pop Alternatif',
    durationSec: 201,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4a/1c/91/4a1c911b-7a6c-d2ff-714a-f32f3f76901a/198588046777.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'yjnSX_iUFVo',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2024,
    playsCount: 2315000,
    lyrics: [
      { timeSec: 12, text: 'Belum ada satu bulan' },
      { timeSec: 17, text: 'Kudengar kabar kau sudah punya yang baru' },
      { timeSec: 25, text: 'Rupanya kamu mudah membuka hati' },
      { timeSec: 32, text: 'Sementara aku masih menangisi dirimu' },
      { timeSec: 40, text: 'Hebatnya kamu melupakan segalanya' },
      { timeSec: 48, text: 'Seolah kita tak pernah ada cerita' },
      { timeSec: 56, text: 'Semoga bahagiamu bukan pelarian semata' },
      { timeSec: 75, text: 'Dan semoga dia mencintaimu lebih dari aku mencintaimu' },
    ],
  },
  {
    id: 'itunes_dari_planet_lain',
    title: 'Dari Planet Lain',
    artist: 'Sal Priadi',
    album: 'MARKERS AND SUCH PENS FLASHDISKS',
    genre: 'Indie Pop',
    durationSec: 184,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bf/25/7f/bf257f89-8dcf-4be3-485c-11e0ff0d4850/cover.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'eBGIQ7ZuuiU',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2024,
    playsCount: 1890000,
    lyrics: [
      { timeSec: 10, text: 'Sepertinya kau memang dari planet yang lain' },
      { timeSec: 18, text: 'Dikirim ke bumi untuk menemani aku' },
      { timeSec: 25, text: 'Yang aneh, yang sering merasa sendiri' },
      { timeSec: 33, text: 'Yang selalu bingung cara mencintai' },
      { timeSec: 45, text: 'Terima kasih telah datang membawa senyuman' },
      { timeSec: 55, text: 'Membuat dunia ini sedikit lebih hangat' },
    ],
  },
  {
    id: 'itunes_lantas',
    title: 'Lantas',
    artist: 'Juicy Luicy',
    album: 'Sentimental',
    genre: 'Pop Akustik',
    durationSec: 232,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4a/1c/91/4a1c911b-7a6c-d2ff-714a-f32f3f76901a/cover.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'pagiHshKe_0',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2020,
    playsCount: 3120000,
    lyrics: [
      { timeSec: 15, text: 'Lantas mengapa ku masih menaruh hati' },
      { timeSec: 22, text: 'Padahal tahu kau tlah terikat janji' },
      { timeSec: 30, text: 'Keliru ataukah bukan tak tahu' },
      { timeSec: 38, text: 'Lupakanmu tapi aku tak mau' },
      { timeSec: 46, text: 'Pantaskah ku menyimpan rasa ini' },
      { timeSec: 55, text: 'Biar ku nikmati sendiri rasa perih ini' },
    ],
  },
  {
    id: 'itunes_rayuan_perempuan_gila',
    title: 'Rayuan Perempuan Gila',
    artist: 'Nadin Amizah',
    album: 'Untuk Dunia, Cinta, dan Kotornya',
    genre: 'Folk / Indie',
    durationSec: 279,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/bf/25/7f/bf257f89-8dcf-4be3-485c-11e0ff0d4850/cover.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'gIsoLyQX7W8',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2023,
    playsCount: 2750000,
    lyrics: [
      { timeSec: 15, text: 'Menurutmu apa yang bisa kulakukan' },
      { timeSec: 25, text: 'Selain merayu kau agar tetap tinggal' },
      { timeSec: 35, text: 'Aku memang perempuan yang sulit dipahami' },
      { timeSec: 45, text: 'Tapi cintaku padamu sungguh tak terperi' },
    ],
  },
  {
    id: 'itunes_evaluasi',
    title: 'Evaluasi',
    artist: 'Hindia',
    album: 'Menari Dengan Bayangan',
    genre: 'Rock Alternatif',
    durationSec: 215,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/4a/1c/91/4a1c911b-7a6c-d2ff-714a-f32f3f76901a/cover.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: '01WhxHpsOyc',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2019,
    playsCount: 4100000,
    lyrics: [
      { timeSec: 10, text: 'Yang tak pernah berkesudahan' },
      { timeSec: 18, text: 'Tentang beban dan tuntutan hidup' },
      { timeSec: 26, text: 'Bilas muka, gosok gigi, evaluasi' },
      { timeSec: 35, text: 'Tidurlah, malam terlalu malam tuk kau tangisi' },
      { timeSec: 50, text: 'Masalah yang mengeruh, oh biarkan reda sejenak' },
    ],
  },
  {
    id: 'itunes_risalah_hati',
    title: 'Risalah Hati',
    artist: 'Dewa 19',
    album: 'Bintang Lima',
    genre: 'Pop Rock Klasik',
    durationSec: 294,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/bf/25/7f/bf257f89-8dcf-4be3-485c-11e0ff0d4850/cover.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: '3NPVxBXRivw',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2000,
    playsCount: 5200000,
    lyrics: [
      { timeSec: 20, text: 'Aku bisa membuatmu jatuh cinta kepadaku' },
      { timeSec: 30, text: 'Meski kau tak pernah menginginkanku' },
      { timeSec: 42, text: 'Beri sedikit waktu biar cinta datang' },
      { timeSec: 55, text: 'Karna telah terbiasa' },
    ],
  },
  {
    id: 'itunes_sephia',
    title: 'Sephia',
    artist: 'Sheila On 7',
    album: 'Kisah Klasik Untuk Masa Depan',
    genre: 'Pop Rock',
    durationSec: 298,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/25/7f/bf257f89-8dcf-4be3-485c-11e0ff0d4850/886444855906.jpg/600x600bb.jpg',
    audioUrl: '',
    rawPreviewUrl: '',
    youtubeVideoId: 'q9C0IAPzNcI',
    bitrateLabel: '256kbps AAC / YT Full',
    releaseYear: 2000,
    playsCount: 3800000,
    lyrics: [
      { timeSec: 15, text: 'Hei, Sephia, malam ini ku tak bisa' },
      { timeSec: 25, text: 'Menemani tidurmu yang dingin' },
      { timeSec: 38, text: 'Karna ku harus pulang ke pelukan kekasihku' },
      { timeSec: 52, text: 'Lupakanlah diriku, jangan pernah cari aku lagi' },
    ],
  },
];

