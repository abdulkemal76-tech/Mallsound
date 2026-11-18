export interface GenreMoodCard {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  query: string;
}

export const MOOD_CARDS: GenreMoodCard[] = [
  { id: 'mood-santai', label: 'Santai & Rileks', icon: '☕', gradient: 'from-amber-500 via-orange-500 to-rose-500', query: 'Santai Akustik Senja' },
  { id: 'mood-fokus', label: 'Fokus & Kerja', icon: '🎧', gradient: 'from-blue-600 via-indigo-600 to-violet-700', query: 'Focus Lo-Fi Study' },
  { id: 'mood-semangat', label: 'Semangat & Energi', icon: '⚡', gradient: 'from-rose-500 via-red-600 to-amber-500', query: 'Semangat Workout Beat' },
  { id: 'mood-galau', label: 'Galau & Sendu', icon: '🌧️', gradient: 'from-indigo-600 via-purple-600 to-pink-600', query: 'Lagu Galau Indonesia' },
  { id: 'mood-pesta', label: 'Pesta & Ceria', icon: '🎉', gradient: 'from-fuchsia-500 via-pink-500 to-rose-500', query: 'Party Hits Indonesia' },
  { id: 'mood-tidur', label: 'Tidur & Tenang', icon: '🌙', gradient: 'from-slate-800 via-indigo-950 to-neutral-900', query: 'Sleep Ambient Relax' },
  { id: 'mood-nostalgia', label: 'Nostalgia Hangat', icon: '📻', gradient: 'from-emerald-600 via-teal-600 to-cyan-700', query: 'Nostalgia Klasik Indonesia' },
  { id: 'mood-perjalanan', label: 'Jalan Santai / Trip', icon: '🚗', gradient: 'from-cyan-500 via-blue-600 to-indigo-600', query: 'Roadtrip Playlist' },
];

export const GENRE_CARDS: GenreMoodCard[] = [
  { id: 'genre-pop-indo', label: 'Pop Indonesia', icon: '🎤', gradient: 'from-pink-500 via-rose-500 to-purple-600', query: 'Pop Indonesia' },
  { id: 'genre-indie', label: 'Indie & Senja', icon: '🌅', gradient: 'from-amber-500 via-orange-600 to-rose-600', query: 'Indie Indonesia' },
  { id: 'genre-rock', label: 'Rock & Punk', icon: '🎸', gradient: 'from-red-600 via-rose-700 to-purple-800', query: 'Rock Indonesia' },
  { id: 'genre-rnb', label: 'R&B & Soul', icon: '🎷', gradient: 'from-violet-600 via-purple-600 to-indigo-700', query: 'R&B Indonesia' },
  { id: 'genre-hiphop', label: 'Hip-Hop / Rap', icon: '🧢', gradient: 'from-orange-500 via-amber-600 to-yellow-600', query: 'Hip Hop Indonesia' },
  { id: 'genre-koplo', label: 'Dangdut & Koplo', icon: '🪘', gradient: 'from-yellow-500 via-amber-500 to-rose-500', query: 'Dangdut Koplo' },
  { id: 'genre-akustik', label: 'Akustik & Folk', icon: '🪕', gradient: 'from-teal-500 via-emerald-600 to-cyan-700', query: 'Akustik Folk Indonesia' },
  { id: 'genre-elektronik', label: 'Elektronik & Dance', icon: '🎛️', gradient: 'from-blue-600 via-cyan-500 to-teal-500', query: 'EDM Electronic' },
  { id: 'genre-kpop', label: 'K-Pop & Asian', icon: '🌸', gradient: 'from-fuchsia-500 via-pink-400 to-rose-400', query: 'K-Pop Hits' },
  { id: 'genre-jazz', label: 'Jazz & Keroncong', icon: '🎺', gradient: 'from-amber-600 via-yellow-700 to-orange-800', query: 'Jazz Indonesia' },
  { id: 'genre-metal', label: 'Metal & Cadas', icon: '⚡', gradient: 'from-neutral-800 via-zinc-800 to-neutral-950', query: 'Metal Indonesia' },
  { id: 'genre-lofi', label: 'Lo-Fi & Chillwave', icon: '📼', gradient: 'from-indigo-600 via-violet-700 to-pink-600', query: 'Lo-Fi Chill Beats' },
];

export const GENRE_MOOD_CARDS: GenreMoodCard[] = [
  ...GENRE_CARDS.slice(0, 8),
  ...MOOD_CARDS.slice(0, 4),
];
