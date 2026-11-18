import React, { useId, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Disc3,
  RotateCcw,
  Zap,
  Music,
  Heart,
  Sliders,
  Sparkles,
  Radio,
  Gauge,
  ListMusic,
} from 'lucide-react';
import { Track } from '../types/music';

export interface DJPageProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  // Playback control
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  // EQ
  eqGains: [number, number, number, number, number];
  onEqBandChange: (idx: number, val: number) => void;
  // Queue
  queueTracks: Track[];
  onSelectTrack: (track: Track) => void;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  // Optional extra playback toggles
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
}

const EQ_BAND_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];
const QUICK_SPEEDS = [0.75, 1.0, 1.25, 1.5];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const TurntableVinyl: React.FC<{
  coverUrl: string;
  isPlaying: boolean;
  playbackRate: number;
  title: string;
}> = ({ coverUrl, isPlaying, playbackRate, title }) => {
  const [imageError, setImageError] = useState(false);
  const spinDuration = 3 / Math.max(0.25, playbackRate);

  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Glow aura behind platter */}
      <div
        className={`absolute w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isPlaying
            ? 'opacity-40 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500'
            : 'opacity-10 bg-violet-900'
        }`}
      />

      {/* Turntable Platter Base */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-92 md:h-92 rounded-full p-2 bg-neutral-900 border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center">
        {/* Outer Strobe Rim Dots */}
        <div className="absolute inset-1 rounded-full border border-dashed border-white/15 pointer-events-none" />

        {/* Vinyl Disc Body */}
        <div
          className="relative w-full h-full rounded-full bg-neutral-950 border border-neutral-800 shadow-2xl flex items-center justify-center overflow-hidden"
          style={{
            animation: 'dj-vinyl-spin 3s linear infinite',
            animationDuration: `${spinDuration}s`,
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        >
          {/* Vinyl Grooves Texture */}
          <div className="absolute inset-2 rounded-full border border-neutral-800/80 pointer-events-none" />
          <div className="absolute inset-5 rounded-full border border-neutral-800/70 pointer-events-none" />
          <div className="absolute inset-8 rounded-full border border-neutral-800/80 pointer-events-none" />
          <div className="absolute inset-12 rounded-full border border-neutral-800/60 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-neutral-800/80 pointer-events-none" />
          <div className="absolute inset-20 rounded-full border border-neutral-800/50 pointer-events-none" />

          {/* Radial Light Sheen */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-20"
            style={{
              background:
                'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.18) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.18) 225deg, transparent 270deg)',
            }}
          />

          {/* Center Label (Cover Art) */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/20 shadow-inner flex items-center justify-center bg-neutral-900">
            {coverUrl && !imageError ? (
              <img
                src={coverUrl}
                alt={title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-900 via-neutral-900 to-fuchsia-950 flex items-center justify-center">
                <Disc3 className="w-10 h-10 text-violet-400" />
              </div>
            )}

            {/* Inner Ring Gradient */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/40 pointer-events-none" />

            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-neutral-900 border-2 border-neutral-400 shadow-md flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
            </div>
          </div>
        </div>

        {/* Tonearm graphic overlay */}
        <div
          className="absolute -top-3 -right-2 sm:-top-5 sm:-right-4 w-24 sm:w-32 h-36 sm:h-44 pointer-events-none origin-top-right transition-transform duration-700 ease-out z-20"
          style={{
            transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)',
          }}
        >
          {/* Tonearm Base Pivot */}
          <div className="absolute top-1 right-2 w-7 h-7 rounded-full bg-neutral-800 border-2 border-neutral-600 shadow-lg flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          </div>
          {/* Metallic Arm Shaft */}
          <div className="absolute top-5 right-5 w-1 h-28 sm:h-34 bg-gradient-to-b from-neutral-400 via-neutral-300 to-neutral-500 rounded shadow-md origin-top rotate-[-12deg]" />
          {/* Cartridge Head / Stylus */}
          <div className="absolute bottom-2 left-3 sm:left-4 w-4 h-6 bg-violet-500 rounded-sm shadow-md border border-violet-300 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DJPage: React.FC<DJPageProps> = ({
  currentTrack,
  isPlaying,
  currentTimeSec,
  durationSec,
  onTogglePlay,
  onSeek,
  onNextTrack,
  onPrevTrack,
  playbackRate,
  onPlaybackRateChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  eqGains,
  onEqBandChange,
  queueTracks,
  onSelectTrack,
  isTrackLiked,
  onToggleLike,
  isShuffle: propIsShuffle,
  onToggleShuffle: propOnToggleShuffle,
  isRepeat: propIsRepeat,
  onToggleRepeat: propOnToggleRepeat,
}) => {
  // Local fallback for shuffle & repeat if not passed from parent
  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState(false);

  const isShuffle = propIsShuffle !== undefined ? propIsShuffle : localShuffle;
  const isRepeat = propIsRepeat !== undefined ? propIsRepeat : localRepeat;

  const handleToggleShuffle = () => {
    if (propOnToggleShuffle) {
      propOnToggleShuffle();
    } else {
      setLocalShuffle((prev) => !prev);
    }
  };

  const handleToggleRepeat = () => {
    if (propOnToggleRepeat) {
      propOnToggleRepeat();
    } else {
      setLocalRepeat((prev) => !prev);
    }
  };

  // Effect Boost logic
  // Bass Boost: +6dB on 60Hz and 230Hz (bands 0 and 1)
  const isBassBoostActive = eqGains[0] >= 5.5 && eqGains[1] >= 5.5;
  const handleToggleBassBoost = () => {
    if (isBassBoostActive) {
      onEqBandChange(0, 0);
      onEqBandChange(1, 0);
    } else {
      onEqBandChange(0, 6);
      onEqBandChange(1, 6);
    }
  };

  // Vocal Boost: +4dB on 910Hz and 3.6kHz (bands 2 and 3)
  const isVocalBoostActive = eqGains[2] >= 3.5 && eqGains[3] >= 3.5;
  const handleToggleVocalBoost = () => {
    if (isVocalBoostActive) {
      onEqBandChange(2, 0);
      onEqBandChange(3, 0);
    } else {
      onEqBandChange(2, 4);
      onEqBandChange(3, 4);
    }
  };

  // Treble Boost: +5dB on 14kHz (band 4)
  const isTrebleBoostActive = eqGains[4] >= 4.5;
  const handleToggleTrebleBoost = () => {
    if (isTrebleBoostActive) {
      onEqBandChange(4, 0);
    } else {
      onEqBandChange(4, 5);
    }
  };

  // Reset EQ: All bands to 0dB
  const handleResetEq = () => {
    [0, 1, 2, 3, 4].forEach((idx) => onEqBandChange(idx, 0));
  };

  const isLiked = isTrackLiked(currentTrack.id);
  const progressPercent = durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;
  const volumePercent = isMuted ? 0 : Math.round(volume * 100);

  // Derived or estimated BPM
  const displayBpm = currentTrack.synthConfig?.bpm
    ? Math.round(currentTrack.synthConfig.bpm * playbackRate)
    : Math.round(116 * playbackRate);

  const scrubberId = useId();

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-500 selection:text-white pb-24">
      {/* Embedded keyframe definition for spinning disc */}
      <style>{`
        @keyframes dj-vinyl-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      {/* Top Ambient Glow Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-violet-600/15 via-fuchsia-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* =================================================================
            1. HEADER: "🎧 DJ Studio" with animated gradient text
        ================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>MallSound v2.0 Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient-text">
              🎧 DJ Studio
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Konsol mixing profesional dengan kontrol deck putar, 5-band EQ, dan efek audio instan.
            </p>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Live Playback Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                }`}
              />
              <span className="font-medium text-white/80">
                {isPlaying ? 'ON AIR' : 'PAUSED'}
              </span>
            </div>

            {/* Live BPM Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur text-xs font-mono text-amber-400">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayBpm} BPM</span>
            </div>
          </div>
        </header>

        {/* =================================================================
            2. NOW PLAYING DECK - Large centered section
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Deck Lighting Lines */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          <div className="flex flex-col items-center text-center space-y-6">
            {/* Animated Vinyl Platter */}
            <TurntableVinyl
              coverUrl={currentTrack.coverUrl}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              title={currentTrack.title}
            />

            {/* Track Info & Like Action */}
            <div className="w-full max-w-lg space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white truncate tracking-tight">
                    {currentTrack.title || 'Tidak ada lagu'}
                  </h2>
                  <p className="text-sm sm:text-base text-white/60 truncate font-medium">
                    {currentTrack.artist || 'Artis Tidak Diketahui'}
                    {currentTrack.album ? ` • ${currentTrack.album}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => onToggleLike(currentTrack, e)}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                    isLiked
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.35)]'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                  aria-label={isLiked ? 'Batal suka' : 'Sukai lagu'}
                  title={isLiked ? 'Disukai' : 'Sukai'}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Badges Row */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {currentTrack.genre && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
                    {currentTrack.genre}
                  </span>
                )}
                {currentTrack.bitrateLabel && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 text-white/50 border border-white/10">
                    {currentTrack.bitrateLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Large Progress Bar with Time Display */}
            <div className="w-full max-w-2xl space-y-2 pt-2">
              <div className="relative group flex items-center">
                <label htmlFor={scrubberId} className="sr-only">
                  Garis waktu pemutaran DJ
                </label>
                <input
                  id={scrubberId}
                  type="range"
                  min={0}
                  max={Math.max(1, durationSec)}
                  step={0.1}
                  value={currentTimeSec}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-400 focus:outline-none transition-all"
                  style={{
                    background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(217, 70, 239) ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-white/60 tabular-nums px-1">
                <span className="text-violet-300 font-semibold">{formatTime(currentTimeSec)}</span>
                <span>{formatTime(durationSec)}</span>
              </div>
            </div>

            {/* =================================================================
                3. TRANSPORT CONTROLS
            ================================================================= */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 pt-2">
              {/* Shuffle Toggle */}
              <button
                type="button"
                onClick={handleToggleShuffle}
                className={`p-3 rounded-2xl transition-all cursor-pointer ${
                  isShuffle
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                }`}
                aria-label="Acak pemutaran"
                title={isShuffle ? 'Acak Aktif' : 'Acak Nonaktif'}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              {/* Previous Track */}
              <button
                type="button"
                onClick={onPrevTrack}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Trek sebelumnya"
                title="Sebelumnya"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </button>

              {/* Giant Play / Pause Button with Gradient Glow */}
              <button
                type="button"
                onClick={onTogglePlay}
                className="p-5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(217,70,239,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label={isPlaying ? 'Jeda pemutaran' : 'Mulai pemutaran'}
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                type="button"
                onClick={onNextTrack}
                className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="Trek selanjutnya"
                title="Selanjutnya"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </button>

              {/* Repeat Toggle */}
              <button
                type="button"
                onClick={handleToggleRepeat}
                className={`p-3 rounded-2xl transition-all cursor-pointer ${
                  isRepeat
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                }`}
                aria-label="Ulangi pemutaran"
                title={isRepeat ? 'Ulangi Aktif' : 'Ulangi Nonaktif'}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* =================================================================
            4. DJ CONTROLS PANEL - Grid of DJ-specific controls
        ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-400" />
              <span>Panel Kontrol DJ</span>
            </h2>
            <span className="text-xs text-white/50">Studio Hardware Emulation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* =============================================================
                a. SPEED / PITCH CONTROL
            ============================================================= */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Pitch & Tempo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPlaybackRateChange(1.0)}
                  className="text-[11px] font-mono text-white/50 hover:text-violet-300 underline cursor-pointer"
                  title="Kembalikan tempo ke 1.00x normal"
                >
                  Reset
                </button>
              </div>

              {/* Digital Speed Readout */}
              <div className="text-center py-2 bg-black/40 rounded-xl border border-white/5">
                <div className="text-3xl font-extrabold font-mono text-violet-400 tabular-nums">
                  {playbackRate.toFixed(2)}x
                </div>
                <div className="text-[11px] font-mono text-white/50">
                  {playbackRate === 1.0
                    ? 'Tempo Asli (±0%)'
                    : `${playbackRate > 1.0 ? '+' : ''}${Math.round(
                        (playbackRate - 1.0) * 100
                      )}% Pitch`}
                </div>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={playbackRate}
                  onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg accent-violet-400 cursor-pointer"
                  aria-label="Kecepatan pitch pemutaran"
                />
              </div>

              {/* Quick Speed Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {QUICK_SPEEDS.map((spd) => {
                  const isActive = Math.abs(playbackRate - spd) < 0.01;
                  return (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onPlaybackRateChange(spd)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-violet-500 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      {spd.toFixed(2)}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =============================================================
                b. 5-BAND EQ MINI (Horizontal layout spanning 2 cols on lg)
            ============================================================= */}
            <div className="md:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    5-Band Equalizer Mini
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/50">-12 dB s/d +12 dB</span>
              </div>

              {/* 5 Vertical Sliders */}
              <div className="grid grid-cols-5 gap-2 py-2 flex-1 items-center">
                {EQ_BAND_LABELS.map((label, idx) => {
                  const gain = eqGains[idx];
                  const formattedGain =
                    gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1);

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-between h-44 py-1 bg-black/25 rounded-xl border border-white/5"
                    >
                      {/* Gain Value Display */}
                      <span
                        className={`text-[10px] font-mono font-semibold tabular-nums ${
                          gain > 0
                            ? 'text-fuchsia-400'
                            : gain < 0
                            ? 'text-rose-400'
                            : 'text-white/60'
                        }`}
                      >
                        {formattedGain}
                      </span>

                      {/* Vertical Slider Wrapper */}
                      <div className="h-28 flex items-center justify-center relative">
                        {/* Center Zero Detent Marker */}
                        <div className="absolute w-6 h-[1px] bg-white/20 pointer-events-none" />
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={gain}
                          onChange={(e) =>
                            onEqBandChange(idx, Number(e.target.value))
                          }
                          className="w-24 -rotate-90 accent-fuchsia-400 cursor-pointer"
                          aria-label={`Equalizer frekuensi ${label}`}
                        />
                      </div>

                      {/* Frequency Label */}
                      <span className="text-[10px] font-mono text-white/70 font-medium">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-white/40 text-center">
                Geser ke atas untuk dorongan (boost), ke bawah untuk potongan (cut).
              </div>
            </div>

            {/* =============================================================
                d. VOLUME FADER
            ============================================================= */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Master Fader
                  </span>
                </div>
                <span className="text-xs font-mono text-pink-400 font-bold tabular-nums">
                  {volumePercent}%
                </span>
              </div>

              {/* Fader Center Area with Visual VU meter simulation */}
              <div className="flex items-center justify-center gap-4 py-1 flex-1">
                {/* Visual LED VU Meter */}
                <div className="flex flex-col justify-between h-28 w-2 py-0.5 bg-neutral-900 rounded border border-white/10">
                  {Array.from({ length: 8 }).map((_, i) => {
                    // 8 segments: 0..4 green, 5..6 amber, 7 red
                    const activeThreshold = ((7 - i) / 7) * 100;
                    const isLit = !isMuted && isPlaying && volumePercent >= activeThreshold;
                    const colorClass =
                      i < 2
                        ? isLit
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          : 'bg-rose-950/60'
                        : i < 4
                        ? isLit
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'bg-amber-950/60'
                        : isLit
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-emerald-950/60';

                    return (
                      <div
                        key={i}
                        className={`h-2 w-full rounded-xs transition-colors duration-150 ${colorClass}`}
                      />
                    );
                  })}
                </div>

                {/* Vertical Volume Slider */}
                <div className="h-28 flex items-center justify-center">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="w-24 -rotate-90 accent-pink-500 cursor-pointer"
                    aria-label="Volume utama"
                  />
                </div>
              </div>

              {/* Mute Button Toggle */}
              <button
                type="button"
                onClick={onToggleMute}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                  isMuted || volume === 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>Bisu (Muted)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span>Matikan Suara</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =================================================================
              c. EFFECTS PANEL (Instant FX buttons)
          ================================================================= */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Efek Instan & Filter Studio
                </span>
              </div>
              <span className="text-xs text-white/50">One-Tap FX Triggers</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Bass Boost */}
              <button
                type="button"
                onClick={handleToggleBassBoost}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-24 ${
                  isBassBoostActive
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Bass Boost
                  </span>
                  <Zap
                    className={`w-4 h-4 ${
                      isBassBoostActive ? 'text-amber-300 animate-bounce' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +6 dB pada 60Hz & 230Hz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isBassBoostActive ? 'AKTIF' : 'NONAKTIF'}
                </div>
              </button>

              {/* Vocal Boost */}
              <button
                type="button"
                onClick={handleToggleVocalBoost}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-24 ${
                  isVocalBoostActive
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Vocal Boost
                  </span>
                  <Music
                    className={`w-4 h-4 ${
                      isVocalBoostActive ? 'text-white' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +4 dB pada 910Hz & 3.6kHz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isVocalBoostActive ? 'AKTIF' : 'NONAKTIF'}
                </div>
              </button>

              {/* Treble Boost */}
              <button
                type="button"
                onClick={handleToggleTrebleBoost}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-24 ${
                  isTrebleBoostActive
                    ? 'bg-gradient-to-br from-pink-600 to-rose-600 text-white border-pink-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Treble Boost
                  </span>
                  <Sparkles
                    className={`w-4 h-4 ${
                      isTrebleBoostActive ? 'text-white' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +5 dB pada 14kHz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isTrebleBoostActive ? 'AKTIF' : 'NONAKTIF'}
                </div>
              </button>

              {/* Reset EQ */}
              <button
                type="button"
                onClick={handleResetEq}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-left transition-all cursor-pointer flex flex-col justify-between h-24 active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider text-white/90">
                    Reset EQ
                  </span>
                  <RotateCcw className="w-4 h-4 text-white/60 group-hover:-rotate-90 transition-transform duration-300" />
                </div>
                <div className="text-[11px] text-white/60">
                  Kembalikan semua ke 0 dB
                </div>
                <div className="text-[10px] font-mono text-amber-400 font-semibold">
                  FLAT STUDIO
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* =================================================================
            5. QUEUE PREVIEW - Scrollable list at bottom showing upcoming tracks
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold font-display text-white">
                Antrean Trek DJ
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-mono font-semibold">
                {queueTracks.length}
              </span>
            </div>
            <span className="text-xs text-white/50">
              Klik trek untuk langsung memutar di deck
            </span>
          </div>

          {queueTracks.length === 0 ? (
            <div className="py-12 text-center text-white/50 text-sm">
              Antrean trek DJ kosong. Pilih musik untuk dimasukkan ke antrean.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
              {queueTracks.map((track, idx) => {
                const isSelected = track.id === currentTrack.id;
                const trackLiked = isTrackLiked(track.id);

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer pt-3 ${
                      isSelected
                        ? 'bg-violet-500/20 border border-violet-500/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                    onClick={() => onSelectTrack(track)}
                  >
                    {/* Left: Index / Sound wave & Cover art */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 text-center font-mono text-xs text-white/40 shrink-0">
                        {isSelected && isPlaying ? (
                          <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Small Cover Art */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10 flex items-center justify-center">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Music className="w-4 h-4 text-white/40" />
                        )}
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-violet-300 font-bold' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-violet-400 text-neutral-950 shrink-0">
                              Now
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Right: Duration & Like */}
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs font-mono text-white/60 tabular-nums">
                        {formatTime(track.durationSec)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(track, e);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          trackLiked
                            ? 'text-pink-400'
                            : 'text-white/40 hover:text-white'
                        }`}
                        aria-label={trackLiked ? 'Batal suka' : 'Suka'}
                      >
                        <Heart
                          className={`w-4 h-4 ${trackLiked ? 'fill-current' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
