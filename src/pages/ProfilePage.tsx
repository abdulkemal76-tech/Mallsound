import React from 'react';
import {
  User as UserIcon,
  LogIn,
  LogOut,
  Sliders,
  Gauge,
  Moon,
  Sun,
  Info,
  ExternalLink,
  ShieldCheck,
  Timer,
  Shuffle,
  Volume2,
  Sparkles,
  Smartphone,
  Music4,
} from 'lucide-react';
import { EQUALIZER_PRESETS } from '../types/music';

export interface ProfilePageProps {
  user: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  // EQ settings
  eqGains: [number, number, number, number, number];
  activeEqPreset: string;
  onEqBandChange: (idx: number, val: number) => void;
  onApplyEqPreset: (presetId: string) => void;
  // Playback settings
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  sleepTimerMinutes: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
  // Crossfade
  crossfadeSec: number;
  onCrossfadeChange: (sec: number) => void;
}

const EQ_BAND_METAS = [
  { label: '60 Hz', role: 'Sub-Bass' },
  { label: '230 Hz', role: 'Bass' },
  { label: '910 Hz', role: 'Vokal Mid' },
  { label: '3.6 kHz', role: 'Presence' },
  { label: '14 kHz', role: 'Air / Brilliance' },
];

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5];

const SLEEP_TIMER_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Mati', value: null },
  { label: '15 Menit', value: 15 },
  { label: '30 Menit', value: 30 },
  { label: '45 Menit', value: 45 },
  { label: '60 Menit', value: 60 },
];

