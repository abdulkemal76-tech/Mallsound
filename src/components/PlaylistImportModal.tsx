import React, { useState, useMemo } from 'react';
import {
  Link as LinkIcon,
  Loader2,
  Music,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Youtube,
  CheckCircle2,
  Disc,
} from 'lucide-react';
import { Track } from '../types/music';

export interface PlaylistImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (tracks: Track[], playlistTitle: string) => void;
}

type PlatformType = 'spotify' | 'ytmusic' | 'youtube' | 'youtube-video' | 'unknown';

function detectPlatform(url: string): PlatformType {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('open.spotify.com/playlist/')) {
    return 'spotify';
  }
  // YouTube Music: terima /playlist DAN /watch yang membawa ?list=...
  // (link yang dibagikan dari aplikasi YT Music sering berupa watch URL).
  if (trimmed.includes('music.youtube.com/playlist')) {
    return 'ytmusic';
  }
  if (trimmed.includes('music.youtube.com/watch') && /[?&]list=/.test(trimmed)) {
    return 'ytmusic';
  }
  if (trimmed.includes('youtube.com/playlist')) {
    return 'youtube';
  }
  if (trimmed.includes('youtube.com/watch') && /[?&]list=/.test(trimmed)) {
    return 'youtube';
  }
  // v86 — VIDEO SATUAN (tanpa ?list=): satu lagu dari link video YouTube.
  if (
    (trimmed.includes('youtube.com/watch') ||
      trimmed.includes('music.youtube.com/watch')) &&
    /[?&]v=[a-zA-Z0-9_-]{11}/.test(trimmed)
  ) {
    return 'youtube-video';
  }
  if (
    trimmed.includes('youtu.be/') ||
    /youtube\.com\/(shorts|embed|v)\//.test(trimmed)
  ) {
    return 'youtube-video';
  }
  return 'unknown';
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const PlaylistImportModal: React.FC<PlaylistImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success preview state
  const [importedTracks, setImportedTracks] = useState<Track[] | null>(null);
  const [playlistTitle, setPlaylistTitle] = useState('');

  const detectedPlatform = useMemo(() => detectPlatform(url), [url]);

  if (!isOpen) return null;

  const handleReset = () => {
    setUrl('');
    setIsLoading(false);
    setErrorMessage(null);
    setImportedTracks(null);
    setPlaylistTitle('');
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setErrorMessage('Silakan tempel (paste) URL playlist terlebih dahulu.');
      return;
    }

    if (detectedPlatform === 'unknown') {
      setErrorMessage(
        'Format URL tidak dikenali. Masukkan link playlist dari Spotify atau YouTube / YouTube Music — atau link SATU video YouTube (youtube.com/watch?v=... / youtu.be/...).'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = `/api/playlist/import?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        let errDetail = 'Gagal mengimpor playlist. Pastikan playlist bersifat publik.';
        try {
          const errJson = await response.json();
          if (errJson.error || errJson.message) {
            errDetail = errJson.error || errJson.message;
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errDetail);
      }

      const data = await response.json();
      const tracks: Track[] = Array.isArray(data.tracks) ? data.tracks : [];
      const title =
        String(data.title || data.playlistTitle || '').trim() ||
        (detectedPlatform === 'spotify'
          ? 'Playlist Impor Spotify'
          : detectedPlatform === 'youtube-video'
            ? 'Lagu Impor'
            : 'Playlist Impor YouTube Music');

      if (tracks.length === 0) {
        throw new Error(
          'Tidak ada lagu yang ditemukan di dalam playlist ini. Pastikan playlist tidak kosong dan bersifat publik.'
        );
      }

      setImportedTracks(tracks);
      setPlaylistTitle(title);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengimpor playlist. Periksa kembali tautan dan koneksi internetmu.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToCollection = () => {
    if (!importedTracks || importedTracks.length === 0) return;
    const finalTitle = playlistTitle.trim() || 'Playlist Impor Baru';
    onImportComplete(importedTracks, finalTitle);
    handleModalClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">Import Playlist / Lagu</h2>
              <p className="text-xs text-white/60">
                Impor playlist dari Spotify atau YouTube Music — atau SATU lagu dari link video YouTube
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {!importedTracks ? (
            /* STEP 1: URL Input & Platform Detection */
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">
                  Tautan Playlist / Video (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Paste link playlist… atau link 1 video YouTube (watch?v=… / youtu.be/…)"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Detected Platform Indicator */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-white/40">Platform Terdeteksi:</span>
                <div>
                  {detectedPlatform === 'spotify' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Spotify Playlist
                    </span>
                  )}
                  {detectedPlatform === 'ytmusic' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      <Youtube className="w-3.5 h-3.5" />
                      YouTube Music
                    </span>
                  )}
                  {detectedPlatform === 'youtube' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      <Youtube className="w-3.5 h-3.5" />
                      YouTube Playlist
                    </span>
                  )}
                  {detectedPlatform === 'youtube-video' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30">
                      <Youtube className="w-3.5 h-3.5" />
                      Satu Video YouTube
                    </span>
                  )}
                  {detectedPlatform === 'unknown' && (
                    <span className="text-white/30 italic">
                      {url.trim() ? 'Platform tidak didukung' : 'Menunggu tautan...'}
                    </span>
                  )}
                </div>
              </div>

              {/* URL Pattern Guidelines */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs text-white/50">
                <p className="font-semibold text-white/70 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                  Format yang didukung:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  <li>
                    <span className="text-white/70 font-mono">open.spotify.com/playlist/...</span>
                  </li>
                  <li>
                    <span className="text-white/70 font-mono">music.youtube.com/playlist?list=...</span>
                  </li>
                  <li>
                    <span className="text-white/70 font-mono">youtube.com/playlist?list=...</span>
                  </li>
                  <li>
                    <span className="text-white/70 font-mono">youtube.com/watch?v=... / youtu.be/... (1 lagu)</span>
                  </li>
                </ul>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {detectedPlatform === 'youtube-video'
                          ? 'Mengimpor Lagu...'
                          : 'Mengimpor Playlist...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Mulai Impor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Preview & Confirmation */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Berhasil mengimpor <strong>{importedTracks.length} lagu</strong>!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportedTracks(null)}
                  className="text-xs text-emerald-400 underline hover:text-emerald-300"
                >
                  Impor Ulang
                </button>
              </div>

              {/* Editable Playlist Title */}
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1.5">
                  Judul Playlist Baru
                </label>
                <input
                  type="text"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Beri nama playlist..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Scrollable Track Preview */}
              <div>
                <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                  <span>Pratinjau Lagu</span>
                  <span>{importedTracks.length} trek</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 rounded-xl">
                  {importedTracks.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 text-center text-white/30 font-mono text-[10px]">
                          {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                          {track.coverUrl ? (
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Disc className="w-4 h-4 text-white/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-[200px] sm:max-w-[280px]">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-white/50 truncate max-w-[180px] sm:max-w-[260px]">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-white/40 shrink-0 ml-2">
                        {formatDuration(track.durationSec)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save & Cancel Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveToCollection}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 transition-all hover:scale-[1.02]"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan ke Koleksi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
