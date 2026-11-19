import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sliders,
  LogIn,
  User as UserIcon,
  X,
  Disc3,
} from 'lucide-react';
import { User } from 'firebase/auth';

export interface DesktopTopBarProps {
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onOpenTheme: () => void;
  onSignIn: () => void;
  user: User | null;
  accentColor?: string;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  onSearch,
  onOpenSettings,
  onOpenTheme,
  onSignIn,
  user,
  accentColor = '#8b5cf6',
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-6 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 select-none">
      {/* Left: Navigation Arrows */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => window.history.forward()}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          title="Maju"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Search Bar (YouTube Music Desktop style) */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 max-w-xl mx-8 relative"
      >
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-white/40 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search songs, albums, artists, podcasts..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 text-white placeholder-white/40 text-sm rounded-full pl-11 pr-10 py-2.5 outline-none border border-transparent focus:border-white/20 transition-all shadow-inner"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Color Quick Toggle */}
        <button
          type="button"
          onClick={onOpenTheme}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          title="Ubah Warna Tema"
        >
          <span
            className="w-3.5 h-3.5 rounded-full shadow-xs"
            style={{ backgroundColor: accentColor }}
          />
          <Palette className="w-4 h-4" />
        </button>

        {/* Settings & Equalizer */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Pengaturan & Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Account / Sign In */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-white/80 max-w-[120px] truncate hidden lg:inline">
              {user.displayName || user.email}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};
