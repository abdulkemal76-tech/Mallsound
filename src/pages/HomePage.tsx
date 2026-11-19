import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Heart,
  Search,
  Sparkles,
  Flame,
  ArrowRight,
  Music2,
  Headphones,
  Sliders,
  MoreVertical,
  Disc,
  Disc3,
  Radio,
  Coffee,
  Zap,
  Activity,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Music,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Download,
  X,
} from 'lucide-react';
import { Track } from '../types/music';
import { TRENDING_SECTIONS, TrendingSection } from '../data/trending';
import { GENRE_MOOD_CARDS, GenreMoodCard } from '../data/genres';
import { GLOBAL_ARTISTS, ArtistItem } from '../data/artists';
import { DJ_INDO_TRACKS } from '../data/djIndoTracks';
import { searchCatalogWithMeta } from '../services/musicApi';

export interface HomePageProps {
  onSelectTrack: (track: Track, contextTracks?: Track[]) => void;
  currentTrack: Track;
  isPlaying: boolean;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  onNavigateToSearch: (query?: string) => void;
  onOpenActions?: (track: Track, e?: React.MouseEvent) => void;
  onNavigateToDJ?: () => void;
  onNavigateToGuide?: () => void;
}

// Fallback image component with graceful degradation
const ResilientCoverImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-violet-900/60 via-fuchsia-950/50 to-neutral-900 flex items-center justify-center text-violet-400 ${className}`}
      >
        <Music2 className="w-6 h-6 opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

// Formats duration in seconds to MM:SS string
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Dynamic smart greeting based on current hour
function getGreeting(): { text: string; icon: string; subtext: string } {
  const hour = new Date().getHours();
  // 00:00 - 00:59: Tengah Malam
  if (hour === 0) {
    return {
      text: 'Selamat Tengah Malam',
      icon: '🌙',
      subtext: 'Lagu tenang pengantar waktu istirahatmu',
    };
  }
  // 01:00 - 04:59: Dini Hari / Pagi buta (termasuk jam 2 pagi)
  if (hour >= 1 && hour < 5) {
    return {
      text: 'Selamat Pagi',
      icon: '🌌',
      subtext: `Jam ${hour} pagi • Lagu santai peneman istirahat & begadang`,
    };
  }
  // 05:00 - 10:59: Pagi hari
  if (hour >= 5 && hour < 11) {
    return {
      text: 'Selamat Pagi',
      icon: '🌅',
      subtext: 'Awali harimu dengan alunan musik berenergi',
    };
  }
  // 11:00 - 14:59: Siang hari
  if (hour >= 11 && hour < 15) {
    return {
      text: 'Selamat Siang',
      icon: '☀️',
      subtext: 'Temani kesibukan dan rehat siangmu',
    };
  }
  // 15:00 - 17:59: Sore hari
  if (hour >= 15 && hour < 18) {
    return {
      text: 'Selamat Sore',
      icon: '☕',
      subtext: 'Lepas penat sore dengan melodi favoritmu',
    };
  }
  // 18:00 - 23:59: Malam hari
  return {
    text: 'Selamat Malam',
    icon: '🌙',
    subtext: 'Waktunya bersantai dan menikmati malam',
  };
}

// Quick mood chips for 1-tap filtering
const MOOD_FILTERS = [
  { id: 'semua', label: 'Semua Hits', query: '' },
  { id: 'global', label: '🌐 Top Global', query: 'Top Global Hits' },
  { id: 'hits', label: '✨ Top Hits 2026', query: 'Top Hits Indonesia' },
  { id: 'shoegaze', label: '🎸 Shoegaze', query: 'Shoegaze' },
  { id: 'tiktok', label: '⚡ Viral TikTok', query: 'Viral TikTok Indonesia' },
  { id: 'galau', label: '🌧️ Galau Brutal', query: 'Lagu Galau Indonesia' },
  { id: 'rock', label: '🎸 Band 2000-an', query: 'Pop Rock 2000 Indonesia' },
  { id: 'santai', label: '🏖️ Santai Sore', query: 'Lagu Santai Indonesia' },
];

// Spotify-Style 6 Quick-Picks Curated Mixes
interface QuickPickItem {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  gradient: string;
  actionQuery?: string;
  djTrack?: Track;
}

const QUICK_PICKS: QuickPickItem[] = [
  {
    id: 'qp-top-global',
    title: 'Top Global Music',
    subtitle: 'Billboard & Hits Dunia',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    gradient: 'from-blue-600/40 via-indigo-900/30 to-black',
    actionQuery: 'Top Global Hits',
  },
  {
    id: 'qp-top-hits',
    title: 'Top Hits Indonesia',
    subtitle: 'Bernadya, Sal Priadi',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    gradient: 'from-pink-600/40 via-fuchsia-900/30 to-black',
    actionQuery: 'Top Hits Indonesia',
  },
  {
    id: 'qp-shoegaze',
    title: 'Shoegaze',
    subtitle: 'Fuzz, Reverb & Dream Pop',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
    gradient: 'from-fuchsia-600/40 via-purple-900/30 to-black',
    actionQuery: 'Shoegaze',
  },
  {
    id: 'qp-tiktok-fyp',
    title: 'Viral TikTok FYP',
    subtitle: 'Sound Paling Ramai 2026',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    gradient: 'from-cyan-600/40 via-blue-900/30 to-black',
    actionQuery: 'Viral TikTok Indonesia',
  },
  {
    id: 'qp-nostalgia',
    title: 'Nostalgia 2000-an',
    subtitle: 'Sheila On 7, Dewa 19',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
    gradient: 'from-emerald-600/40 via-teal-900/30 to-black',
    actionQuery: 'Sheila On 7',
  },
  {
    id: 'qp-galau',
    title: 'Galau Maksimal',
    subtitle: 'Renungan Larut Malam',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    gradient: 'from-indigo-600/40 via-slate-900/30 to-black',
    actionQuery: 'Lagu Galau Indonesia',
  },
];

// Initial recommendation query pool
const RECOMMENDATION_QUERIES = [
  'Sheila On 7',
  'Bernadya',
  'Hindia',
  'Juicy Luicy',
  'Tulus',
  'Nadin Amizah',
  'Perunggu',
  'Sal Priadi',
  'Tenxi',
  'Dongker',
  'Rex Orange County',
  'Shoegaze',
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTrack,
  currentTrack,
  isPlaying,
  isTrackLiked,
  onToggleLike,
  onNavigateToSearch,
  onOpenActions,
  onNavigateToDJ,
  onNavigateToGuide,
}) => {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [activeRecommendationQuery, setActiveRecommendationQuery] = useState('Top Hits Indonesia');
  const [recommendationSubtitle, setRecommendationSubtitle] = useState('Berdasarkan selera musikmu & lagu teratas');
  const [activeMood, setActiveMood] = useState('semua');

  // Hero Spotlight Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const slideTimerRef = useRef<number | null>(null);

  const greeting = getGreeting();

  // Auto-rotate Hero Spotlight every 6.5 seconds
  useEffect(() => {
    if (isHovered) return;
    slideTimerRef.current = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6500);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [isHovered]);

  // Load diverse, history-aware recommendations (Never just one artist!)
  const loadDiverseRecommendations = async () => {
    setIsLoadingRecommendations(true);
    setIsRefreshingRecs(true);

    try {
      // 1. Check user listening history from localStorage
      let topArtists: string[] = [];
      try {
        const saved = localStorage.getItem('mallsound_recently_played');
        if (saved) {
          const historyTracks: Track[] = JSON.parse(saved);
          if (Array.isArray(historyTracks) && historyTracks.length > 0) {
            const counts = new Map<string, number>();
            for (const t of historyTracks) {
              if (!t.artist) continue;
              const primary = t.artist.split(/[&,x\/+]/)[0].trim();
              if (primary && primary.length > 1) {
                counts.set(primary, (counts.get(primary) || 0) + 1);
              }
            }
            topArtists = Array.from(counts.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([a]) => a);
          }
        }
      } catch (err) {
        console.warn('Failed to parse listening history:', err);
      }

      // 2. Build multi-query streams
      const queryList: string[] = [];
      if (topArtists.length >= 2) {
        queryList.push(topArtists[0]);
        queryList.push(topArtists[1]);
        queryList.push('Top Hits Indonesia');
        const candidatePool = RECOMMENDATION_QUERIES.filter((q) => !topArtists.includes(q));
        const extra = candidatePool[Math.floor(Math.random() * candidatePool.length)] || 'Indie Indonesia Senja';
        queryList.push(extra);
        setRecommendationSubtitle(`Dirancang dari favoritmu (${topArtists[0]}, ${topArtists[1]}) & hits segar`);
      } else if (topArtists.length === 1) {
        queryList.push(topArtists[0]);
        queryList.push('Top Hits Indonesia');
        queryList.push('Indie Indonesia Senja');
        const extra = RECOMMENDATION_QUERIES.filter((q) => q !== topArtists[0])[Math.floor(Math.random() * 4)] || 'Pop Rock 2000 Indonesia';
        queryList.push(extra);
        setRecommendationSubtitle(`Dipilih untukmu berdasarkan ${topArtists[0]} & tren terkini`);
      } else {
        queryList.push('Top Hits Indonesia');
        const shuffled = [...RECOMMENDATION_QUERIES].sort(() => Math.random() - 0.5);
        queryList.push(shuffled[0]);
        queryList.push(shuffled[1]);
        setRecommendationSubtitle('Koleksi spesial beragam artis pilihan penikmat musik');
      }

      setActiveRecommendationQuery(queryList[0] || 'Top Hits Indonesia');

      // 3. Fetch each query stream in parallel
      const streamResults = await Promise.all(
        queryList.map((q) =>
          searchCatalogWithMeta(q, 6).catch(() => ({ tracks: [] as Track[] }))
        )
      );

      // 4. Round-Robin Interleave + STRICT ARTIST DIVERSITY (Max 1 song per primary artist!)
      const seenPrimaryArtists = new Set<string>();
      const seenTrackIds = new Set<string>();
      const diverseList: Track[] = [];

      const maxLen = Math.max(...streamResults.map((r) => r.tracks.length), 0);
      for (let round = 0; round < maxLen; round++) {
        for (const res of streamResults) {
          const t = res.tracks[round];
          if (!t) continue;
          if (seenTrackIds.has(t.id)) continue;

          // Normalize primary artist so collaborations don't duplicate (e.g. Tenxi & Jemsii vs dia & Tenxi)
          const primary = (t.artist || '')
            .toLowerCase()
            .split(/[&,x\/+]/)[0]
            .trim();

          if (primary && !seenPrimaryArtists.has(primary)) {
            seenPrimaryArtists.add(primary);
            seenTrackIds.add(t.id);
            diverseList.push(t);
          }

          if (diverseList.length >= 6) break;
        }
        if (diverseList.length >= 6) break;
      }

      // Fallback relaxation if less than 6 found
      if (diverseList.length < 6) {
        for (const res of streamResults) {
          for (const t of res.tracks) {
            if (!seenTrackIds.has(t.id)) {
              seenTrackIds.add(t.id);
              diverseList.push(t);
            }
            if (diverseList.length >= 6) break;
          }
          if (diverseList.length >= 6) break;
        }
      }

      if (diverseList.length > 0) {
        setRecommendedTracks(diverseList.slice(0, 6));
      }
    } catch (err) {
      console.error('Gagal memuat rekomendasi musik beragam:', err);
    } finally {
      setIsLoadingRecommendations(false);
      setIsRefreshingRecs(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDiverseRecommendations();
  }, []);

  // Separate Indonesian artists and global artists
  const indonesianArtists = GLOBAL_ARTISTS.filter(
    (artist: ArtistItem) =>
      artist.isIndonesian ||
      artist.category === 'Legenda & Band' ||
      artist.category === 'Indie & Senja' ||
      artist.category === 'Populer Indonesia'
  ).slice(0, 12);

  return (
    <div className="min-h-full pb-36 space-y-8 text-white animate-fade-in">
      {/* =====================================================================
          1. DYNAMIC GREETING & STATUS BAR (VIP Atmosphere)
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-0.5 shadow-lg shadow-violet-500/20 shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-xl">
              {greeting.icon}
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              {greeting.text}, Pendengar
            </h1>
            <div className="flex items-center gap-2 text-xs text-white/50 pt-0.5 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="font-semibold text-emerald-300">MallSound</span>
              <span className="text-white/30">•</span>
              <span className="text-white/70">{greeting.subtext}</span>
            </div>
          </div>
        </div>

        {/* Quick Mode Switcher & Guide */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToDJ && (
            <button
              type="button"
              onClick={onNavigateToDJ}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 border border-violet-500/40 text-violet-200 text-xs sm:text-sm font-bold shadow-lg shadow-violet-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
              <span>Buka Menu DJ 🎛️</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-600/30 to-teal-600/30 hover:from-sky-600/50 hover:to-teal-600/50 border border-sky-500/40 text-sky-200 text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Buka Menu Panduan 📖</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. QUICK MOOD FILTER PILLS BAR
      ===================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MOOD_FILTERS.map((m) => {
          const isActive = activeMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setActiveMood(m.id);
                if (m.query) {
                  onNavigateToSearch(m.query);
                }
              }}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          3. SPOTIFY-STYLE "DENGAR CEPAT" (6-Item Quick-Picks Grid)
      ===================================================================== */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {QUICK_PICKS.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.djTrack) {
                  onSelectTrack(item.djTrack, DJ_INDO_TRACKS);
                } else if (item.actionQuery) {
                  onNavigateToSearch(item.actionQuery);
                }
              }}
              className={`group relative flex items-center justify-between rounded-2xl p-2 sm:p-2.5 bg-gradient-to-r ${item.gradient} border border-white/10 hover:border-white/30 backdrop-blur-md cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl overflow-hidden`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 shadow-md bg-neutral-900 border border-white/10 relative">
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 pr-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-violet-200 transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-white/60 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Floating Instant Play Button */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 shadow-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-200 mr-1.5">
                <Play className="w-4 h-4 fill-current translate-x-0.5 text-black" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          4. CINEMATIC SPOTLIGHT BILLBOARD (3-Slide Interactive Showcase)
      ===================================================================== */}
      <section
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-3xl border border-white/15 shadow-2xl transition-all duration-500 bg-neutral-950"
      >
        {/* ===================== SLIDE 0: TENXI ===================== */}
        {activeSlide === 0 && (
          <div className="relative p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-violet-950/90 via-black to-fuchsia-950/80 animate-fade-in">
            {/* Ambient Lighting Orbs */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-violet-600/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-fuchsia-600/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              {/* Left Column: Headline & Action */}
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md">
                    <Flame className="w-3.5 h-3.5" /> SPOTLIGHT ARTIS #1
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    ⚡ PELOPOR HIPDUT
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-cyan-500/20 border border-cyan-500/30">
                    Sidoarjo Trap Koplo
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    Tenxi{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                      (Hipdut & Trap Koplo)
                    </span>
                  </h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-xl">
                    Joan Pasha Syahputra (Tenxi) asal Sidoarjo—pelopor fenomena genre Hipdut yang menggabungkan trap modern dengan kendang koplo nusantara. Populer lewat anthem viral Garam & Madu (Sakit Dadaku), Kasih Aba-Aba, hingga mejikuhibiniu.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Tenxi')}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Putar Lagu Tenxi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Tenxi Garam dan Madu')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base border border-white/15 hover:border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Music className="w-4 h-4 text-violet-400" />
                    <span>Garam & Madu 🍯</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Rotating Vinyl Artwork */}
              <div className="relative shrink-0 flex items-center justify-center mx-auto md:mx-0">
                <div
                  className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-neutral-900 bg-neutral-950 shadow-2xl relative flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 60%, #000 100%)',
                    boxShadow: '0 0 35px rgba(168, 85, 247, 0.45)',
                  }}
                >
                  <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute inset-7 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-11 rounded-full border border-white/10 pointer-events-none" />

                  {/* Center Label */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                    <img
                      src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop"
                      alt="Tenxi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-white/30 absolute z-10" />
                </div>

                <div className="absolute -bottom-3 -right-2 px-3 py-1.5 rounded-2xl bg-neutral-900/90 border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-mono text-cyan-300">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>320kbps Hipdut</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SLIDE 1: DONGKER ===================== */}
        {activeSlide === 1 && (
          <div className="relative p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-red-950/90 via-black to-zinc-950/80 animate-fade-in">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-red-600/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-600/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-white shadow-md">
                    <Zap className="w-3.5 h-3.5" /> SPOTLIGHT BAND #2
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    ⚡ PUNK ROCK BANDUNG
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30">
                    Distorsi & Katarsis
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    Dongker{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
                      (Balada Api & Distorsi Mentah)
                    </span>
                  </h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-xl">
                    Kuartet punk rock eksplosif asal Bandung dengan riff gitar berenergi tinggi, ketukan drum bertempo cepat, serta lirik balada perlawanan penuh emosi. Dikenal lewat Bertaruh Pada Api, Lautan Bunga Warna Merah, dan Tuhan di Reruntuh Kota.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Dongker')}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Putar Lagu Dongker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Dongker Bertaruh Pada Api')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base border border-white/15 hover:border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Flame className="w-4 h-4 text-red-300" />
                    <span>Bertaruh Pada Api 🔥</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Rotating Vinyl Artwork */}
              <div className="relative shrink-0 flex items-center justify-center mx-auto md:mx-0">
                <div
                  className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-neutral-900 bg-neutral-950 shadow-2xl relative flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 60%, #000 100%)',
                    boxShadow: '0 0 35px rgba(239, 68, 68, 0.45)',
                  }}
                >
                  <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute inset-7 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-11 rounded-full border border-white/10 pointer-events-none" />

                  {/* Center Label */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                    <img
                      src="https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=300&h=300&fit=crop"
                      alt="Dongker"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-white/30 absolute z-10" />
                </div>

                <div className="absolute -bottom-3 -right-2 px-3 py-1.5 rounded-2xl bg-neutral-900/90 border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-mono text-red-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Raw Punk 24-bit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SLIDE 2: REX ORANGE COUNTY ===================== */}
        {activeSlide === 2 && (
          <div className="relative p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-amber-950/90 via-black to-yellow-950/80 animate-fade-in">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-600/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-yellow-600/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white shadow-md">
                    <Sparkles className="w-3.5 h-3.5" /> SPOTLIGHT GLOBAL #3
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🌻 INDIE POP & NEO-SOUL
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono text-yellow-200 bg-yellow-500/10 border border-yellow-500/20">
                    Lo-Fi Horns & Jazz
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    Rex Orange County{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400">
                      (Harmoni Manis & Romansa Hangat)
                    </span>
                  </h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-xl">
                    Penyanyi & multi-instrumentalis asal Inggris (Alexander O'Connor) dengan vokal soulful hangat, piano jazzy ceria, dan lirik cinta personal. Terkenal di seluruh dunia lewat hits abadi Sunflower, Best Friend, Pluto Projector, hingga The Shade.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Rex Orange County')}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Putar Rex Orange County</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToSearch('Rex Orange County Sunflower')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm sm:text-base border border-white/15 hover:border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Sunflower 🌻</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Rotating Vinyl Artwork */}
              <div className="relative shrink-0 flex items-center justify-center mx-auto md:mx-0">
                <div
                  className={`w-40 h-40 sm:w-52 sm:h-52 rounded-full border-4 border-neutral-900 bg-neutral-950 shadow-2xl relative flex items-center justify-center ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #1a1a1a 0%, #0d0d0d 60%, #000 100%)',
                    boxShadow: '0 0 35px rgba(245, 158, 11, 0.45)',
                  }}
                >
                  <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute inset-7 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-11 rounded-full border border-white/10 pointer-events-none" />

                  {/* Center Label */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                    <img
                      src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
                      alt="Rex Orange County"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-white/30 absolute z-10" />
                </div>

                <div className="absolute -bottom-3 -right-2 px-3 py-1.5 rounded-2xl bg-neutral-900/90 border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-mono text-amber-300">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Bedroom Pop 24-bit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SLIDE NAVIGATION CONTROLS ===================== */}
        <div className="px-6 sm:px-10 py-3 bg-neutral-900/90 border-t border-white/10 flex items-center justify-between gap-3">
          {/* Slide Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSlide(0)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSlide === 0
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/50'
              }`}
            >
              ⚡ 1. Tenxi
            </button>

            <button
              type="button"
              onClick={() => setActiveSlide(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSlide === 1
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/50'
              }`}
            >
              🎸 2. Dongker
            </button>

            <button
              type="button"
              onClick={() => setActiveSlide(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSlide === 2
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-white/50'
              }`}
            >
              🌻 3. Rex Orange County
            </button>
          </div>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev - 1 + 3) % 3)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Slide sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev + 1) % 3)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Slide berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. 🔥 TRENDING / VIRAL (Enhanced Interactive Cards)
      ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Trending & Viral Hari Ini
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch('Top Hits Indonesia')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Horizontal Scroll Cards with Live Ambient Soundwave */}
        <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory">
          {TRENDING_SECTIONS.map((section: TrendingSection) => (
            <div
              key={section.id}
              onClick={() => onNavigateToSearch(section.query)}
              className={`group relative snap-start shrink-0 w-64 sm:w-72 p-5 rounded-3xl bg-gradient-to-br ${section.gradient} cursor-pointer border border-white/15 shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />

              <div className="relative z-10 flex flex-col justify-between h-34">
                <div className="flex items-start justify-between">
                  <span className="text-3xl filter drop-shadow-md">{section.icon}</span>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
                    <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-200 transition-colors drop-shadow-sm">
                    {section.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                    {section.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          6. ✨ REKOMENDASI UNTUKMU
      ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Rekomendasi Untukmu
              </h2>
            </div>
            <p className="text-xs text-white/50 truncate pt-0.5">
              {recommendationSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDiverseRecommendations()}
              disabled={isRefreshingRecs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Acak rekomendasi baru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRecs ? 'animate-spin text-violet-400' : ''}`} />
              <span className="hidden sm:inline">Acak</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToSearch(activeRecommendationQuery)}
              className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Track Grid or Skeletons */}
        {isLoadingRecommendations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`rec-skeleton-${idx}`}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 space-y-3 animate-pulse"
              >
                <div className="aspect-square w-full rounded-xl bg-white/10" />
                <div className="h-4 bg-white/10 rounded-md w-3/4" />
                <div className="h-3 bg-white/5 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {recommendedTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;
              const liked = isTrackLiked(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track, recommendedTracks)}
                  className={`group relative bg-white/[0.04] hover:bg-white/[0.09] backdrop-blur-md border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'border-violet-500/60 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/30'
                      : 'border-white/10 hover:border-white/20 hover:scale-[1.02]'
                  }`}
                >
                  <div>
                    {/* Cover Art with Overlay Actions */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 shadow-md">
                      <ResilientCoverImage
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Play Button Overlay */}
                      <div
                        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
                          isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-transform">
                          {isCurrentlyPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Like Button (Top Right) */}
                      <button
                        onClick={(e) => onToggleLike(track, e)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                          liked
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-black/70'
                        }`}
                        title={liked ? 'Hapus dari Favorit' : 'Sukai lagu ini'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                      </button>

                      {/* Duration Badge (Bottom Right) */}
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90">
                        {formatDuration(track.durationSec)}
                      </div>
                    </div>

                    {/* Meta: Title & Artist with 3 dots */}
                    <div className="mt-3 flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-semibold text-sm truncate leading-snug ${
                            isCurrent ? 'text-violet-400 font-bold' : 'text-white group-hover:text-violet-300'
                          }`}
                          title={track.title}
                        >
                          {track.title}
                        </h4>
                        <p className="text-xs text-white/60 truncate mt-0.5" title={track.artist}>
                          {track.artist}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActions?.(track, e);
                        }}
                        className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 shrink-0 transition-colors cursor-pointer"
                        title="Menu opsi lagu"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bitrate / Quality Tag */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                    <span className="truncate">{track.genre || 'Pop'}</span>
                    <span className="text-amber-400/80 font-mono font-semibold">24-bit Hi-Fi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          7. 🌍 JELAJAHI GENRE
      ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Jelajahi Genre
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch()}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {GENRE_MOOD_CARDS.map((card: GenreMoodCard) => (
            <div
              key={card.id}
              onClick={() => onNavigateToSearch(card.query)}
              className={`group relative p-4 rounded-2xl bg-gradient-to-br ${card.gradient} cursor-pointer border border-white/10 hover:border-white/30 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col justify-between h-28 sm:h-32 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <div className="relative z-10 text-2xl sm:text-3xl filter drop-shadow">
                {card.icon}
              </div>
              <div className="relative z-10">
                <span className="font-display font-bold text-xs sm:text-sm text-white leading-tight line-clamp-2 drop-shadow-sm group-hover:text-amber-200 transition-colors">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          8. 🇮🇩 ARTIS POPULER INDONESIA
      ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇮🇩</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Artis Populer Indonesia
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch('Artis Indonesia')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
          {indonesianArtists.map((artist: ArtistItem) => (
            <div
              key={artist.id}
              onClick={() => onNavigateToSearch(artist.query || artist.name)}
              className="group snap-start shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-violet-500/50 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md min-w-[200px]"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 p-0.5 shrink-0 shadow-sm">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {artist.name.slice(0, 2)}
                </div>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-white group-hover:text-violet-300 transition-colors truncate">
                  {artist.name}
                </h4>
                <p className="text-xs text-white/50 truncate">
                  {artist.subtitle || artist.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          MODAL PANDUAN & TIPS PUTAR LATAR BELAKANG
      ===================================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900/95 border border-sky-500/30 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display">
                    Panduan & Putar di Latar Belakang
                  </h3>
                  <p className="text-xs text-sky-300/80">
                    Tips musik tetap berputar saat layar tertutup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-white/85 leading-relaxed">
                Browser bawaan HP mematikan suara saat layar terkunci. Gunakan <b>Lemur Browser</b> agar musik MallSound terus menyala mulus di latar belakang!
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">3 Langkah Mudah:</p>
                <ol className="space-y-2 text-xs text-white/80">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold text-[10px] flex items-center justify-center border border-sky-500/40 shrink-0">1</span>
                    <span>Unduh <b>Lemur Browser</b> resmi di Google Play Store.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold text-[10px] flex items-center justify-center border border-sky-500/40 shrink-0">2</span>
                    <span>Buka <b>mallz12.my.id</b> melalui Lemur Browser.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold text-[10px] flex items-center justify-center border border-sky-500/40 shrink-0">3</span>
                    <span>Putar lagumu, lalu minimalkan atau kunci layar HP — musik terus mengalir!</span>
                  </li>
                </ol>
              </div>

              {/* Download Lemur Button */}
              <a
                href="https://play.google.com/store/search?q=lemur+browser&c=apps"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4" />
                  <span>Download Lemur Browser di Play Store</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Add to Home Shortcut Tip */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-white/75">
                <p className="font-semibold text-white">💡 Tips Pintasan ke Layar Utama:</p>
                <p className="text-[11px] leading-relaxed">
                  Di browser, ketuk <b>Menu Titik Tiga (⋮)</b> &gt; pilih <b>&quot;Tambahkan ke Layar Utama&quot;</b> agar ikon MallSound ada di beranda HP kamu.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
              {onNavigateToGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(false);
                    onNavigateToGuide();
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                >
                  Buka Menu Pengaturan Lengkap →
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="ml-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
