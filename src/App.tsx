import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Repeat,
  Shuffle,
  Search,
  Trash2,
  Disc,
  FolderPlus,
  Loader2,
  Maximize2,
  Settings,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  BUILT_IN_TRACKS,
  COVER_INDIE_SENJA,
  EQUALIZER_PRESETS,
  GenreType,
  LyricLine,
  Playlist,
  PlaylistCoverTheme,
  Track,
} from './types/music';
import { studioAudioEngine } from './services/audioEngine';
import {
  ArtistQuickItem,
  POPULAR_INDO_ARTISTS,
  searchCatalogWithMeta,
  lookupCatalogTracksByIds,
  fetchTrackLyrics,
  resolveYouTubeVideoId,
} from './services/musicApi';
import { YouTubeMusicPlayer } from './components/YouTubeMusicPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddCustomTrackModal, CreatePlaylistModal } from './components/Modals';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/AppDownloadHub';

type ActiveSection = 'explore' | 'artists' | 'favorites' | 'playlists';
type PlaybackEngineMode = 'hifi-eq' | 'yt-music';

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseLyricsLines(rawText: string, durationSec: number): LyricLine[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [{ timeSec: 0, text: 'Instrumental — MallSound' }];
  }
  const interval = Math.max(8, Math.floor((durationSec - 10) / lines.length));
  return lines.map((text, idx) => ({
    timeSec: idx * interval,
    text,
  }));
}

