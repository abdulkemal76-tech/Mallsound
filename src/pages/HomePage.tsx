import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Track } from '../types/music';
import { TRENDING_SECTIONS, TrendingSection } from '../data/trending';
import { GENRE_MOOD_CARDS, GenreMoodCard } from '../data/genres';
import { GLOBAL_ARTISTS, ArtistItem } from '../data/artists';
import { searchCatalogWithMeta } from '../services/musicApi';

export interface HomePageProps {
  onSelectTrack: (track: Track) => void;
  currentTrack: Track;
  isPlaying: boolean;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  onNavigateToSearch: (query?: string) => void;
  onOpenActions?: (track: Track, e?: React.MouseEvent) => void;
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
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTrack,
  currentTrack,
  isPlaying,
  isTrackLiked,
  onToggleLike,
  onNavigateToSearch,
  onOpenActions,
}) => {
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [activeRecommendationQuery, setActiveRecommendationQuery] = useState('Sheila On 7');

  // Fetch initial recommended tracks on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadRecommendations() {
      setIsLoadingRecommendations(true);
      const randomQuery =
        RECOMMENDATION_QUERIES[Math.floor(Math.random() * RECOMMENDATION_QUERIES.length)];
      setActiveRecommendationQuery(randomQuery);

      try {
        const { tracks } = await searchCatalogWithMeta(randomQuery, 6);
        if (!isCancelled) {
          setRecommendedTracks(tracks.slice(0, 6));
        }
      } catch (err) {
        console.error('Gagal memuat rekomendasi musik:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRecommendations(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Separate Indonesian artists and global artists
  const indonesianArtists = GLOBAL_ARTISTS.filter(
    (artist: ArtistItem) =>
      artist.isIndonesian ||
      artist.category === 'Legenda & Band' ||
      artist.category === 'Indie & Senja' ||
      artist.category === 'Populer Indonesia'
  ).slice(0, 12);

  const globalArtists = GLOBAL_ARTISTS.filter(
    (artist: ArtistItem) =>
      artist.isIndonesian === false ||
      artist.category === 'Global Pop' ||
      artist.category === 'Rock & Alternatif Global' ||
      artist.category === 'Asia & K-Pop'
  );

  return (
    <div className="min-h-full pb-36 space-y-10 text-white">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-12 border border-white/10 shadow-2xl bg-gradient-to-br from-violet-950/80 via-neutral-950 to-fuchsia-950/70">
        {/* Animated Glow Background Effects */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-violet-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Version & Feature Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> MallSound v2.0
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10 backdrop-blur-md">
              <Headphones className="w-3.5 h-3.5 text-pink-400" /> Lossless Hi-Fi
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10 backdrop-blur-md">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Studio EQ 5-Band
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Selamat Datang di{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                MallSound
              </span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl leading-relaxed">
              Streaming musik Indonesia dan katalog dunia tanpa batas. Nikmati audio berkualitas tinggi, lirik sinkron real-time, dan tata suara studio yang memukau.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToSearch(activeRecommendationQuery)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Play className="w-5 h-5 fill-current" />
              Mulai Dengarkan
            </button>
            <button
              onClick={() => onNavigateToSearch()}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm sm:text-base border border-white/15 hover:border-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Search className="w-4 h-4 text-white/70" />
              Jelajahi Semua Lagu
            </button>
          </div>
        </div>
      </section>

      {/* 2. 🔥 TRENDING / VIRAL */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Trending / Viral
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch('Top Hits Indonesia')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory">
          {TRENDING_SECTIONS.map((section: TrendingSection) => (
            <div
              key={section.id}
              onClick={() => onNavigateToSearch(section.query)}
              className={`group relative snap-start shrink-0 w-64 sm:w-72 p-5 rounded-2xl bg-gradient-to-br ${section.gradient} cursor-pointer border border-white/15 shadow-lg hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 overflow-hidden`}
            >
              {/* Subtle glass overlay & radial glow */}
              <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
              <div className="relative z-10 flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                  <span className="text-3xl filter drop-shadow-md">{section.icon}</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200">
                    <ArrowRight className="w-4 h-4 text-white" />
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

      {/* 3. ✨ REKOMENDASI UNTUKMU */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Rekomendasi Untukmu
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch(activeRecommendationQuery)}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Track Grid or Skeletons */}
        {isLoadingRecommendations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendedTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentlyPlaying = isCurrent && isPlaying;
              const liked = isTrackLiked(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`group relative bg-white/5 hover:bg-white/10 backdrop-blur-md border rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
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
                            isCurrent ? 'text-violet-400' : 'text-white group-hover:text-violet-300'
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
                        className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
                        title="Menu opsi lagu"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bitrate / Quality Tag */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40">
                    <span className="truncate">{track.genre || 'Pop'}</span>
                    <span className="text-amber-400/80 font-mono">Hi-Fi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 🌍 JELAJAHI GENRE */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Jelajahi Genre
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch()}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3 columns mobile, 4 columns tablet, 6 columns desktop */}
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

      {/* 5. 🇮🇩 ARTIS POPULER INDONESIA */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇮🇩</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Artis Populer Indonesia
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch('Artis Indonesia')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Horizontal Scroll of Top 12 Indonesian Artist Chips */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
          {indonesianArtists.map((artist: ArtistItem) => (
            <div
              key={artist.id}
              onClick={() => onNavigateToSearch(artist.query || artist.name)}
              className="group snap-start shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-violet-500/50 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md min-w-[200px]"
            >
              {/* Circular Avatar / Badge */}
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

      {/* 6. 🌏 ARTIS GLOBAL */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌏</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
              Artis Global
            </h2>
          </div>
          <button
            onClick={() => onNavigateToSearch('Global Pop')}
            className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Horizontal Scroll of International Artist Chips */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
          {globalArtists.map((artist: ArtistItem) => (
            <div
              key={artist.id}
              onClick={() => onNavigateToSearch(artist.query || artist.name)}
              className="group snap-start shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-pink-500/50 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md min-w-[200px]"
            >
              {/* Circular Avatar / Badge */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-sm">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-sm uppercase">
                  {artist.name.slice(0, 2)}
                </div>
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-white group-hover:text-pink-300 transition-colors truncate">
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
    </div>
  );
};
