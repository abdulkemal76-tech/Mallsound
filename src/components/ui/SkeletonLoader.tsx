import React from 'react';

export interface SkeletonProps {
  className?: string;
}

/**
 * Base pulse skeleton element dengan Tailwind 4 & gradien halus
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-white/5 rounded-lg ${className}`}
    />
  );
};

export interface TrackListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader untuk daftar lagu / track list (default 8 baris)
 */
export const TrackListSkeleton: React.FC<TrackListSkeletonProps> = ({
  count = 8,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Memuat daftar lagu"
      className={`space-y-2 w-full ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm animate-pulse"
        >
          {/* Index / Cover Thumbnail */}
          <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />

          {/* Title & Artist */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-white/10 rounded-md w-3/5 max-w-[200px]" />
            <div className="h-3 bg-white/5 rounded-md w-2/5 max-w-[140px]" />
          </div>

          {/* Extra metadata: duration & action button placeholder */}
          <div className="hidden sm:flex items-center gap-4 shrink-0 pr-2">
            <div className="h-3 bg-white/5 rounded-md w-10" />
            <div className="w-7 h-7 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface CardGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader untuk grid kartu lagu/album (default 6 kartu)
 */
export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Memuat kartu musik"
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 flex flex-col animate-pulse"
        >
          {/* Cover Art Skeleton */}
          <div className="aspect-square w-full rounded-xl bg-white/10 mb-3" />

          {/* Title Line */}
          <div className="h-4 bg-white/10 rounded-md w-4/5 mb-2" />

          {/* Subtitle / Artist Line */}
          <div className="h-3 bg-white/5 rounded-md w-3/5" />
        </div>
      ))}
    </div>
  );
};

export interface HeroSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader untuk hero banner beranda (single hero atau multiple)
 */
export const HeroSkeleton: React.FC<HeroSkeletonProps> = ({
  count = 1,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Memuat banner sorotan"
      className={`w-full space-y-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative w-full h-56 sm:h-72 md:h-80 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-8 overflow-hidden animate-pulse flex flex-col justify-end"
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent pointer-events-none" />

          {/* Shimmer gradient line */}
          <div className="relative z-10 space-y-3 max-w-lg">
            {/* Tag / Category Badge */}
            <div className="h-5 bg-white/10 rounded-full w-28 mb-1" />

            {/* Headline Title */}
            <div className="h-8 sm:h-10 bg-white/10 rounded-xl w-4/5" />

            {/* Subtitle Description */}
            <div className="h-4 bg-white/5 rounded-md w-3/5" />

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 bg-white/10 rounded-full w-32" />
              <div className="w-10 h-10 bg-white/5 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export interface GenreGridSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader untuk grid kategori / genre musik (default 6 kartu)
 */
export const GenreGridSkeleton: React.FC<GenreGridSkeletonProps> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Memuat kategori genre"
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 w-full ${className}`}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-24 sm:h-28 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 relative overflow-hidden animate-pulse flex items-end justify-between"
        >
          {/* Genre Label Line */}
          <div className="h-4 bg-white/10 rounded-md w-2/3" />

          {/* Decorative Corner Icon Placeholder */}
          <div className="w-8 h-8 rounded-full bg-white/5 shrink-0 self-start" />
        </div>
      ))}
    </div>
  );
};
