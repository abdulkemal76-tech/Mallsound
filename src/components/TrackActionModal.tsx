import React, { useState } from 'react';
import {
  X,
  Heart,
  Share2,
  CornerDownRight,
  ListPlus,
  Radio,
  Download,
  Pin,
  Ban,
  Check,
  Plus,
  ArrowLeft,
  Music,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { Track, Playlist, PlaylistCoverTheme } from '../types/music';

export interface TrackActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isLiked?: boolean;
  onToggleLike?: (track: Track) => void;
  // Queue actions
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onStartRadio: (track: Track) => void;
  // Playlist actions
  playlists: Playlist[];
  onAddTrackToPlaylist: (playlistId: string, track: Track) => void;
  onCreatePlaylistWithTrack?: (title: string, coverTheme: PlaylistCoverTheme, track: Track) => void;
  // Notifications
  onShowToast: (message: string) => void;
}

const COVER_THEMES: { id: PlaylistCoverTheme; label: string; bg: string }[] = [
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'rose', label: 'Ruby', bg: 'bg-rose-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-600' },
];

export const TrackActionModal: React.FC<TrackActionModalProps> = ({
  isOpen,
  onClose,
  track,
  isLiked = false,
  onToggleLike,
  onPlayNext,
  onAddToQueue,
  onStartRadio,
  playlists,
  onAddTrackToPlaylist,
  onCreatePlaylistWithTrack,
  onShowToast,
}) => {
  const [activeView, setActiveView] = useState<'main' | 'playlist'>('main');
  const [isCreatingNewPlaylist, setIsCreatingNewPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newCoverTheme, setNewCoverTheme] = useState<PlaylistCoverTheme>('amber');
  const [pinned, setPinned] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !track) return null;

  const handleShare = async () => {
    const shareData = {
      title: `${track.title} — MallSound`,
      text: `Dengarkan lagu "${track.title}" oleh ${track.artist} di MallSound Studio!`,
      url: window.location.href,
    };
    try {
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${track.title} - ${track.artist} | https://mallz12.my.id`);
        onShowToast('✓ Tautan lagu berhasil disalin!');
      }
    } catch {
      // User dismissed share dialog or copy fallback
    }
    onClose();
  };

  const handleTogglePin = () => {
    const nextPin = !pinned;
    setPinned(nextPin);
    onShowToast(nextPin ? `📌 "${track.title}" disematkan ke pintasan cepat` : 'Dilepas dari pintasan');
  };

  const handleDownload = () => {
    setDownloaded(true);
    onShowToast(`✓ "${track.title}" siap diputar offline!`);
    onClose();
  };

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newPlaylistTitle.trim();
    if (!cleanTitle) return;

    if (onCreatePlaylistWithTrack) {
      onCreatePlaylistWithTrack(cleanTitle, newCoverTheme, track);
    }
    onShowToast(`✓ Playlist "${cleanTitle}" dibuat & lagu ditambahkan!`);
    setNewPlaylistTitle('');
    setIsCreatingNewPlaylist(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Background click overlay */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Bottom Sheet Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Menu aksi lagu ${track.title}`}
        className="relative z-10 w-full max-w-lg bg-neutral-900 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto select-none transition-transform duration-200"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* ==============================================================
            VIEW 1: MAIN ACTION SHEET (YouTube Music Style - Gambar 1)
        ============================================================== */}
        {activeView === 'main' && (
          <div className="space-y-5">
            {/* Header: Track Info + Like & Close buttons */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10 shadow-sm flex items-center justify-center">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate font-display tracking-tight">
                    {track.title}
                  </h3>
                  <p className="text-xs text-white/60 truncate mt-0.5">
                    {track.artist}
                    {track.album ? ` • ${track.album}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onToggleLike && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleLike(track);
                      onShowToast(isLiked ? 'Dihapus dari lagu favorit' : '❤️ Ditambahkan ke lagu favorit');
                    }}
                    className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                      isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title={isLiked ? 'Batal Suka' : 'Suka'}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Top 3 Quick Action Cards (Putar setelah ini | Simpan ke playlist | Bagikan) */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onPlayNext(track);
                  onShowToast(`✓ "${track.title}" akan diputar setelah ini`);
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-violet-600 transition-all">
                  <CornerDownRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/90 leading-tight">
                  Putar setelah ini
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('playlist')}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-fuchsia-600 transition-all">
                  <ListPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/90 leading-tight">
                  Simpan ke playlist
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-pink-600 transition-all">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/90 leading-tight">
                  Bagikan
                </span>
              </button>
            </div>

            {/* List Menu Options Below (Gambar 1) */}
            <div className="space-y-1 pt-1 divide-y divide-white/5 text-sm">
              <button
                type="button"
                onClick={() => {
                  onStartRadio(track);
                  onShowToast(`📻 Memulai radio musik untuk "${track.title}"`);
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer text-left"
              >
                <Radio className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-medium text-white/90">Mulai mix lagu ini</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddToQueue(track);
                  onShowToast(`✓ "${track.title}" ditambahkan ke antrean`);
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer text-left"
              >
                <ListPlus className="w-5 h-5 text-violet-400 shrink-0" />
                <span className="font-medium text-white/90">Tambahkan ke antrean</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer text-left"
              >
                <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-white/90">Download / Offline</span>
                  <span className="block text-[11px] text-white/50">Simpan untuk didengarkan tanpa kuota</span>
                </div>
                {downloaded && <Check className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={handleTogglePin}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer text-left"
              >
                <Pin className="w-5 h-5 text-pink-400 shrink-0" />
                <span className="font-medium text-white/90">Sematkan ke Pintasan cepat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onShowToast('✓ Ditandai tidak tertarik');
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer text-left"
              >
                <Ban className="w-5 h-5 text-white/40 shrink-0" />
                <span className="font-medium">Tidak tertarik</span>
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================
            VIEW 2: PLAYLIST PICKER (Simpan ke Playlist / Buat Playlist Baru)
        ============================================================== */}
        {activeView === 'playlist' && (
          <div className="space-y-4">
            {/* Header: Back Button + Title + Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveView('main');
                  setIsCreatingNewPlaylist(false);
                }}
                className="p-2 -ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <h3 className="text-base font-bold text-white font-display">
                Simpan ke Playlist
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Playlist Button / Inline Form */}
            {!isCreatingNewPlaylist ? (
              <button
                type="button"
                onClick={() => setIsCreatingNewPlaylist(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Buat Playlist Baru</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewPlaylist} className="p-4 rounded-2xl bg-white/5 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FolderPlus className="w-4 h-4 text-violet-400" />
                    Playlist Baru
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewPlaylist(false)}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Batal
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nama playlist (misal: Favorit Senja, DJ Pargoy)..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  maxLength={60}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {COVER_THEMES.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setNewCoverTheme(th.id)}
                        className={`w-6 h-6 rounded-full ${th.bg} transition-transform cursor-pointer ${
                          newCoverTheme === th.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                        title={th.label}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={!newPlaylistTitle.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                  >
                    Simpan & Tambahkan
                  </button>
                </div>
              </form>
            )}

            {/* List of Existing Playlists */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {playlists.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/50 space-y-2">
                  <FolderPlus className="w-8 h-8 text-white/20 mx-auto" />
                  <p>Belum ada playlist dibuat.</p>
                  <p className="text-[11px] text-white/40">
                    Klik tombol di atas untuk membuat playlist pertama Anda!
                  </p>
                </div>
              ) : (
                playlists.map((pl) => {
                  const isTrackInPlaylist = pl.trackIds?.includes(track.id);

                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        onAddTrackToPlaylist(pl.id, track);
                        onShowToast(
                          isTrackInPlaylist
                            ? `Dihapus dari "${pl.title}"`
                            : `✓ Ditambahkan ke "${pl.title}"`
                        );
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-white/10 flex items-center justify-center shrink-0">
                          <FolderPlus className="w-5 h-5 text-violet-300" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                            {pl.title}
                          </h4>
                          <p className="text-xs text-white/50">
                            {pl.trackIds?.length || 0} lagu
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isTrackInPlaylist
                            ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                            : 'border border-white/30 text-transparent group-hover:border-white/60'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
