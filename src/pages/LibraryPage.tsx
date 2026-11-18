import React, { useState } from 'react';
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
} from 'lucide-react';
import { Track, Playlist, PlaylistCoverTheme } from '../types/music';

export interface LibraryPageProps {
  // Playlists
  playlists: Playlist[];
  onSelectPlaylist: (playlistId: string) => void;
  onDeletePlaylist: (playlistId: string, e: React.MouseEvent) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportPlaylist: () => void;
  // Favorites
  favoriteTracks: Track[];
  // Recently played (local state)
  recentlyPlayed: Track[];
  // Track actions
  onSelectTrack: (track: Track) => void;
  currentTrack: Track;
  isPlaying: boolean;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  // Custom tracks
  onOpenAddCustomTrack: () => void;
  customTracks?: Track[];
}

type SubTab = 'playlist' | 'disukai' | 'baru-diputar' | 'upload';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const COVER_THEME_STYLES: Record<
  PlaylistCoverTheme,
  {
    border: string;
    bgGradient: string;
    badge: string;
    glow: string;
  }
> = {
  amber: {
    border: 'border-l-amber-500',
    bgGradient: 'from-amber-500/15 via-neutral-900/60 to-neutral-950/80',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glow: 'group-hover:shadow-amber-500/20',
  },
  emerald: {
    border: 'border-l-emerald-500',
    bgGradient: 'from-emerald-500/15 via-neutral-900/60 to-neutral-950/80',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  indigo: {
    border: 'border-l-indigo-500',
    bgGradient: 'from-indigo-500/15 via-neutral-900/60 to-neutral-950/80',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    glow: 'group-hover:shadow-indigo-500/20',
  },
  rose: {
    border: 'border-l-rose-500',
    bgGradient: 'from-rose-500/15 via-neutral-900/60 to-neutral-950/80',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    glow: 'group-hover:shadow-rose-500/20',
  },
  slate: {
    border: 'border-l-slate-400',
    bgGradient: 'from-slate-500/15 via-neutral-900/60 to-neutral-950/80',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    glow: 'group-hover:shadow-slate-500/20',
  },
};

const ResilientCover: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

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
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const LibraryPage: React.FC<LibraryPageProps> = ({
  playlists,
  onSelectPlaylist,
  onDeletePlaylist,
  onOpenCreatePlaylist,
  onOpenImportPlaylist,
  favoriteTracks,
  recentlyPlayed,
  onSelectTrack,
  currentTrack,
  isPlaying,
  isTrackLiked,
  onToggleLike,
  onOpenAddCustomTrack,
  customTracks,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('playlist');

  const resolvedCustomTracks =
    customTracks || favoriteTracks.filter((t) => t.isCustom);

  const tabs: { id: SubTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'playlist', label: 'Playlist', icon: FolderPlus, count: playlists.length },
    { id: 'disukai', label: 'Disukai', icon: Heart, count: favoriteTracks.length },
    { id: 'baru-diputar', label: 'Baru Diputar', icon: Clock, count: recentlyPlayed.length },
    { id: 'upload', label: 'Upload', icon: Upload, count: resolvedCustomTracks.length },
  ];

  const renderTrackRow = (track: Track, index: number) => {
    const isCurrent = currentTrack?.id === track.id;
    const isLiked = isTrackLiked(track.id);

    return (
      <div
        key={`${track.id}-${index}`}
        onClick={() => onSelectTrack(track)}
        className={`group relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
          isCurrent
            ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10'
            : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
            <ResilientCover
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrent && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                {isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-fuchsia-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2.5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                ) : (
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold truncate transition-colors ${
                isCurrent ? 'text-violet-400 font-display' : 'text-white group-hover:text-violet-300'
              }`}
            >
              {track.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-white/60 truncate max-w-[180px] sm:max-w-[280px]">
                {track.artist}
              </p>
              {track.genre && (
                <>
                  <span className="text-[10px] text-white/30">•</span>
                  <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {track.genre}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
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

          <span className="text-xs text-white/50 font-mono hidden sm:inline-block w-12 text-right">
            {formatDuration(track.durationSec)}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTrack(track);
            }}
            className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-pink-500 flex items-center justify-center text-white transition-all shadow-sm"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 pt-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            Koleksi Musik
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Kelola playlist, lagu favorit, riwayat dengar, dan lagu kustom pribadimu.
          </p>
        </div>

        {activeTab === 'playlist' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onOpenImportPlaylist}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all shadow-sm hover:scale-[1.02]"
            >
              <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
              <span>Import Playlist</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreatePlaylist}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Playlist</span>
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <button
            type="button"
            onClick={onOpenAddCustomTrack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4" />
            <span>Tambah Lagu Kustom</span>
          </button>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
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

      {/* Tab 1: Playlists */}
      {activeTab === 'playlist' && (
        <div className="space-y-6">
          {playlists.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center text-fuchsia-400 mb-4 shadow-inner">
                <FolderPlus className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">Belum ada playlist</h3>
              <p className="text-sm text-white/60 max-w-md mt-1 mb-6">
                Buat playlist baru untuk menyusun lagu-lagu favoritmu, atau import playlist langsung
                dari Spotify atau YouTube Music.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenCreatePlaylist}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Playlist Pertama</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenImportPlaylist}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4 text-fuchsia-400" />
                  <span>📥 Import dari Spotify/YT</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => {
                const theme = COVER_THEME_STYLES[playlist.coverTheme] || COVER_THEME_STYLES.amber;
                return (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className={`group relative rounded-2xl p-5 border border-white/10 ${theme.border} border-l-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-xl ${theme.glow}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center text-white shadow-md">
                        <Music className="w-6 h-6 text-white/90" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onDeletePlaylist(playlist.id, e)}
                        className="opacity-60 group-hover:opacity-100 p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                        title="Hapus playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-semibold text-white font-display truncate group-hover:text-violet-300 transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 mt-1 min-h-[32px]">
                      {playlist.description || 'Tidak ada deskripsi'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                      <span className={`px-2 py-0.5 rounded-md border font-medium ${theme.badge}`}>
                        {playlist.trackIds.length} lagu
                      </span>
                      <span className="text-white/40 group-hover:text-white/70 transition-colors flex items-center gap-1">
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

      {/* Tab 2: Disukai */}
      {activeTab === 'disukai' && (
        <div className="space-y-4">
          {favoriteTracks.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-pink-400 mb-4 shadow-inner">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">
                Belum ada lagu yang disukai
              </h3>
              <p className="text-sm text-white/60 max-w-md mt-1">
                Ketuk ikon hati pada lagu apa pun saat mendengarkan untuk menambahkannya ke koleksi
                favoritmu.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                <span>Daftar Lagu ({favoriteTracks.length})</span>
                <span className="hidden sm:inline">Durasi</span>
              </div>
              {favoriteTracks.map((track, idx) => renderTrackRow(track, idx))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Baru Diputar */}
      {activeTab === 'baru-diputar' && (
        <div className="space-y-4">
          {recentlyPlayed.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">
                Belum ada riwayat pemutaran
              </h3>
              <p className="text-sm text-white/60 max-w-md mt-1">
                Lagu yang kamu putar akan otomatis terekam di sini agar kamu mudah menemukannya
                kembali.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                <span>Riwayat Terakhir ({recentlyPlayed.length})</span>
                <span className="hidden sm:inline">Durasi</span>
              </div>
              {recentlyPlayed.map((track, idx) => renderTrackRow(track, idx))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Upload */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-white/10">
            <div>
              <h3 className="text-sm font-semibold text-white font-display">
                Studio Lagu Mandiri & Upload
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Tambahkan file audio MP3/WAV atau buat komposisi instrumen synthesizer Web Audio.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAddCustomTrack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-violet-500/20 hover:scale-[1.02] transition-all shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Lagu Baru</span>
            </button>
          </div>

          {resolvedCustomTracks.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center text-violet-400 mb-4 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">
                Belum ada lagu kustom
              </h3>
              <p className="text-sm text-white/60 max-w-md mt-1 mb-6">
                Unggah lagu karya sendiri atau gunakan generator musik studio MallSound untuk
                membuat rekaman baru.
              </p>
              <button
                type="button"
                onClick={onOpenAddCustomTrack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Unggah Lagu Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs text-white/40 uppercase tracking-wider font-semibold">
                <span>Lagu Kustom ({resolvedCustomTracks.length})</span>
                <span className="hidden sm:inline">Durasi</span>
              </div>
              {resolvedCustomTracks.map((track, idx) => renderTrackRow(track, idx))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
