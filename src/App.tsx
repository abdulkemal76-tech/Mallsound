import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  Disc,
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
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
import { backgroundAudioService } from './services/backgroundAudio';
import {
  searchCatalogWithMeta,
  lookupCatalogTracksByIds,
  fetchTrackLyrics,
  resolveYouTubeVideoId,
} from './services/musicApi';

// Component imports
import { YouTubeMusicPlayer } from './components/YouTubeMusicPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddCustomTrackModal, CreatePlaylistModal } from './components/Modals';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/AppDownloadHub';
import { PlaylistImportModal } from './components/PlaylistImportModal';
import { BottomNav, BottomNavTab } from './components/ui/BottomNav';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DJPage } from './pages/DJPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';

// Theme Configuration
import { getSavedThemeAccent, applyThemeAccent } from './theme/themeConfig';

type PlaybackEngineMode = 'hifi-eq' | 'yt-music';

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

export function App() {
  // Navigation State (Restored from last session)
  const [activeTab, setActiveTab] = useState<BottomNavTab>(() => {
    try {
      const saved = localStorage.getItem('mallsound_active_tab') as BottomNavTab;
      if (['home', 'search', 'dj', 'library', 'profile'].includes(saved)) return saved;
    } catch {
      // ignore
    }
    return 'home';
  });
  const [searchQueryFromExternal, setSearchQueryFromExternal] = useState<string>('');

  // Firebase Auth & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authBannerError, setAuthBannerError] = useState<string | null>(null);

  // Cloud collections
  const [cloudPlaylists, setCloudPlaylists] = useState<Playlist[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Record<string, string>>({}); // trackId -> docId
  const [cloudCustomTracks, setCloudCustomTracks] = useState<Track[]>([]);

  // Local state fallback
  const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mallsound_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('mallsound_recently_played');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [crossfadeSec, setCrossfadeSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mallsound_crossfade');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Track caches
  const [catalogTracks, setCatalogTracks] = useState<Track[]>(BUILT_IN_TRACKS);
  const [localSessionTracks, setLocalSessionTracks] = useState<Track[]>([]);
  const [resolvedSavedTracks, setResolvedSavedTracks] = useState<Record<string, Track>>({});
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Audio Playback State (Restored from last session so it never resets to beginning)
  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    try {
      const saved = localStorage.getItem('mallsound_saved_track');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return BUILT_IN_TRACKS[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mallsound_saved_time');
      if (saved) return Number(saved) || 0;
    } catch {
      // ignore
    }
    return 0;
  });
  const [durationSec, setDurationSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mallsound_saved_track');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.durationSec) return parsed.durationSec;
      }
    } catch {
      // ignore
    }
    return BUILT_IN_TRACKS[0].durationSec;
  });
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Dual Playback Engine & YouTube (Default to 'yt-music' for full song playback)
  const [engineMode, setEngineMode] = useState<PlaybackEngineMode>('yt-music');
  const [currentYtVideoId, setCurrentYtVideoId] = useState<string | null>(null);
  const [currentYtCandidates, setCurrentYtCandidates] = useState<string[]>([]);
  const [ytSeekRequest, setYtSeekRequest] = useState<{ sec: number; nonce: number } | null>(null);
  const [stageMode, setStageMode] = useState<'cover' | 'video'>('cover');

  // Equalizer
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>([0, 0, 0, 0, 0]);
  const [activeEqPreset, setActiveEqPreset] = useState<string>('flat');

  // Theme & Modals
  const [isDark, setIsDark] = useState(true);
  const [accentColor, setAccentColor] = useState<string>(() => getSavedThemeAccent());

  useEffect(() => {
    applyThemeAccent(accentColor);
  }, [accentColor]);

  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Sync localFavorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mallsound_favorites', JSON.stringify(localFavorites));
    } catch {
      // ignore
    }
  }, [localFavorites]);

  // Sync crossfade to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mallsound_crossfade', String(crossfadeSec));
    } catch {
      // ignore
    }
  }, [crossfadeSec]);

  // ── Auto-Save Active Tab to localStorage ──
  useEffect(() => {
    try {
      localStorage.setItem('mallsound_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // ── Auto-Save Current Track to localStorage so playback never resets ──
  useEffect(() => {
    if (currentTrack && currentTrack.id) {
      try {
        localStorage.setItem('mallsound_saved_track', JSON.stringify(currentTrack));
      } catch {
        // ignore
      }
    }
  }, [currentTrack]);

  // ── Auto-Save Playback Position to localStorage ──
  useEffect(() => {
    if (currentTimeSec > 0) {
      try {
        localStorage.setItem('mallsound_saved_time', String(Math.floor(currentTimeSec)));
      } catch {
        // ignore
      }
    }
  }, [currentTimeSec]);

  // ── Background Audio Service Init ──
  // Runs once on mount to register Media Session handlers and enable
  // lock-screen controls / notification media controls on Android & iOS.
  useEffect(() => {
    backgroundAudioService.init({
      onPlay: handleTogglePlay,
      onPause: handleTogglePlay,
      onNextTrack: () => handleNextTrack(),
      onPrevTrack: handlePrevTrack,
      onSeekTo: (sec) => {
        setCurrentTimeSec(sec);
        if (engineMode === 'hifi-eq') {
          studioAudioEngine.seek(sec);
        } else {
          setYtSeekRequest({ sec, nonce: Date.now() });
        }
      },
    });
    return () => backgroundAudioService.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Media Session: Update now playing metadata on track change ──
  useEffect(() => {
    backgroundAudioService.updateNowPlaying(currentTrack);
  }, [currentTrack]);

  // ── Media Session: Update playback state + Wake Lock on play/pause ──
  useEffect(() => {
    backgroundAudioService.updatePlaybackState(isPlaying);
    if (isPlaying) {
      backgroundAudioService.acquireWakeLock();
    } else {
      backgroundAudioService.releaseWakeLock();
    }
  }, [isPlaying]);

  // ── Media Session: Update position state for lock screen progress bar ──
  useEffect(() => {
    backgroundAudioService.updatePositionState(currentTimeSec, durationSec, playbackRate);
    // Throttled — runs every time currentTimeSec changes (driven by audio engine)
  }, [currentTimeSec, durationSec, playbackRate]);

  // Initial catalog load: Fresh viral hits (Bernadya, Sal Priadi, Juicy Luicy, Mahalini, Nadin Amizah)
  useEffect(() => {
    let cancelled = false;
    async function loadInitialCatalog() {
      try {
        const [bernadyaRes, salPriadiRes, juicyLuicyRes] = await Promise.all([
          searchCatalogWithMeta('Bernadya', 8),
          searchCatalogWithMeta('Sal Priadi', 8),
          searchCatalogWithMeta('Juicy Luicy', 8),
        ]);

        if (cancelled) return;

        const merged: Track[] = [];
        const seen = new Set<string>();
        const maxLen = Math.max(
          bernadyaRes.tracks.length,
          salPriadiRes.tracks.length,
          juicyLuicyRes.tracks.length
        );

        for (let i = 0; i < maxLen; i++) {
          if (bernadyaRes.tracks[i] && !seen.has(bernadyaRes.tracks[i].id)) {
            seen.add(bernadyaRes.tracks[i].id);
            merged.push(bernadyaRes.tracks[i]);
          }
          if (salPriadiRes.tracks[i] && !seen.has(salPriadiRes.tracks[i].id)) {
            seen.add(salPriadiRes.tracks[i].id);
            merged.push(salPriadiRes.tracks[i]);
          }
          if (juicyLuicyRes.tracks[i] && !seen.has(juicyLuicyRes.tracks[i].id)) {
            seen.add(juicyLuicyRes.tracks[i].id);
            merged.push(juicyLuicyRes.tracks[i]);
          }
        }

        if (merged.length > 0) {
          setCatalogTracks(merged);
          // Only set first track as currentTrack if user does NOT have a saved track in localStorage!
          const hasSavedTrack = localStorage.getItem('mallsound_saved_track');
          if (!hasSavedTrack) {
            setCurrentTrack(merged[0]);
            setDurationSec(merged[0].durationSec);
            enrichTrackMetadata(merged[0]);
          } else {
            // Enrich the restored saved track with lyrics & video
            try {
              const saved = JSON.parse(hasSavedTrack);
              enrichTrackMetadata(saved);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // fallback to BUILT_IN_TRACKS
      }
    }
    loadInitialCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Enrich track with synced lyrics (.lrc) + YouTube Music videoId
  const enrichTrackMetadata = async (track: Track) => {
    if (track.audioUrl.startsWith('synth://') || track.audioUrl.startsWith('blob:')) return;
    setIsLoadingLyrics(true);
    const [lyricsResult, ytData] = await Promise.all([
      fetchTrackLyrics(track.title, track.artist, track.durationSec),
      resolveYouTubeVideoId(track.title, track.artist, track.id),
    ]);
    setIsLoadingLyrics(false);
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

  // Combined Track Dictionary
  const allKnownTracks = useMemo(() => {
    const map = new Map<string, Track>();
    [
      ...localSessionTracks,
      ...cloudCustomTracks,
      ...catalogTracks,
      ...recentlyPlayed,
      ...Object.values(resolvedSavedTracks),
      ...BUILT_IN_TRACKS,
    ].forEach((t) => {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [localSessionTracks, cloudCustomTracks, catalogTracks, recentlyPlayed, resolvedSavedTracks]);

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
  }, [favoriteIds, localFavorites, cloudPlaylists, resolvedSavedTracks]);

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
    openFullScreen = false
  ) => {
    // Add to recently played
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('mallsound_recently_played', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

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
    return allKnownTracks;
  }, [cloudPlaylists, activePlaylistId, allKnownTracks]);

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
    if (!user) return;
    if (playlist.trackIds.includes(track.id)) return;
    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));
    const path = `playlists/${playlist.id}`;
    try {
      await setDoc(
        doc(db, 'playlists', playlist.id),
        {
          trackIds: [...playlist.trackIds, track.id].slice(0, 50),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddCustomTrack = (track: Track) => {
    setLocalSessionTracks((prev) => [track, ...prev]);
    handleSelectTrack(track);
  };

  const handleImportPlaylistComplete = async (tracks: Track[], playlistTitle: string) => {
    // Cache imported tracks in localSessionTracks
    setLocalSessionTracks((prev) => {
      const merged = [...tracks, ...prev];
      return merged.filter((t, idx, self) => self.findIndex((x) => x.id === t.id) === idx);
    });

    tracks.forEach((t) => {
      setResolvedSavedTracks((prev) => ({ ...prev, [t.id]: t }));
    });

    // Save as cloud playlist if user is signed in
    if (user) {
      const playlistId = `pl_import_${Date.now()}`;
      try {
        await setDoc(doc(db, 'playlists', playlistId), {
          title: playlistTitle.slice(0, 80),
          description: `Diimpor dari Spotify / YouTube (${tracks.length} lagu)`,
          coverTheme: 'indigo',
          trackIds: tracks.map((t) => t.id).slice(0, 50),
          ownerId: user.uid,
          ownerName: user.displayName || 'Kurator',
          isPublic: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setActivePlaylistId(playlistId);
      } catch (err) {
        console.warn('Failed to save imported playlist to firestore:', err);
      }
    }

    if (tracks.length > 0) {
      handleSelectTrack(tracks[0], undefined, false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthBannerError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google';
      setAuthBannerError(msg);
    }
  };

  // Favorite tracks derived list
  const favoriteTracks = useMemo(() => {
    return allKnownTracks.filter((t) =>
      user ? Boolean(favoriteIds[t.id]) : localFavorites.includes(t.id)
    );
  }, [allKnownTracks, user, favoriteIds, localFavorites]);

  // Active lyric index calculation
  const activeLyricIndex = useMemo(() => {
    if (!currentTrack.lyrics || currentTrack.lyrics.length === 0) return -1;
    for (let i = currentTrack.lyrics.length - 1; i >= 0; i--) {
      if (currentTimeSec >= currentTrack.lyrics[i].timeSec) {
        return i;
      }
    }
    return 0;
  }, [currentTrack.lyrics, currentTimeSec]);

  // Progress percentage for mini player
  const progressPercent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;

  return (
    <div className={`min-h-screen bg-neutral-950 text-white flex flex-col font-sans ${isDark ? 'dark' : ''}`}>
      {/* Offline PWA Indicator */}
      <OfflineIndicator />

      {/* Main Page Body (Scrollable container with bottom padding for mini player & nav) */}
      <main className="flex-1 pb-36">
        {activeTab === 'home' && (
          <HomePage
            onSelectTrack={(trk) => handleSelectTrack(trk, undefined, false)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onNavigateToSearch={(queryTerm) => {
              if (queryTerm) setSearchQueryFromExternal(queryTerm);
              setActiveTab('search');
            }}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            onSelectTrack={(trk) => handleSelectTrack(trk, undefined, false)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            initialQuery={searchQueryFromExternal}
          />
        )}

        {activeTab === 'dj' && (
          <DJPage
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTimeSec={currentTimeSec}
            durationSec={durationSec}
            onTogglePlay={handleTogglePlay}
            onSeek={(sec) => {
              setCurrentTimeSec(sec);
              if (engineMode === 'hifi-eq') {
                studioAudioEngine.seek(sec);
              } else {
                setYtSeekRequest({ sec, nonce: Date.now() });
              }
            }}
            onNextTrack={() => handleNextTrack()}
            onPrevTrack={handlePrevTrack}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            eqGains={eqGains}
            onEqBandChange={handleEqBandChange}
            queueTracks={displayedTracks.length > 0 ? displayedTracks : allKnownTracks}
            onSelectTrack={(trk) => handleSelectTrack(trk, undefined, false)}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            isRepeat={isRepeat}
            onToggleRepeat={() => setIsRepeat(!isRepeat)}
          />
        )}

        {activeTab === 'library' && (
          <LibraryPage
            playlists={cloudPlaylists}
            onSelectPlaylist={(plId) => {
              setActivePlaylistId(plId);
            }}
            onDeletePlaylist={handleDeletePlaylist}
            onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
            onOpenImportPlaylist={() => setIsImportModalOpen(true)}
            favoriteTracks={favoriteTracks}
            recentlyPlayed={recentlyPlayed}
            onSelectTrack={(trk) => handleSelectTrack(trk, undefined, false)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onOpenAddCustomTrack={() => setIsAddTrackModalOpen(true)}
            customTracks={cloudCustomTracks}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            onSignIn={handleGoogleSignIn}
            onSignOut={() => signOutUser()}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            accentColor={accentColor}
            onAccentColorChange={(hex) => setAccentColor(hex)}
            eqGains={eqGains}
            activeEqPreset={activeEqPreset}
            onEqBandChange={handleEqBandChange}
            onApplyEqPreset={handleApplyEqPreset}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            sleepTimerMinutes={sleepTimerMinutes}
            onSetSleepTimer={setSleepTimerMinutes}
            crossfadeSec={crossfadeSec}
            onCrossfadeChange={setCrossfadeSec}
          />
        )}
      </main>

      {/* =====================================================================
          FLOATING MINI PLAYER (Docked right above BottomNav, hidden on DJ tab)
      ===================================================================== */}
      {activeTab !== 'dj' && currentTrack && (
        <aside
          aria-label="Pemutar Musik Cepat"
          className="fixed bottom-18 left-3 right-3 z-40 max-w-xl mx-auto bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-violet-500/40"
          onClick={() => setIsFullScreenPlayerOpen(true)}
        >
          {/* Top border progress bar */}
          <div className="w-full h-1 bg-white/10">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: accentColor || '#8b5cf6',
                boxShadow: `0 0 8px ${accentColor || '#8b5cf6'}`,
              }}
            />
          </div>

          <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
            {/* Left: Cover & Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-md">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: accentColor || '#8b5cf6' }}
                  >
                    <Disc className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div
                      className="w-2 h-2 rounded-full animate-ping"
                      style={{ backgroundColor: accentColor || '#8b5cf6' }}
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => handleToggleLike(currentTrack, e)}
                className={`p-2 rounded-full transition-colors ${
                  isTrackLiked(currentTrack.id)
                    ? 'text-pink-500'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={isTrackLiked(currentTrack.id) ? 'Hapus dari Favorit' : 'Suka'}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isTrackLiked(currentTrack.id) ? 'currentColor' : 'none'}
                />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 transition-all"
                style={{
                  backgroundColor: accentColor || '#8b5cf6',
                  boxShadow: `0 0 16px ${accentColor ? `${accentColor}66` : 'rgba(139, 92, 246, 0.4)'}`,
                }}
                title={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNextTrack()}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                title="Lagu Berikutnya"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* =====================================================================
          BOTTOM NAVIGATION BAR
      ===================================================================== */}
      <BottomNav
        activeTab={activeTab}
        accentColor={accentColor}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* =====================================================================
          FULLSCREEN PLAYER MODAL (Holds YouTube Stage Slot for continuity)
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
              onTimeUpdate={(cur, dur) => {
                setCurrentTimeSec(cur);
                setDurationSec(dur);
              }}
              onEnded={() => handleNextTrack(true)}
              onPlayingChange={(playing) => setIsPlaying(playing)}
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
            setYtSeekRequest({ sec, nonce: Date.now() });
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
          SETTINGS MODAL
      ===================================================================== */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        accentColor={accentColor}
        onAccentColorChange={(hex) => setAccentColor(hex)}
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

      {/* =====================================================================
          PLAYLIST IMPORT MODAL (Spotify & YouTube Music URLs)
      ===================================================================== */}
      <PlaylistImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportPlaylistComplete}
      />

      {/* =====================================================================
          PLAYLIST CREATION MODAL
      ===================================================================== */}
      <CreatePlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        allTracks={allKnownTracks}
        onSave={handleCreatePlaylist}
      />

      {/* =====================================================================
          CUSTOM TRACK UPLOAD MODAL
      ===================================================================== */}
      <AddCustomTrackModal
        isOpen={isAddTrackModalOpen}
        onClose={() => setIsAddTrackModalOpen(false)}
        onAddTrack={handleAddCustomTrack}
      />
    </div>
  );
}

export default App;
