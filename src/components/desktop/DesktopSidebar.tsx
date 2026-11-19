import React from 'react';
import {
  Home,
  Compass,
  Disc3,
  Library,
  User as UserIcon,
  FolderDown,
  Heart,
  Plus,
  LogIn,
  Music2,
  Sparkles,
} from 'lucide-react';
import { BottomNavTab } from '../ui/BottomNav';
import { Playlist } from '../../types/music';
import { User } from 'firebase/auth';

export interface DesktopSidebarProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  playlists: Playlist[];
  onSelectPlaylist: (playlistId: string) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportPlaylist: () => void;
  user: User | null;
  onSignIn: () => void;
  accentColor?: string;
  isNowPlayingExpanded?: boolean;
  onToggleNowPlaying?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  playlists,
  onSelectPlaylist,
  onOpenCreatePlaylist,
  onOpenImportPlaylist,
  user,
  onSignIn,
  accentColor = '#8b5cf6',
  isNowPlayingExpanded,
  onToggleNowPlaying,
}) => {
  const navItems: { id: BottomNavTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Explore', icon: Compass },
    { id: 'dj', label: 'DJ Studio', icon: Disc3 },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral-950 border-r border-white/5 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 16px ${accentColor}66`,
          }}
        >
          <Music2 className="w-5 h-5 fill-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-lg text-white tracking-tight">
              MallSound
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm text-white"
              style={{ backgroundColor: accentColor }}
            >
              PRO
            </span>
          </div>
          <span className="text-[10px] text-white/40 -mt-0.5">Desktop Music Studio</span>
        </div>
      </div>

      {/* Primary Navigation Menu */}
      <div className="px-3 pt-4 pb-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !isNowPlayingExpanded;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isNowPlayingExpanded && onToggleNowPlaying) {
                  onToggleNowPlaying();
                }
                onTabChange(item.id);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                className="w-5 h-5 transition-transform group-hover:scale-110"
                style={isActive ? { color: accentColor } : undefined}
              />
              <span>{item.label}</span>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full ml-auto shadow-sm"
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 my-2 border-t border-white/5" />

      {/* Quick Library Shortcuts / Folders */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-white/10 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold tracking-wider text-white/40 uppercase">
            Koleksi & Playlist
          </span>
          <button
            type="button"
            onClick={onOpenCreatePlaylist}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Buat Playlist Baru"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              if (isNowPlayingExpanded && onToggleNowPlaying) onToggleNowPlaying();
              onTabChange('library');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <FolderDown className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <span className="truncate">Lagu Diimpor (Spotify/YT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isNowPlayingExpanded && onToggleNowPlaying) onToggleNowPlaying();
              onTabChange('library');
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <Heart className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="truncate">Lagu Favorit</span>
          </button>

          {/* User Custom Playlists Folders */}
          {playlists.slice(0, 8).map((pl) => (
            <button
              key={pl.id}
              type="button"
              onClick={() => {
                if (isNowPlayingExpanded && onToggleNowPlaying) onToggleNowPlaying();
                onSelectPlaylist(pl.id);
                onTabChange('library');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
            >
              <span className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
              <span className="truncate">{pl.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sidebar Box: Sign-in promo / User state (YouTube Music style) */}
      {!user && (
        <div className="p-4 m-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
          <p className="text-xs font-semibold text-white">Sign in to MallSound</p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Dapatkan rekomendasi playlist personal dan sinkronisasi koleksi ke cloud.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in</span>
          </button>
        </div>
      )}
    </aside>
  );
};
