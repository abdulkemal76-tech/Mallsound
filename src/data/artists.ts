export interface ArtistItem {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  query: string;
  avatarUrl?: string;
  isIndonesian?: boolean;
}

export const ARTIST_CATEGORIES = [
  'Semua',
  'Populer Indonesia',
  'Indie & Senja',
  'Legenda & Band',
  'Pop & R&B Hits',
  'Global Pop',
  'Rock & Alternatif Global',
  'Asia & K-Pop',
] as const;

export const GLOBAL_ARTISTS: ArtistItem[] = [
  // Top Indonesian Artists
  { id: 'sheila-on-7', name: 'Sheila On 7', category: 'Legenda & Band', subtitle: 'Pop Rock Klasik Yogyakarta', query: 'Sheila On 7', isIndonesian: true },
  { id: 'bernadya', name: 'Bernadya', category: 'Pop & R&B Hits', subtitle: 'Pop Melankolis & Balada Malam', query: 'Bernadya', isIndonesian: true },
  { id: 'hindia', name: 'Hindia', category: 'Indie & Senja', subtitle: 'Monolog Alternatif & Lirik Personal', query: 'Hindia', isIndonesian: true },
  { id: 'tulus', name: 'Tulus', category: 'Pop & R&B Hits', subtitle: 'Pop Jazz Hangat & Harmoni Vokal', query: 'Tulus', isIndonesian: true },
  { id: 'dewa-19', name: 'Dewa 19', category: 'Legenda & Band', subtitle: 'Antologi Rock & Balada Abadi', query: 'Dewa 19', isIndonesian: true },
  { id: 'nadin-amizah', name: 'Nadin Amizah', category: 'Indie & Senja', subtitle: 'Folk Akustik & Puisi Kamar', query: 'Nadin Amizah', isIndonesian: true },
  { id: 'juicy-luicy', name: 'Juicy Luicy', category: 'Pop & R&B Hits', subtitle: 'Pop Sentimental Bandung', query: 'Juicy Luicy', isIndonesian: true },
  { id: 'noah', name: 'Noah / Peterpan', category: 'Legenda & Band', subtitle: 'Anthem Band Pop Rock Legendaris', query: 'Noah Peterpan', isIndonesian: true },
  { id: 'perunggu', name: 'Perunggu', category: 'Indie & Senja', subtitle: 'Rock Pulang Kantor & Ode Kota', query: 'Perunggu', isIndonesian: true },
  { id: 'the-adams', name: 'The Adams', category: 'Indie & Senja', subtitle: 'Power Pop & Indie Rock Jakarta', query: 'The Adams', isIndonesian: true },
  { id: 'sal-priadi', name: 'Sal Priadi', category: 'Pop & R&B Hits', subtitle: 'Eksplorasi Pop Teatrikal & Puitis', query: 'Sal Priadi', isIndonesian: true },
  { id: 'maliq', name: "Maliq & D'Essentials", category: 'Pop & R&B Hits', subtitle: 'Soul, Funk & Groove Jakarta', query: "Maliq & D'Essentials", isIndonesian: true },
  { id: 'pamungkas', name: 'Pamungkas', category: 'Indie & Senja', subtitle: 'Modern Bedroom Pop & Balada', query: 'Pamungkas', isIndonesian: true },
  { id: 'tenxi', name: 'Tenxi', category: 'Populer Indonesia', subtitle: 'Pioneer Hipdut & Trap Koplo Sidoarjo', query: 'Tenxi', isIndonesian: true },
  { id: 'dongker', name: 'Dongker', category: 'Indie & Senja', subtitle: 'Punk / Indie Alternatif Bandung', query: 'Dongker', isIndonesian: true },
  { id: 'fourtwnty', name: 'Fourtwnty', category: 'Indie & Senja', subtitle: 'Folk Senja & Akustik Santai', query: 'Fourtwnty', isIndonesian: true },
  { id: 'feast', name: '.Feast', category: 'Indie & Senja', subtitle: 'Rock Alternatif & Kritik Sosial', query: '.Feast', isIndonesian: true },

  // Global & Asia Artists
  { id: 'rex-orange-county', name: 'Rex Orange County', category: 'Rock & Alternatif Global', subtitle: 'Indie Pop, Bedroom Pop & Neo-Soul', query: 'Rex Orange County', isIndonesian: false },
  { id: 'coldplay', name: 'Coldplay', category: 'Rock & Alternatif Global', subtitle: 'Stadium Alternative Rock', query: 'Coldplay', isIndonesian: false },
  { id: 'taylor-swift', name: 'Taylor Swift', category: 'Global Pop', subtitle: 'Global Pop Superstar', query: 'Taylor Swift', isIndonesian: false },
  { id: 'the-weeknd', name: 'The Weeknd', category: 'Global Pop', subtitle: 'Dark R&B & Synth Pop Master', query: 'The Weeknd', isIndonesian: false },
  { id: 'bruno-mars', name: 'Bruno Mars', category: 'Global Pop', subtitle: 'Funk, R&B & Pop Showman', query: 'Bruno Mars', isIndonesian: false },
  { id: 'billie-eilish', name: 'Billie Eilish', category: 'Global Pop', subtitle: 'Alt-Pop & Whispering Melodies', query: 'Billie Eilish', isIndonesian: false },
  { id: 'arctic-monkeys', name: 'Arctic Monkeys', category: 'Rock & Alternatif Global', subtitle: 'British Indie & Garage Rock', query: 'Arctic Monkeys', isIndonesian: false },
  { id: 'dua-lipa', name: 'Dua Lipa', category: 'Global Pop', subtitle: 'Nu-Disco & Dance Pop Queen', query: 'Dua Lipa', isIndonesian: false },
  { id: 'oasis', name: 'Oasis', category: 'Rock & Alternatif Global', subtitle: 'Anthem Britpop Legendaris', query: 'Oasis', isIndonesian: false },
  { id: 'yoasobi', name: 'YOASOBI', category: 'Asia & K-Pop', subtitle: 'J-Pop Elektronik Sinematik', query: 'YOASOBI', isIndonesian: false },
  { id: 'newjeans', name: 'NewJeans', category: 'Asia & K-Pop', subtitle: 'Y2K Easy-Listening K-Pop', query: 'NewJeans', isIndonesian: false },
  { id: 'bts', name: 'BTS', category: 'Asia & K-Pop', subtitle: 'Global K-Pop Phenomenon', query: 'BTS', isIndonesian: false },
  { id: 'ed-sheeran', name: 'Ed Sheeran', category: 'Global Pop', subtitle: 'Acoustic Pop Singer-Songwriter', query: 'Ed Sheeran', isIndonesian: false },
];
