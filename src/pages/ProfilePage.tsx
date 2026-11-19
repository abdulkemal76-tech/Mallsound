import React, { useState } from 'react';
import {
  Sliders,
  Gauge,
  Moon,
  Sun,
  ExternalLink,
  Timer,
  Shuffle,
  Volume2,
  Sparkles,
  Palette,
  Globe,
  Info,
  Download,
  Smartphone,
  Plus,
} from 'lucide-react';
import { EQUALIZER_PRESETS } from '../types/music';
import { ThemeColorPicker } from '../components/ThemeColorPicker';
import { ThemeMode, getThemeConfig } from '../theme/themeConfig';
import { usePWAInstall } from '../hooks/usePWAInstall';

export interface ProfilePageProps {
  user?: { displayName: string | null; email: string | null; photoURL: string | null } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  accentColor?: string;
  onAccentColorChange?: (hex: string) => void;
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
  { label: '5 Menit', value: 5 },
  { label: '15 Menit', value: 15 },
  { label: '30 Menit', value: 30 },
  { label: '45 Menit', value: 45 },
  { label: '60 Menit', value: 60 },
];

const CROSSFADE_STEPS = [0, 3, 5, 8, 12];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  isDark,
  onToggleTheme,
  currentTheme,
  onSelectTheme,
  accentColor,
  onAccentColorChange,
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
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleAddShortcut = async () => {
    if (isInstallable) {
      const res = await promptInstall();
      if (res !== 'accepted') {
        setShowInstallGuide((prev) => !prev);
      }
    } else {
      setShowInstallGuide((prev) => !prev);
    }
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-24 max-w-4xl mx-auto px-4 sm:px-6 pt-2">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
          <Palette className="w-6 h-6 text-fuchsia-400" />
          Tema & Pengaturan Studio
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Sesuaikan tema visual antarmuka, kalibrasi equalizer 5-band studio, dan atur preferensi pemutaranmu.
        </p>
      </div>

      {/* SECTION 1: Theme & Appearance */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">Tampilan Antarmuka</h2>
              <p className="text-xs text-white/60">
                Mode saat ini: {currentTheme ? getThemeConfig(currentTheme).name : isDark ? 'Tema Gelap' : 'Tema Terang'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-amber-500'
            }`}
            title="Ganti Tema Terang/Gelap"
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

        {/* Dynamic Theme Color Customizer */}
        <div>
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">
            Pilihan Warna Aksen & Preset Tema
          </h3>
          <ThemeColorPicker
            currentAccent={accentColor || '#8b5cf6'}
            onSelectAccent={onAccentColorChange || (() => {})}
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />
        </div>
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
                Kalibrasi respon frekuensi perangkatmu secara instan
              </p>
            </div>
          </div>

          {/* Active Preset Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-white/50">Preset:</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
              {EQUALIZER_PRESETS.find((p) => p.id === activeEqPreset)?.name || 'Kustom'}
            </span>
          </div>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {EQUALIZER_PRESETS.map((preset) => {
            const isActive = activeEqPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyEqPreset(preset.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* 5-Band Vertical Sliders */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-3 pb-1">
          {EQ_BAND_METAS.map((meta, idx) => {
            const gainVal = eqGains[idx] ?? 0;
            return (
              <div
                key={meta.label}
                className="flex flex-col items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 transition-all group"
              >
                {/* Gain value badge */}
                <span
                  className={`text-[11px] font-mono font-bold mb-3 ${
                    gainVal > 0
                      ? 'text-fuchsia-400'
                      : gainVal < 0
                      ? 'text-violet-400'
                      : 'text-white/50'
                  }`}
                >
                  {gainVal > 0 ? `+${gainVal}` : gainVal} dB
                </span>

                {/* Vertical Range Slider */}
                <div className="h-32 sm:h-36 flex items-center justify-center my-1 relative">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gainVal}
                    onChange={(e) => onEqBandChange(idx, Number(e.target.value))}
                    aria-label={`Gain band ${meta.label}`}
                    style={{
                      writingMode: 'vertical-lr',
                      direction: 'rtl',
                      appearance: 'slider-vertical',
                      WebkitAppearance: 'slider-vertical',
                    }}
                    className="w-4 h-full accent-fuchsia-500 cursor-pointer"
                  />
                </div>

                {/* Band frequency label */}
                <span className="text-xs font-bold text-white mt-3 font-display">
                  {meta.label}
                </span>
                <span className="text-[10px] text-white/50 text-center leading-tight">
                  {meta.role}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Playback Preferences */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-display">Preferensi Pemutaran</h2>
            <p className="text-xs text-white/60">
              Pengatur kecepatan audio, waktu tidur otomatis, dan transisi lagu
            </p>
          </div>
        </div>

        {/* 1. Kecepatan Putar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-white/90 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-violet-400" />
              <span>Kecepatan Pemutaran Audio</span>
            </label>
            <span className="text-xs font-mono font-bold text-violet-300">
              {playbackRate}x
            </span>
          </div>

          <div className="flex items-center gap-2">
            {PLAYBACK_SPEEDS.map((speed) => {
              const isActive = playbackRate === speed;
              return (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onPlaybackRateChange(speed)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
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
            <label className="text-xs sm:text-sm font-semibold text-white/90 flex items-center gap-2">
              <Timer className="w-4 h-4 text-fuchsia-400" />
              <span>Pengatur Waktu Tidur (Sleep Timer)</span>
            </label>
            <span className="text-xs font-mono font-bold text-fuchsia-300">
              {sleepTimerMinutes !== null ? `${sleepTimerMinutes} menit tersisa` : 'Mati'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SLEEP_TIMER_OPTIONS.map((opt) => {
              const isActive = sleepTimerMinutes === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onSetSleepTimer(opt.value)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-white/40">
            Audio akan memudar dan berhenti otomatis saat penghitung waktu habis.
          </p>
        </div>

        {/* 3. Crossfade Transisi */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-semibold text-white/90 flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-pink-400" />
              <span>Transisi Antar Lagu (Crossfade)</span>
            </label>
            <span className="text-xs font-mono font-bold text-pink-300">
              {crossfadeSec} detik
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

      {/* SECTION 4: Latar Belakang Tips */}
      <section className="rounded-2xl border backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4 bg-sky-500/10 border-sky-500/30">
        <div className="flex items-center gap-2.5 pb-2 border-b border-sky-500/20">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Putar Musik di Latar Belakang</h3>
            <p className="text-xs text-sky-300/80">Cara agar MallSound tetap berbunyi saat layar tertutup</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white/80 leading-relaxed">
            Browser bawaan Android menghentikan audio saat kamu beralih ke aplikasi lain.
            Gunakan browser yang mendukung <span className="font-semibold text-sky-300">pemutaran latar belakang</span> supaya musik terus mengalir meski layar mati.
          </p>
        </div>

        {/* Browser Steps */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Cara Pakai:</p>
          <ol className="list-none space-y-2">
            {[
              'Unduh salah satu browser di bawah ini',
              'Buka mallz12.my.id melalui browser tersebut',
              'Putar lagu, lalu minimalkan atau kunci layar — musik tetap jalan!',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-white/75">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500/30 text-sky-300 font-bold text-[10px] flex items-center justify-center border border-sky-500/40">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Download Browser Buttons */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Browser yang Disarankan:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                name: 'Lemur Browser',
                sub: 'Mendukung putar latar belakang',
                url: 'https://play.google.com/store/search?q=lemur+browser&c=apps',
                color: 'from-sky-500 to-cyan-500',
                shadow: 'shadow-cyan-500/25',
              },
              {
                name: 'Brave Browser',
                sub: 'Privat & bebas iklan',
                url: 'https://play.google.com/store/apps/details?id=com.brave.browser',
                color: 'from-orange-500 to-amber-500',
                shadow: 'shadow-orange-500/25',
              },
              {
                name: 'Kiwi Browser',
                sub: 'Mendukung ekstensi Chrome',
                url: 'https://play.google.com/store/apps/details?id=com.kiwibrowser.browser',
                color: 'from-green-500 to-emerald-500',
                shadow: 'shadow-green-500/25',
              },
            ].map((browser) => (
              <a
                key={browser.name}
                href={browser.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r ${browser.color} ${browser.shadow} shadow-md text-white hover:opacity-90 active:opacity-80 transition-all`}
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight truncate">{browser.name}</p>
                  <p className="text-[10px] opacity-80 leading-tight truncate">{browser.sub}</p>
                </div>
                <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0 opacity-70" />
              </a>
            ))}
          </div>
        </div>

        {/* APK Pintasan MallSound Langsung Pasang (33 KB) */}
        <div className="pt-2 border-t border-sky-500/20 space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            APK Pintasan MallSound (Langsung Pasang):
          </p>

          <a
            href="/MallSound-Pintasan.apk"
            download="MallSound-Pintasan.apk"
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-emerald-700/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/50 text-white transition-all group shadow-lg shadow-emerald-950/20"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    Download APK Pintasan MallSound
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-mono font-bold">
                    33 KB • Langsung Instal
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/80 truncate">
                  File APK shortcut super ringan (33 KB) &bull; Solusi jika pintasan browser tidak muncul di HP
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs flex-shrink-0 group-hover:bg-emerald-400 transition-colors shadow-md">
              <Download className="w-3.5 h-3.5" />
              <span>Unduh APK (33 KB)</span>
            </div>
          </a>

          {/* Opsi Pintasan Browser Cepat */}
          <button
            type="button"
            onClick={handleAddShortcut}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <span className="text-[11px]">Atau coba tambah pintasan lewat menu browser HP</span>
            <span className="text-sky-400 font-semibold text-[11px] flex items-center gap-1">
              Petunjuk Browser <Info className="w-3 h-3" />
            </span>
          </button>

          {showInstallGuide && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs text-white/90">
              <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Cara Pasang Pintasan di Lemur Browser / Chrome:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-white/80 text-[11px]">
                <li>
                  Ketuk tombol <b>Menu Titik Tiga (⋮)</b> di sudut browser kamu.
                </li>
                <li>
                  Pilih opsi <b>&quot;Tambahkan ke Layar Utama&quot; (Add to Home screen)</b> atau <b>&quot;Pasang Aplikasi&quot;</b>.
                </li>
                <li>
                  Tekan <b>Tambah / Add</b>. Ikon pintasan MallSound akan langsung aktif di layar utama HP kamu!
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Open Shortcut */}
        <div className="pt-1 border-t border-sky-500/20">
          <a
            href="https://mallz12.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-all"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            Buka MallSound di Tab Baru
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          <p className="text-[10px] text-white/40 mt-1.5">Salin link ini ke browser yang sudah kamu unduh.</p>
        </div>
      </section>

      {/* SECTION 5: About MallSound */}
      <section className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Tentang MallSound</h3>
              <p className="text-xs text-white/60">Audio Streaming Studio</p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Versi Web Stabil
          </span>
        </div>

        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          MallSound dirancang dengan arsitektur audio modern berdaya Web Audio API, katalog
          musisi terpopuler, equalizer 5-band studio presisi, dan pengalaman audio mulus di peramban web favoritmu.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/50 border-t border-white/5">
          <span>Dibuat dengan dedikasi penuh untuk penikmat musik tanah air.</span>
          <a
            href="https://mallz12.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium self-start sm:self-auto"
          >
            <span>mallz12.my.id</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
};
