import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderPlus,
  Heart,
  Clock,
  Upload,
  Plus,
  Trash2,
  Play,
  Pause,
  Music,
  ArrowDownToLine,
  Disc,
  Sparkles,
  Folder,
  FolderDown,
  FolderHeart,
  FolderClock,
  ChevronRight,
  ArrowLeft,
  Shuffle,
  Music2,
  MoreVertical,
  Search,
  Share2,
  Check,
  User,
  ListMusic,
  Disc3,
  X,
} from 'lucide-react';
import { Track, Playlist, PlaylistCoverTheme } from '../types/music';
import { SHOEGAZE_INDO_PLAYLIST_ID } from '../data/shoegazeIndoTracks';
import { MOOD_PLAYLIST_IDS } from '../data/moodPlaylists';
import { GENRE_PLAYLIST_IDS } from '../data/genrePlaylists';

export interface LibraryPageProps {
  // Playlists
  playlists: Playlist[];
  activePlaylistId?: string | null;
  onSelectPlaylist?: (playlistId: string) => void;
  onClearActivePlaylist?: () => void;
  onDeletePlaylist: (playlistId: string, e: React.MouseEvent) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportPlaylist: () => void;
  // Favorites
  favoriteTracks: Track[];
  // Recently played (local state)
  recentlyPlayed: Track[];
  // Imported tracks from Spotify/YouTube Music
  importedTracks?: Track[];
  // All tracks dictionary for resolving playlist items
  allTracks?: Track[];
  // Track actions
  onSelectTrack: (track: Track, contextTracks?: Track[]) => void;
  onQueueTracks?: (tracks: Track[]) => void;
  currentTrack: Track;
  isPlaying: boolean;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  onOpenActions?: (track: Track, e?: React.MouseEvent) => void;
  // Custom tracks
  onOpenAddCustomTrack: () => void;
  customTracks?: Track[];
  accentColor?: string;
  onNavigateToSearch?: (query?: string) => void;
  onShowToast?: (message: string) => void;
}

type SubTab = 'folders' | 'playlist' | 'disukai' | 'baru-diputar' | 'upload';

interface ActiveFolder {
  id: string;
  title: string;
  subtitle: string;
  type: 'imported' | 'disukai' | 'history' | 'upload';
  tracks: Track[];
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 mnt';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} jam ${mins} mnt`;
  }
  return `${mins} menit`;
}

const COVER_THEME_STYLES: Record<
  PlaylistCoverTheme,
  {
    border: string;
    bgGradient: string;
    badge: string;
    glow: string;
    accent: string;
    heroGradient: string;
  }
> = {
  amber: {
    border: 'border-l-amber-500',
    bgGradient: 'from-amber-600/25 via-amber-950/20 to-neutral-950',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glow: 'hover:shadow-amber-500/20',
    accent: 'text-amber-400',
    heroGradient: 'from-amber-600/30 via-neutral-900/90 to-neutral-950',
  },
  emerald: {
    border: 'border-l-emerald-500',
    bgGradient: 'from-emerald-600/25 via-emerald-950/20 to-neutral-950',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glow: 'hover:shadow-emerald-500/20',
    accent: 'text-emerald-400',
    heroGradient: 'from-emerald-600/30 via-neutral-900/90 to-neutral-950',
  },
  indigo: {
    border: 'border-l-indigo-500',
    bgGradient: 'from-indigo-600/25 via-indigo-950/20 to-neutral-950',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    glow: 'hover:shadow-indigo-500/20',
    accent: 'text-indigo-400',
    heroGradient: 'from-indigo-600/35 via-neutral-900/90 to-neutral-950',
  },
  rose: {
    border: 'border-l-rose-500',
    bgGradient: 'from-rose-600/25 via-rose-950/20 to-neutral-950',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    glow: 'hover:shadow-rose-500/20',
    accent: 'text-rose-400',
    heroGradient: 'from-rose-600/30 via-neutral-900/90 to-neutral-950',
  },
  slate: {
    border: 'border-l-slate-400',
    bgGradient: 'from-slate-600/25 via-slate-950/20 to-neutral-950',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    glow: 'hover:shadow-slate-500/20',
    accent: 'text-slate-300',
    heroGradient: 'from-slate-600/30 via-neutral-900/90 to-neutral-950',
  },
};

