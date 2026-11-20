import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  Tv,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Quote,
  MessageSquare,
  ListPlus,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Sliders,
  Volume2,
  VolumeX,
  Disc,
  Loader2,
  Check,
  Trash2,
  Search,
  X,
  ListMusic,
  Plus,
  Activity,
} from 'lucide-react';
import { EQUALIZER_PRESETS, Playlist, RepeatMode, Track } from '../types/music';
import { SpectrumVisualizer } from './SpectrumVisualizer';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  stageMode: 'cover' | 'video';
  onSwitchStageMode: (mode: 'cover' | 'video') => void;
  videoStageSlot?: React.ReactNode;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: (fromEnded?: boolean) => void;
  onSeek: (sec: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  isRepeat: boolean;
  repeatMode?: RepeatMode;
  onToggleRepeat: () => void;
  isLiked: boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  activeLyricIndex: number;
  isLoadingLyrics: boolean;
  queueTracks: Track[];
  onSelectTrack: (track: Track) => void;
  onRemoveFromQueue?: (trackId: string) => void;
  onClearQueue?: () => void;
  onAddToQueue?: (track: Track) => void;
  allAvailableTracks?: Track[];
  playlists: Playlist[];
  onAddTrackToPlaylist: (playlist: Playlist, track: Track) => void;
  onOpenCreatePlaylist: () => void;
  eqGains: [number, number, number, number, number];
  activeEqPreset: string;
  onEqBandChange: (idx: number, val: number) => void;
  onApplyEqPreset: (presetId: string) => void;
}

const EQ_BAND_SHORT = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];

function formatTimeShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatLikesCount(plays: number, liked: boolean): string {
  const base = Math.max(120, Math.floor((plays || 125000) / 95) + (liked ? 1 : 0));
  if (base >= 1000) {
    return `${(base / 1000).toFixed(1).replace('.', ',')} rb`;
  }
  return String(base);
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTimeSec,
  durationSec,
  stageMode,
  onSwitchStageMode,
  videoStageSlot,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSeek,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  repeatMode,
  onToggleRepeat,
  isLiked,
  onToggleLike,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  activeLyricIndex,
  isLoadingLyrics,
  queueTracks,
  onSelectTrack,
  onRemoveFromQueue,
  onClearQueue,
  onAddToQueue,
  allAvailableTracks = [],
  playlists,
  onAddTrackToPlaylist,
  onOpenCreatePlaylist,
  eqGains,
  activeEqPreset,
  onEqBandChange,
  onApplyEqPreset,
}) => {
  const [disliked, setDisliked] = useState(false);
  const [overlayPanel, setOverlayPanel] = useState<'none' | 'lyrics' | 'queue' | 'eq' | 'save'>('none');
  const [imgFailed, setImgFailed] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [searchQueueQuery, setSearchQueueQuery] = useState('');
  const [isSearchingQueue, setIsSearchingQueue] = useState(false);

  // Auto-scroll lirik: ikuti baris lirik yang sedang jalan.
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const lyricLineRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  // Kapan terakhir pengguna menggulir sendiri (agar auto-scroll tidak
  // melawan mereka saat sedang membaca lirik di atas/bawah).
  const userScrolledAtRef = useRef(0);
  // Penanda bahwa guliran berasal dari auto-scroll (bukan pengguna),
  // supaya onScroll tidak salah menganggapnya guliran manual.
  const isAutoScrollingRef = useRef(false);

  const handleLyricsScroll = () => {
    if (isAutoScrollingRef.current) return;
    userScrolledAtRef.current = Date.now();
  };

  // Gulir lirik ke baris yang sedang dinyanyikan (tengah layar, halus).
  // Jeda saat pengguna baru saja menggulir sendiri (4 detik).
  useEffect(() => {
    if (overlayPanel !== 'lyrics' || activeLyricIndex < 0) return;
    if (Date.now() - userScrolledAtRef.current < 4000) return;
    const lineEl = lyricLineRefs.current.get(activeLyricIndex);
    if (!lineEl) return;
    isAutoScrollingRef.current = true;
    lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 800);
  }, [activeLyricIndex, overlayPanel, currentTrack.id]);

  const filteredSearchTracks = React.useMemo(() => {
    if (!searchQueueQuery.trim() || !allAvailableTracks) return [];
    const q = searchQueueQuery.toLowerCase().trim();
    return allAvailableTracks
      .filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchQueueQuery, allAvailableTracks]);

  useEffect(() => {
    setImgFailed(false);
  }, [currentTrack.coverUrl]);

  const togglePanel = (panel: 'lyrics' | 'queue' | 'eq' | 'save') => {
    setOverlayPanel((prev) => (prev === panel ? 'none' : panel));
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Ambient Blurred Album Cover Background */}
      {currentTrack.coverUrl && !imgFailed && (
        <img
          src={currentTrack.coverUrl}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-35 scale-125 pointer-events-none"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/75 via-neutral-950/90 to-neutral-950 pointer-events-none" />

      {/* Main Centered Container */}
      <div className="relative z-10 w-full max-w-md mx-auto h-full flex flex-col justify-between px-6 pt-4 pb-5">
        {/* =================================================================
            1. TOP HEADER BAR: Collapse Chevron | Audio/Video Switch | Options
        ================================================================= */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Kecilkan pemutar"
          >
            <ChevronDown className="w-7 h-7" />
          </button>

          {/* Center Segmented Sampul (Headphones) / Video (TV) Pill Switch — BOTH play full song! */}
          <div className="flex items-center bg-black/45 border border-white/10 rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                onSwitchStageMode('cover');
                setOverlayPanel('none');
              }}
              className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                stageMode === 'cover'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white/80'
              }`}
              aria-label="Mode Sampul Album"
              title="Tampilkan Sampul Album (Lagu Penuh)"
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchStageMode('video');
                setOverlayPanel('none');
              }}
              className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                stageMode === 'video'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white/80'
              }`}
              aria-label="Mode Video Musik"
              title="Tampilkan Video Musik (Lagu Penuh)"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => togglePanel('eq')}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              overlayPanel === 'eq'
                ? 'bg-white/20 text-amber-400'
                : 'text-white/90 hover:bg-white/10'
            }`}
            aria-label="Pengaturan Studio & Equalizer"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        {/* =================================================================
            2. CENTER VISUAL STAGE: Persistent YT Video + Album Cover + Sheets
        ================================================================= */}
        <div className="my-auto py-3 flex flex-col items-center justify-center w-full">
          <div
            id="mallsound-video-stage-target"
            className="w-full aspect-square rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl relative"
          >
            {/* Underlying persistent YouTube Full-Track Audio/Video Engine */}
            <div
              className={`absolute inset-0 ${
                stageMode === 'video' && overlayPanel === 'none'
                  ? 'z-20 pointer-events-auto'
                  : 'z-0 pointer-events-none'
              }`}
            >
              {videoStageSlot}
            </div>

            {/* Album Cover Layer (Shown when stageMode === 'cover' and no overlay sheet is active) */}
            {stageMode === 'cover' && overlayPanel === 'none' && (
              <div className="absolute inset-0 z-10">
                {currentTrack.coverUrl && !imgFailed ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-amber-400">
                    <Disc className="w-20 h-20 opacity-60" />
                  </div>
                )}
              </div>
            )}

            {/* Overlay Panels (Lyrics, Queue, EQ, Save) */}
            {overlayPanel === 'lyrics' && (
              <div className="absolute inset-0 z-20 bg-neutral-950/90 backdrop-blur-md p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/70 truncate pr-2">
                    Lirik Tersinkronisasi · {currentTrack.title}
                  </span>
                  {isLoadingLyrics && <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />}
                </div>
                <div
                  ref={lyricsContainerRef}
                  onScroll={handleLyricsScroll}
                  className="flex-1 overflow-y-auto space-y-3 pr-1"
                >
                  {(currentTrack.lyrics || []).map((line, i) => {
                    const isCurrentLine = i === activeLyricIndex;
                    return (
                      <button
                        key={`${line.timeSec}-${i}`}
                        ref={(el) => {
                          if (el) lyricLineRefs.current.set(i, el);
                          else lyricLineRefs.current.delete(i);
                        }}
                        type="button"
                        onClick={() => onSeek(line.timeSec)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                          isCurrentLine
                            ? 'text-white font-bold text-lg bg-white/10'
                            : 'text-white/45 hover:text-white/80 text-sm'
                        }`}
                      >
                        {line.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}



            {overlayPanel === 'eq' && (
              <div className="absolute inset-0 z-20 bg-neutral-950/90 backdrop-blur-md p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-semibold text-white/80">
                    Equalizer 5-Band & Volume
                  </span>
                  <div className="flex items-center gap-1">
                    {EQUALIZER_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onApplyEqPreset(p.id)}
                        className={`px-2 py-0.5 text-[10px] rounded-md transition-colors cursor-pointer ${
                          activeEqPreset === p.id
                            ? 'bg-amber-500 text-neutral-950 font-semibold'
                            : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 my-auto py-2">
                  {EQ_BAND_SHORT.map((lbl, idx) => (
                    <div key={lbl} className="flex flex-col items-center gap-2">
                      <span className="font-mono text-[10px] text-amber-400 tabular-nums">
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
                        />
                      </div>
                      <span className="font-mono text-[10px] text-white/60">{lbl}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <SpectrumVisualizer isPlaying={isPlaying} height={36} barCount={24} />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="text-white/70 hover:text-white cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={onVolumeChange}
                      className="flex-1 h-1.5 bg-white/20 rounded-lg accent-white cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {overlayPanel === 'save' && (
              <div className="absolute inset-0 z-20 bg-neutral-950/90 backdrop-blur-md p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/80 truncate pr-2">
                    Simpan "{currentTrack.title}" ke Playlist
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreatePlaylist();
                    }}
                    className="text-xs text-amber-400 hover:underline cursor-pointer shrink-0"
                  >
                    + Playlist Baru
                  </button>
                </div>
                {savedToast && (
                  <div className="my-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{savedToast}</span>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto space-y-2 py-2">
                  {playlists.length === 0 ? (
                    <div className="text-xs text-white/60 text-center py-10">
                      Belum ada playlist. Klik "+ Playlist Baru" di kanan atas untuk membuat playlist pertama Anda.
                    </div>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => {
                          onAddTrackToPlaylist(pl, currentTrack);
                          setSavedToast(`Ditambahkan ke ${pl.title}`);
                          window.setTimeout(() => setSavedToast(null), 2000);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/15 transition-colors text-left cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">{pl.title}</div>
                          <div className="text-xs text-white/50">{pl.trackIds.length} lagu</div>
                        </div>
                        <ListPlus className="w-4 h-4 text-amber-400" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
            3. TRACK TITLE, ARTIST & ACTION BAR (Matching User Screenshot)
        ================================================================= */}
        <div className="space-y-5">
          {/* Title & Artist */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-2xl font-bold text-white tracking-tight truncate">
                {currentTrack.title}
              </h1>
              <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
            </div>
            <p className="text-base text-white/65 truncate">{currentTrack.artist}</p>
          </div>

          {/* Horizontal Action Buttons Row (Like/Dislike | Lirik | EQ Studio | Simpan) */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {/* Compound ThumbsUp + Count | ThumbsDown Button */}
            <div className="inline-flex items-center bg-white/10 hover:bg-white/15 rounded-full px-3.5 py-2 shrink-0 transition-colors">
              <button
                type="button"
                onClick={(e) => {
                  setDisliked(false);
                  onToggleLike(currentTrack, e);
                }}
                className="inline-flex items-center gap-2 pr-3 text-xs font-semibold text-white cursor-pointer"
                aria-label="Sukai lagu"
              >
                <ThumbsUp
                  className={`w-4 h-4 ${isLiked ? 'fill-white text-white' : 'text-white/90'}`}
                />
                <span className="tabular-nums">
                  {formatLikesCount(currentTrack.playsCount, isLiked)}
                </span>
              </button>
              <span className="w-px h-4 bg-white/20" />
              <button
                type="button"
                onClick={() => setDisliked(!disliked)}
                className="pl-3 text-white/80 hover:text-white cursor-pointer"
                aria-label="Tidak suka"
              >
                <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-white text-white' : ''}`} />
              </button>
            </div>

            {/* Lirik Button */}
            <button
              type="button"
              onClick={() => togglePanel('lyrics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                overlayPanel === 'lyrics'
                  ? 'bg-white text-neutral-950'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              <Quote className="w-4 h-4" />
              <span>Lirik</span>
            </button>

            {/* Queue Count Button */}
            <button
              type="button"
              onClick={() => togglePanel('queue')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                overlayPanel === 'queue'
                  ? 'bg-white text-neutral-950'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="tabular-nums">{queueTracks.length}</span>
            </button>

            {/* Save to Playlist Button */}
            <button
              type="button"
              onClick={() => togglePanel('save')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                overlayPanel === 'save'
                  ? 'bg-white text-neutral-950'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
              aria-label="Simpan ke playlist"
            >
              <ListPlus className="w-4 h-4" />
              <span>Simpan</span>
            </button>

            {/* Equalizer Button */}
            <button
              type="button"
              onClick={() => togglePanel('eq')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                overlayPanel === 'eq'
                  ? 'bg-white text-neutral-950'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>EQ</span>
            </button>
          </div>

          {/* =================================================================
              4. SCRUBBER TIMELINE BAR (0:00 — 2:58 Full Duration!)
          ================================================================= */}
          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min={0}
              max={Math.max(1, durationSec)}
              value={currentTimeSec}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-1 bg-white/25 rounded-lg accent-white cursor-pointer"
              aria-label="Garis waktu pemutaran"
            />
            <div className="flex items-center justify-between text-xs font-mono text-white/60 tabular-nums">
              <span>{formatTimeShort(currentTimeSec)}</span>
              <span>{formatTimeShort(durationSec)}</span>
            </div>
          </div>

          {/* =================================================================
              5. LARGE TRANSPORT CONTROLS (Shuffle | Prev | Giant White Play | Next | Repeat)
          ================================================================= */}
          <div className="flex items-center justify-between px-2 py-1">
            {/* Shuffle Button */}
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`relative p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                isShuffle
                  ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/30 scale-105'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
              title={isShuffle ? 'Mode Acak: AKTIF' : 'Mode Acak: NONAKTIF'}
              aria-label="Acak lagu"
            >
              <Shuffle className="w-6 h-6" />
              {isShuffle && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              )}
            </button>

            <button
              type="button"
              onClick={onPrevTrack}
              className="p-2.5 text-white hover:scale-105 transition-transform cursor-pointer"
              aria-label="Lagu sebelumnya"
            >
              <SkipBack className="w-8 h-8 fill-white" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-20 h-20 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-9 h-9 fill-neutral-950" />
              ) : (
                <Play className="w-9 h-9 fill-neutral-950 ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNextTrack(false)}
              className="p-2.5 text-white hover:scale-105 transition-transform cursor-pointer"
              aria-label="Lagu berikutnya"
            >
              <SkipForward className="w-8 h-8 fill-white" />
            </button>

            {/* Repeat Button */}
            <button
              type="button"
              onClick={onToggleRepeat}
              className={`relative p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                repeatMode === 'one'
                  ? 'text-pink-400 bg-pink-500/20 border border-pink-500/40 shadow-lg shadow-pink-500/30 scale-105'
                  : (isRepeat || repeatMode === 'all')
                  ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/30 scale-105'
                  : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
              title={
                repeatMode === 'one'
                  ? 'Ulangi 1 Lagu: AKTIF'
                  : isRepeat
                  ? 'Ulangi Semua: AKTIF'
                  : 'Ulangi: NONAKTIF'
              }
              aria-label="Ulangi lagu"
            >
              <Repeat className="w-6 h-6" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center shadow">
                  1
                </span>
              )}
              {repeatMode === 'all' && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              )}
            </button>
          </div>

          {/* =================================================================
              6. BOTTOM HANDLE & "Antrean Putar" QUEUE DRAWER TRIGGER
          ================================================================= */}
          <button
            type="button"
            onClick={() => togglePanel('queue')}
            className="w-full pt-2 flex flex-col items-center gap-1.5 text-center cursor-pointer group"
          >
            <div className="w-10 h-1 rounded-full bg-white/30 group-hover:bg-white/60 transition-colors" />
            <div className="flex items-center gap-2 text-xs font-semibold text-white/80 group-hover:text-white">
              <ListMusic className="w-3.5 h-3.5 text-violet-400" />
              <span>Antrean Putar</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/60 font-mono">
                {queueTracks.length} lagu
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ================================================================
          QUEUE FULL-SCREEN OVERLAY — lives OUTSIDE the album art square
          so it covers the entire FullScreenPlayer (no cramped 300px box!)
      ================================================================ */}
      {overlayPanel === 'queue' && (
        <div className="absolute inset-0 z-20 flex flex-col bg-neutral-950/98 backdrop-blur-xl animate-fade-in">
          {/* Ambient background carry-over */}
          {currentTrack.coverUrl && !imgFailed && (
            <img
              src={currentTrack.coverUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-15 scale-125 pointer-events-none"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-neutral-950/85 to-neutral-950 pointer-events-none" />

          {/* Scrollable content container — same max-width as rest of player */}
          <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-5 pt-14 pb-6">

            {/* ── Header Row ── */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <ListMusic className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <div>
                  <div className="text-base font-bold text-white leading-tight">Antrean Putar</div>
                  <div className="text-xs text-white/50 font-mono">
                    {queueTracks.length} lagu · Terkunci & Otomatis Lanjut
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onAddToQueue && (
                  <button
                    type="button"
                    onClick={() => setIsSearchingQueue(!isSearchingQueue)}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isSearchingQueue
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                    title="Tambah Lagu ke Antrean"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {queueTracks.length > 0 && onClearQueue && (
                  <button
                    type="button"
                    onClick={onClearQueue}
                    className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                    title="Bersihkan Semua Antrean"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setOverlayPanel('none'); setIsSearchingQueue(false); }}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Tutup Antrean"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Search Bar (when isSearchingQueue) ── */}
            {isSearchingQueue && (
              <div className="mb-4 shrink-0 space-y-2 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQueueQuery}
                    onChange={(e) => setSearchQueueQuery(e.target.value)}
                    placeholder="Ketik judul lagu / artis untuk ditambahkan..."
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-white/10 text-white text-sm placeholder-white/40 border border-white/10 focus:border-violet-500 focus:outline-none"
                    autoFocus
                  />
                  {searchQueueQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQueueQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {filteredSearchTracks.length > 0 && (
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {filteredSearchTracks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                            <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{t.title}</div>
                            <div className="text-[11px] text-white/50 truncate">{t.artist}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { onAddToQueue?.(t); setSearchQueueQuery(''); }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all cursor-pointer shrink-0"
                        >
                          + Tambah
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Now Playing Card ── */}
            <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-violet-950/70 via-black/60 to-fuchsia-950/50 border border-violet-500/30 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-md">
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 mb-0.5">
                    <Activity className="w-3 h-3 animate-pulse" /> Sedang Diputar
                  </div>
                  <div className="text-sm font-bold text-white truncate">{currentTrack.title}</div>
                  <div className="text-xs text-white/60 truncate">{currentTrack.artist}</div>
                </div>
              </div>
              <span className="font-mono text-xs text-white/50 shrink-0">
                {formatTimeShort(currentTrack.durationSec)}
              </span>
            </div>

            {/* ── Up Next Header ── */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Berikutnya ({queueTracks.length})
              </span>
            </div>

            {/* ── Queue Track List ── */}
            {queueTracks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                  <ListMusic className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-sm font-semibold text-white/70">Antrean berikutnya kosong</p>
                <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                  Gunakan tombol <strong className="text-white/60">+ Tambah</strong> di atas atau pilih
                  "Tambahkan ke Antrean" pada menu titik 3 lagu.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {queueTracks.map((trk, idx) => (
                  <div
                    key={`${trk.id}-${idx}`}
                    className="group w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => { onSelectTrack(trk); setOverlayPanel('none'); }}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <span className="font-mono text-xs text-white/35 w-5 tabular-nums shrink-0 text-center">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                        <img src={trk.coverUrl} alt={trk.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                          {trk.title}
                        </div>
                        <div className="text-xs text-white/50 truncate">{trk.artist}</div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs text-white/40 tabular-nums">
                        {formatTimeShort(trk.durationSec)}
                      </span>
                      {onRemoveFromQueue && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRemoveFromQueue(trk.id); }}
                          className="p-1.5 rounded-lg text-white/35 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
