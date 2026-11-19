import React, { useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Heart,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Tv,
  Disc,
  MoreVertical,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';
import { RepeatMode, Track } from '../../types/music';

export interface DesktopPlayerBarProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  currentTimeSec: number;
  durationSec: number;
  onSeek: (sec: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  isRepeat: boolean;
  repeatMode?: RepeatMode;
  onToggleRepeat: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isLiked: boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  isNowPlayingExpanded: boolean;
  onToggleNowPlaying: () => void;
  stageMode: 'cover' | 'video';
  onSwitchStageMode: (mode: 'cover' | 'video') => void;
  accentColor?: string;
  onOpenSettings: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const DesktopPlayerBar: React.FC<DesktopPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  currentTimeSec,
  durationSec,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isRepeat,
  repeatMode,
  onToggleRepeat,
  isShuffle,
  onToggleShuffle,
  isLiked,
  onToggleLike,
  isNowPlayingExpanded,
  onToggleNowPlaying,
  stageMode,
  onSwitchStageMode,
  accentColor = '#8b5cf6',
  onOpenSettings,
}) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const progressPercent =
    durationSec > 0 ? Math.min(100, Math.max(0, (currentTimeSec / durationSec) * 100)) : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || durationSec <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * durationSec);
  };

  return (
    <div className="hidden md:flex flex-col fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 select-none">
      {/* 1. Full-Width Top Progress Bar (YouTube Music Desktop style) */}
      <div
        ref={progressBarRef}
        onClick={handleProgressBarClick}
        className="w-full h-1.5 bg-white/10 hover:h-2.5 transition-all duration-150 cursor-pointer relative group"
        title="Geser durasi lagu"
      >
        {/* Buffered / Base track */}
        <div
          className="h-full transition-all duration-100 relative"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        >
          {/* Scrubber thumb handle */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none"
            style={{ boxShadow: `0 0 8px ${accentColor}` }}
          />
        </div>
      </div>

      {/* 2. Main 3-Column Control Bar */}
      <div className="h-18 px-6 flex items-center justify-between gap-6">
        {/* Left Column: Playback Controls & Time (YouTube Music style) */}
        <div className="flex items-center gap-4 shrink-0 min-w-[240px]">
          <button
            type="button"
            onClick={onPrevTrack}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Lagu Sebelumnya (J)"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
            title={isPlaying ? 'Jeda (K / Spasi)' : 'Putar (K / Spasi)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNextTrack}
            className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Lagu Berikutnya (L)"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Time Counter */}
          <div className="text-xs text-white/60 font-mono tabular-nums tracking-tight">
            <span>{formatTime(currentTimeSec)}</span>
            <span className="mx-1 text-white/30">/</span>
            <span>{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* Center Column: Track Info & Likes (Clicking cover toggles Now Playing Stage) */}
        <div className="flex items-center gap-3.5 min-w-0 max-w-md flex-1 justify-center">
          <div
            onClick={onToggleNowPlaying}
            className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shrink-0 cursor-pointer shadow-md group"
            title="Buka Layar Pemutar Lengkap"
          >
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: accentColor }}
              >
                <Disc className="w-6 h-6 animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ChevronUp className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={onToggleNowPlaying}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-white/50 truncate mt-0.5">
              <span>{currentTrack.artist}</span>
              {currentTrack.album && (
                <>
                  <span className="mx-1.5 opacity-40">•</span>
                  <span>{currentTrack.album}</span>
                </>
              )}
            </p>
          </div>

          {/* Like & Dislike Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => onToggleLike(currentTrack, e)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isLiked
                  ? 'text-pink-500 hover:text-pink-400'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
              title={isLiked ? 'Hapus dari Favorit' : 'Suka'}
            >
              <Heart
                className="w-4 h-4 transition-transform hover:scale-110"
                fill={isLiked ? 'currentColor' : 'none'}
              />
            </button>
            <button
              type="button"
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Tidak Suka"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Volume, Shuffle, Repeat & Stage Expand */}
        <div className="flex items-center justify-end gap-3 shrink-0 min-w-[240px]">
          {/* Volume Control */}
          <div className="flex items-center gap-2 group">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Bunyikan' : 'Bisukan'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={onVolumeChange}
              className="w-20 lg:w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Repeat */}
          <button
            type="button"
            onClick={onToggleRepeat}
            className={`relative p-2 rounded-full transition-all cursor-pointer ${
              repeatMode === 'one'
                ? 'text-pink-400 bg-pink-500/20 border border-pink-500/40 shadow-sm'
                : (isRepeat || repeatMode === 'all')
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            style={isRepeat ? { color: accentColor } : undefined}
            title={
              repeatMode === 'one'
                ? 'Ulangi 1 Lagu: AKTIF'
                : isRepeat
                ? 'Ulangi Semua: AKTIF'
                : 'Ulangi: NONAKTIF'
            }
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow">
                1
              </span>
            )}
            {repeatMode === 'all' && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Shuffle */}
          <button
            type="button"
            onClick={onToggleShuffle}
            className={`relative p-2 rounded-full transition-all cursor-pointer ${
              isShuffle
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            style={isShuffle ? { color: accentColor } : undefined}
            title={isShuffle ? 'Mode Acak: AKTIF' : 'Mode Acak: NONAKTIF'}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* Video / Audio Switch */}
          <button
            type="button"
            onClick={() => onSwitchStageMode(stageMode === 'cover' ? 'video' : 'cover')}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              stageMode === 'video'
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            style={stageMode === 'video' ? { color: accentColor } : undefined}
            title={stageMode === 'video' ? 'Mode Video Musik' : 'Mode Sampul Audio'}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Expand / Collapse Now Playing Stage (YouTube Music desktop chevron) */}
          <button
            type="button"
            onClick={onToggleNowPlaying}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              isNowPlayingExpanded
                ? 'bg-white/15 text-white rotate-180'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title={isNowPlayingExpanded ? 'Tutup Tampilan Lengkap' : 'Buka Tampilan Lengkap'}
          >
            <ChevronUp className="w-5 h-5 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
