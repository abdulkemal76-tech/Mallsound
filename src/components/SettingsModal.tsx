import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Radio,
  Tv,
  Smartphone,
  Download,
  LogIn,
  LogOut,
  Upload,
  FolderPlus,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EQUALIZER_PRESETS } from '../types/music';
import { usePWAInstall } from '../hooks/usePWAInstall';

import { ThemeColorPicker } from './ThemeColorPicker';

type PlaybackEngineMode = 'hifi-eq' | 'yt-music';
type SettingsTab = 'audio' | 'general' | 'apk';

const EQ_BAND_LABELS = [
  { freq: 60, label: '60 Hz', sub: 'Sub' },
  { freq: 230, label: '230 Hz', sub: 'Bass' },
  { freq: 910, label: '910 Hz', sub: 'Mid' },
  { freq: 3600, label: '3.6 kHz', sub: 'Vokal' },
  { freq: 14000, label: '14 kHz', sub: 'Air' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  isDark: boolean;
  onToggleDark: () => void;
  accentColor?: string;
  onAccentColorChange?: (hex: string) => void;
  engineMode: PlaybackEngineMode;
  onSwitchEngineMode: (mode: PlaybackEngineMode) => void;
  eqGains: [number, number, number, number, number];
  activeEqPreset: string;
  onEqBandChange: (index: number, gain: number) => void;
  onApplyEqPreset: (presetId: string) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  sleepTimerMinutes: number | null;
  onSleepTimerChange: (mins: number | null) => void;
  user: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  authBannerError: string | null;
  onOpenUploadModal: () => void;
  onOpenCreatePlaylistModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'audio',
  isDark,
  onToggleDark,
  accentColor,
  onAccentColorChange,
  engineMode,
  onSwitchEngineMode,
  eqGains,
  activeEqPreset,
  onEqBandChange,
  onApplyEqPreset,
  playbackRate,
  onPlaybackRateChange,
  sleepTimerMinutes,
  onSleepTimerChange,
  user,
  onGoogleSignIn,
  onSignOut,
  authBannerError,
  onOpenUploadModal,
  onOpenCreatePlaylistModal,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { isInstallable, isInstalled, isAndroid, isIOS, promptInstall } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installNotice, setInstallNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined' && window.location.hostname.includes('mallz12.my.id')
      ? window.location.origin
      : 'https://mallz12.my.id';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=09090b&color=fbbf24&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleInstallWebApk = async () => {
    if (isInstallable) {
      const res = await promptInstall();
      if (res === 'accepted') {
        setInstallNotice('MallSound berhasil dipasang ke perangkat Anda!');
      }
      return;
    }
    setInstallNotice(
      isIOS
        ? 'Di Safari iPhone: Ketuk tombol Bagikan (Share) di bawah layar → pilih "Tambah ke Layar Utama".'
        : 'Di Chrome Android: Ketuk ikon titik tiga (⋮) di pojok kanan atas browser → pilih "Instal aplikasi".'
    );
  };

  const handleDownloadLauncher = () => {
    const a = document.createElement('a');
    a.href = `/api/download/mallsound-launcher?url=${encodeURIComponent(currentUrl)}`;
    a.download = 'MallSound-App-Launcher.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setInstallNotice('File Peluncur MallSound berhasil diunduh!');
  };

  const handleDownloadApkConfig = () => {
    const config = {
      appName: 'MallSound',
      packageId: 'id.mallsound.app',
      versionName: '2.5.0',
      hostUrl: currentUrl,
      manifestUrl: `${currentUrl}/manifest.webmanifest`,
      themeColor: '#09090b',
      backgroundColor: '#09090b',
      display: 'standalone',
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MallSound-APK-Config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallNotice('Konfigurasi APK Android berhasil diunduh!');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Pengaturan & Studio
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Tutup pengaturan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-6 pt-3">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
            {(
              [
                { id: 'audio', label: 'Audio & EQ' },
                { id: 'general', label: 'Umum & Akun' },
                { id: 'apk', label: 'Aplikasi / APK' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: AUDIO & EQUALIZER */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Engine Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  Mesin Pemutar Musik
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchEngineMode('yt-music')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      engineMode === 'yt-music'
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Tv className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Full Lagu (YT)</div>
                      <div className="text-[11px] opacity-75 truncate">Durasi Penuh</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchEngineMode('hifi-eq')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      engineMode === 'hifi-eq'
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Audio Hi-Fi + EQ</div>
                      <div className="text-[11px] opacity-75 truncate">DSP Equalizer</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 5-Band Equalizer */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    Equalizer 5-Band
                  </span>
                  <button
                    type="button"
                    onClick={() => onApplyEqPreset('flat')}
                    className="text-[11px] text-amber-500 hover:underline cursor-pointer"
                  >
                    Reset Flat
                  </button>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {EQUALIZER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyEqPreset(preset.id)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer truncate ${
                        activeEqPreset === preset.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold'
                          : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-amber-500/40'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* 5 Sliders */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {EQ_BAND_LABELS.map((band, idx) => (
                    <div key={band.freq} className="flex flex-col items-center space-y-2">
                      <span className="font-mono text-[11px] font-semibold text-amber-500 tabular-nums">
                        {eqGains[idx] > 0 ? `+${eqGains[idx]}` : eqGains[idx]}
                      </span>
                      <div className="h-28 flex items-center justify-center">
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={eqGains[idx]}
                          onChange={(e) => onEqBandChange(idx, Number(e.target.value))}
                          className="w-24 -rotate-90 accent-amber-500 cursor-pointer"
                          aria-label={band.label}
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-mono text-[10px] font-semibold text-slate-700 dark:text-zinc-300">
                          {band.label}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {band.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speed & Sleep Timer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    Kecepatan Audio
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
                    {[
                      { rate: 0.85, label: '0.85x' },
                      { rate: 1.0, label: '1.0x' },
                      { rate: 1.15, label: '1.15x' },
                    ].map((opt) => (
                      <button
                        key={opt.rate}
                        type="button"
                        onClick={() => onPlaybackRateChange(opt.rate)}
                        className={`py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                          playbackRate === opt.rate
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>Sleep Timer</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
                    {[
                      { min: null, label: 'Off' },
                      { min: 15, label: '15m' },
                      { min: 30, label: '30m' },
                      { min: 60, label: '60m' },
                    ].map((item) => (
                      <button
                        key={String(item.min)}
                        type="button"
                        onClick={() => onSleepTimerChange(item.min)}
                        className={`py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          sleepTimerMinutes === item.min
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UMUM & AKUN */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Tema Tampilan
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Ganti suasana layar gelap atau terang
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleDark}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 hover:border-amber-500 transition-colors cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Mode Terang</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-700" />
                      <span>Mode Gelap</span>
                    </>
                  )}
                </button>
              </div>

              {/* Theme Accent Color Customizer (Warna Bebas / Sesuka Hati) */}
              <ThemeColorPicker
                currentAccent={accentColor || '#8b5cf6'}
                onSelectAccent={onAccentColorChange || (() => {})}
              />

              {/* Quick Studio Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUploadModal();
                  }}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-amber-500 bg-slate-50/60 dark:bg-zinc-900/50 text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>Unggah Lagu Sendiri</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreatePlaylistModal();
                  }}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-amber-500 bg-slate-50/60 dark:bg-zinc-900/50 text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>Buat Playlist Baru</span>
                </button>
              </div>

              {/* Google Account Sync */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Sinkronisasi Awan (Playlist & Favorit)
                </div>

                {authBannerError && (
                  <div className="text-[11px] text-rose-500">{authBannerError}</div>
                )}

                {user ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.displayName || user.email}
                      </div>
                      <div className="text-[11px] text-emerald-500">Tersambung ke Awan</div>
                    </div>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk dengan Google</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: UNDUH APLIKASI / APK */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              {installNotice && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{installNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50">
                <div className="sm:col-span-7 space-y-2.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Pasang MallSound di HP & Desktop
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Pasang langsung sebagai aplikasi layar penuh (WebAPK) atau unduh peluncur
                    mandiri ke perangkat Anda.
                  </p>

                  <div className="space-y-2 pt-1">
                    {isInstalled ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sudah Terpasang</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInstallWebApk}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>
                          {isAndroid
                            ? 'Instal Aplikasi Android'
                            : isIOS
                            ? 'Pasang di iPhone'
                            : 'Pasang Aplikasi Sekarang'}
                        </span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadLauncher}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-amber-500 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        <span>Launcher App</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadApkConfig}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-amber-500 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        <span>Config APK</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code MallSound"
                    className="w-28 h-28 rounded-lg object-contain"
                  />
                  <span className="mt-1.5 text-[10px] text-zinc-400 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-amber-400" />
                    <span>Scan di HP</span>
                  </span>
                </div>
              </div>

              {/* Copy Link Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-700 dark:text-zinc-300"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
