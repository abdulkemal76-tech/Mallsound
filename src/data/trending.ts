export interface TrendingSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  query: string;
  gradient: string;
}

export const TRENDING_SECTIONS: TrendingSection[] = [
  {
    id: 'trending-indo',
    title: 'Top Hits Indonesia',
    subtitle: 'Lagu terpopuler dan paling viral minggu ini',
    icon: '🔥',
    query: 'Bernadya',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
  },
  {
    id: 'trending-tiktok',
    title: 'Viral TikTok Indo',
    subtitle: 'Sound FYP yang lagi ramai diperbincangkan',
    icon: '⚡',
    query: 'Viral TikTok Indonesia',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
  },
  {
    id: 'trending-indie',
    title: 'Indie Senja Sore',
    subtitle: 'Harmoni syahdu penikmat kopi & senja',
    icon: '☕',
    query: 'Indie Indonesia Senja',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
  },
  {
    id: 'trending-pop',
    title: 'Pop Terkini 2026',
    subtitle: 'Deretan rilisan pop lokal paling segar',
    icon: '✨',
    query: 'Pop Indonesia 2026',
    gradient: 'from-pink-500 via-fuchsia-600 to-violet-600',
  },
  {
    id: 'trending-rock',
    title: 'Rock Alternatif',
    subtitle: 'Distorsi gitar dan energi panggung lokal',
    icon: '🎸',
    query: 'Rock Alternatif Indonesia',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
  },
  {
    id: 'trending-nostalgia',
    title: 'Nostalgia 2000-an',
    subtitle: 'Kompilasi emas era kaset dan radio',
    icon: '📼',
    query: 'Pop Rock 2000 Indonesia',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
  },
  {
    id: 'trending-galau',
    title: 'Galau Maksimal',
    subtitle: 'Lagu pengiring renungan larut malam',
    icon: '🌧️',
    query: 'Lagu Galau Indonesia',
    gradient: 'from-indigo-700 via-purple-700 to-pink-700',
  },
  {
    id: 'trending-koplo',
    title: 'Koplo Modern Wave',
    subtitle: 'Kendang ambyar masa kini penolak gundah',
    icon: '💃',
    query: 'Dangdut Koplo Modern',
    gradient: 'from-rose-500 via-amber-500 to-orange-600',
  },
];
