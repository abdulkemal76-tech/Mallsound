import React from 'react';
import { Home, Search, Disc3, Library, User } from 'lucide-react';

export type BottomNavTab = 'home' | 'search' | 'dj' | 'library' | 'profile';

export interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  hidden?: boolean;
}

interface NavItem {
  id: BottomNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'search', label: 'Cari', icon: Search },
  { id: 'dj', label: 'DJ', icon: Disc3 },
  { id: 'library', label: 'Koleksi', icon: Library },
  { id: 'profile', label: 'Profil', icon: User },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hidden = false,
}) => {
  if (hidden) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 transition-all duration-300"
    >
      <div className="max-w-md mx-auto w-full px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className="group relative flex flex-col items-center justify-center flex-1 py-1 px-2 select-none focus:outline-none transition-colors duration-200"
            >
              {/* Icon Container with active scale effect */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 ease-out ${
                  isActive
                    ? 'scale-110 text-violet-400 -translate-y-0.5'
                    : 'text-white/40 group-hover:text-white/70 group-active:scale-95'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />

                {/* Active glow halo */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -m-1 rounded-full bg-violet-500/20 blur-sm pointer-events-none"
                  />
                )}
              </div>

              {/* Tab Label */}
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 transition-colors duration-200 ${
                  isActive ? 'text-violet-400 font-semibold' : 'text-white/40 group-hover:text-white/70'
                }`}
              >
                {item.label}
              </span>

              {/* Active Tab Gradient Indicator Dot */}
              <div className="h-1.5 flex items-center justify-center mt-0.5">
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                  />
                ) : (
                  <span aria-hidden="true" className="w-1.5 h-1.5 opacity-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
