import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  Tv,
  Disc,
  Headphones,
  Sliders,
  Sparkles,
  Music2,
  ListMusic,
  FileText,
  Radio,
  Clock,
  Heart,
  Volume2,
} from 'lucide-react';
import { Track } from '../../types/music';

export interface DesktopNowPlayingStageProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  queueTracks: Track[];
  // v81 — katalog lengkap, dipakai tab RELATED untuk mencari karya lain
  // dari artis yang sama (bukan sekadar 10 lagu antrean).
  allTracks?: Track[];
  videoStageSlot?: React.ReactNode;
  stageMode: 'cover' | 'video';
  onSwitchStageMode: (mode: 'cover' | 'video') => void;
  activeLyricIndex: number;
  isLoadingLyrics: boolean;
  accentColor?: string;
  onOpenSettings: () => void;
}

type DesktopStageTab = 'up-next' | 'lyrics' | 'related';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export const DesktopNowPlayingStage: React.FC<DesktopNowPlayingStageProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onSelectTrack,
  queueTracks,
  allTracks,
  videoStageSlot,
  stageMode,
  onSwitchStageMode,
  activeLyricIndex,
  isLoadingLyrics,
  accentColor = '#8b5cf6',
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<DesktopStageTab>('up-next');

  if (!isOpen) return null;

  return (
    <div className="hidden md:flex flex-col fixed inset-0 bottom-20 z-30 bg-neutral-950 overflow-hidden select-none animate-fadeIn">
      {/* Background Ambient Glow */}
      {currentTrack.coverUrl && (
        <img
          src={currentTrack.coverUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-2xl pointer-events-none" />

      {/* Top Header of Stage */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Tutup Layar Penuh</span>
        </button>

        {/* Center Pill: Sampul / Video Switch */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
          <button
            type="button"
            onClick={() => onSwitchStageMode('cover')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              stageMode === 'cover'
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Sampul</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchStageMode('video')}
            className={`px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              stageMode === 'video'
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Equalizer & Efek Suara"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </header>

      {/* Main 2-Column Stage Body (Exactly like YouTube Music desktop screenshot!) */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-8 px-10 py-6 max-w-7xl mx-auto w-full min-h-0">
        {/* Left / Center Column: Large Artwork or Video Player */}
        <div className="col-span-7 flex flex-col items-center justify-center min-h-0">
          <div
            id="mallsound-desktop-stage-target"
            className="w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl relative group"
          >
            {/* YouTube Video Slot */}
            <div
              className={`absolute inset-0 ${
                stageMode === 'video' ? 'z-20 pointer-events-auto' : 'z-0 pointer-events-none'
              }`}
            >
              {videoStageSlot}
            </div>

            {/* Album Cover Art */}
            {stageMode === 'cover' && (
              <div className="absolute inset-0 z-10">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                    <Disc className="w-24 h-24 text-white/20 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Song Meta Below Artwork */}
          <div className="w-full max-w-[500px] mt-5 text-left">
            <h2 className="text-2xl font-bold font-display text-white truncate">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-white/60 mt-1 truncate">
              {currentTrack.artist}
              {currentTrack.album && (
                <>
                  <span className="mx-2 opacity-40">•</span>
                  <span>{currentTrack.album}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Column: Tabbed Panel (UP NEXT | LYRICS | RELATED) */}
        <div className="col-span-5 flex flex-col min-h-0 bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          {/* Panel Tab Headers */}
          <div className="flex items-center border-b border-white/10 px-4 pt-2">
            {[
              { id: 'up-next', label: 'UP NEXT' },
              { id: 'lyrics', label: 'LYRICS' },
              { id: 'related', label: 'RELATED' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as DesktopStageTab)}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer relative ${
                    isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Panel Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/15">
            {/* Tab 1: UP NEXT (Queue List) */}
            {activeTab === 'up-next' && (
              <div className="space-y-1">
                {queueTracks.map((trk, idx) => {
                  const isCurrent = trk.id === currentTrack.id;
                  return (
                    <div
                      key={`${trk.id}-${idx}`}
                      onClick={() => onSelectTrack(trk)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group ${
                        isCurrent
                          ? 'bg-white/15 text-white shadow-xs'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                          {trk.coverUrl ? (
                            <img
                              src={trk.coverUrl}
                              alt={trk.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <Music2 className="w-4 h-4" />
                            </div>
                          )}
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Play
                                className="w-4 h-4 fill-current"
                                style={{ color: accentColor }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'font-bold' : ''
                            }`}
                            style={isCurrent ? { color: accentColor } : undefined}
                          >
                            {trk.title}
                          </p>
                          <p className="text-[11px] text-white/50 truncate mt-0.5">
                            {trk.artist}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-white/40 ml-2">
                        {formatDuration(trk.durationSec)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: LYRICS */}
            {activeTab === 'lyrics' && (
              <div className="py-4 space-y-5 text-center">
                {isLoadingLyrics ? (
                  <p className="text-xs text-white/50 animate-pulse">Memuat lirik lagu...</p>
                ) : currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
                  currentTrack.lyrics.map((line, lIdx) => {
                    const isCurrentLine = lIdx === activeLyricIndex;
                    return (
                      <p
                        key={lIdx}
                        className={`text-sm sm:text-base transition-all duration-300 ${
                          isCurrentLine
                            ? 'font-bold text-lg scale-105 filter drop-shadow-md'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                        style={isCurrentLine ? { color: accentColor } : undefined}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : (
                  <div className="py-12 text-white/40 text-xs">
                    <p>Lirik instrumental atau belum tersedia untuk lagu ini.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: RELATED */}
            {activeTab === 'related' && (
              <div className="space-y-4">
                {(() => {
                  // v81 — RELATED kini benar-benar karya artis yang sama:
                  // cari di katalog lengkap berdasarkan nama artis pertama,
                  // lalu isi sisanya (maks 10) dengan lagu lain dari antrean.
                  const mainArtist = currentTrack.artist
                    .split(/[, &]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)[0]?.toLowerCase();
                  const pool = allTracks && allTracks.length > 0 ? allTracks : queueTracks;
                  const sameArtist = mainArtist
                    ? pool.filter(
                        (t) =>
                          t.id !== currentTrack.id &&
                          t.artist.toLowerCase().includes(mainArtist),
                      )
                    : [];
                  const seen = new Set(sameArtist.map((t) => t.id));
                  seen.add(currentTrack.id);
                  const queueFill = queueTracks
                    .filter((t) => !seen.has(t.id))
                    .slice(0, Math.max(0, 10 - sameArtist.length));
                  const renderRow = (trk: Track) => (
                    <div
                      key={trk.id}
                      onClick={() => onSelectTrack(trk)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <img
                        src={trk.coverUrl}
                        alt={trk.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{trk.title}</p>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{trk.artist}</p>
                      </div>
                    </div>
                  );
                  return (
                    <>
                      {sameArtist.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-white/50">
                            Karya lain dari {currentTrack.artist.split(',')[0].trim()}:
                          </p>
                          {sameArtist.slice(0, 10).map(renderRow)}
                        </div>
                      )}
                      {queueFill.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-white/50">Lagu lain dari antrean:</p>
                          {queueFill.map(renderRow)}
                        </div>
                      )}
                      {sameArtist.length === 0 && queueFill.length === 0 && (
                        <p className="text-xs text-white/40 py-6 text-center">
                          Belum ada lagu terkait untuk lagu ini.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
