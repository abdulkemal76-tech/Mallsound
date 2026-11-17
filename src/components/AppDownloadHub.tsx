import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  WifiOff,
  Sparkles,
  FileCode,
  ShieldCheck,
  QrCode,
  X,
  Info,
  Terminal,
  Rocket,
} from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

const DEV_APP_URL =
  'https://ais-dev-6xww342i4pkuyodnppwpn6-190489516406.asia-southeast1.run.app';
const SHARED_APP_URL =
  'https://ais-pre-6xww342i4pkuyodnppwpn6-190489516406.asia-southeast1.run.app';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline Aktif — Memutar dari Cache Lokal MallSound</span>
    </div>
  );
};

export const AppDownloadHub: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [customDomainUrl, setCustomDomainUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : DEV_APP_URL
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [showManualInstallModal, setShowManualInstallModal] = useState(false);
  const [showApkBuilderModal, setShowApkBuilderModal] = useState(false);

  const activeUrl = customDomainUrl.trim() || DEV_APP_URL;

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=09090b&color=fbbf24&data=${encodeURIComponent(
    activeUrl
  )}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(activeUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleInstantInstall = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        setInstallFeedback('MallSound berhasil dipasang ke perangkat Anda!');
      }
      return;
    }
    setShowManualInstallModal(true);
  };

  const handleDownloadStandaloneLauncher = () => {
    const a = document.createElement('a');
    a.href = `/api/download/mallsound-launcher?url=${encodeURIComponent(activeUrl)}`;
    a.download = 'MallSound-App-Launcher.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setInstallFeedback(
      'File Peluncur MallSound (MallSound-App-Launcher.html) berhasil diunduh ke perangkat Anda!'
    );
  };

  const handleDownloadApkKit = () => {
    const kit = {
      appName: 'MallSound',
      packageId: 'id.mallsound.app',
      versionName: '2.4.0',
      versionCode: 24,
      hostUrl: activeUrl,
      manifestUrl: `${activeUrl}/manifest.webmanifest`,
      themeColor: '#09090b',
      backgroundColor: '#09090b',
      display: 'standalone',
      orientation: 'portrait',
      capacitorConfig: {
        appId: 'id.mallsound.app',
        appName: 'MallSound',
        webDir: 'dist',
        server: {
          url: activeUrl,
          cleartext: false,
        },
      },
      twaManifest: {
        packageId: 'id.mallsound.app',
        host: activeUrl.replace(/^https?:\/\//, ''),
        name: 'MallSound',
        launcherName: 'MallSound',
        display: 'standalone',
        themeColor: '#09090b',
        navigationColor: '#09090b',
        backgroundColor: '#09090b',
        enableNotifications: true,
        startUrl: '/',
        iconUrl: `${activeUrl}/pwa-512x512.png`,
        maskableIconUrl: `${activeUrl}/pwa-maskable-512x512.png`,
      },
    };

    const blob = new Blob([JSON.stringify(kit, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MallSound-Android-APK-Kit.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallFeedback('Paket Konfigurasi APK Android (MallSound-Android-APK-Kit.json) berhasil diunduh!');
  };

  const capacitorBuildCommands = `# 1. Buat folder pembungkus APK Android MallSound
mkdir mallsound-apk && cd mallsound-apk
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inisialisasi APK dengan URL Web MallSound Anda
npx cap init "MallSound" "id.mallsound.app" --web-dir=www
mkdir www && echo '<meta http-equiv="refresh" content="0;url=${activeUrl}">' > www/index.html

# 3. Tambahkan platform Android & Compile file MallSound.apk
npx cap add android
cd android && ./gradlew assembleDebug
# File siap diambil di: android/app/build/outputs/apk/debug/app-debug.apk`;

  const handleCopyBuildScript = async () => {
    try {
      await navigator.clipboard.writeText(capacitorBuildCommands);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <section className="space-y-6">
      {/* Important Notice about AI Studio Share / Deploy Button so user never sees "Page not found" */}
      <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs leading-relaxed">
          <div className="font-bold text-slate-900 dark:text-amber-300">
            Penting: Mengapa link publik sebelumnya tertulis "Page not found"?
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            Di Google AI Studio, link publik (<code className="font-mono">{SHARED_APP_URL}</code>)
            baru akan aktif <strong>setelah Anda menekan tombol "Share" / "Deploy"</strong> (ikon
            bagikan/roket di pojok kanan atas layar AI Studio). Sebelum tombol Share ditekan,
            gunakan <strong>URL Aktif Saat Ini</strong> di bawah atau tekan tombol{' '}
            <strong>Deploy / Share</strong> di kanan atas agar bisa diakses siapa saja tanpa login.
          </p>
        </div>
      </div>

      {/* Hero Banner — Gaya dengr.lentera.fun */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>MallSound v2.4 · Web App & Android APK Ready</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Pusat Unduhan Resmi MallSound — Web Player & Aplikasi Android
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Nikmati pengalaman musik penuh ala <em>dengr.lentera.fun</em>. Anda dapat langsung
              memasang <strong>MallSound WebAPK</strong> ke layar utama HP Android/iOS, mengunduh{' '}
              <strong>Peluncur Aplikasi Mandiri</strong>, atau merakit file{' '}
              <code className="text-amber-300 font-mono">MallSound.apk</code> untuk dibagikan.
            </p>

            {installFeedback && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{installFeedback}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplikasi MallSound Sudah Terpasang di Perangkat Ini</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstantInstall}
                  className="inline-flex items-center gap-2.5 px-5 py-3 text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {isAndroid
                      ? 'Pasang Aplikasi Android (WebAPK)'
                      : isIOS
                      ? 'Pasang di Layar Utama iPhone'
                      : 'Pasang Aplikasi MallSound (WebAPK)'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadStandaloneLauncher}
                className="inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh File Launcher Aplikasi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApkBuilderModal(true)}
                className="inline-flex items-center gap-2 px-4 py-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-900 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>Cetak File .APK Android</span>
              </button>
            </div>
          </div>

          {/* Right QR Code Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center space-y-3 shadow-lg max-w-xs w-full">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <QrCode className="w-4 h-4" />
                <span>Scan QR untuk Buka di HP</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-slate-800">
                <img
                  src={qrCodeImageUrl}
                  alt="QR Code MallSound"
                  className="w-40 h-40 rounded-lg object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Otomatis mengikuti URL aplikasi di bawah ini agar dapat di-scan dari kamera HP.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configurable Active URL / Domain Bar */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Globe className="w-4 h-4 shrink-0" />
            <span>Alamat Web MallSound (Bisa Diganti dengan Domain Anda Sendiri)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() =>
                setCustomDomainUrl(
                  typeof window !== 'undefined' ? window.location.origin : DEV_APP_URL
                )
              }
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
            >
              Gunakan URL Saat Ini
            </button>
            <button
              type="button"
              onClick={() => setCustomDomainUrl(SHARED_APP_URL)}
              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-500 cursor-pointer"
            >
              Gunakan URL Publik (Setelah Share)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            value={customDomainUrl}
            onChange={(e) => setCustomDomainUrl(e.target.value)}
            placeholder="https://mallsound.domainkamu.com"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tautan Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Langkah Mudah Seperti dengr.lentera.fun */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Publish to Web */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Rocket className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Langkah 1: Aktifkan Link Publik (Agar Tidak 404)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Agar aplikasi <strong>MallSound</strong> bisa dibuka oleh semua orang di HP mereka
              tanpa "Page not found":
            </p>
            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
              <li>
                Klik tombol <strong>Share / Deploy</strong> di pojok kanan atas Google AI Studio
                (atau deploy ke Cloud Run / Vercel).
              </li>
              <li>
                Atau hubungkan ke domain sendiri (contoh:{' '}
                <code className="font-mono">mallsound.my.id</code>).
              </li>
            </ol>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Server Full-Stack Siap Deploy</span>
            </span>
          </div>
        </div>

        {/* Step 2: Install WebAPK */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Langkah 2: Pasang WebAPK Langsung dari Browser HP
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sama persis seperti <strong>dengr.lentera.fun</strong>, pengguna yang membuka link
              MallSound di Chrome Android cukup mengetuk <strong>Instal Aplikasi</strong>. Android
              akan otomatis merakit APK di HP mereka (muncul di daftar aplikasi & layar penuh tanpa
              URL bar).
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowManualInstallModal(true)}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              Panduan Pasang di Android & iOS →
            </button>
          </div>
        </div>

        {/* Step 3: Build .APK File */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Langkah 3: Cetak File <code className="font-mono text-amber-500">MallSound.apk</code>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ingin membagikan file mentah <code className="font-mono">MallSound.apk</code> di grup
              WhatsApp atau tombol download website? Gunakan generator konfigurasi APK kami di bawah
              ini.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowApkBuilderModal(true)}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
            >
              Buka Generator File .APK →
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Panduan Instalasi Langsung di Android & iOS */}
      {showManualInstallModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowManualInstallModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                Cara Pasang Aplikasi MallSound di HP
              </h3>
              <button
                type="button"
                onClick={() => setShowManualInstallModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-amber-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>HP Android (Chrome / Samsung Internet / Edge)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Buka alamat web <strong>MallSound</strong> di tab browser Chrome HP Anda (bukan
                    di dalam preview frame).
                  </li>
                  <li>
                    Ketuk ikon <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome.
                  </li>
                  <li>
                    Pilih <strong>"Instal aplikasi" (Install app)</strong> atau{' '}
                    <strong>"Tambahkan ke Layar utama"</strong>.
                  </li>
                  <li>
                    Android otomatis memasang <strong>MallSound</strong> sebagai aplikasi mandiri!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-amber-400 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>iPhone & iPad (Safari iOS)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Buka alamat web <strong>MallSound</strong> di browser <strong>Safari</strong>.
                  </li>
                  <li>
                    Ketuk ikon <strong>Bagikan (Share)</strong> di bagian bawah layar.
                  </li>
                  <li>
                    Pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadStandaloneLauncher}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer"
              >
                Unduh File Launcher (.html)
              </button>
              <button
                type="button"
                onClick={() => setShowManualInstallModal(false)}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: In-App Android .APK Generator Wizard (No broken external 404 links!) */}
      {showApkBuilderModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowApkBuilderModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">
                Generator File <code className="font-mono text-amber-400">MallSound.apk</code>
              </h3>
              <button
                type="button"
                onClick={() => setShowApkBuilderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Aplikasi <strong>MallSound</strong> sudah memiliki manifest resmi{' '}
                <code className="font-mono text-amber-300">/manifest.webmanifest</code> dan ikon
                standar Android. Ada 2 cara paling mudah untuk mencetak file{' '}
                <code className="font-mono text-amber-300">.apk</code> setelah Anda menekan tombol{' '}
                <strong>Share / Deploy</strong>:
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="font-semibold text-amber-400">
                  Opsi A: Tanpa Koding (Menggunakan WebIntoApp / PWABuilder)
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    Pastikan aplikasi sudah di-<strong>Share / Deploy</strong> agar link publiknya
                    bisa diakses umum.
                  </li>
                  <li>
                    Salin URL publik MallSound Anda:{' '}
                    <code className="font-mono text-amber-300 break-all">{activeUrl}</code>
                  </li>
                  <li>
                    Masukkan URL tersebut di layanan konversi URL-ke-APK gratis seperti{' '}
                    <strong>webintoapp.com</strong> atau <strong>pwabuilder.com</strong>, lalu
                    unduh file <code className="font-mono">MallSound.apk</code>.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400">
                    Opsi B: Build APK Murni via Capacitor CLI
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyBuildScript}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black/80 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {capacitorBuildCommands}
                </pre>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleDownloadApkKit}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Konfigurasi APK (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowApkBuilderModal(false)}
                className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
