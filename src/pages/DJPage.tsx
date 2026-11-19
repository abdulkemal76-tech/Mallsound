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
  Flame,
  Sun,
  Activity,
} from 'lucide-react';
import { Track } from '../types/music';
import { DJ_INDO_TRACKS } from '../data/djIndoTracks';

export type DiscoLightMode = 'disco' | 'strobe' | 'laser' | 'ambient' | 'off';

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

// Estimated BPM map for DJ Indo tracks
const DJ_TRACK_BPM: Record<string, number> = {
  dj_ublag_ublag: 155,
  dj_sia_sia_mengharap: 150,
  dj_karna_su_sayang: 132,
  dj_malam_pagi: 130,
  dj_tabrak_tabrak: 152,
  dj_komang: 148,
  dj_sial_mahalini: 150,
  dj_domba_kuring: 158,
  dj_cikini_gondangdia: 146,
  dj_alay: 154,
  dj_santri_pekok: 160,
  dj_stecu_stecu: 152,
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * TurntableStage:
 * Features realistic rotating vinyl, tone arm, hanging mirror disco ball,
 * sweeping moving-head spotlights, cyber laser lines, strobe flash overlay,
 * and subwoofer bass-kick shockwave rings.
 */
const TurntableStage: React.FC<{
  coverUrl: string;
  isPlaying: boolean;
  playbackRate: number;
  title: string;
  lightMode: DiscoLightMode;
  isManualBlitz: boolean;
  isHoregBass: boolean;
}> = ({
  coverUrl,
  isPlaying,
  playbackRate,
  title,
  lightMode,
  isManualBlitz,
  isHoregBass,
}) => {
  const [imageError, setImageError] = useState(false);
  const spinDuration = 3 / Math.max(0.25, playbackRate);
  const pulseDuration = 0.55 / Math.max(0.5, playbackRate);

  const showSpotlights = (lightMode === 'disco' || lightMode === 'ambient') && isPlaying;
  const showLasers = (lightMode === 'laser' || lightMode === 'disco') && isPlaying;
  const showStrobe = lightMode === 'strobe' && isPlaying;
  const isStrobeActive = showStrobe || isManualBlitz;

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-6 overflow-hidden rounded-3xl bg-radial from-violet-950/40 via-neutral-950/90 to-black border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
      {/* =================================================================
          A. STROBE BLITZ OVERLAY (Rave Flash)
      ================================================================= */}
      {isStrobeActive && (
        <div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            animation: 'dj-strobe-blitz 0.1s steps(2, start) infinite',
            backgroundColor: isManualBlitz ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.25)',
          }}
        />
      )}

      {/* =================================================================
          B. MOVING-HEAD SPOTLIGHT BEAMS (Left & Right)
      ================================================================= */}
      {showSpotlights && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Spotlight Left (Cyan / Violet) */}
          <div
            className="absolute -top-10 left-1/4 w-40 sm:w-60 h-[420px] origin-top blur-xl opacity-60"
            style={{
              background:
                lightMode === 'disco'
                  ? 'linear-gradient(180deg, rgba(6,182,212,0.8) 0%, rgba(147,51,234,0.3) 60%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(168,85,247,0.7) 0%, rgba(59,130,246,0.3) 60%, transparent 100%)',
              clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
              animation: 'dj-spotlight-left 3.6s ease-in-out infinite alternate',
            }}
          />

          {/* Spotlight Right (Magenta / Amber) */}
          <div
            className="absolute -top-10 right-1/4 w-40 sm:w-60 h-[420px] origin-top blur-xl opacity-60"
            style={{
              background:
                lightMode === 'disco'
                  ? 'linear-gradient(180deg, rgba(236,72,153,0.8) 0%, rgba(245,158,11,0.3) 60%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(217,70,239,0.7) 0%, rgba(99,102,241,0.3) 60%, transparent 100%)',
              clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
              animation: 'dj-spotlight-right 4.2s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* =================================================================
          C. CYBER LASER BEAMS
      ================================================================= */}
      {showLasers && (
        <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
          {/* Neon Green Laser */}
          <div
            className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399]"
            style={{
              top: '38%',
              animation: 'dj-laser-sweep 2.8s ease-in-out infinite alternate',
            }}
          />
          {/* Neon Cyan Laser */}
          <div
            className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee]"
            style={{
              top: '62%',
              animation: 'dj-laser-sweep-reverse 3.2s ease-in-out infinite alternate',
            }}
          />
        </div>
      )}

      {/* =================================================================
          D. HANGING MIRROR DISCO BALL
      ================================================================= */}
      {lightMode !== 'off' && (
        <div className="relative z-20 flex flex-col items-center mb-3 group">
          {/* Hanging Cord */}
          <div className="w-[1.5px] h-8 sm:h-10 bg-gradient-to-b from-white/40 via-neutral-400 to-white/70 shadow-sm" />

          {/* Disco Ball Sphere */}
          <div
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.6)] border border-white/60 overflow-hidden flex items-center justify-center"
            style={{
              background:
                'conic-gradient(from 0deg, #ffffff 0deg, #cbd5e1 45deg, #64748b 90deg, #f8fafc 135deg, #94a3b8 180deg, #e2e8f0 225deg, #475569 270deg, #ffffff 360deg)',
              animation: isPlaying ? 'dj-discoball-spin 6s linear infinite' : 'none',
            }}
          >
            {/* Mirror Facets Grid Texture */}
            <div
              className="absolute inset-0 opacity-45 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px)',
              }}
            />

            {/* Specular Highlight */}
            <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white blur-[1px] opacity-90" />
          </div>

          {/* Glint Sparkles around ball */}
          <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-amber-300 animate-pulse pointer-events-none" />
          <Sparkles className="absolute top-4 -left-3 w-3.5 h-3.5 text-cyan-300 animate-ping pointer-events-none" />
        </div>
      )}

      {/* =================================================================
          E. TURNTABLE VINYL & SUBWOOFER BASS SHOCKWAVE
      ================================================================= */}
      <div className="relative flex items-center justify-center p-2 z-20">
        {/* Glow Aura behind platter */}
        <div
          className={`absolute w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isPlaying
              ? isHoregBass
                ? 'opacity-85 bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-amber-500 scale-110'
                : 'opacity-50 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-500'
              : 'opacity-15 bg-violet-900'
          }`}
        />

        {/* Subwoofer Bass-Kick Shockwave Ring */}
        {isPlaying && (
          <div
            className={`absolute rounded-full pointer-events-none border-2 transition-all ${
              isHoregBass
                ? 'border-fuchsia-400/80 shadow-[0_0_35px_rgba(236,72,153,0.85)]'
                : 'border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.6)]'
            }`}
            style={{
              width: '102%',
              height: '102%',
              animation: `dj-bass-kick ${pulseDuration}s cubic-bezier(0.1, 0.9, 0.2, 1) infinite`,
            }}
          />
        )}

        {/* Turntable Platter Base */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-92 md:h-92 rounded-full p-2 bg-neutral-900 border-2 border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex items-center justify-center">
          {/* Outer Strobe Rim Dots */}
          <div className="absolute inset-1 rounded-full border border-dashed border-white/20 pointer-events-none" />

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
              className="absolute inset-0 rounded-full pointer-events-none opacity-25"
              style={{
                background:
                  'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.25) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.25) 225deg, transparent 270deg)',
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
            {/* Cartridge Head / Stylus with LED */}
            <div className="absolute bottom-2 left-3 sm:left-4 w-4 h-6 bg-violet-500 rounded-sm shadow-md border border-violet-300 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-pulse" />
            </div>
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
  // Local states
  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState(false);
  const [lightMode, setLightMode] = useState<DiscoLightMode>('disco');
  const [isManualBlitz, setIsManualBlitz] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'dj-indo' | 'queue'>('dj-indo');

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

  // Bass Boost Logic:
  // Mega Bass Horeg: +12dB on 60Hz and +8dB on 230Hz (Indonesian Sound System Horeg)
  const isHoregBass = eqGains[0] >= 11 && eqGains[1] >= 7.5;
  // Sub-Bass Club: +6dB on 60Hz and +4dB on 230Hz
  const isSubBassClub = !isHoregBass && eqGains[0] >= 5.5 && eqGains[1] >= 3.5;

  const handleSetMegaBassHoreg = () => {
    if (isHoregBass) {
      // Toggle back to flat
      onEqBandChange(0, 0);
      onEqBandChange(1, 0);
    } else {
      onEqBandChange(0, 12);
      onEqBandChange(1, 8);
    }
  };

  const handleSetSubBassClub = () => {
    if (isSubBassClub) {
      onEqBandChange(0, 0);
      onEqBandChange(1, 0);
    } else {
      onEqBandChange(0, 6);
      onEqBandChange(1, 4);
    }
  };

  // Vocal Boost: +4dB on 910Hz and 3.6kHz
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

  // Treble Boost: +5dB on 14kHz
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
  const trackIdClean = currentTrack.id.toLowerCase();
  const knownBpm = DJ_TRACK_BPM[trackIdClean] || currentTrack.synthConfig?.bpm || 135;
  const displayBpm = Math.round(knownBpm * playbackRate);

  const scrubberId = useId();

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-500 selection:text-white pb-28">
      {/* Embedded CSS Keyframes for Disco & Stage Lighting */}
      <style>{`
        @keyframes dj-vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dj-discoball-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dj-spotlight-left {
          0% { transform: rotate(-22deg) scaleX(0.85); opacity: 0.45; }
          50% { transform: rotate(6deg) scaleX(1.15); opacity: 0.8; }
          100% { transform: rotate(26deg) scaleX(0.9); opacity: 0.55; }
        }
        @keyframes dj-spotlight-right {
          0% { transform: rotate(24deg) scaleX(0.85); opacity: 0.5; }
          50% { transform: rotate(-8deg) scaleX(1.2); opacity: 0.85; }
          100% { transform: rotate(-28deg) scaleX(0.95); opacity: 0.45; }
        }
        @keyframes dj-laser-sweep {
          0% { transform: translateY(-30px) rotate(-4deg); opacity: 0.3; }
          50% { transform: translateY(20px) rotate(3deg); opacity: 0.95; }
          100% { transform: translateY(-10px) rotate(-2deg); opacity: 0.4; }
        }
        @keyframes dj-laser-sweep-reverse {
          0% { transform: translateY(25px) rotate(3deg); opacity: 0.4; }
          50% { transform: translateY(-25px) rotate(-4deg); opacity: 0.95; }
          100% { transform: translateY(15px) rotate(2deg); opacity: 0.35; }
        }
        @keyframes dj-strobe-blitz {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.95; }
        }
        @keyframes dj-bass-kick {
          0% { transform: scale(1.0); opacity: 0.85; }
          50% { transform: scale(1.16); opacity: 0.25; }
          100% { transform: scale(1.28); opacity: 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      {/* Top Ambient Glow Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* =================================================================
            1. HEADER: "🎧 DJ Studio & Disco Club"
        ================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>MallSound DJ Stage • Jedag Jedug Horeg</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent animate-gradient-text">
              🎧 DJ Club & Disco Studio
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              Pencahayaan disco rave, sub-bass horeg menggelegar, dan koleksi 12 lagu DJ Indo viral pilihan.
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
                {isPlaying ? 'ON DECK' : 'PAUSED'}
              </span>
            </div>

            {/* Live BPM Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur text-xs font-mono text-amber-400">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayBpm} BPM</span>
            </div>

            {/* Bass Horeg Status */}
            {isHoregBass && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-xs font-bold text-fuchsia-300 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>HOREG +12dB</span>
              </div>
            )}
          </div>
        </header>

        {/* =================================================================
            2. NOW PLAYING DECK & TURNTABLE STAGE
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Deck Lighting Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

          {/* Interactive Turntable Stage with Disco & Lighting */}
          <TurntableStage
            coverUrl={currentTrack.coverUrl}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            title={currentTrack.title}
            lightMode={lightMode}
            isManualBlitz={isManualBlitz}
            isHoregBass={isHoregBass}
          />

          {/* Track Info & Like Action */}
          <div className="flex flex-col items-center text-center space-y-3 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white truncate tracking-tight">
                  {currentTrack.title || 'Pilih Trek DJ'}
                </h2>
                <p className="text-sm sm:text-base text-white/70 truncate font-medium">
                  {currentTrack.artist || 'Artis DJ'}
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
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {currentTrack.genre && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {currentTrack.genre}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ⚡ {displayBpm} BPM
              </span>
              {isHoregBass && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Sub-Bass Horeg
                </span>
              )}
              {currentTrack.bitrateLabel && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 text-white/50 border border-white/10">
                  {currentTrack.bitrateLabel}
                </span>
              )}
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="w-full max-w-2xl mx-auto space-y-2 pt-2">
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

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 pt-2">
            {/* Shuffle */}
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

            {/* Prev Track */}
            <button
              type="button"
              onClick={onPrevTrack}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Trek sebelumnya"
              title="Sebelumnya"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Giant Play / Pause Button with Glow */}
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:shadow-[0_0_45px_rgba(217,70,239,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
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

            {/* Repeat */}
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
        </section>

        {/* =================================================================
            3. CLUB LIGHTING FX CONTROLLER (Lampu Disco, Flash & Laser)
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Pencahayaan Panggung Disco & Laser
              </h2>
            </div>
            <span className="text-xs text-white/50">
              Pilih mode pencahayaan club atau picu flash blitz manual
            </span>
          </div>

          {/* Mode Selector Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'disco', label: '🌈 Disco RGB', desc: 'Lampu bergerak warna-warni' },
              { id: 'strobe', label: '⚡ Strobe Blitz', desc: 'Flash kilat rave frekuensi tinggi' },
              { id: 'laser', label: '🚨 Laser Cyber', desc: 'Sinar laser neon membelah deck' },
              { id: 'ambient', label: '🌌 Club Ambient', desc: 'Nuansa club malam hangat' },
              { id: 'off', label: '🌑 Off', desc: 'Pencahayaan dinonaktifkan' },
            ].map((mode) => {
              const isActive = lightMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLightMode(mode.id as DiscoLightMode)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-pink-600/30 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.45)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold font-display">{mode.label}</span>
                  <span className="text-[10px] text-white/50 pt-1">{mode.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Manual Flash Blitz Button (Hold or Click) */}
          <div className="pt-2">
            <button
              type="button"
              onMouseDown={() => setIsManualBlitz(true)}
              onMouseUp={() => setIsManualBlitz(false)}
              onTouchStart={() => setIsManualBlitz(true)}
              onTouchEnd={() => setIsManualBlitz(false)}
              className={`w-full py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                isManualBlitz
                  ? 'bg-white text-black border-white shadow-[0_0_35px_rgba(255,255,255,1)] scale-[0.99]'
                  : 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 hover:from-amber-500/30 hover:to-violet-500/30 text-amber-200 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Tahan atau klik untuk menembakkan blitz kilat di atas panggung!"
            >
              <Zap className={`w-5 h-5 ${isManualBlitz ? 'text-amber-500 animate-spin' : 'text-amber-300'}`} />
              <span>
                {isManualBlitz ? '💥 BLITZ FLASH KELUAR! (MENYALA)' : '⚡ TEMBAK BLITZ / MANUAL FLASH (TAHAN / KLIK)'}
              </span>
            </button>
          </div>
        </section>

        {/* =================================================================
            4. DJ HARDWARE CONTROLS: PITCH, 5-BAND EQ, MASTER FADER
        ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-400" />
              <span>Panel Kontrol DJ Studio</span>
            </h2>
            <span className="text-xs text-white/50">Studio Equalizer & Pitch Hardware</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speed & Pitch */}
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

              {/* Quick Speeds */}
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

            {/* 5-Band Equalizer Mini */}
            <div className="md:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    5-Band Equalizer Studio
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

              <div className="text-[11px] text-white/50 text-center">
                Geser ke atas untuk dorongan (boost), ke bawah untuk potongan (cut).
              </div>
            </div>

            {/* Master Volume Fader */}
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

              <div className="flex items-center justify-center gap-4 py-1 flex-1">
                {/* Visual LED VU Meter */}
                <div className="flex flex-col justify-between h-28 w-2 py-0.5 bg-neutral-900 rounded border border-white/10">
                  {Array.from({ length: 8 }).map((_, i) => {
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

                {/* Vertical Slider */}
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
              5. BASS YANG LEBIH NENDANG & EFEK STUDIO INSTAN
          ================================================================= */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                  Bass Horeg & Efek Suara Panggung
                </span>
              </div>
              <span className="text-xs text-white/50">Dentuman Sub-Bass Khas Sound System Indo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* MEGA BASS HOREG (+12dB) */}
              <button
                type="button"
                onClick={handleSetMegaBassHoreg}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isHoregBass
                    ? 'bg-gradient-to-br from-amber-600 via-pink-600 to-fuchsia-600 text-white border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Mega Bass Horeg
                  </span>
                  <Flame
                    className={`w-4 h-4 ${
                      isHoregBass ? 'text-amber-200 animate-bounce' : 'text-amber-400/60'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/80">
                  +12dB 60Hz & +8dB 230Hz (Nendang!)
                </div>
                <div className="text-[10px] font-mono font-bold tracking-wider">
                  {isHoregBass ? '🔥 AKTIF (HOREG)' : 'NONAKTIF'}
                </div>
              </button>

              {/* SUB-BASS CLUB (+6dB) */}
              <button
                type="button"
                onClick={handleSetSubBassClub}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isSubBassClub
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Sub-Bass Club
                  </span>
                  <Activity
                    className={`w-4 h-4 ${
                      isSubBassClub ? 'text-cyan-300' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +6dB 60Hz & +4dB 230Hz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isSubBassClub ? 'AKTIF (CLUB)' : 'NONAKTIF'}
                </div>
              </button>

              {/* Vocal Boost (+4dB) */}
              <button
                type="button"
                onClick={handleToggleVocalBoost}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isVocalBoostActive
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Vocal Clarity
                  </span>
                  <Music
                    className={`w-4 h-4 ${
                      isVocalBoostActive ? 'text-white' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +4dB 910Hz & 3.6kHz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isVocalBoostActive ? 'AKTIF' : 'NONAKTIF'}
                </div>
              </button>

              {/* Treble Crisp or Reset Flat */}
              <button
                type="button"
                onClick={handleResetEq}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-left transition-all cursor-pointer flex flex-col justify-between h-28 active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider text-white/90">
                    Flat Studio
                  </span>
                  <RotateCcw className="w-4 h-4 text-white/60 group-hover:-rotate-90 transition-transform duration-300" />
                </div>
                <div className="text-[11px] text-white/60">
                  Kembalikan semua frekuensi ke 0 dB
                </div>
                <div className="text-[10px] font-mono text-cyan-300 font-semibold">
                  RESET FLAT
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* =================================================================
            6. PLAYLIST TABS: 12 DJ INDO VIRAL vs ANTREAN MUSIK
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
          {/* Tab Bar Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveListTab('dj-indo')}
                className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeListTab === 'dj-indo'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>🔥 12 DJ Indo Viral (Jedag Jedug)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveListTab('queue')}
                className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeListTab === 'queue'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <ListMusic className="w-4 h-4 text-violet-300" />
                <span>📋 Antrean Musik</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {queueTracks.length}
                </span>
              </button>
            </div>

            <span className="text-xs text-white/50">
              {activeListTab === 'dj-indo'
                ? 'Klik trek mana pun untuk langsung mix di deck!'
                : 'Daftar trek antrean musik aktif saat ini'}
            </span>
          </div>

          {/* TAB 1: 12 DJ INDO VIRAL TRACKS */}
          {activeListTab === 'dj-indo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
              {DJ_INDO_TRACKS.map((track, idx) => {
                const isSelected = track.id === currentTrack.id || track.title === currentTrack.title;
                const trackLiked = isTrackLiked(track.id);
                const trackBpm = DJ_TRACK_BPM[track.id] || 150;

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(track)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-violet-600/25 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.01]'
                        : 'bg-black/30 hover:bg-white/10 border-white/5 text-white/90'
                    }`}
                  >
                    {/* Left: Index + Cover + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 text-center font-mono text-xs text-white/50 shrink-0">
                        {isSelected && isPlaying ? (
                          <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : (
                          <span>#{idx + 1}</span>
                        )}
                      </div>

                      {/* Cover with DJ Vinyl Badge */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10 flex items-center justify-center">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Music className="w-5 h-5 text-white/40" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-violet-600/40 backdrop-blur-[1px] flex items-center justify-center">
                            <Disc3 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Title, Artist, Genre Badge */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-violet-300 font-bold' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                        </div>
                        <p className="text-xs text-white/60 truncate font-medium">
                          {track.artist}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {track.genre}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20">
                            {trackBpm} BPM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Duration, Like & Deck Button */}
                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
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
                        <Heart className={`w-4 h-4 ${trackLiked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTrack(track)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected && isPlaying
                            ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                            : 'bg-white/10 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {isSelected && isPlaying ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span>ON AIR</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>PUTAR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ACTIVE QUEUE TRACKS */}
          {activeListTab === 'queue' && (
            <div>
              {queueTracks.length === 0 ? (
                <div className="py-12 text-center text-white/50 text-sm">
                  Antrean trek DJ kosong. Pilih musik untuk dimasukkan ke antrean.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
