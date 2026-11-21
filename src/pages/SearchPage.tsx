import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Heart,
  Clock,
  Sparkles,
  Music2,
  TrendingUp,
  Flame,
  Radio,
  Compass,
  Disc3,
  Loader2,
  AlertCircle,
  Volume2,
  MoreVertical,
} from 'lucide-react';
import { Track } from '../types/music';
import { MOOD_CARDS, GENRE_CARDS, GenreMoodCard } from '../data/genres';
import { MOOD_CARD_TO_PLAYLIST, MOOD_PLAYLISTS } from '../data/moodPlaylists';
import { GLOBAL_ARTISTS, ARTIST_CATEGORIES, ArtistItem } from '../data/artists';
import { searchCatalogWithMeta } from '../services/musicApi';
// Audius search (v52): merged below the catalog results, marked "Audius".
// Audius tracks play through AudiusPlayer (<audio>) and CAN start while
// the tab is hidden — unlike the YouTube catalog tracks.
import { searchAudiusTracks } from '../services/players/audiusApi';

export interface SearchPageProps {
  onSelectTrack: (track: Track, contextTracks?: Track[]) => void;
  currentTrack: Track;
  isPlaying: boolean;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  onOpenActions?: (track: Track, e?: React.MouseEvent) => void;
  initialQuery?: string;
  onOpenPlaylist?: (playlistId: string) => void;
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
        <Music2 className="w-5 h-5 opacity-60" />
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

export const SearchPage: React.FC<SearchPageProps> = ({
  onSelectTrack,
  currentTrack,
  isPlaying,
  isTrackLiked,
  onToggleLike,
  onOpenActions,
  initialQuery = '',
  onOpenPlaylist,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const debounceTimerRef = useRef<number | null>(null);

  // Sync initialQuery if it changes externally
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search handler (300ms)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedQuery(val.trim());
    }, 300);
  };

  // Clear search bar
  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setSearchResults([]);
    setCorrectedQuery(null);
  };

  // Perform music catalog search when debouncedQuery changes
  useEffect(() => {
    let isCancelled = false;

    if (!debouncedQuery) {
      setSearchResults([]);
      setCorrectedQuery(null);
      setIsLoading(false);
      return;
    }

    async function executeSearch() {
      setIsLoading(true);
      try {
        const { tracks, correctedQuery: suggestedCorrection } = await searchCatalogWithMeta(
          debouncedQuery,
          36
        );

        // Audius results (v52): appended after the catalog, so the YouTube
        // catalog keeps its order. Failures return [] and change nothing.
        // v79 — saring relevansi: katalog Audius hampir tidak punya pop
        // Indonesia, jadi pencariannya mengembalikan 8 lagu yang tidak
        // nyambung dengan query (mis. genre Rock/K-Pop). Hanya tempel
        // lagu Audius yang judul/artisnya mengandung kata kunci query.
        let audiusTracks: Track[] = [];
        try {
          const queryWords = debouncedQuery
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length >= 3);
          const allAudius = await searchAudiusTracks(debouncedQuery, 8);
          audiusTracks = allAudius.filter((t) => {
            const hay = `${t.title} ${t.artist}`.toLowerCase();
            return queryWords.some((w) => hay.includes(w));
          });
        } catch {
          audiusTracks = [];
        }

        if (!isCancelled) {
          const seen = new Set(tracks.map((t) => t.id));
          const merged = [
            ...tracks,
            ...audiusTracks.filter((t) => !seen.has(t.id)),
          ];
          setSearchResults(merged);
          setCorrectedQuery(suggestedCorrection);
        }
      } catch (err) {
        console.error('Pencarian musik gagal:', err);
        if (!isCancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Click handler for category pills or quick exploration cards
  const handleQuickSelect = (newQuery: string) => {
    setQuery(newQuery);
    setDebouncedQuery(newQuery);
  };

  // Filter artists based on selected category pill
  const filteredArtists = GLOBAL_ARTISTS.filter((artist: ArtistItem) => {
    if (selectedCategory === 'Semua') return true;
    if (selectedCategory === 'Populer Indonesia') {
      return (
        artist.isIndonesian ||
        artist.category === 'Populer Indonesia' ||
        artist.category === 'Legenda & Band' ||
        artist.category === 'Indie & Senja'
      );
    }
    return artist.category === selectedCategory;
  });

  const isSearching = Boolean(debouncedQuery);

  return (
    <div className="min-h-full pb-36 space-y-8 text-white">
      {/* 1. SEARCH BAR AT TOP */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 space-y-3">
        <div className="relative flex items-center">
          {/* Search Icon */}
          <div className="absolute left-4.5 pointer-events-none text-white/40">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            ) : (
              <Search className="w-5 h-5 text-white/50" />
            )}
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Cari lagu, artis, lirik, atau genre..."
            className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.09] text-white placeholder-white/40 text-base sm:text-lg rounded-2xl border border-white/10 focus:border-violet-500/80 focus:ring-4 focus:ring-violet-500/20 backdrop-blur-xl transition-all duration-200 outline-none"
            autoFocus={!initialQuery}
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
              title="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocorrect / Typo Correction Hint Display */}
        {correctedQuery && correctedQuery.toLowerCase() !== debouncedQuery.toLowerCase() && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-950/60 border border-violet-500/30 text-xs sm:text-sm text-white/90 shadow-md">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span>
              Menampilkan hasil untuk{' '}
              <button
                onClick={() => handleQuickSelect(correctedQuery)}
                className="font-bold text-violet-300 underline hover:text-violet-200 transition-colors"
              >
                {correctedQuery}
              </button>
              . Tetap cari{' '}
              <button
                onClick={() => {
                  setCorrectedQuery(null);
                  handleQuickSelect(query);
                }}
                className="text-white/60 italic hover:text-white underline transition-colors"
              >
                "{query}"
              </button>
              ?
            </span>
          </div>
        )}
      </div>

      {/* 2. WHEN NO SEARCH QUERY: MOODS, GENRES & ARTISTS */}
      {!isSearching && (
        <div className="space-y-10">
          {/* Section: Cari Berdasarkan Mood */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Cari Berdasarkan Mood
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {MOOD_CARDS.map((card: GenreMoodCard) => {
                const playlistId = MOOD_CARD_TO_PLAYLIST[card.id];
                const trackCount = playlistId
                  ? MOOD_PLAYLISTS.find((p) => p.id === playlistId)?.trackIds.length ?? 0
                  : 0;
                return (
                <div
                  key={card.id}
                  onClick={() => {
                    // Kartu mood membuka playlist beneran (v67), bukan pencarian.
                    if (playlistId && onOpenPlaylist) {
                      onOpenPlaylist(playlistId);
                    } else {
                      handleQuickSelect(card.query);
                    }
                  }}
                  className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${card.gradient} cursor-pointer border border-white/10 hover:border-white/30 shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex flex-col justify-between h-28 sm:h-32 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <div className="relative z-10 text-3xl filter drop-shadow">
                    {card.icon}
                  </div>
                  <div className="relative z-10">
                    <span className="font-display font-bold text-sm sm:text-base text-white drop-shadow-sm group-hover:text-amber-200 transition-colors">
                      {card.label}
                    </span>
                    {trackCount > 0 && (
                      <span className="block text-[11px] text-white/70 font-medium">
                        {trackCount} lagu
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>

          {/* Section: Jelajahi Genre */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎸</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Jelajahi Genre
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {GENRE_CARDS.map((card: GenreMoodCard) => (
                <div
                  key={card.id}
                  onClick={() => handleQuickSelect(card.query)}
                  className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${card.gradient} cursor-pointer border border-white/10 hover:border-white/30 shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex flex-col justify-between h-28 sm:h-32 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <div className="relative z-10 text-3xl filter drop-shadow">
                    {card.icon}
                  </div>
                  <div className="relative z-10">
                    <span className="font-display font-bold text-sm sm:text-base text-white drop-shadow-sm group-hover:text-amber-200 transition-colors">
                      {card.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Artis Berdasarkan Kategori */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">
                Jelajahi Artis Populer
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {ARTIST_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Artist Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredArtists.map((artist: ArtistItem) => (
                <div
                  key={artist.id}
                  onClick={() => handleQuickSelect(artist.query || artist.name)}
                  className="group flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-violet-500/50 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 shrink-0">
                    <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white font-bold text-xs uppercase">
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
        </div>
      )}

      {/* 3. WHEN SEARCHING: LOADING SKELETON OR SEARCH RESULTS */}
      {isSearching && (
        <div className="space-y-4">
          {/* Results Summary Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-display font-semibold text-base sm:text-lg text-white">
              Hasil Pencarian:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                "{debouncedQuery}"
              </span>
            </h3>
            {!isLoading && (
              <span className="text-xs sm:text-sm text-white/50">
                {searchResults.length} lagu ditemukan
              </span>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={`skeleton-row-${idx}`}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 animate-pulse"
                >
                  <div className="w-5 text-center text-xs text-white/20">
                    {idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-white/5 rounded w-12" />
                  <div className="w-8 h-8 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty Search Results State */}
          {!isLoading && searchResults.length === 0 && (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-lg text-white">
                  Lagu Tidak Ditemukan
                </h4>
                <p className="text-sm text-white/60">
                  Tidak ada lagu yang cocok dengan kata kunci "{debouncedQuery}". Coba periksa ejaanmu atau cari artis lain.
                </p>
              </div>
              <button
                onClick={handleClear}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/15 transition-all"
              >
                Kembali ke Jelajah Musik
              </button>
            </div>
          )}

          {/* Search Results Track List */}
          {!isLoading && searchResults.length > 0 && (
            <div className="space-y-1.5">
              {/* Header row on tablet/desktop */}
              <div className="hidden sm:grid grid-cols-[40px_1fr_160px_80px_40px_40px] gap-4 px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                <span>#</span>
                <span>Judul Lagu</span>
                <span>Album</span>
                <span className="text-right">Durasi</span>
                <span className="text-center">Suka</span>
                <span className="text-center">Aksi</span>
              </div>

              {/* Track rows */}
              {searchResults.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                const isCurrentlyPlaying = isCurrent && isPlaying;
                const liked = isTrackLiked(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(track, searchResults)}
                    className={`group flex sm:grid sm:grid-cols-[40px_1fr_160px_80px_40px_40px] items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-2xl backdrop-blur-md transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'bg-violet-950/40 border border-violet-500/40 shadow-md'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Index / Play / Wave Indicator */}
                    <div className="w-8 sm:w-auto flex items-center justify-center shrink-0">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end gap-0.5 h-4 text-violet-400">
                          <span className="w-1 bg-violet-400 rounded-full animate-bounce h-3" />
                          <span className="w-1 bg-violet-400 rounded-full animate-bounce h-4 [animation-delay:0.15s]" />
                          <span className="w-1 bg-violet-400 rounded-full animate-bounce h-2 [animation-delay:0.3s]" />
                        </div>
                      ) : (
                        <>
                          <span className="text-xs font-mono text-white/40 group-hover:hidden">
                            {index + 1}
                          </span>
                          <Play className="w-4 h-4 text-white fill-current hidden group-hover:block" />
                        </>
                      )}
                    </div>

                    {/* Cover Art + Title + Artist */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-sm relative group/cover">
                        <ResilientCoverImage
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Mobile tap play overlay */}
                        <div className="absolute inset-0 bg-black/30 sm:hidden flex items-center justify-center">
                          {isCurrentlyPlaying ? (
                            <Pause className="w-4 h-4 text-white fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current opacity-70" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-semibold text-sm sm:text-base truncate ${
                            isCurrent
                              ? 'text-violet-400'
                              : 'text-white group-hover:text-violet-300'
                          } transition-colors`}
                          title={track.title}
                        >
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-white/60 truncate mt-0.5">
                          <span className="truncate">{track.artist}</span>
                          <span className="hidden sm:inline text-white/20">•</span>
                          <span className="hidden sm:inline text-amber-400/80 font-mono text-[10px]">
                            {track.bitrateLabel || '24-bit FLAC'}
                          </span>
                          {track.source === 'audius' && (
                            <span
                              className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-400/30"
                              title="Diputar lewat Audius — bisa jalan di latar belakang"
                            >
                              Audius
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Album Name (Tablet/Desktop) */}
                    <div className="hidden sm:block text-xs text-white/50 truncate">
                      {track.album || '-'}
                    </div>

                    {/* Duration */}
                    <div className="text-xs font-mono text-white/60 sm:text-right shrink-0">
                      {formatDuration(track.durationSec)}
                    </div>

                    {/* Like Action */}
                    <div className="flex items-center justify-center shrink-0">
                      <button
                        onClick={(e) => onToggleLike(track, e)}
                        className={`p-2 rounded-full transition-all ${
                          liked
                            ? 'text-rose-500 hover:scale-110'
                            : 'text-white/40 hover:text-rose-400 hover:scale-110'
                        }`}
                        title={liked ? 'Hapus dari Favorit' : 'Sukai lagu ini'}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* 3-Dots Action Menu */}
                    <div className="flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActions?.(track, e);
                        }}
                        className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                        title="Opsi lagu lainnya"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