const CROSSFADE_STEPS = [0, 3, 5, 8, 12];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onSignIn,
  onSignOut,
  isDark,
  onToggleTheme,
  eqGains,
  activeEqPreset,
  onEqBandChange,
  onApplyEqPreset,
  playbackRate,
  onPlaybackRateChange,
  sleepTimerMinutes,
  onSetSleepTimer,
  crossfadeSec,
  onCrossfadeChange,
}) => {
  return (
    <div className="space-y-6 pb-28 sm:pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-2">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-fuchsia-400" />
          Profil & Pengaturan
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Kelola akun, kalibrasi equalizer 5-band studio, dan sesuaikan preferensi pemutaranmu.
        </p>
      </div>

      {/* SECTION 1: User Profile Card */}
      <section className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Pengguna'}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-500/50 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-neutral-950 rounded-full"
                  title="Akun Aktif"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-display">
                    {user.displayName || 'Pengguna MallSound'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <ShieldCheck className="w-3 h-3 text-violet-400" />
                    Terverifikasi
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5">{user.email}</p>
                <p className="text-[11px] text-fuchsia-400/90 font-medium mt-1">
                  Playlist & favorit tersinkronisasi otomatis ke cloud.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 transition-all hover:scale-[1.02]"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-inner shrink-0">
                <UserIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Masuk ke MallSound Cloud
                </h3>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 max-w-md">
                  Sinkronkan playlist favorit, riwayat dengar, dan lagu kustom kamu di semua
                  perangkat secara instan dengan akun Google.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 transition-all hover:scale-[1.02] shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2: Equalizer Studio */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Studio Equalizer (5-Band)
              </h2>
              <p className="text-xs text-white/60">
                Pengolah suara Web Audio API fidelitas tinggi dengan respons biquad filter.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-1 rounded-lg border border-fuchsia-500/20 self-start sm:self-auto">
            Mode Preset: {activeEqPreset.toUpperCase()}
          </span>
        </div>

        {/* Preset Buttons Row */}
        <div>
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-2.5">
            Pilihan Preset EQ
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {EQUALIZER_PRESETS.map((preset) => {
              const isSelected = activeEqPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyEqPreset(preset.id)}
                  className={`p-3 rounded-xl text-left border transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-pink-500/30 border-fuchsia-500 text-white shadow-md shadow-fuchsia-500/10'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  <p className="text-xs sm:text-sm font-semibold truncate">{preset.name}</p>
                  <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Vertical Slider Interface */}
        <div className="bg-neutral-950/60 rounded-2xl p-4 sm:p-6 border border-white/5">
          <div className="flex items-center justify-between text-xs text-white/40 mb-4 px-2">
            <span>+12 dB</span>
            <span className="text-white/30 font-mono text-[11px]">Rentang Frekuensi Audio</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end justify-items-center">
            {eqGains.map((gain, idx) => {
              const meta = EQ_BAND_METAS[idx] || { label: `Band ${idx + 1}`, role: 'Audio' };
              const formattedGain = gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1);

              return (
                <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                  {/* Gain readout */}
                  <span
                    className={`text-[11px] sm:text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                      gain > 0
                        ? 'text-fuchsia-300 bg-fuchsia-500/10'
                        : gain < 0
                        ? 'text-violet-300 bg-violet-500/10'
                        : 'text-white/50 bg-white/5'
                    }`}
                  >
                    {formattedGain}
                  </span>

                  {/* Vertical Slider Track Container */}
                  <div className="relative h-40 sm:h-48 w-8 sm:w-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center p-1 group">
                    {/* Zero center tick */}
                    <div className="absolute top-1/2 left-1 right-1 h-[1px] bg-white/20 pointer-events-none" />

                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={0.5}
                      value={gain}
                      onChange={(e) => onEqBandChange(idx, parseFloat(e.target.value))}
                      className="w-36 sm:w-44 h-2 -rotate-90 origin-center accent-fuchsia-500 cursor-pointer bg-transparent"
                      title={`${meta.label}: ${formattedGain} dB`}
                    />
                  </div>

                  {/* Band Frequency & Role */}
                  <div className="text-center mt-1">
                    <p className="text-xs sm:text-sm font-bold text-white font-mono">
                      {meta.label}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">{meta.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Playback Settings */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Pengaturan Pemutaran</h2>
            <p className="text-xs text-white/60">
              Konfigurasi kecepatan pemutar, pengatur waktu tidur otomatis, dan efek transisi lagu.
            </p>
          </div>
        </div>

        {/* 1. Playback Speed */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
              Kecepatan Pemutaran (Playback Rate)
            </span>
            <span className="text-xs font-mono text-fuchsia-400 font-bold">
              {playbackRate.toFixed(2)}x
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PLAYBACK_SPEEDS.map((speed) => {
              const isActive = playbackRate === speed;
              return (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onPlaybackRateChange(speed)}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  {speed}x
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sleep Timer */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 uppercase tracking-wider">
              <Timer className="w-4 h-4 text-violet-400" />
              <span>Pengatur Waktu Tidur (Sleep Timer)</span>
            </div>
            <span className="text-xs font-mono text-fuchsia-400 font-bold">
              {sleepTimerMinutes ? `${sleepTimerMinutes} menit aktif` : 'Nonaktif'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SLEEP_TIMER_OPTIONS.map((opt) => {
              const isActive = sleepTimerMinutes === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onSetSleepTimer(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Crossfade */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/70 uppercase tracking-wider">
              <Shuffle className="w-4 h-4 text-pink-400" />
              <span>Crossfade Transisi Antar Lagu</span>
            </div>
            <span className="text-xs font-mono text-pink-400 font-bold">
              {crossfadeSec > 0 ? `${crossfadeSec} detik` : 'Mati (0s)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {CROSSFADE_STEPS.map((step) => {
              const isActive = crossfadeSec === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onCrossfadeChange(step)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-pink-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  {step === 0 ? '0s' : `${step}s`}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-white/40">
            Menggabungkan akhir lagu dengan awal lagu berikutnya untuk transisi tanpa jeda sunyi.
          </p>
        </div>
      </section>

      {/* SECTION 4: Theme & Appearance */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Tampilan Antarmuka</h3>
              <p className="text-xs text-white/60">
                Mode saat ini: {isDark ? 'Tema Gelap (OLED Black)' : 'Tema Terang'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-amber-500'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-neutral-900" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-600" />
              )}
            </span>
          </button>
        </div>
      </section>

      {/* SECTION 5: About MallSound */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Tentang MallSound</h3>
              <p className="text-xs text-white/60">Versi 2.0 • Audio Streaming PWA</p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            v2.0 Stabil
          </span>
        </div>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          MallSound v2.0 dirancang dengan arsitektur audio modern berdaya Web Audio API, katalog
          resmi musisi Indonesia, sinkronisasi cloud real-time Firebase, serta integrasi pemutaran
          lagu penuh dari platform YouTube Music dan Spotify.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50 border-t border-white/5">
          <span>Dibuat dengan dedikasi penuh untuk penikmat musik tanah air.</span>
          <a
            href="https://mallz12.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium self-start sm:self-auto"
          >
            <span>Kunjungi mallz12.my.id</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
};
