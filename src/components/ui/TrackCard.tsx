import React, { useState } from 'react';
import { Play, Pause, Heart, Disc3, MoreVertical } from 'lucide-react';
import { Track } from '../../types/music';

export interface TrackCardProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onToggleLike?: (track: Track, e: React.MouseEvent) => void;
  onOpenActions?: (track: Track, e: React.MouseEvent) => void;
  isLiked?: boolean;
  showArtist?: boolean; // default true
  size?: 'sm' | 'md' | 'lg'; // default 'md'
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isCurrentTrack,
  isPlaying,
  onClick,
  onToggleLike,
  onOpenActions,
  isLiked = false,
  showArtist = true,
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const isPlayingCurrent = isCurrentTrack && isPlaying;

  // Size styling presets
  const sizeConfig = {
    sm: {
      card: 'p-2 rounded-xl',
      cover: 'rounded-lg mb-2',
      playButton: 'w-8 h-8',
      playIcon: 'w-4 h-4',
      likeButton: 'p-1.5 top-1.5 right-1.5',
      likeIcon: 'w-3.5 h-3.5',
      title: 'text-xs font-medium',
      artist: 'text-[11px]',
    },
    md: {
      card: 'p-3 rounded-2xl',
      cover: 'rounded-xl mb-3',
      playButton: 'w-10 h-10',
      playIcon: 'w-5 h-5',
      likeButton: 'p-2 top-2 right-2',
      likeIcon: 'w-4 h-4',
      title: 'text-sm font-semibold',
      artist: 'text-xs',
    },
    lg: {
      card: 'p-4 rounded-2xl',
      cover: 'rounded-xl mb-3',
      playButton: 'w-12 h-12',
      playIcon: 'w-6 h-6',
      likeButton: 'p-2.5 top-2.5 right-2.5',
      likeIcon: 'w-4 h-4',
      title: 'text-base sm:text-lg font-bold',
      artist: 'text-sm',
    },
  }[size];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${track.title} oleh ${track.artist}`}
      className={`group relative flex flex-col bg-white/5 backdrop-blur-sm border transition-all duration-300 cursor-pointer select-none outline-none hover:scale-[1.02] hover:bg-white/10 ${
        sizeConfig.card
      } ${
        isCurrentTrack
          ? 'border-violet-500/80 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-violet-500/50'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Cover Image Container */}
      <div className={`relative aspect-square w-full overflow-hidden bg-neutral-900 ${sizeConfig.cover}`}>
        {!imageError && track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-white/30">
            <Disc3 className="w-10 h-10 opacity-60" />
          </div>
        )}

        {/* Hover / Active Gradient Play-Pause Overlay */}
        <div
          className={`absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isPlayingCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div
            className={`${sizeConfig.playButton} rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/40 flex items-center justify-center transition-transform duration-200 transform group-hover:scale-110 active:scale-95`}
          >
            {isPlayingCurrent ? (
              <Pause className={`${sizeConfig.playIcon} fill-white`} />
            ) : (
              <Play className={`${sizeConfig.playIcon} fill-white translate-x-0.5`} />
            )}
          </div>
        </div>

        {/* Like Button */}
        {onToggleLike && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(track, e);
            }}
            aria-label={isLiked ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}
            className={`absolute ${sizeConfig.likeButton} rounded-full backdrop-blur-md transition-all duration-200 z-10 focus:outline-none ${
              isLiked
                ? 'bg-neutral-950/70 text-pink-500 opacity-100 scale-105'
                : 'bg-neutral-950/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 hover:scale-110'
            }`}
          >
            <Heart
              className={`${sizeConfig.likeIcon} transition-colors ${
                isLiked ? 'fill-pink-500' : ''
              }`}
            />
          </button>
        )}

        {/* Active Equalizer Playing Indicator */}
        {isPlayingCurrent && (
          <div className="absolute bottom-2 left-2 z-10 flex items-end gap-0.5 px-2 py-1 rounded-md bg-neutral-950/80 backdrop-blur-md">
            <span className="w-0.5 h-3 bg-violet-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-2 bg-fuchsia-400 rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-4 bg-pink-400 rounded-full animate-pulse delay-150" />
          </div>
        )}
      </div>

      {/* Track Details */}
      <div className="w-full min-w-0 flex items-start justify-between gap-1 mt-1">
        <div className="min-w-0 flex-1">
          <h4
            title={track.title}
            className={`font-display truncate tracking-tight transition-colors ${sizeConfig.title} ${
              isCurrentTrack ? 'text-violet-400 font-bold' : 'text-white group-hover:text-violet-200'
            }`}
          >
            {track.title}
          </h4>

          {showArtist && (
            <p
              title={track.artist}
              className={`text-white/60 truncate font-sans mt-0.5 transition-colors group-hover:text-white/80 ${sizeConfig.artist}`}
            >
              {track.artist}
            </p>
          )}
        </div>

        {onOpenActions && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenActions(track, e);
            }}
            className="p-1 -mr-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Menu lagu"
            aria-label={`Menu pilihan untuk lagu ${track.title}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