const ResilientCover: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-zinc-800 via-zinc-900 to-amber-950 flex items-center justify-center text-amber-400 ${className}`}
      >
        <Disc className="w-8 h-8 opacity-75" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Navigation & Search State
  const [activeSection, setActiveSection] = useState<ActiveSection>('explore');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('sheila-on-7');
  const [artistCategoryFilter, setArtistCategoryFilter] = useState<string>('Semua');
  const [searchInput, setSearchInput] = useState('');
  const [correctedSearchHint, setCorrectedSearchHint] = useState<string | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Live Catalog State
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const [resolvedSavedTracks, setResolvedSavedTracks] = useState<Record<string, Track>>({});
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [activeCatalogLabel, setActiveCatalogLabel] = useState('Sheila On 7');

  // Firebase Auth & Firestore State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authBannerError, setAuthBannerError] = useState<string | null>(null);

  const [cloudPlaylists, setCloudPlaylists] = useState<Playlist[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, string>>({});
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [cloudCustomTracks, setCloudCustomTracks] = useState<Track[]>([]);
  const [localSessionTracks, setLocalSessionTracks] = useState<Track[]>([]);

  // Modals & Full-Screen Player State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);

  // Dual Playback Engine State ('yt-music' = Full-Track Default | 'hifi-eq' = Web Audio API + 5-Band EQ)
  const [engineMode, setEngineMode] = useState<PlaybackEngineMode>('yt-music');
  const [stageMode, setStageMode] = useState<'cover' | 'video'>('cover');
  const [currentTrack, setCurrentTrack] = useState<Track>(BUILT_IN_TRACKS[0]);
  const [currentYtVideoId, setCurrentYtVideoId] = useState<string | null>(null);
  const [currentYtCandidates, setCurrentYtCandidates] = useState<string[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [ytSeekRequest, setYtSeekRequest] = useState<{ sec: number; nonce: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(BUILT_IN_TRACKS[0].durationSec);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // 5-Band Equalizer State
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [activeEqPreset, setActiveEqPreset] = useState<string>('flat');

  const searchTimeoutRef = useRef<number | null>(null);
  // Cache of resolved YouTube videoIds, so the next track can be
  // started instantly instead of waiting for /api/music/yt after
  // the previous track ends (the gap that left background playback
  // stuck). Filled by enrichTrackMetadata() and by prefetching.
  const ytVideoIdCacheRef = useRef<
    Record<string, { videoId: string | null; candidates: string[] }>
  >({});
  // Fired when the tab becomes visible again while playing, so the
  // YouTube player retries playVideo() even though isPlaying did
  // not change.
  const [ytResumeRequest, setYtResumeRequest] = useState<{
    nonce: number;
  } | null>(null);
  const lastMediaPositionRef = useRef(-1);

  // Load Initial Indonesian Catalog on boot
  useEffect(() => {
    let cancelled = false;
    async function loadInitialIndoCatalog() {
      setIsLoadingCatalog(true);
      const { tracks } = await searchCatalogWithMeta('Sheila On 7', 30);
      if (!cancelled) {
        if (tracks.length > 0) {
          setCatalogTracks(tracks);
          setCurrentTrack(tracks[0]);
          setDurationSec(tracks[0].durationSec);
          enrichTrackMetadata(tracks[0]);
        } else {
          setCatalogTracks(BUILT_IN_TRACKS);
        }
        setIsLoadingCatalog(false);
      }
    }
    loadInitialIndoCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enrich any track with real synced lyrics (.lrc) from LRCLIB + YouTube Music videoId & candidates
  const enrichTrackMetadata = async (track: Track) => {
    if (track.audioUrl.startsWith('synth://') || track.audioUrl.startsWith('blob:')) return;
    const cached = ytVideoIdCacheRef.current[track.id];
    if (cached) {
      setCurrentYtVideoId(cached.videoId);
      setCurrentYtCandidates(cached.candidates);
      // Lyrics still need fetching; videoId is already known.
      setIsLoadingLyrics(true);
      const lyricsResult = await fetchTrackLyrics(track.title, track.artist, track.durationSec);
      setIsLoadingLyrics(false);
      setCurrentTrack((prev) => {
        if (prev.id !== track.id) return prev;
        return { ...prev, lyrics: lyricsResult, youtubeVideoId: cached.videoId ?? undefined };
      });
      return;
    }
    setIsLoadingLyrics(true);
    const [lyricsResult, ytData] = await Promise.all([
      fetchTrackLyrics(track.title, track.artist, track.durationSec),
      resolveYouTubeVideoId(track.title, track.artist, track.id),
    ]);
    setIsLoadingLyrics(false);
    ytVideoIdCacheRef.current[track.id] = ytData;
    setCurrentYtVideoId(ytData.videoId);
    setCurrentYtCandidates(ytData.candidates);
    setCurrentTrack((prev) => {
      if (prev.id !== track.id) return prev;
      return {
        ...prev,
        lyrics: lyricsResult,
        youtubeVideoId: ytData.videoId,
      };
    });
  };

  // Select Artist from Quick Bar or Band Directory
  const handleSelectArtistChip = async (
    artistObj: ArtistQuickItem,
    autoPlayFirst = false
  ) => {
    setSelectedArtistId(artistObj.id);
    setSearchInput('');
    setCorrectedSearchHint(null);
    setActivePlaylistId(null);
    setActiveSection('explore');
    setActiveCatalogLabel(artistObj.label);
    setIsLoadingCatalog(true);
    const { tracks } = await searchCatalogWithMeta(artistObj.query, 30);
    setCatalogTracks(tracks);
    setIsLoadingCatalog(false);
    if (autoPlayFirst && tracks.length > 0) {
      handleSelectTrack(tracks[0]);
    }
  };

  // Live Debounced Smart Typo-Tolerant Search
  const handleSearchInputChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setCorrectedSearchHint(null);
      const currentArtist =
        POPULAR_INDO_ARTISTS.find((a) => a.id === selectedArtistId) ||
        POPULAR_INDO_ARTISTS[0];
      handleSelectArtistChip(currentArtist);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setActivePlaylistId(null);
      setActiveSection('explore');
      setActiveCatalogLabel(val.trim());
      setIsLoadingCatalog(true);
      const { tracks, correctedQuery } = await searchCatalogWithMeta(val.trim(), 32);
      setCatalogTracks(tracks);
      setCorrectedSearchHint(correctedQuery);
      if (correctedQuery) {
        setActiveCatalogLabel(correctedQuery);
      }
      setIsLoadingCatalog(false);
    }, 300);
  };

  // Combined Track Dictionary
  const allKnownTracks = useMemo(() => {
    const map = new Map<string, Track>();
    [
      ...localSessionTracks,
      ...cloudCustomTracks,
      ...catalogTracks,
      ...Object.values(resolvedSavedTracks),
      ...BUILT_IN_TRACKS,
    ].forEach((t) => {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [localSessionTracks, cloudCustomTracks, catalogTracks, resolvedSavedTracks]);

  // Lookup saved iTunes IDs for Playlists & Favorites
  useEffect(() => {
    const neededIds = new Set<string>();
    Object.keys(favoriteIds).forEach((id) => {
      if (id.startsWith('itunes_') && !resolvedSavedTracks[id]) neededIds.add(id);
    });
    localFavorites.forEach((id) => {
      if (id.startsWith('itunes_') && !resolvedSavedTracks[id]) neededIds.add(id);
    });
    cloudPlaylists.forEach((pl) => {
      pl.trackIds.forEach((id) => {
        if (id.startsWith('itunes_') && !resolvedSavedTracks[id]) neededIds.add(id);
      });
    });

    const arr = Array.from(neededIds);
    if (arr.length === 0) return;

    lookupCatalogTracksByIds(arr).then((tracks) => {
      if (tracks.length > 0) {
        setResolvedSavedTracks((prev) => {
          const next = { ...prev };
          tracks.forEach((t) => {
            next[t.id] = t;
          });
          return next;
        });
      }
    });
  }, [favoriteIds, localFavorites, cloudPlaylists]);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore Real-Time Listeners
  useEffect(() => {
    if (!isAuthReady || !user) {
      setCloudPlaylists([]);
      setFavoriteIds({});
      setCloudCustomTracks([]);
      return;
    }

    const playlistsQuery = query(
      collection(db, 'playlists'),
      where('ownerId', '==', user.uid)
    );
    const unsubPlaylists = onSnapshot(
      playlistsQuery,
      (snap) => {
        const list: Playlist[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || 'Playlist'),
            description: String(data.description || ''),
            coverTheme: (data.coverTheme as PlaylistCoverTheme) || 'amber',
            trackIds: Array.isArray(data.trackIds) ? data.trackIds : [],
            ownerId: String(data.ownerId || user.uid),
            ownerName: String(data.ownerName || 'Pengguna'),
            isPublic: Boolean(data.isPublic),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setCloudPlaylists(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'playlists');
      }
    );

    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('ownerId', '==', user.uid)
    );
    const unsubFavorites = onSnapshot(
      favoritesQuery,
      (snap) => {
        const map: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.trackId) {
            map[String(data.trackId)] = d.id;
          }
        });
        setFavoriteIds(map);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'favorites');
      }
    );

    const customTracksQuery = query(
      collection(db, 'customTracks'),
      where('ownerId', '==', user.uid)
    );
    const unsubCustomTracks = onSnapshot(
      customTracksQuery,
      (snap) => {
        const tracks: Track[] = snap.docs.map((d) => {
          const data = d.data();
          const dur = Number(data.durationSec) || 160;
          const rawLyrics = String(data.lyricsText || '');
          return {
            id: d.id,
            title: String(data.title || 'Lagu Kustom'),
            artist: String(data.artist || 'Musisi Mandiri'),
            album: String(data.album || 'Single Mandiri'),
            genre: (data.genre as GenreType) || 'Indie Senja',
            durationSec: dur,
            coverUrl: COVER_INDIE_SENJA,
            audioUrl: String(data.audioUrl || 'synth://custom-studio'),
            bitrateLabel: '24-bit / Cloud Master',
            releaseYear: 2026,
            playsCount: 1,
            lyrics: parseLyricsLines(rawLyrics, dur),
            isCustom: true,
            ownerId: String(data.ownerId || user.uid),
            ownerName: String(data.ownerName || 'Pengguna'),
          };
        });
        setCloudCustomTracks(tracks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customTracks');
      }
    );

    return () => {
      unsubPlaylists();
      unsubFavorites();
      unsubCustomTracks();
    };
  }, [isAuthReady, user]);

  // Wire Web Audio Engine Callbacks
  useEffect(() => {
    studioAudioEngine.setCallbacks(
      (time, dur) => {
        if (engineMode === 'hifi-eq') {
          setCurrentTimeSec(time);
          setDurationSec(dur);
        }
      },
      () => {
        if (engineMode === 'hifi-eq') {
          handleNextTrack(true);
        }
      }
    );
  });

  // Sleep Timer Countdown
  useEffect(() => {
    if (sleepTimerMinutes === null || !isPlaying) return;
    const timeoutId = window.setTimeout(() => {
      studioAudioEngine.pause();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);
    return () => window.clearTimeout(timeoutId);
  }, [sleepTimerMinutes, isPlaying]);

  const handleSwitchEngineMode = (nextMode: PlaybackEngineMode) => {
    if (nextMode === engineMode) return;
    setEngineMode(nextMode);
    setCurrentTimeSec(0);
    if (nextMode === 'yt-music') {
      studioAudioEngine.pause();
      setDurationSec(currentTrack.durationSec);
      if (!currentYtVideoId) {
        resolveYouTubeVideoId(currentTrack.title, currentTrack.artist, currentTrack.id).then(
          (ytData) => {
            setCurrentYtVideoId(ytData.videoId);
            setCurrentYtCandidates(ytData.candidates);
          }
        );
      }
    } else {
      studioAudioEngine.loadTrack(currentTrack, isPlaying);
    }
  };

  const handleSelectTrack = (
    track: Track,
    forceMode?: PlaybackEngineMode,
    openFullScreen = true
  ) => {
    const isLocalOrSynth =
      track.audioUrl.startsWith('synth://') || track.audioUrl.startsWith('blob:');
    const targetMode: PlaybackEngineMode = isLocalOrSynth
      ? 'hifi-eq'
      : forceMode || 'yt-music';

    if (targetMode !== engineMode) {
      setEngineMode(targetMode);
    }
    if (forceMode === 'yt-music') {
      setStageMode('video');
    }

    if (openFullScreen) {
      setIsFullScreenPlayerOpen(true);
    }

    if (currentTrack.id === track.id && !forceMode) {
      if (!isPlaying) {
        handleTogglePlay();
      }
      return;
    }

    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));
    setCurrentTrack(track);
    setCurrentTimeSec(0);
    setDurationSec(track.durationSec);
    setIsPlaying(true);

    if (targetMode === 'hifi-eq') {
      studioAudioEngine.loadTrack(track, true);
    } else {
      studioAudioEngine.pause();
      // If the next track was prefetched, switch the YouTube player
      // to it immediately instead of waiting for enrichTrackMetadata().
      const cached = ytVideoIdCacheRef.current[track.id];
      if (cached) {
        setCurrentYtVideoId(cached.videoId);
        setCurrentYtCandidates(cached.candidates);
      }
    }

    enrichTrackMetadata(track);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (engineMode === 'hifi-eq') {
        studioAudioEngine.pause();
      }
      setIsPlaying(false);
    } else {
      if (engineMode === 'hifi-eq') {
        if (currentTimeSec === 0) {
          studioAudioEngine.loadTrack(currentTrack, true);
        } else {
          studioAudioEngine.play();
        }
      }
      setIsPlaying(true);
    }
  };

  const displayedTracks = useMemo(() => {
    const activePlaylist = cloudPlaylists.find((p) => p.id === activePlaylistId) || null;
    if (activePlaylist) {
      return allKnownTracks.filter((t) => activePlaylist.trackIds.includes(t.id));
    }
    if (activeSection === 'favorites') {
      return allKnownTracks.filter((t) =>
        user ? Boolean(favoriteIds[t.id]) : localFavorites.includes(t.id)
      );
    }
    return [...localSessionTracks, ...cloudCustomTracks, ...catalogTracks];
  }, [
    cloudPlaylists,
    activePlaylistId,
    activeSection,
    allKnownTracks,
    user,
    favoriteIds,
    localFavorites,
    localSessionTracks,
    cloudCustomTracks,
    catalogTracks,
  ]);

  const handleNextTrack = (fromEnded = false) => {
    if (fromEnded && isRepeat) {
      if (engineMode === 'hifi-eq') {
        studioAudioEngine.seek(0);
        studioAudioEngine.play();
      } else {
        setYtSeekRequest({ sec: 0, nonce: Date.now() });
      }
      setIsPlaying(true);
      return;
    }
    const queue = displayedTracks.length > 0 ? displayedTracks : allKnownTracks;
    if (queue.length === 0) return;

    if (isShuffle && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      const randomTrack = candidates[Math.floor(Math.random() * candidates.length)];
      handleSelectTrack(randomTrack, undefined, isFullScreenPlayerOpen);
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (idx + 1) % queue.length;
    handleSelectTrack(queue[nextIdx], undefined, isFullScreenPlayerOpen);
  };

  const handlePrevTrack = () => {
    if (currentTimeSec > 4) {
      if (engineMode === 'hifi-eq') {
        studioAudioEngine.seek(0);
      } else {
        setYtSeekRequest({ sec: 0, nonce: Date.now() });
      }
      setCurrentTimeSec(0);
      return;
    }
    const queue = displayedTracks.length > 0 ? displayedTracks : allKnownTracks;
    if (queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    handleSelectTrack(queue[prevIdx], undefined, isFullScreenPlayerOpen);
  };

  // Pre-resolve the next track's YouTube videoId while the current
  // track is still playing, so track change in background does not
  // have to wait for a network fetch first.
  useEffect(() => {
    const queue = displayedTracks.length > 0 ? displayedTracks : allKnownTracks;
    if (queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[(idx + 1) % queue.length];
    if (!next || next.id === currentTrack.id) return;
    if (next.audioUrl.startsWith('synth://') || next.audioUrl.startsWith('blob:')) return;
    if (ytVideoIdCacheRef.current[next.id]) return;
    let cancelled = false;
    resolveYouTubeVideoId(next.title, next.artist, next.id).then((ytData) => {
      if (!cancelled) {
        ytVideoIdCacheRef.current[next.id] = ytData;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentTrack.id, displayedTracks, allKnownTracks]);

  // Media Session API: this is what tells Chrome / Android that
  // MallSound is playing media, keeps the lock-screen notification
  // alive, and lets the user press Next/Prev from the notification
  // or headset while the tab is in background.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: currentTrack.coverUrl
          ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying) handleTogglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying) handleTogglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack(false));
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          setCurrentTimeSec(details.seekTime);
          if (engineMode === 'hifi-eq') {
            studioAudioEngine.seek(details.seekTime);
          } else {
            setYtSeekRequest({ sec: details.seekTime, nonce: Date.now() });
          }
        }
      });
    } catch {
      // Media Session is best-effort; playback must not depend on it.
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {
        // ignore
      }
    };
  }, [currentTrack, isPlaying, engineMode]);

  // Keep Media Session position in sync (throttled to whole seconds).
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const posSec = Math.floor(currentTimeSec);
    if (posSec === lastMediaPositionRef.current) return;
    lastMediaPositionRef.current = posSec;
    try {
      if (Number.isFinite(durationSec) && durationSec > 0) {
        navigator.mediaSession.setPositionState({
          duration: durationSec,
          playbackRate,
          position: Math.min(currentTimeSec, durationSec),
        });
      }
    } catch {
      // ignore
    }
  }, [currentTimeSec, durationSec, playbackRate]);

  // When the tab returns from background while playing, resume the
  // AudioContext (suspended by Chrome in background) and ask the
  // YouTube player to play again — isPlaying never changed, so the
  // normal sync effects would not re-run on their own.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !isPlaying) return;
      studioAudioEngine.resume().catch(() => {});
      if (engineMode === 'yt-music') {
        setYtResumeRequest({ nonce: Date.now() });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isPlaying, engineMode]);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTimeSec(val);
    if (engineMode === 'hifi-eq') {
      studioAudioEngine.seek(val);
    } else {
      setYtSeekRequest({ sec: val, nonce: Date.now() });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    studioAudioEngine.setMuted(val === 0);
    studioAudioEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    studioAudioEngine.setMuted(nextMuted);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    studioAudioEngine.setPlaybackRate(rate);
  };

  const handleEqBandChange = (bandIndex: number, newGain: number) => {
    const updated = [...eqGains] as [number, number, number, number, number];
    updated[bandIndex] = newGain;
    setEqGains(updated);
    setActiveEqPreset('custom');
    studioAudioEngine.setEqualizerGains(updated);
  };

  const handleApplyEqPreset = (presetId: string) => {
    const found = EQUALIZER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActiveEqPreset(found.id);
    setEqGains([...found.gains] as [number, number, number, number, number]);
    studioAudioEngine.setEqualizerGains(found.gains);
  };

  const isTrackLiked = (trackId: string): boolean => {
    if (user) {
      return Boolean(favoriteIds[trackId]);
    }
    return localFavorites.includes(trackId);
  };

  const handleToggleLike = async (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));
    const trackId = track.id;

    if (!user) {
      setLocalFavorites((prev) =>
        prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
      );
      return;
    }

    const existingDocId = favoriteIds[trackId];
    if (existingDocId) {
      const path = `favorites/${existingDocId}`;
      try {
        await deleteDoc(doc(db, 'favorites', existingDocId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      const cleanTrackId = trackId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
      const favId = `fav_${user.uid.slice(0, 20)}_${cleanTrackId}`.slice(0, 120);
      const path = `favorites/${favId}`;
      try {
        await setDoc(doc(db, 'favorites', favId), {
          trackId: cleanTrackId,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleCreatePlaylist = async (data: {
    title: string;
    description: string;
    coverTheme: PlaylistCoverTheme;
    trackIds: string[];
    isPublic: boolean;
  }) => {
    if (!user) {
      await handleGoogleSignIn();
      return;
    }
    const playlistId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const path = `playlists/${playlistId}`;
    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        title: data.title.trim().slice(0, 80),
        description: data.description.trim().slice(0, 300),
        coverTheme: data.coverTheme,
        trackIds: data.trackIds.slice(0, 50),
        ownerId: user.uid,
        ownerName: (user.displayName || user.email || 'Kurator MallSound').slice(0, 80),
        isPublic: data.isPublic,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActivePlaylistId(playlistId);
      setActiveSection('explore');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const path = `playlists/${playlistId}`;
    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
      if (activePlaylistId === playlistId) {
        setActivePlaylistId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddTrackToPlaylist = async (playlist: Playlist, track: Track) => {
    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));
    if (!user) return;
    if (playlist.trackIds.includes(track.id) || playlist.trackIds.length >= 50) return;
    const updatedTrackIds = [...playlist.trackIds, track.id].slice(0, 50);
    const path = `playlists/${playlist.id}`;
    try {
      await updateDoc(doc(db, 'playlists', playlist.id), {
        trackIds: updatedTrackIds,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddCustomTrack = async (trackData: {
    title: string;
    artist: string;
    album: string;
    genre: GenreType;
    audioUrl: string;
    durationSec: number;
    lyricsText: string;
    coverUrl: string;
    isLocalBlob?: boolean;
  }) => {
    const newId = `ct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTrack: Track = {
      id: newId,
      title: trackData.title,
      artist: trackData.artist,
      album: trackData.album,
      genre: trackData.genre,
      durationSec: trackData.durationSec,
      coverUrl: trackData.coverUrl,
      audioUrl: trackData.audioUrl,
      bitrateLabel: trackData.isLocalBlob ? 'Local Studio PCM/MP3' : '24-bit / Studio Stream',
      releaseYear: 2026,
      playsCount: 1,
      lyrics: parseLyricsLines(trackData.lyricsText, trackData.durationSec),
      isCustom: true,
    };

    if (trackData.isLocalBlob || !user) {
      setLocalSessionTracks((prev) => [newTrack, ...prev]);
      handleSelectTrack(newTrack);
      return;
    }

    const path = `customTracks/${newId}`;
    try {
      await setDoc(doc(db, 'customTracks', newId), {
        title: trackData.title.slice(0, 100),
        artist: trackData.artist.slice(0, 80),
        album: trackData.album.slice(0, 80),
        genre: trackData.genre,
        audioUrl: trackData.audioUrl.slice(0, 500),
        durationSec: Math.max(10, Math.min(3600, trackData.durationSec)),
        lyricsText: trackData.lyricsText.slice(0, 2000),
        ownerId: user.uid,
        ownerName: (user.displayName || user.email || 'Musisi MallSound').slice(0, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      handleSelectTrack(newTrack);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteCustomTrack = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.audioUrl.startsWith('blob:') || !user) {
      setLocalSessionTracks((prev) => prev.filter((t) => t.id !== track.id));
      return;
    }
    const path = `customTracks/${track.id}`;
    try {
      await deleteDoc(doc(db, 'customTracks', track.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthBannerError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthBannerError(
        err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.'
      );
    }
  };

  const activePlaylist = useMemo(
    () => cloudPlaylists.find((p) => p.id === activePlaylistId) || null,
    [cloudPlaylists, activePlaylistId]
  );

  // Active Lyric Line Index
  const activeLyricIndex = useMemo(() => {
    if (!currentTrack.lyrics || currentTrack.lyrics.length === 0) return 0;
    let idx = 0;
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (currentTimeSec >= currentTrack.lyrics[i].timeSec) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTrack.lyrics, currentTimeSec]);

  const topSixShowcase = useMemo(() => displayedTracks.slice(0, 6), [displayedTracks]);

  const filteredArtistsDirectory = useMemo(() => {
    if (artistCategoryFilter === 'Semua') return POPULAR_INDO_ARTISTS;
    return POPULAR_INDO_ARTISTS.filter((a) => a.category === artistCategoryFilter);
  }, [artistCategoryFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-28">
      {/* =====================================================================
          TOP BAR CONTRACT (Strictly 3 zones separated by gap-8)
      ===================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-5 sm:px-8 py-3.5 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('explore');
            setActivePlaylistId(null);
          }}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          MallSound
        </a>

        {/* Zone 2: 4 Clean Single-Line Navigation Links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSection('explore');
              setActivePlaylistId(null);
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'explore' && !activePlaylistId
                ? 'text-slate-900 dark:text-white border-b-2 border-amber-500 font-semibold'
                : ''
            }`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('artists');
              setActivePlaylistId(null);
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'artists'
                ? 'text-slate-900 dark:text-white border-b-2 border-amber-500 font-semibold'
                : ''
            }`}
          >
            Band & Artis
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('favorites');
              setActivePlaylistId(null);
            }}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'favorites'
                ? 'text-slate-900 dark:text-white border-b-2 border-amber-500 font-semibold'
                : ''
            }`}
          >
            Disukai
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('playlists')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeSection === 'playlists' || Boolean(activePlaylistId)
                ? 'text-slate-900 dark:text-white border-b-2 border-amber-500 font-semibold'
                : ''
            }`}
          >
            Playlist
          </button>
        </nav>

        {/* Zone 3: 1 Primary Gear Settings Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900 hover:border-amber-500 text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Pengaturan Audio, Equalizer, Tema & APK"
          >
            <Settings className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </header>
      <OfflineIndicator />

      {/* =====================================================================
          CLEAN, MINIMALIST MUSIC-FIRST WORKSPACE
      ===================================================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-7">
        {/* 1. SMART SEARCH BAR & QUICK ARTIST CHIPS */}
        {(activeSection === 'explore' || activeSection === 'artists') && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 dark:text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Cari lagu atau band apa saja (contoh: Sheila On 7, Dongker, Dewa 19, Bernadya, Hindia)..."
                className="w-full pl-12 pr-24 py-3.5 text-sm bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 shadow-xs transition-colors"
              />
              {isLoadingCatalog ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : searchInput ? (
                <button
                  type="button"
                  onClick={() => handleSearchInputChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Smart Typo Auto-Correction Feedback */}
            {correctedSearchHint && searchInput.trim() && (
              <div className="flex items-center gap-2 px-1 text-xs text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Pencarian cerdas menampilkan hasil untuk{' '}
                  <strong className="font-bold underline">{correctedSearchHint}</strong>
                </span>
              </div>
            )}

            {/* Clean Quick-Select Band Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {POPULAR_INDO_ARTISTS.slice(0, 15).map((artist) => {
                const isActive =
                  !searchInput.trim() &&
                  !activePlaylist &&
                  activeSection === 'explore' &&
                  selectedArtistId === artist.id;
                return (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => handleSelectArtistChip(artist)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-amber-500/50'
                    }`}
                  >
                    {artist.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 1: BERANDA (CLEAN VISUAL SONG GRID + INSTANT TRACKLIST)
        =================================================================== */}
        {(activeSection === 'explore' || activeSection === 'favorites') && (
          <div className="space-y-8">
            {/* Visual Featured Song Grid (6 Cards) */}
            {activeSection === 'explore' && !activePlaylist && topSixShowcase.length >= 4 && (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Pilihan Populer · {activeCatalogLabel}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection('artists')}
                    className="text-xs font-medium text-amber-500 hover:underline cursor-pointer"
                  >
                    Semua Band →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                  {topSixShowcase.map((trk) => {
                    const isCurrent = currentTrack.id === trk.id;
                    return (
                      <div
                        key={`showcase-${trk.id}`}
                        onClick={() => handleSelectTrack(trk)}
                        className={`group p-2.5 rounded-2xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:bg-slate-100/60 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden mb-2.5 relative bg-zinc-900">
                          <ResilientCover
                            src={trk.coverUrl}
                            alt={trk.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div
                            className={`absolute inset-0 bg-black/35 flex items-center justify-center transition-opacity ${
                              isCurrent && isPlaying
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                              {isCurrent && isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {trk.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {trk.artist}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Instant Tracklist Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activePlaylist
                    ? activePlaylist.title
                    : activeSection === 'favorites'
                    ? 'Lagu yang Anda Sukai'
                    : `Daftar Lagu · ${activeCatalogLabel}`}
                </h2>
                <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 tabular-nums">
                  {displayedTracks.length} lagu
                </span>
              </div>

              {displayedTracks.length === 0 && !isLoadingCatalog ? (
                <div className="p-10 text-center border border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    {activeSection === 'favorites'
                      ? 'Belum ada lagu yang ditandai suka.'
                      : 'Lagu tidak ditemukan.'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {activeSection === 'favorites'
                      ? 'Ketuk ikon hati pada lagu mana pun untuk menyimpannya di sini.'
                      : 'Coba ketik judul lagu atau nama band lain di kolom pencarian atas.'}
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-zinc-800/90 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/40 divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {displayedTracks.map((trk, idx) => {
                    const isCurrent = currentTrack.id === trk.id;
                    const liked = isTrackLiked(trk.id);

                    return (
                      <div
                        key={trk.id}
                        onClick={() => handleSelectTrack(trk)}
                        className={`group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-900/90'
                        }`}
                      >
                        {/* Left: Index + Cover + Title & Artist */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span
                            className={`w-5 text-right font-mono text-xs tabular-nums shrink-0 ${
                              isCurrent ? 'text-amber-500 font-bold' : 'text-slate-400 dark:text-zinc-500'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>

                          <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-zinc-900">
                            <ResilientCover
                              src={trk.coverUrl}
                              alt={trk.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm font-semibold truncate ${
                                isCurrent
                                  ? 'text-amber-500'
                                  : 'text-slate-900 dark:text-zinc-100'
                              }`}
                            >
                              {trk.title}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                              {trk.artist} · {trk.album}
                            </div>
                          </div>
                        </div>

                        {/* Right: Minimalist Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {cloudPlaylists.length > 0 && (
                            <select
                              aria-label="Tambahkan ke playlist"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const targetPl = cloudPlaylists.find(
                                  (p) => p.id === e.target.value
                                );
                                if (targetPl) {
                                  handleAddTrackToPlaylist(targetPl, trk);
                                }
                                e.target.value = '';
                              }}
                              defaultValue=""
                              className="hidden sm:block text-[11px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-600 dark:text-zinc-300 focus:outline-none cursor-pointer"
                            >
                              <option value="" disabled>
                                + Playlist
                              </option>
                              {cloudPlaylists.map((pl) => (
                                <option key={pl.id} value={pl.id}>
                                  {pl.title}
                                </option>
                              ))}
                            </select>
                          )}

                          {trk.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomTrack(trk, e)}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Hapus lagu kustom"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleToggleLike(trk, e)}
                            className={`p-2 rounded-full transition-colors cursor-pointer ${
                              liked
                                ? 'text-amber-500'
                                : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200'
                            }`}
                            aria-label={liked ? 'Hapus dari disukai' : 'Sukai lagu'}
                          >
                            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                          </button>

                          <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 tabular-nums w-11 text-right">
                            {formatDuration(trk.durationSec)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: BAND & ARTIS DIRECTORY
        =================================================================== */}
        {activeSection === 'artists' && (
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Pilih Band & Musisi
              </h1>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl overflow-x-auto">
                {(
                  [
                    'Semua',
                    'Legenda & Band',
                    'Indie & Alternatif',
                    'Pop & R&B Hits',
                    'Global & Asia',
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setArtistCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      artistCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredArtistsDirectory.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handleSelectArtistChip(artist, true)}
                  className="group p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-amber-500 text-left transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-500 truncate">
                      {artist.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {artist.category}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================================
            VIEW 3: PLAYLISTS
        =================================================================== */}
        {activeSection === 'playlists' && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Playlist Saya
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrackModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-amber-500 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unggah Lagu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Playlist Baru</span>
                </button>
              </div>
            </div>

            {cloudPlaylists.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-center space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Belum ada playlist tersimpan.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  Buat Playlist Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cloudPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => {
                      setActivePlaylistId(pl.id);
                      setActiveSection('explore');
                    }}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-amber-500 transition-colors cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-slate-900 dark:text-white truncate">
                          {pl.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {pl.description || 'Koleksi pilihan MallSound'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePlaylist(pl.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        aria-label="Hapus playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-amber-500">
                      {pl.trackIds.length} lagu →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* =====================================================================
          CLEAN BOTTOM PLAYER BAR (Click to open Full-Screen Player)
      ===================================================================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto grid grid-cols-12 items-center gap-3">
          {/* Left: Current Track (Click opens Full-Screen Player) */}
          <div
            onClick={() => setIsFullScreenPlayerOpen(true)}
            className="col-span-7 sm:col-span-4 flex items-center gap-3 min-w-0 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-zinc-900 relative">
              <ResilientCover
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                {currentTrack.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          {/* Center: Transport & Scrubber */}
          <div className="col-span-5 sm:col-span-5 flex flex-col items-end sm:items-center gap-1">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsShuffle(!isShuffle)}
                className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isShuffle ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'
                }`}
                aria-label="Acak"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePrevTrack}
                className="p-1.5 text-slate-700 dark:text-zinc-200 hover:text-amber-500 transition-colors cursor-pointer"
                aria-label="Sebelumnya"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNextTrack(false)}
                className="p-1.5 text-slate-700 dark:text-zinc-200 hover:text-amber-500 transition-colors cursor-pointer"
                aria-label="Berikutnya"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isRepeat ? 'text-amber-500' : 'text-slate-400 dark:text-zinc-500'
                }`}
                aria-label="Ulangi"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:flex w-full max-w-md items-center gap-2.5">
              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums w-8 text-right">
                {formatDuration(currentTimeSec)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(1, durationSec)}
                value={currentTimeSec}
                onChange={handleSeekChange}
                className="flex-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg accent-amber-500 cursor-pointer"
                aria-label="Waktu lagu"
              />
              <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums w-8">
                {formatDuration(durationSec)}
              </span>
            </div>
          </div>

          {/* Right: Volume + Expand Fullscreen + Gear */}
          <div className="hidden sm:flex sm:col-span-3 items-center justify-end gap-2">
            <div className="flex items-center gap-1.5 w-24">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Volume"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
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
                onChange={handleVolumeChange}
                className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg accent-amber-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreenPlayerOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          PERSISTENT FULL-SCREEN PLAYER (Keeps YT Full-Track Playing)
      ===================================================================== */}
      <FullScreenPlayer
        isOpen={isFullScreenPlayerOpen}
        onClose={() => setIsFullScreenPlayerOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTimeSec={currentTimeSec}
        durationSec={durationSec}
        stageMode={stageMode}
        onSwitchStageMode={(mode) => {
          setStageMode(mode);
          if (mode === 'video' && engineMode !== 'yt-music') {
            handleSwitchEngineMode('yt-music');
          }
        }}
        videoStageSlot={
          engineMode === 'yt-music' ? (
            <YouTubeMusicPlayer
              videoId={currentYtVideoId}
              candidateIds={currentYtCandidates}
              isPlaying={isPlaying}
              volume={volume}
              isMuted={isMuted}
              seekRequest={ytSeekRequest}
              resumeRequest={ytResumeRequest}
              onTimeUpdate={(cur, dur) => {
                setCurrentTimeSec(cur);
                setDurationSec(dur);
              }}
              onEnded={() => handleNextTrack(true)}
              onPlayingChange={(playing) => {
                // A PAUSED report that arrives while the tab is
                // hidden is YouTube/Chrome blocking play in
                // background, not the user pressing pause. Accepting
                // it would set isPlaying=false and kill every
                // retry, so the next track never starts until the
                // page is reopened. Ignore it; the watchdog in
                // YouTubeMusicPlayer keeps retrying instead.
                if (!playing && document.hidden) return;
                setIsPlaying(playing);
              }}
              onFallbackToPreview={() => handleSwitchEngineMode('hifi-eq')}
            />
          ) : null
        }
        onTogglePlay={handleTogglePlay}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onSeek={(sec) => {
          setCurrentTimeSec(sec);
          if (engineMode === 'hifi-eq') {
            studioAudioEngine.seek(sec);
          } else {
            setYtSeekRequest({ sec: sec, nonce: Date.now() });
          }
        }}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        isLiked={isTrackLiked(currentTrack.id)}
        onToggleLike={handleToggleLike}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        activeLyricIndex={activeLyricIndex}
        isLoadingLyrics={isLoadingLyrics}
        queueTracks={displayedTracks}
        onSelectTrack={(trk) => handleSelectTrack(trk, undefined, true)}
        playlists={cloudPlaylists}
        onAddTrackToPlaylist={handleAddTrackToPlaylist}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
        eqGains={eqGains}
        activeEqPreset={activeEqPreset}
        onEqBandChange={handleEqBandChange}
        onApplyEqPreset={handleApplyEqPreset}
      />

      {/* =====================================================================
          GEAR SETTINGS MODAL (Equalizer, Engine, Theme, Account & APK)
      ===================================================================== */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        engineMode={engineMode}
        onSwitchEngineMode={handleSwitchEngineMode}
        eqGains={eqGains}
        activeEqPreset={activeEqPreset}
        onEqBandChange={handleEqBandChange}
        onApplyEqPreset={handleApplyEqPreset}
        playbackRate={playbackRate}
        onPlaybackRateChange={handlePlaybackRateChange}
        sleepTimerMinutes={sleepTimerMinutes}
        onSleepTimerChange={setSleepTimerMinutes}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={() => signOutUser()}
        authBannerError={authBannerError}
        onOpenUploadModal={() => setIsAddTrackModalOpen(true)}
        onOpenCreatePlaylistModal={() => setIsPlaylistModalOpen(true)}
      />

      {/* Upload & Playlist Creation Modals */}
      <CreatePlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        allTracks={allKnownTracks}
        onSave={handleCreatePlaylist}
      />

      <AddCustomTrackModal
        isOpen={isAddTrackModalOpen}
        onClose={() => setIsAddTrackModalOpen(false)}
        onAddTrack={handleAddCustomTrack}
      />
    </div>
  );
}