const ResilientCover: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-violet-900/40 via-neutral-900 to-neutral-950 flex items-center justify-center text-violet-400 ${className}`}
      >
        <Disc className="w-5 h-5 opacity-70" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

// 2x2 Collage Artwork Component (Spotify Style)
const PlaylistCoverCollage: React.FC<{
  tracks: Track[];
  theme: PlaylistCoverTheme;
  title: string;
  className?: string;
}> = ({ tracks, theme, title, className = 'w-full h-full' }) => {
  const tracksWithCovers = useMemo(
    () => tracks.filter((t) => Boolean(t.coverUrl)),
    [tracks]
  );
  const themeStyle = COVER_THEME_STYLES[theme] || COVER_THEME_STYLES.amber;

  if (tracksWithCovers.length >= 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 ${className} overflow-hidden bg-neutral-900`}>
        {tracksWithCovers.slice(0, 4).map((t, idx) => (
          <img
            key={`${t.id}-${idx}`}
            src={t.coverUrl}
            alt={t.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  if (tracksWithCovers.length > 0) {
    return (
      <img
        src={tracksWithCovers[0].coverUrl}
        alt={title}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${themeStyle.bgGradient} text-white/50 p-4`}
    >
      <Disc className="w-14 h-14 text-white/60 drop-shadow" />
    </div>
  );
};

export const LibraryPage: React.FC<LibraryPageProps> = ({
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onClearActivePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onOpenCreatePlaylist,
  onOpenImportPlaylist,
  favoriteTracks,
  recentlyPlayed,
  importedTracks = [],
  allTracks = [],
  onSelectTrack,
  onQueueTracks,
  currentTrack,
  isPlaying,
  isTrackLiked,
  onToggleLike,
  onOpenActions,
  onOpenAddCustomTrack,
  customTracks,
  accentColor = '#8b5cf6',
  onNavigateToSearch,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('folders');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    activePlaylistId || null
  );
  const [selectedFolder, setSelectedFolder] = useState<ActiveFolder | null>(null);

  // Sync external activePlaylistId (e.g. from Desktop Sidebar or URL)
  useEffect(() => {
    if (activePlaylistId) {
      setSelectedPlaylistId(activePlaylistId);
    }
  }, [activePlaylistId]);

  const resolvedCustomTracks =
    customTracks || favoriteTracks.filter((t) => t.isCustom);

  // Helper to resolve tracks for a given playlist (never drop songs!)
  const resolvePlaylistTracks = (playlist: Playlist): Track[] => {
    const pool =
      allTracks.length > 0
        ? allTracks
        : [...importedTracks, ...favoriteTracks, ...recentlyPlayed, ...resolvedCustomTracks];
    const map = new Map<string, Track>();
    pool.forEach((t) => map.set(t.id, t));

    return playlist.trackIds.map((id) => {
      const found = map.get(id);
      if (found) return found;
      // Graceful fallback track placeholder so song is never dropped
      const cleanTitle = id.replace(/^itunes_|^yt_|^trk_/, '').replace(/[-_]/g, ' ') || 'Lagu Playlist';
      return {
        id,
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        artist: 'MallSound Studio',
        album: playlist.title,
        genre: 'Pop',
        coverUrl: '',
        audioUrl: '',
        durationSec: 210,
        bitrateLabel: '24-bit Hi-Fi',
        releaseYear: 2024,
        playsCount: 0,
        lyrics: [],
      };
    });
  };

  // Currently opened playlist
  const activePlaylist = useMemo(() => {
    if (!selectedPlaylistId) return null;
    return playlists.find((p) => p.id === selectedPlaylistId) || null;
  }, [playlists, selectedPlaylistId]);

  // Tracks inside the currently opened playlist
  const activePlaylistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    return resolvePlaylistTracks(activePlaylist);
  }, [activePlaylist, allTracks, importedTracks, favoriteTracks, recentlyPlayed, resolvedCustomTracks]);

  // Total duration of current playlist
  const activePlaylistTotalSec = useMemo(() => {
    return activePlaylistTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0);
  }, [activePlaylistTracks]);

  // Play All handler
  const handlePlayAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    onSelectTrack(tracks[0], tracks);
    if (tracks.length > 1 && onQueueTracks) {
      onQueueTracks(tracks.slice(1));
    }
    onShowToast?.(`▶ Memutar semua ${tracks.length} lagu`);
  };

  // Shuffle All handler
  const handleShuffleAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    onSelectTrack(shuffled[0], shuffled);
    if (shuffled.length > 1 && onQueueTracks) {
      onQueueTracks(shuffled.slice(1));
    }
    onShowToast?.(`🔀 Memutar acak ${tracks.length} lagu`);
  };

  // Share playlist
  const handleSharePlaylist = async (playlist: Playlist) => {
    const shareData = {
      title: `${playlist.title} — Playlist MallSound`,
      text: `Dengarkan playlist "${playlist.title}" (${playlist.trackIds.length} lagu) di MallSound Studio!`,
      url: window.location.href,
    };
    try {
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${playlist.title} | https://mallz12.my.id`);
        onShowToast?.('✓ Tautan playlist berhasil disalin!');
      }
    } catch {
      // dismissed
    }
  };

  const tabs: { id: SubTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'folders', label: 'Folder Koleksi', icon: Folder, count: 3 + playlists.length },
    { id: 'playlist', label: 'Semua Playlist', icon: FolderPlus, count: playlists.length },
    { id: 'disukai', label: 'Disukai', icon: Heart, count: favoriteTracks.length },
    { id: 'baru-diputar', label: 'Baru Diputar', icon: Clock, count: recentlyPlayed.length },
    { id: 'upload', label: 'Upload', icon: Upload, count: resolvedCustomTracks.length },
  ];

  // Render unified track row
  const renderTrackRow = (
    track: Track,
    index: number,
    options?: {
      playlistId?: string;
      canRemove?: boolean;
      contextTracks?: Track[];
    }
  ) => {
    const isCurrent = currentTrack?.id === track.id;
    const isLiked = isTrackLiked(track.id);

    return (
      <div
        key={`${track.id}-${index}`}
        onClick={() => onSelectTrack(track, options?.contextTracks)}
        className={`group relative flex items-center justify-between p-2.5 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
          isCurrent
            ? 'bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10'
            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/10'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
          {/* Index or Wave */}
          <div className="w-5 sm:w-6 text-center font-mono text-xs text-white/40 shrink-0">
            {isCurrent && isPlaying ? (
              <div className="flex items-end gap-0.5 justify-center h-4 text-violet-400">
                <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-3" />
                <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-4 [animation-delay:0.15s]" />
                <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-2 [animation-delay:0.3s]" />
              </div>
            ) : (
              <span className="group-hover:hidden">{index + 1}</span>
            )}
            {!isPlaying && (
              <Play className="w-3.5 h-3.5 text-white fill-current hidden group-hover:inline-block mx-auto" />
            )}
          </div>

          {/* Cover */}
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-neutral-900 border border-white/10">
            <ResilientCover
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrent && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white fill-current" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                )}
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold truncate transition-colors ${
                isCurrent ? 'text-violet-400 font-display' : 'text-white group-hover:text-violet-300'
              }`}
            >
              {track.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-white/60 truncate max-w-[160px] sm:max-w-[280px]">
                {track.artist}
              </p>
              <span className="text-[10px] text-white/20 hidden sm:inline">•</span>
              <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">
                {track.bitrateLabel || '24-bit FLAC'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
          {/* Like button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(track, e);
            }}
            className={`p-2 rounded-xl transition-all ${
              isLiked
                ? 'text-pink-500 hover:text-pink-400 hover:scale-110'
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`}
            title={isLiked ? 'Hapus dari Disukai' : 'Sukai lagu'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${isLiked ? 'fill-pink-500 scale-105' : ''}`}
            />
          </button>

          {/* Remove from playlist button (if playlist context) */}
          {options?.canRemove && options.playlistId && onRemoveTrackFromPlaylist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTrackFromPlaylist(options.playlistId!, track.id);
              }}
              className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Hapus lagu dari playlist ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duration */}
          <span className="text-xs text-white/50 font-mono hidden sm:inline-block w-12 text-right">
            {formatDuration(track.durationSec)}
          </span>

          {/* 3-Dots Action button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenActions?.(track, e);
            }}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Menu opsi lagu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW A: DEDICATED PLAYLIST DETAIL VIEW (Spotify / Apple Music Style)
  // =========================================================================
  if (activePlaylist) {
    const theme = COVER_THEME_STYLES[activePlaylist.coverTheme] || COVER_THEME_STYLES.amber;

    return (
      <div className="space-y-6 pb-28 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-2 animate-fade-in">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedPlaylistId(null);
              onClearActivePlaylist?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Koleksi</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSharePlaylist(activePlaylist)}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Bagikan playlist"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                onDeletePlaylist(activePlaylist.id, e);
                setSelectedPlaylistId(null);
                onClearActivePlaylist?.();
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Hapus playlist"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hapus Playlist</span>
            </button>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div
          className={`relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b ${theme.heroGradient} p-6 sm:p-8 backdrop-blur-2xl shadow-2xl`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6 sm:gap-8">
            {/* Playlist Artwork Cover */}
            <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-2xl border border-white/20 shrink-0 relative group mx-auto md:mx-0">
              <PlaylistCoverCollage
                tracks={activePlaylistTracks}
                theme={activePlaylist.coverTheme}
                title={activePlaylist.title}
                className="w-full h-full"
              />

              {activePlaylistTracks.length > 0 && (
                <div
                  onClick={() => handlePlayAll(activePlaylistTracks)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform group-hover:scale-110 active:scale-95 transition-transform">
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Meta Details */}
            <div className="flex-1 space-y-3 min-w-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${theme.badge}`}
                >
                  Playlist {activePlaylist.isPublic ? 'Publik' : 'Pribadi'}
                </span>
                <span className="text-[11px] text-white/50 font-mono">
                  MallSound Audio Studio
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight font-display break-words">
                {activePlaylist.title}
              </h1>

              {activePlaylist.description && (
                <p className="text-sm sm:text-base text-white/70 max-w-2xl line-clamp-2">
                  {activePlaylist.description}
                </p>
              )}

              {/* Creator & Statistics */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-white/80 pt-1 font-medium">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  {activePlaylist.ownerName || 'Saya'}
                </span>
                <span className="text-white/30">•</span>
                <span className="font-mono text-white/90">
                  {activePlaylistTracks.length} Lagu
                </span>
                <span className="text-white/30">•</span>
                <span className="font-mono text-white/60">
                  Sekitar {formatTotalDuration(activePlaylistTotalSec)}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handlePlayAll(activePlaylistTracks)}
                  disabled={activePlaylistTracks.length === 0}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm text-black bg-white hover:bg-white/90 active:scale-95 transition-all shadow-xl disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Putar Semua</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShuffleAll(activePlaylistTracks)}
                  disabled={activePlaylistTracks.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/15 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Acak</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToSearch?.()}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm text-violet-300 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Lagu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Tracks List Table */}
        <div className="space-y-3">
          {activePlaylistTracks.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto shadow-inner">
                <Music className="w-8 h-8 opacity-70" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white font-display">
                  Playlist ini Masih Kosong
                </h4>
                <p className="text-sm text-white/60">
                  Mulai isi playlist "{activePlaylist.title}" dengan lagu favoritmu! Cari lagu di menu Jelajah atau tekan titik 3 (⋮) pada lagu mana saja lalu pilih "Simpan ke Playlist".
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToSearch?.()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Jelajahi & Tambah Lagu</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                <span>Daftar Lagu ({activePlaylistTracks.length})</span>
                <span className="hidden sm:inline">Durasi</span>
              </div>
              {activePlaylistTracks.map((track, idx) =>
                renderTrackRow(track, idx, {
                  playlistId: activePlaylist.id,
                  canRemove: activePlaylist.id !== SHOEGAZE_INDO_PLAYLIST_ID && !MOOD_PLAYLIST_IDS.has(activePlaylist.id) && !GENRE_PLAYLIST_IDS.has(activePlaylist.id),
                  contextTracks: activePlaylistTracks,
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: SYSTEM FOLDER DETAIL VIEW (Imported, Favorites, History)
  // =========================================================================
  if (selectedFolder) {
    return (
      <div className="space-y-6 pb-28 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-2 animate-fade-in">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedFolder(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Semua Folder</span>
          </button>

          {selectedFolder.type === 'imported' && (
            <button
              type="button"
              onClick={onOpenImportPlaylist}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Link Lagi</span>
            </button>
          )}
        </div>

        {/* Folder Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 24px ${accentColor}55`,
              }}
            >
              <Folder className="w-8 h-8 sm:w-10 sm:h-10 fill-white/20" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Folder Koleksi
              </span>
              <h2 className="text-xl sm:text-3xl font-black font-display text-white">
                {selectedFolder.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-xl">
                {selectedFolder.subtitle}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-white font-mono">
                  {selectedFolder.tracks.length} Lagu Tersimpan
                </span>
              </div>
            </div>
          </div>

          {/* Play Actions */}
          {selectedFolder.tracks.length > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handlePlayAll(selectedFolder.tracks)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 16px ${accentColor}66`,
                }}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Putar Semua</span>
              </button>

              <button
                type="button"
                onClick={() => handleShuffleAll(selectedFolder.tracks)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Acak</span>
              </button>
            </div>
          )}
        </div>

        {/* Tracks List */}
        {selectedFolder.tracks.length === 0 ? (
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-12 text-center text-white/50 text-sm">
            <p>Folder ini masih kosong. Belum ada lagu yang tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedFolder.tracks.map((track, idx) =>
              renderTrackRow(track, idx, { contextTracks: selectedFolder.tracks })
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW C: MAIN LIBRARY HUB (Tabs, Folders & Playlists Grid)
  // =========================================================================
  return (
    <div className="space-y-6 pb-28 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-2 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            Koleksi Musik & Folder
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Kelola semua playlist, folder otomatis, favorit, dan hasil impor Spotify/YouTube
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreatePlaylist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Playlist</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportPlaylist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
            <span className="hidden sm:inline">Import Link</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Pill Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedFolder(null);
                setSelectedPlaylistId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      boxShadow: `0 0 14px ${accentColor}55`,
                    }
                  : undefined
              }
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : tab.id === 'disukai' ? 'text-pink-400' : 'text-white/60'
                }`}
              />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =================================================================
          TAB 1: FOLDER KOLEKSI
      ================================================================= */}
      {activeTab === 'folders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. 📁 FOLDER LAGU DIIMPOR (Spotify & YouTube) */}
            <div
              onClick={() =>
                setSelectedFolder({
                  id: 'imported',
                  title: 'Lagu Diimpor (Spotify & YouTube)',
                  subtitle: 'Semua lagu hasil import playlist Spotify & YT Music',
                  type: 'imported',
                  tracks: importedTracks,
                })
              }
              className="group relative rounded-3xl p-5 border border-white/10 bg-gradient-to-br from-indigo-600/25 via-violet-900/20 to-neutral-950 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md group-hover:scale-105 transition-transform">
                  <FolderDown className="w-6 h-6 text-indigo-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Spotify & YT
                </span>
              </div>

              <h3 className="text-base font-bold text-white font-display group-hover:text-indigo-300 transition-colors">
                📁 Lagu Diimpor
              </h3>
              <p className="text-xs text-white/60 line-clamp-2 mt-1">
                Semua lagu yang kamu import dari link Spotify atau YouTube Music terkumpul otomatis di folder ini.
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                <span className="font-mono text-indigo-300 font-semibold">
                  {importedTracks.length} Lagu
                </span>
                <span className="text-white/40 group-hover:text-white flex items-center gap-1 font-semibold">
                  Buka folder <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 2. 📁 FOLDER LAGU DISUKAI (FAVORIT) */}
            <div
              onClick={() =>
                setSelectedFolder({
                  id: 'favorites',
                  title: 'Lagu Favorit (Disukai)',
                  subtitle: 'Daftar semua lagu favorit yang kamu sukai',
                  type: 'disukai',
                  tracks: favoriteTracks,
                })
              }
              className="group relative rounded-3xl p-5 border border-white/10 bg-gradient-to-br from-pink-600/20 via-rose-950/20 to-neutral-950 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-md group-hover:scale-105 transition-transform">
                  <FolderHeart className="w-6 h-6 text-pink-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Favorit
                </span>
              </div>

              <h3 className="text-base font-bold text-white font-display group-hover:text-pink-300 transition-colors">
                📁 Lagu Favorit
              </h3>
              <p className="text-xs text-white/60 line-clamp-2 mt-1">
                Koleksi lagu-lagu terbaik yang kamu beri tanda cinta di MallSound.
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                <span className="font-mono text-pink-300 font-semibold">
                  {favoriteTracks.length} Lagu
                </span>
                <span className="text-white/40 group-hover:text-white flex items-center gap-1 font-semibold">
                  Buka folder <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 3. 📁 FOLDER BARU DIPUTAR (RIWAYAT) */}
            <div
              onClick={() =>
                setSelectedFolder({
                  id: 'history',
                  title: 'Baru Diputar (Riwayat)',
                  subtitle: 'Rekam jejak lagu yang baru saja didengarkan',
                  type: 'history',
                  tracks: recentlyPlayed,
                })
              }
              className="group relative rounded-3xl p-5 border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-950/20 to-neutral-950 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md group-hover:scale-105 transition-transform">
                  <FolderClock className="w-6 h-6 text-blue-300" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Riwayat
                </span>
              </div>

              <h3 className="text-base font-bold text-white font-display group-hover:text-blue-300 transition-colors">
                📁 Baru Diputar
              </h3>
              <p className="text-xs text-white/60 line-clamp-2 mt-1">
                Dengarkan kembali lagu-lagu yang baru saja berputar di sesi musikmu.
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                <span className="font-mono text-blue-300 font-semibold">
                  {recentlyPlayed.length} Lagu
                </span>
                <span className="text-white/40 group-hover:text-white flex items-center gap-1 font-semibold">
                  Buka folder <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 4. 📁 PLAYLIST FOLDERS (OPEN PLAYLIST DETAIL!) */}
            {playlists.map((pl) => {
              const plTracks = resolvePlaylistTracks(pl);
              const theme = COVER_THEME_STYLES[pl.coverTheme] || COVER_THEME_STYLES.amber;
              return (
                <div
                  key={`folder-${pl.id}`}
                  onClick={() => {
                    setSelectedPlaylistId(pl.id);
                    onSelectPlaylist?.(pl.id);
                  }}
                  className={`group relative rounded-3xl p-5 border border-white/10 ${theme.border} border-l-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-xl ${theme.glow}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-md overflow-hidden">
                      <PlaylistCoverCollage
                        tracks={plTracks}
                        theme={pl.coverTheme}
                        title={pl.title}
                        className="w-full h-full"
                      />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                      Playlist
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-display truncate group-hover:text-violet-300 transition-colors">
                    📁 {pl.title}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-1 min-h-[32px]">
                    {pl.description || 'Playlist buatanmu di MallSound'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                    <span className="font-mono text-white/70 font-semibold">
                      {pl.trackIds.length} Lagu
                    </span>
                    <span className="text-white/40 group-hover:text-white flex items-center gap-1 font-semibold">
                      Buka playlist <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================
          TAB 2: SEMUA PLAYLIST (Full Playlist Gallery with Click to Open!)
      ================================================================= */}
      {activeTab === 'playlist' && (
        <div className="space-y-6">
          {playlists.length === 0 ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-fuchsia-400 mb-4 shadow-inner">
                <FolderPlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-display">Belum ada playlist</h3>
              <p className="text-sm text-white/60 max-w-md mt-1 mb-6">
                Buat playlist baru untuk menyusun lagu-lagu favoritmu, atau import playlist langsung
                dari Spotify atau YouTube Music.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenCreatePlaylist}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Buat Playlist Pertama</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenImportPlaylist}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
                  <span>📥 Import dari Spotify/YT</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => {
                const plTracks = resolvePlaylistTracks(playlist);
                const theme = COVER_THEME_STYLES[playlist.coverTheme] || COVER_THEME_STYLES.amber;

                return (
                  <div
                    key={playlist.id}
                    onClick={() => {
                      setSelectedPlaylistId(playlist.id);
                      onSelectPlaylist?.(playlist.id);
                    }}
                    className={`group relative rounded-3xl p-5 border border-white/10 ${theme.border} border-l-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-xl ${theme.glow}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center text-white shadow-md shrink-0">
                        <PlaylistCoverCollage
                          tracks={plTracks}
                          theme={playlist.coverTheme}
                          title={playlist.title}
                          className="w-full h-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlaylist(playlist.id, e);
                        }}
                        className="opacity-60 group-hover:opacity-100 p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                        title="Hapus playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white font-display truncate group-hover:text-violet-300 transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 mt-1 min-h-[32px]">
                      {playlist.description || 'Dibuat dengan MallSound Studio'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                      <span className={`px-2.5 py-0.5 rounded-full border font-mono font-medium ${theme.badge}`}>
                        {playlist.trackIds.length} lagu
                      </span>
                      <span className="text-white/40 group-hover:text-white transition-colors flex items-center gap-1 font-semibold">
                        Buka playlist →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 3: DISUKAI
      ================================================================= */}
      {activeTab === 'disukai' && (
        <div className="space-y-4">
          {favoriteTracks.length === 0 ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-pink-400 mb-4 shadow-inner">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">Belum ada lagu disukai</h3>
              <p className="text-sm text-white/60 max-w-md mt-1">
                Ketuk ikon hati pada lagu apa pun untuk memasukkannya ke dalam daftar lagu favoritmu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Lagu Disukai ({favoriteTracks.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAll(favoriteTracks)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-all cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Putar Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShuffleAll(favoriteTracks)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {favoriteTracks.map((track, idx) =>
                  renderTrackRow(track, idx, { contextTracks: favoriteTracks })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 4: BARU DIPUTAR
      ================================================================= */}
      {activeTab === 'baru-diputar' && (
        <div className="space-y-4">
          {recentlyPlayed.length === 0 ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Belum ada riwayat pemutaran
              </h3>
              <p className="text-sm text-white/60 max-w-md mt-1">
                Lagu yang kamu putar akan otomatis terekam di sini agar kamu mudah menemukannya kembali.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Riwayat Terakhir ({recentlyPlayed.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAll(recentlyPlayed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-all cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Putar Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShuffleAll(recentlyPlayed)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Acak</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {recentlyPlayed.map((track, idx) =>
                  renderTrackRow(track, idx, { contextTracks: recentlyPlayed })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          TAB 5: UPLOAD (Custom Songs & Generator)
      ================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 border border-white/10">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Studio Lagu Mandiri & Upload
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Tambahkan file audio MP3/WAV atau buat komposisi instrumen synthesizer Web Audio.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddCustomTrack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Lagu Baru</span>
            </button>
          </div>

          {resolvedCustomTracks.length === 0 ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center text-violet-400 mb-4 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Belum ada lagu kustom
              </h3>
              <p className="text-sm text-white/60 max-w-md mt-1 mb-6">
                Unggah lagu karya sendiri atau gunakan generator musik studio MallSound untuk
                membuat rekaman baru.
              </p>
              <button
                type="button"
                onClick={onOpenAddCustomTrack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Unggah Lagu Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                <span>Lagu Kustom ({resolvedCustomTracks.length})</span>
                <span className="hidden sm:inline">Durasi</span>
              </div>
              {resolvedCustomTracks.map((track, idx) =>
                renderTrackRow(track, idx, { contextTracks: resolvedCustomTracks })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
