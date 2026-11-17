import React, { useState } from 'react';
import { X, Upload, Music, Check } from 'lucide-react';
import {
  GenreType,
  PlaylistCoverTheme,
  Track,
  COVER_INDIE_SENJA,
  COVER_MIDNIGHT_SYNTH,
  COVER_ACOUSTIC_DAWN,
} from '../types/music';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTracks: Track[];
  onSave: (data: {
    title: string;
    description: string;
    coverTheme: PlaylistCoverTheme;
    trackIds: string[];
    isPublic: boolean;
  }) => Promise<void>;
}

const COVER_THEMES: { id: PlaylistCoverTheme; label: string; swatchClass: string }[] = [
  { id: 'amber', label: 'Amber Studio', swatchClass: 'bg-amber-500' },
  { id: 'emerald', label: 'Hijau Tropis', swatchClass: 'bg-emerald-600' },
  { id: 'indigo', label: 'Indigo Malam', swatchClass: 'bg-indigo-600' },
  { id: 'rose', label: 'Merah Senja', swatchClass: 'bg-rose-600' },
  { id: 'slate', label: 'Monokrom Slate', swatchClass: 'bg-slate-600' },
];

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  allTracks,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverTheme, setCoverTheme] = useState<PlaylistCoverTheme>('amber');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([
    'trk-senja-pelabuhan',
    'trk-distrik-tengah-malam',
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : prev.length < 50
        ? [...prev, trackId]
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim().slice(0, 80);
    const cleanDesc = description.trim().slice(0, 300);
    if (!cleanTitle) {
      setErrorMsg('Judul playlist wajib diisi (maksimal 80 karakter).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        title: cleanTitle,
        description: cleanDesc || 'Koleksi kurasi pribadi di MallSound',
        coverTheme,
        trackIds: selectedTrackIds.slice(0, 50),
        isPublic,
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan playlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Buat Playlist Baru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Susun daftar putar pilihan Anda dan sinkronkan ke awan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Playlist (Maks. 80 karakter)
            </label>
            <input
              type="text"
              maxLength={80}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Fokus Koding Tengah Malam"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan Kurasi (Maks. 300 karakter)
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan suasana atau momen yang cocok untuk playlist ini..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Warna Identitas Sampul
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COVER_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setCoverTheme(theme.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                    coverTheme === theme.id
                      ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-slate-100 font-medium'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${theme.swatchClass}`} />
                  <span className="truncate w-full text-center text-[11px]">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pilih Lagu Awal ({selectedTrackIds.length}/50 dipilih)
              </label>
            </div>
            <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
              {allTracks.map((trk) => {
                const isSelected = selectedTrackIds.includes(trk.id);
                return (
                  <button
                    key={trk.id}
                    type="button"
                    onClick={() => toggleTrackSelection(trk.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {trk.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {trk.artist} · {trk.genre}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <span>Izinkan pengguna lain melihat playlist kurasi ini</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddCustomTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (trackData: {
    title: string;
    artist: string;
    album: string;
    genre: GenreType;
    audioUrl: string;
    durationSec: number;
    lyricsText: string;
    coverUrl: string;
    isLocalBlob?: boolean;
  }) => Promise<void>;
}

const GENRE_OPTIONS: GenreType[] = [
  'Indie Senja',
  'Lo-Fi Beats',
  'Synthwave',
  'Akustik',
  'Eksperimental',
  'Pop Alternatif',
];

export const AddCustomTrackModal: React.FC<AddCustomTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
}) => {
  const [mode, setMode] = useState<'local-file' | 'cloud-stream'>('local-file');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('Rilisan Mandiri 2026');
  const [genre, setGenre] = useState<GenreType>('Indie Senja');
  const [audioUrl, setAudioUrl] = useState('synth://custom-studio');
  const [durationSec, setDurationSec] = useState(160);
  const [lyricsText, setLyricsText] = useState(
    'Bait pertama mengalir di ruang dengar\nHarmoni mandiri dari studio kita\nBiarkan ritme ini terus berputar'
  );
  const [localFileName, setLocalFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setLocalFileName(file.name);
    setAudioUrl(blobUrl);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').slice(0, 100));
    }

    // Read actual audio duration from file
    const tempAudio = new Audio(blobUrl);
    tempAudio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(tempAudio.duration) && tempAudio.duration >= 10) {
        setDurationSec(Math.min(3600, Math.round(tempAudio.duration)));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim().slice(0, 100);
    const cleanArtist = artist.trim().slice(0, 80);
    const cleanAlbum = album.trim().slice(0, 80) || 'Single Mandiri';
    const cleanLyrics = lyricsText.trim().slice(0, 2000);

    if (!cleanTitle || !cleanArtist) {
      setErrorMsg('Judul lagu dan nama musisi wajib diisi.');
      return;
    }

    const coverByGenre =
      genre === 'Synthwave' || genre === 'Eksperimental'
        ? COVER_MIDNIGHT_SYNTH
        : genre === 'Akustik'
        ? COVER_ACOUSTIC_DAWN
        : COVER_INDIE_SENJA;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onAddTrack({
        title: cleanTitle,
        artist: cleanArtist,
        album: cleanAlbum,
        genre,
        audioUrl: audioUrl.trim().slice(0, 500) || 'synth://custom-studio',
        durationSec: Math.max(10, Math.min(3600, Number(durationSec) || 160)),
        lyricsText: cleanLyrics,
        coverUrl: coverByGenre,
        isLocalBlob: audioUrl.startsWith('blob:'),
      });
      setTitle('');
      setArtist('');
      setLocalFileName('');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan lagu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Unggah & Rilis Lagu Sendiri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Putar file audio lokal (MP3/WAV/OGG) atau simpan rilisan awan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMode('local-file')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'local-file'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            File Audio Perangkat (MP3/WAV)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('cloud-stream');
              if (audioUrl.startsWith('blob:')) {
                setAudioUrl('synth://custom-studio');
              }
            }}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'cloud-stream'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            URL Stream / Studio Synth Awan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {mode === 'local-file' ? (
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
              <Upload className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {localFileName || 'Klik untuk memilih file MP3, WAV, atau OGG dari perangkat Anda'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Diputar langsung melalui equalizer 5-band & spectrum analyzer
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                URL Stream Audio HTTPS atau URI Synth Studio
              </label>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  maxLength={500}
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://contoh.com/lagu.mp3 atau synth://custom-studio"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Judul Lagu *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Malam di Braga"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Musisi / Proyek *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Contoh: Proyek Senja"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Album / EP
              </label>
              <input
                type="text"
                maxLength={80}
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as GenreType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Lirik Lagu (Satu baris per bait untuk sinkronisasi otomatis)
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Menambahkan...' : 'Tambahkan & Putar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
