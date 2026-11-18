import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex items-end justify-between gap-4 mb-4 sm:mb-6 w-full">
      {/* Sisi Kiri: Title, Subtitle, dan Icon opsional */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-violet-400 shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight truncate">
            {title}
          </h2>
        </div>

        {subtitle && (
          <p className="text-sm text-white/60 font-sans mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Sisi Kanan: Action Link (misal: 'Lihat Semua') */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="group inline-flex items-center gap-1 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors shrink-0 pb-0.5 focus:outline-none"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
};
