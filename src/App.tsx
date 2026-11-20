import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  Disc,
  Sparkles,
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
  RepeatMode,
  Track,
} from './types/music';
import { studioAudioEngine } from './services/audioEngine';
import { backgroundAudioService } from './services/backgroundAudio';
import {
  searchCatalogWithMeta,
  lookupCatalogTracksByIds,
  fetchTrackLyrics,
  resolveYouTubeVideoId,
  POPULAR_YT_MAP,
} from './services/musicApi';

// Component imports
import { YouTubeMusicPlayer } from './components/YouTubeMusicPlayer';
import { DebugPanel } from './components/DebugPanel';
import { dbg } from './services/debugLog';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddCustomTrackModal, CreatePlaylistModal } from './components/Modals';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/AppDownloadHub';
import { PlaylistImportModal } from './components/PlaylistImportModal';
import { TrackActionModal } from './components/TrackActionModal';
import { BottomNav, BottomNavTab } from './components/ui/BottomNav';
import { DJ_INDO_TRACKS } from './data/djIndoTracks';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DJPage } from './pages/DJPage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';

// Theme Configuration
import {
  ThemeMode,
  getSavedAppTheme,
  getThemeConfig,
  applyAppTheme,
  getSavedThemeAccent,
  applyThemeAccent,
} from './theme/themeConfig';

// Desktop Experience Components (YouTube Music desktop style)
import { DesktopTopBar } from './components/desktop/DesktopTopBar';
import { DesktopSidebar } from './components/desktop/DesktopSidebar';
import { DesktopPlayerBar } from './components/desktop/DesktopPlayerBar';
import { DesktopNowPlayingStage } from './components/desktop/DesktopNowPlayingStage';

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

  // Local Playlists (Functional offline & without requiring Google Auth)
  const [localPlaylists, setLocalPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('mallsound_local_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Merged Playlists (local + cloud)
  const allPlaylists = useMemo(() => {
    const list: Playlist[] = [...localPlaylists];
    cloudPlaylists.forEach((cp) => {
      const existingIdx = list.findIndex((lp) => lp.id === cp.id);
      if (existingIdx >= 0) {
        list[existingIdx] = cp;
      } else {
        list.push(cp);
      }
    });
    return list;
  }, [localPlaylists, cloudPlaylists]);

  // Playback Queue (YouTube Music style queue)
  const [playbackQueue, setPlaybackQueue] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('mallsound_playback_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Action Sheet Modal Track
  const [actionModalTrack, setActionModalTrack] = useState<Track | null>(null);

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

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
  const [resolvedSavedTracks, setResolvedSavedTracks] = useState<Record<string, Track>>(() => {
    try {
      const saved = localStorage.getItem('mallsound_resolved_tracks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mallsound_resolved_tracks', JSON.stringify(resolvedSavedTracks));
    } catch {
      // ignore
    }
  }, [resolvedSavedTracks]);

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Audio Playback State (Restored from last session so it never resets to beginning)
  const [currentTrack, setCurrentTrack] = useState<Track>(() => {
    try {
      const saved = localStorage.getItem('mallsound_saved_track');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.id?.startsWith('trk-') && !parsed.audioUrl?.startsWith('synth://')) {
          return parsed;
        }
      }
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
        if (parsed && !parsed.id?.startsWith('trk-') && !parsed.audioUrl?.startsWith('synth://')) {
          if (parsed.durationSec) return parsed.durationSec;
        }
      }
    } catch {
      // ignore
    }
    return BUILT_IN_TRACKS[0].durationSec;
  });
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mallsound_is_shuffle');
      if (saved) return JSON.parse(saved);
    } catch {}
    return false;
  });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    try {
      const saved = localStorage.getItem('mallsound_repeat_mode');
      if (saved === 'all' || saved === 'one') return saved;
      const legacy = localStorage.getItem('mallsound_is_repeat');
      if (legacy && JSON.parse(legacy)) return 'one';
    } catch {}
    return 'off';
  });
  const isRepeat = repeatMode !== 'off';
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    try {
      const savedRate = localStorage.getItem('mallsound_playback_rate');
      if (savedRate) {
        const val = Number(savedRate);
        if (!isNaN(val) && val >= 0.5 && val <= 2.0) return val;
      }
      const savedSettings = localStorage.getItem('mallsound_dj_console_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.playbackRate && typeof parsed.playbackRate === 'number') return parsed.playbackRate;
      }
    } catch {
      // ignore
    }
    return 1.0;
  });
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Dual Playback Engine & YouTube (Default to 'yt-music' for full song playback)
  const [engineMode, setEngineMode] = useState<PlaybackEngineMode>('yt-music');
  const [currentYtVideoId, setCurrentYtVideoId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('mallsound_saved_track');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.id?.startsWith('trk-') && !parsed.audioUrl?.startsWith('synth://')) {
          if (parsed.youtubeVideoId) return parsed.youtubeVideoId;
          const cleanTitle = (parsed.title || '').toLowerCase().trim();
          for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
            if (cleanTitle.includes(key) || key.includes(cleanTitle)) return id;
          }
        }
      }
    } catch {
      // ignore
    }
    return BUILT_IN_TRACKS[0]?.youtubeVideoId || 'Ch3l_Q9PxpQ';
  });
  const [currentYtCandidates, setCurrentYtCandidates] = useState<string[]>(() => {
    return ['Ch3l_Q9PxpQ', '7Jm2Il2U-c0'];
  });
  const [ytSeekRequest, setYtSeekRequest] = useState<{ sec: number; nonce: number } | null>(null);

  // Two-player pre-roll for background playback (v48):
  // A YouTube video cannot START while its tab is hidden on mobile, but a
  // video that is already playing keeps playing when the tab hides. So a
  // second ("standby") player pre-loads the NEXT track and plays it muted
  // while the tab is still visible. At track change we flip: the standby
  // becomes audible (seek to 0 + unmute) and the old active player becomes
  // the standby for the following track. No new play() call is needed in
  // the background — only a seek + unmute on an already-playing player.
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [standbyVideoId, setStandbyVideoId] = useState<string | null>(null);
  const [standbyTrackId, setStandbyTrackId] = useState<string | null>(null);
  const [standbyCandidates, setStandbyCandidates] = useState<string[]>([]);
  const [standbySeekRequest, setStandbySeekRequest] = useState<{ sec: number; nonce: number } | null>(null);
  const [standbyIsPlaying, setStandbyIsPlaying] = useState(false);
  const [stageMode, setStageMode] = useState<'cover' | 'video'>('cover');
  const [videoStageRect, setVideoStageRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Equalizer (Auto-restored from saved settings)
  const [eqGains, setEqGains] = useState<[number, number, number, number, number]>(() => {
    try {
      const savedEq = localStorage.getItem('mallsound_eq_gains');
      if (savedEq) {
        const parsed = JSON.parse(savedEq);
        if (Array.isArray(parsed) && parsed.length === 5) {
          return parsed as [number, number, number, number, number];
        }
      }
      const savedSettings = localStorage.getItem('mallsound_dj_console_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (Array.isArray(parsed?.eqGains) && parsed.eqGains.length === 5) {
          return parsed.eqGains as [number, number, number, number, number];
        }
      }
    } catch {
      // ignore
    }
    return [0, 0, 0, 0, 0];
  });
  const [activeEqPreset, setActiveEqPreset] = useState<string>('flat');

  // Full-App Background & Accent Theme System
  const [appTheme, setAppTheme] = useState<ThemeMode>(() => getSavedAppTheme());
  const [accentColor, setAccentColor] = useState<string>(() => getSavedThemeAccent());
  const currentThemeConfig = useMemo(() => getThemeConfig(appTheme), [appTheme]);
  const isDark = !currentThemeConfig.isLight;

  const handleThemeChange = (newTheme: ThemeMode) => {
    setAppTheme(newTheme);
    applyAppTheme(newTheme, accentColor);
  };

  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [isDesktopNowPlayingExpanded, setIsDesktopNowPlayingExpanded] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  useEffect(() => {
    applyAppTheme(appTheme, accentColor);
  }, [appTheme, accentColor]);

  // Persist EQ gains & playback rate to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('mallsound_eq_gains', JSON.stringify(eqGains));
    } catch {
      // ignore
    }
  }, [eqGains]);

  useEffect(() => {
    try {
      localStorage.setItem('mallsound_playback_rate', String(playbackRate));
    } catch {
      // ignore
    }
  }, [playbackRate]);

  // Apply initial EQ & rate to Studio Audio Engine
  useEffect(() => {
    studioAudioEngine.setEqualizerGains(eqGains);
    studioAudioEngine.setPlaybackRate(playbackRate);
  }, []);

  // Synchronize exact pixel bounding rect for persistent YouTube video stage
  useEffect(() => {
    if (stageMode !== 'video') {
      setVideoStageRect(null);
      return;
    }
    const updateRect = () => {
      const targetId = isFullScreenPlayerOpen
        ? 'mallsound-video-stage-target'
        : isDesktopNowPlayingExpanded
        ? 'mallsound-desktop-stage-target'
        : null;
      if (!targetId) {
        setVideoStageRect(null);
        return;
      }
      const el = document.getElementById(targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setVideoStageRect({
            top: Math.round(r.top),
            left: Math.round(r.left),
            width: Math.round(r.width),
            height: Math.round(r.height),
          });
          return;
        }
      }
      setVideoStageRect(null);
    };

    updateRect();
    const interval = window.setInterval(updateRect, 200);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [stageMode, isFullScreenPlayerOpen, isDesktopNowPlayingExpanded]);

  // Persistent Imported Tracks (Spotify & YouTube Music)
  const [importedTracks, setImportedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('mallsound_imported_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // ── Background Audio Service Init & Handlers ──
  const handlersRef = useRef({
    onPlay: () => {},
    onPause: () => {},
    onNextTrack: () => {},
    onPrevTrack: () => {},
    onSeekTo: (_sec: number) => {},
  });

  useEffect(() => {
    handlersRef.current = {
      onPlay: () => {
        backgroundAudioService.ensureAudioActive();
        handleTogglePlay();
      },
      onPause: handleTogglePlay,
      onNextTrack: () => handleNextTrack(),
      onPrevTrack: handlePrevTrack,
      onSeekTo: (sec: number) => {
        setCurrentTimeSec(sec);
        if (engineMode === 'hifi-eq') {
          studioAudioEngine.seek(sec);
        } else {
          setYtSeekRequest({ sec, nonce: Date.now() });
        }
      },
    };
    backgroundAudioService.updateHandlers(handlersRef.current);
  });

  useEffect(() => {
    backgroundAudioService.init({
      onPlay: () => handlersRef.current.onPlay(),
      onPause: () => handlersRef.current.onPause(),
      onNextTrack: () => handlersRef.current.onNextTrack(),
      onPrevTrack: () => handlersRef.current.onPrevTrack(),
      onSeekTo: (sec) => handlersRef.current.onSeekTo(sec),
    });
    return () => backgroundAudioService.destroy();
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
  // skipVideoResolve: used on a two-player flip — the standby player already
  // has the right video loaded, so resolving a (possibly different) videoId
  // here could reload the active player while the tab is hidden. Lyrics
  // are still fetched.
  const enrichTrackMetadata = async (track: Track, skipVideoResolve = false) => {
    if (track.audioUrl.startsWith('blob:')) {
      if (!track.youtubeVideoId) return;
    }

    if (!skipVideoResolve) {
    let instantId = track.youtubeVideoId || null;
    if (!instantId) {
      const cleanTitle = (track.title || '').toLowerCase().trim();
      for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
        if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
          instantId = id;
          break;
        }
      }
    }
    if (instantId) {
      setCurrentYtVideoId(instantId);
      setCurrentYtCandidates([instantId]);
    }

    // 1. Resolve YouTube video ID in background if not instant.
    // Retries up to 3 times: in a background tab the first fetch can be
    // delayed by timer/network throttling, and a failed resolve leaves the
    // player stuck on the previous (ended) video in silence.
    if (!instantId) {
      dbg(`resolve start: "${track.title}" - ${track.artist} (hidden=${document.hidden})`);
      const startedAt = Date.now();
      const tryResolve = (attempt: number) => {
        resolveYouTubeVideoId(track.title, track.artist, track.id)
          .then((ytData) => {
            if (ytData.videoId || (ytData.candidates && ytData.candidates.length > 0)) {
              const candidateList =
                ytData.candidates && ytData.candidates.length > 0
                  ? ytData.candidates
                  : ytData.videoId
                  ? [ytData.videoId]
                  : [];
              dbg(`resolve OK: "${track.title}" -> ${ytData.videoId || candidateList[0]} in ${Date.now() - startedAt}ms (attempt ${attempt})`);
              setCurrentYtVideoId(ytData.videoId || candidateList[0]);
              setCurrentYtCandidates(candidateList);
              setCurrentTrack((prev) => {
                if (prev.id !== track.id) return prev;
                return {
                  ...prev,
                  youtubeVideoId: ytData.videoId || prev.youtubeVideoId,
                };
              });
            } else if (attempt < 3) {
              dbg(`resolve empty: "${track.title}" attempt ${attempt}, retrying...`);
              window.setTimeout(() => tryResolve(attempt + 1), 2000);
            } else {
              dbg(`resolve FAILED: "${track.title}" no videoId after 3 attempts`);
            }
          })
          .catch((err) => {
            if (attempt < 3) {
              dbg(`resolve error: "${track.title}" attempt ${attempt}, retrying...`);
              window.setTimeout(() => tryResolve(attempt + 1), 2000);
            } else {
              dbg(`resolve FAILED: "${track.title}" ${String(err)}`);
              console.warn('[App] YouTube resolution failed:', err);
            }
          });
      };
      tryResolve(1);
    } else {
      dbg(`track id instant: "${track.title}" -> ${instantId}`);
    }
    }

    // 2. Fetch lyrics independently without blocking playback
    setIsLoadingLyrics(true);
    fetchTrackLyrics(track.title, track.artist, track.durationSec)
      .then((lyricsResult) => {
        setIsLoadingLyrics(false);
        setCurrentTrack((prev) => {
          if (prev.id !== track.id) return prev;
          return {
            ...prev,
            lyrics: lyricsResult,
          };
        });
      })
      .catch(() => {
        setIsLoadingLyrics(false);
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
      ...DJ_INDO_TRACKS,
      ...BUILT_IN_TRACKS,
    ].forEach((t) => {
      const existing = map.get(t.id);
      if (!existing) {
        map.set(t.id, t);
        return;
      }
      // Prefer the entry that already has a resolved YouTube videoId
      // (e.g. from the pre-fetch into resolvedSavedTracks), so sequential
      // playback can load the next track synchronously instead of
      // re-resolving it at track-change time in a background tab.
      if (!existing.youtubeVideoId && t.youtubeVideoId) {
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
    allPlaylists.forEach((pl) => {
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
  }, [favoriteIds, localFavorites, allPlaylists, resolvedSavedTracks]);

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
    openFullScreen = false,
    contextTracks?: Track[],
    preserveQueue = false
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

    // Manage locked playback queue
    if (!preserveQueue) {
      if (contextTracks && contextTracks.length > 0) {
        const idx = contextTracks.findIndex((t) => t.id === track.id);
        const upcoming = idx !== -1
          ? contextTracks.slice(idx + 1)
          : contextTracks.filter((t) => t.id !== track.id);
        setPlaybackQueue(upcoming);
        try {
          localStorage.setItem('mallsound_playback_queue', JSON.stringify(upcoming));
        } catch {}
      } else {
        // If track was clicked directly within the active queue drawer
        const qIdx = playbackQueue.findIndex((t) => t.id === track.id);
        if (qIdx !== -1) {
          const upcoming = playbackQueue.slice(qIdx + 1);
          setPlaybackQueue(upcoming);
          try {
            localStorage.setItem('mallsound_playback_queue', JSON.stringify(upcoming));
          } catch {}
        }
      }
    }

    const isLocalBlob = track.audioUrl.startsWith('blob:');
    const targetMode: PlaybackEngineMode = isLocalBlob
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

    backgroundAudioService.ensureAudioActive();

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

    // Synchronous immediate video ID resolution for seamless playback
    let immediateYtId: string | null = track.youtubeVideoId || null;
    if (!immediateYtId) {
      const cleanTitle = (track.title || '').toLowerCase().trim();
      for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
        if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
          immediateYtId = id;
          break;
        }
      }
    }
    // Two-player flip: if the standby player already holds this track AND
    // is actually playing (muted), switch the audible role to it instead of
    // loading the video into the main player (which cannot start while hidden).
    const canFlip =
      targetMode !== 'hifi-eq' &&
      standbyVideoId !== null &&
      standbyTrackId === track.id &&
      standbyIsPlaying &&
      (immediateYtId === null || immediateYtId === standbyVideoId);
    if (canFlip) {
      const nextActive = activePlayer === 'A' ? 'B' : 'A';
      setActivePlayer(nextActive);
      setCurrentYtVideoId(standbyVideoId);
      setCurrentYtCandidates(standbyCandidates.length > 0 ? standbyCandidates : [standbyVideoId]);
      // Restart the flipped-in player from 0:00 (it has been playing muted).
      setYtSeekRequest({ sec: 0, nonce: Date.now() });
      setStandbyVideoId(null);
      setStandbyTrackId(null);
      setStandbyCandidates([]);
      setStandbyIsPlaying(false);
      dbg(`flip to standby player ${nextActive}: "${track.title}" (${standbyVideoId}) hidden=${document.hidden}`);
    } else if (immediateYtId) {
      setCurrentYtVideoId(immediateYtId);
      setCurrentYtCandidates([immediateYtId]);
    }

    setIsPlaying(true);

    dbg(`select track: "${track.title}" - ${track.artist} immediateYtId=${immediateYtId || 'NONE'} flip=${canFlip} hidden=${document.hidden}`);

    if (targetMode === 'hifi-eq') {
      studioAudioEngine.loadTrack(track, true);
    } else {
      studioAudioEngine.pause();
    }

    // On a flip, skip the video-ID resolution (the standby already has the
    // right video loaded) but still fetch lyrics.
    enrichTrackMetadata(track, canFlip);
  };

  const handleTogglePlay = () => {
    backgroundAudioService.ensureAudioActive();
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
      } else {
        // Ensure YouTube player has a valid non-null videoId
        if (!currentYtVideoId) {
          let fallbackId = currentTrack.youtubeVideoId || null;
          if (!fallbackId) {
            const cleanTitle = (currentTrack.title || '').toLowerCase().trim();
            for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
              if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
                fallbackId = id;
                break;
              }
            }
          }
          if (!fallbackId) fallbackId = 'Ch3l_Q9PxpQ';
          setCurrentYtVideoId(fallbackId);
          setCurrentYtCandidates([fallbackId]);
        }
      }
      setIsPlaying(true);
    }
  };

  const displayedTracks = useMemo(() => {
    const activePlaylist = allPlaylists.find((p) => p.id === activePlaylistId) || null;
    if (activePlaylist) {
      return allKnownTracks.filter((t) => activePlaylist.trackIds.includes(t.id));
    }
    return allKnownTracks;
  }, [allPlaylists, activePlaylistId, allKnownTracks]);

  // Pre-fetch YouTube video ID for the upcoming track in queue + arm the
  // standby (pre-roll) player with it, so the next track is already playing
  // (muted) before the tab is hidden.
  // MUST be placed AFTER displayedTracks & allKnownTracks declarations to avoid TDZ error
  useEffect(() => {
    let nextTrackToPreload: Track | null = null;
    if (playbackQueue.length > 0) {
      nextTrackToPreload = playbackQueue[0];
    } else {
      const queue = displayedTracks.length > 0 ? displayedTracks : allKnownTracks;
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      if (idx !== -1 && idx + 1 < queue.length) {
        nextTrackToPreload = queue[idx + 1];
      }
    }

    if (!nextTrackToPreload) return;

    // Arm the standby player with the next track's videoId so it can
    // start playing (muted) while the tab is still visible.
    const armStandby = (vid: string, candidates: string[]) => {
      if (vid && vid !== currentYtVideoId) {
        setStandbyTrackId(nextTrackToPreload!.id);
        setStandbyVideoId(vid);
        setStandbyCandidates(candidates.length > 0 ? candidates : [vid]);
        dbg(`standby arm: "${nextTrackToPreload!.title}" -> ${vid}`);
      }
    };

    if (nextTrackToPreload.youtubeVideoId) {
      armStandby(nextTrackToPreload.youtubeVideoId, [nextTrackToPreload.youtubeVideoId]);
      return;
    }

    const cleanTitle = (nextTrackToPreload.title || '').toLowerCase().trim();
    let immediateId: string | null = null;
    for (const [key, id] of Object.entries(POPULAR_YT_MAP)) {
      if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
        immediateId = id;
        break;
      }
    }
    if (immediateId) {
      armStandby(immediateId, [immediateId]);
      return;
    }

    const targetId = nextTrackToPreload.id;
    resolveYouTubeVideoId(nextTrackToPreload.title, nextTrackToPreload.artist, nextTrackToPreload.id)
      .then((yt) => {
        if (yt.videoId) {
          setPlaybackQueue((prev) =>
            prev.map((t) => (t.id === targetId ? { ...t, youtubeVideoId: yt.videoId! } : t))
          );
          setResolvedSavedTracks((prev) => {
            const existing = prev[targetId];
            if (existing) {
              return { ...prev, [targetId]: { ...existing, youtubeVideoId: yt.videoId! } };
            }
            return prev;
          });
          armStandby(yt.videoId, yt.candidates && yt.candidates.length > 0 ? yt.candidates : [yt.videoId]);
        }
      })
      .catch(() => {});
  }, [currentTrack.id, playbackQueue, displayedTracks, allKnownTracks]);

  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    try {
      localStorage.setItem('mallsound_is_shuffle', JSON.stringify(nextShuffle));
    } catch {}

    if (nextShuffle) {
      if (playbackQueue.length > 1) {
        setPlaybackQueue((prev) => {
          const shuffled = [...prev].sort(() => Math.random() - 0.5);
          try {
            localStorage.setItem('mallsound_playback_queue', JSON.stringify(shuffled));
          } catch {}
          return shuffled;
        });
      }
      showToast('🔀 Mode Acak (Shuffle): AKTIF');
    } else {
      showToast('➡️ Mode Acak: NONAKTIF (Putar Urut)');
    }
  };

  const handleToggleRepeat = () => {
    let nextMode: RepeatMode = 'off';
    if (repeatMode === 'off') {
      nextMode = 'all';
      showToast('🔁 Ulangi Semua: Loop Playlist Aktif');
    } else if (repeatMode === 'all') {
      nextMode = 'one';
      showToast(`🔂 Ulangi 1 Lagu: "${currentTrack.title}" diputar ulang terus`);
    } else {
      nextMode = 'off';
      showToast('➡️ Putar Ulang: NONAKTIF');
    }
    setRepeatMode(nextMode);
    try {
      localStorage.setItem('mallsound_repeat_mode', nextMode);
    } catch {}
  };

  const handleNextTrack = (fromEnded = false) => {
    // 1. REPEAT ONE check: If track finished naturally and repeat is 'one', replay current track from 0:00!
    if (fromEnded && repeatMode === 'one') {
      if (engineMode === 'hifi-eq') {
        studioAudioEngine.seek(0);
        studioAudioEngine.play();
      } else {
        setYtSeekRequest({ sec: 0, nonce: Date.now() });
      }
      setCurrentTimeSec(0);
      setIsPlaying(true);
      return;
    }

    // 2. Playback Queue priority (YouTube Music style queue)
    if (playbackQueue.length > 0) {
      let nextTrack: Track;
      if (isShuffle && playbackQueue.length > 1) {
        const randomIdx = Math.floor(Math.random() * playbackQueue.length);
        nextTrack = playbackQueue[randomIdx];
        setPlaybackQueue((prev) => {
          const updated = prev.filter((_, i) => i !== randomIdx);
          try {
            localStorage.setItem('mallsound_playback_queue', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      } else {
        nextTrack = playbackQueue[0];
        setPlaybackQueue((prev) => {
          const updated = prev.slice(1);
          try {
            localStorage.setItem('mallsound_playback_queue', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      handleSelectTrack(nextTrack, undefined, isFullScreenPlayerOpen, undefined, true);
      return;
    }

    // 3. Fallback queue resolution (DJ tracks if on DJ page, playlist tracks if playlist, else catalog)
    let queue = displayedTracks;
    if (activeTab === 'dj' && DJ_INDO_TRACKS.length > 0) {
      queue = DJ_INDO_TRACKS;
    } else if (activePlaylistId) {
      const activePlaylist = allPlaylists.find((p) => p.id === activePlaylistId);
      if (activePlaylist && activePlaylist.trackIds.length > 0) {
        queue = allKnownTracks.filter((t) => activePlaylist.trackIds.includes(t.id));
      }
    }
    if (!queue || queue.length === 0) {
      queue = allKnownTracks;
    }
    if (queue.length === 0) return;

    // 4. Shuffle selection across queue
    if (isShuffle && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      const randomTrack = candidates[Math.floor(Math.random() * candidates.length)] || queue[0];
      handleSelectTrack(randomTrack, undefined, isFullScreenPlayerOpen);
      return;
    }

    // 5. Sequential playback
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) {
      handleSelectTrack(queue[0], undefined, isFullScreenPlayerOpen);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      // Continuous Auto-Play: If queue reaches the end, loop seamlessly to start or pick from catalog
      if (queue.length > 1) {
        handleSelectTrack(queue[0], undefined, isFullScreenPlayerOpen);
      } else {
        const otherTracks = allKnownTracks.filter((t) => t.id !== currentTrack.id);
        const nextSong = otherTracks.length > 0 ? otherTracks[0] : queue[0];
        handleSelectTrack(nextSong, undefined, isFullScreenPlayerOpen);
      }
      return;
    }

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

    let queue = displayedTracks;
    if (activeTab === 'dj' && DJ_INDO_TRACKS.length > 0) {
      queue = DJ_INDO_TRACKS;
    } else if (activePlaylistId) {
      const activePlaylist = allPlaylists.find((p) => p.id === activePlaylistId);
      if (activePlaylist && activePlaylist.trackIds.length > 0) {
        queue = allKnownTracks.filter((t) => activePlaylist.trackIds.includes(t.id));
      }
    }
    if (!queue || queue.length === 0) {
      queue = allKnownTracks;
    }
    if (queue.length === 0) return;

    if (isShuffle && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      const randomTrack = candidates[Math.floor(Math.random() * candidates.length)] || queue[0];
      handleSelectTrack(randomTrack, undefined, isFullScreenPlayerOpen);
      return;
    }

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
    setEqGains((prev) => {
      const updated = [...prev] as [number, number, number, number, number];
      updated[bandIndex] = newGain;
      studioAudioEngine.setEqualizerGains(updated);
      return updated;
    });
    setActiveEqPreset('custom');
  };

  const handleApplyFullEqGains = (newGains: [number, number, number, number, number]) => {
    setEqGains(newGains);
    setActiveEqPreset('custom');
    studioAudioEngine.setEqualizerGains(newGains);
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
    const cleanTitle = data.title.trim().slice(0, 80) || 'Playlist Baru';
    const playlistId = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newPlaylist: Playlist = {
      id: playlistId,
      title: cleanTitle,
      description: data.description.trim().slice(0, 300),
      coverTheme: data.coverTheme || 'amber',
      trackIds: data.trackIds || [],
      ownerId: user ? user.uid : 'offline_user',
      ownerName: user ? (user.displayName || user.email || 'Pengguna') : 'Saya',
      isPublic: data.isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save locally immediately
    setLocalPlaylists((prev) => {
      const updated = [newPlaylist, ...prev];
      try {
        localStorage.setItem('mallsound_local_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActivePlaylistId(playlistId);
    showToast(`✓ Playlist "${newPlaylist.title}" berhasil dibuat!`);

    // 2. If user is logged in, sync to Firestore
    if (user) {
      const path = `playlists/${playlistId}`;
      try {
        await setDoc(doc(db, 'playlists', playlistId), {
          title: newPlaylist.title,
          description: newPlaylist.description,
          coverTheme: newPlaylist.coverTheme,
          trackIds: newPlaylist.trackIds.slice(0, 50),
          ownerId: user.uid,
          ownerName: newPlaylist.ownerName,
          isPublic: newPlaylist.isPublic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleCreatePlaylistWithTrack = (title: string, coverTheme: PlaylistCoverTheme, track: Track) => {
    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));
    handleCreatePlaylist({
      title,
      description: '',
      coverTheme,
      trackIds: [track.id],
      isPublic: false,
    });
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 1. Remove from local playlists
    setLocalPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== playlistId);
      try {
        localStorage.setItem('mallsound_local_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (activePlaylistId === playlistId) {
      setActivePlaylistId(null);
    }
    showToast('Playlist dihapus');

    // 2. If logged in, delete from Firestore
    if (user) {
      const path = `playlists/${playlistId}`;
      try {
        await deleteDoc(doc(db, 'playlists', playlistId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleAddTrackToPlaylist = async (playlist: Playlist, track: Track) => {
    handleAddTrackToPlaylistById(playlist.id, track);
  };

  const handleAddTrackToPlaylistById = async (playlistId: string, track: Track) => {
    setResolvedSavedTracks((prev) => ({ ...prev, [track.id]: track }));

    setLocalPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id === playlistId) {
          const currentTracks = Array.isArray(pl.trackIds) ? pl.trackIds : [];
          const exists = currentTracks.includes(track.id);
          const nextTracks = exists
            ? currentTracks.filter((id) => id !== track.id)
            : [...currentTracks, track.id];
          return { ...pl, trackIds: nextTracks };
        }
        return pl;
      });
      try {
        localStorage.setItem('mallsound_local_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user) {
      const targetPl = allPlaylists.find((p) => p.id === playlistId);
      if (targetPl) {
        const currentTracks = Array.isArray(targetPl.trackIds) ? targetPl.trackIds : [];
        const exists = currentTracks.includes(track.id);
        const nextTracks = exists
          ? currentTracks.filter((id) => id !== track.id)
          : [...currentTracks, track.id];
        try {
          await setDoc(
            doc(db, 'playlists', playlistId),
            {
              trackIds: nextTracks.slice(0, 50),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
        }
      }
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    setLocalPlaylists((prev) => {
      const updated = prev.map((pl) => {
        if (pl.id === playlistId) {
          const currentTracks = Array.isArray(pl.trackIds) ? pl.trackIds : [];
          return { ...pl, trackIds: currentTracks.filter((id) => id !== trackId) };
        }
        return pl;
      });
      try {
        localStorage.setItem('mallsound_local_playlists', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user) {
      const targetPl = allPlaylists.find((p) => p.id === playlistId);
      if (targetPl) {
        const currentTracks = Array.isArray(targetPl.trackIds) ? targetPl.trackIds : [];
        const nextTracks = currentTracks.filter((id) => id !== trackId);
        try {
          await setDoc(
            doc(db, 'playlists', playlistId),
            {
              trackIds: nextTracks,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
        }
      }
    }

    showToast('Lagu dihapus dari playlist');
  };

  const handleQueueMultipleTracks = (tracks: Track[]) => {
    setPlaybackQueue(tracks);
    try {
      localStorage.setItem('mallsound_playback_queue', JSON.stringify(tracks));
    } catch {}
    showToast(`✓ ${tracks.length} lagu dimasukkan ke antrean`);
  };

  const handlePlayNext = (track: Track) => {
    setPlaybackQueue((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered];
      try {
        localStorage.setItem('mallsound_playback_queue', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`✓ "${track.title}" akan diputar setelah ini`);
  };

  const handleAddToQueue = (track: Track) => {
    setPlaybackQueue((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [...filtered, track];
      try {
        localStorage.setItem('mallsound_playback_queue', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`✓ "${track.title}" ditambahkan ke antrean`);
  };

  const handleRemoveFromQueue = (trackId: string) => {
    setPlaybackQueue((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      try {
        localStorage.setItem('mallsound_playback_queue', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('✓ Lagu dihapus dari antrean');
  };

  const handleClearQueue = () => {
    setPlaybackQueue([]);
    try {
      localStorage.removeItem('mallsound_playback_queue');
    } catch {}
    showToast('✓ Antrean dibersihkan');
  };

  const handleStartRadio = (track: Track) => {
    handleSelectTrack(track);
    const others = allKnownTracks.filter((t) => t.id !== track.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 15);
    setPlaybackQueue(shuffled);
    try {
      localStorage.setItem('mallsound_playback_queue', JSON.stringify(shuffled));
    } catch {}
    showToast(`📻 Radio untuk "${track.title}" dimulai!`);
  };

  const handleAddCustomTrack = (track: Track) => {
    setLocalSessionTracks((prev) => [track, ...prev]);
    handleSelectTrack(track);
  };

  const handleImportPlaylistComplete = async (tracks: Track[], playlistTitle: string) => {
    // 1. Cache imported tracks in localSessionTracks
    setLocalSessionTracks((prev) => {
      const merged = [...tracks, ...prev];
      return merged.filter((t, idx, self) => self.findIndex((x) => x.id === t.id) === idx);
    });

    // 2. Persist in importedTracks folder state & localStorage
    setImportedTracks((prev) => {
      const merged = [...tracks, ...prev];
      const unique = merged.filter((t, idx, self) => self.findIndex((x) => x.id === t.id) === idx);
      try {
        localStorage.setItem('mallsound_imported_tracks', JSON.stringify(unique));
      } catch {
        // ignore
      }
      return unique;
    });

    tracks.forEach((t) => {
      setResolvedSavedTracks((prev) => ({ ...prev, [t.id]: t }));
    });

    const playlistId = `pl_import_${Date.now()}`;
    const newPlaylist: Playlist = {
      id: playlistId,
      title: playlistTitle.slice(0, 80),
      description: `Diimpor dari Spotify / YouTube (${tracks.length} lagu)`,
      coverTheme: 'indigo',
      trackIds: tracks.map((t) => t.id).slice(0, 50),
      ownerId: user?.uid || 'local',
      ownerName: user?.displayName || 'Kurator',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to cloudPlaylists state so a new folder immediately appears!
    setCloudPlaylists((prev) => [newPlaylist, ...prev]);
    setActivePlaylistId(playlistId);

    // Save as cloud playlist if user is signed in
    if (user) {
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
    <div
      style={{
        backgroundColor: currentThemeConfig.bgHex,
        color: currentThemeConfig.textPrimary,
      }}
      className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${
        currentThemeConfig.isLight ? 'light' : 'dark'
      }`}
    >
      {/* Offline PWA Indicator */}
      <OfflineIndicator />

      {/* Desktop Left Navigation Sidebar (Hidden on Mobile) */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setIsDesktopNowPlayingExpanded(false);
          setActiveTab(tab);
        }}
        playlists={allPlaylists}
        onSelectPlaylist={(plId) => {
          setIsDesktopNowPlayingExpanded(false);
          setActivePlaylistId(plId);
        }}
        onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
        onOpenImportPlaylist={() => setIsImportModalOpen(true)}
        user={user}
        onSignIn={handleGoogleSignIn}
        accentColor={accentColor}
        isNowPlayingExpanded={isDesktopNowPlayingExpanded}
        onToggleNowPlaying={() => setIsDesktopNowPlayingExpanded(!isDesktopNowPlayingExpanded)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header Bar (Search & Actions, hidden on Mobile) */}
        <DesktopTopBar
          onSearch={(queryTerm) => {
            setIsDesktopNowPlayingExpanded(false);
            setSearchQueryFromExternal(queryTerm);
            setActiveTab('search');
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenTheme={() => setActiveTab('profile')}
          onSignIn={handleGoogleSignIn}
          user={user}
          accentColor={accentColor}
        />

        {/* Main Page Body (Scrollable container with bottom padding for mini player & nav) */}
        <main className="flex-1 pb-36 md:pb-24">
        {activeTab === 'home' && (
          <HomePage
            onSelectTrack={(trk, ctx) => handleSelectTrack(trk, undefined, false, ctx)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onOpenActions={(trk) => setActionModalTrack(trk)}
            onNavigateToSearch={(queryTerm) => {
              if (queryTerm) setSearchQueryFromExternal(queryTerm);
              setActiveTab('search');
            }}
            onNavigateToDJ={() => setActiveTab('dj')}
            onNavigateToGuide={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'search' && (
          <SearchPage
            onSelectTrack={(trk, ctx) => handleSelectTrack(trk, undefined, false, ctx)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onOpenActions={(trk) => setActionModalTrack(trk)}
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
            onApplyEqGains={handleApplyFullEqGains}
            queueTracks={playbackQueue.length > 0 ? playbackQueue : (displayedTracks.length > 0 ? displayedTracks : allKnownTracks)}
            onSelectTrack={(trk, ctx) => handleSelectTrack(trk, undefined, false, ctx || DJ_INDO_TRACKS)}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onOpenActions={(trk) => setActionModalTrack(trk)}
            isShuffle={isShuffle}
            onToggleShuffle={handleToggleShuffle}
            isRepeat={isRepeat}
            repeatMode={repeatMode}
            onToggleRepeat={handleToggleRepeat}
          />
        )}

        {activeTab === 'library' && (
          <LibraryPage
            playlists={allPlaylists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={(plId) => {
              setActivePlaylistId(plId);
            }}
            onClearActivePlaylist={() => setActivePlaylistId(null)}
            onDeletePlaylist={handleDeletePlaylist}
            onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
            onOpenCreatePlaylist={() => setIsPlaylistModalOpen(true)}
            onOpenImportPlaylist={() => setIsImportModalOpen(true)}
            favoriteTracks={favoriteTracks}
            recentlyPlayed={recentlyPlayed}
            importedTracks={importedTracks}
            allTracks={allKnownTracks}
            accentColor={accentColor}
            onSelectTrack={(trk, ctx) => handleSelectTrack(trk, undefined, false, ctx)}
            onQueueTracks={handleQueueMultipleTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isTrackLiked={isTrackLiked}
            onToggleLike={handleToggleLike}
            onOpenActions={(trk) => setActionModalTrack(trk)}
            onOpenAddCustomTrack={() => setIsAddTrackModalOpen(true)}
            customTracks={cloudCustomTracks}
            onNavigateToSearch={(query) => {
              if (query) setSearchQueryFromExternal(query);
              setActiveTab('search');
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            onSignIn={handleGoogleSignIn}
            onSignOut={() => signOutUser()}
            isDark={isDark}
            onToggleTheme={() => handleThemeChange(isDark ? 'light' : 'dark')}
            currentTheme={appTheme}
            onSelectTheme={handleThemeChange}
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
      </div>

      {/* =====================================================================
          FLOATING MINI PLAYER (Docked right above BottomNav on Mobile, hidden on DJ tab)
      ===================================================================== */}
      {activeTab !== 'dj' && currentTrack && (
        <aside
          aria-label="Pemutar Musik Cepat"
          className="md:hidden fixed bottom-18 left-3 right-3 z-40 max-w-xl mx-auto bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-violet-500/40"
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
          BOTTOM NAVIGATION BAR (Mobile Only)
      ===================================================================== */}
      <div className="md:hidden">
        <BottomNav
          activeTab={activeTab}
          accentColor={accentColor}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* =====================================================================
          DESKTOP PERSISTENT PLAYER BAR (YouTube Music Desktop layout)
      ===================================================================== */}
      <DesktopPlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        currentTimeSec={currentTimeSec}
        durationSec={durationSec}
        onSeek={(sec) => {
          setCurrentTimeSec(sec);
          if (engineMode === 'hifi-eq') {
            studioAudioEngine.seek(sec);
          } else {
            setYtSeekRequest({ sec, nonce: Date.now() });
          }
        }}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        isRepeat={isRepeat}
        repeatMode={repeatMode}
        onToggleRepeat={handleToggleRepeat}
        isShuffle={isShuffle}
        onToggleShuffle={handleToggleShuffle}
        isLiked={isTrackLiked(currentTrack.id)}
        onToggleLike={handleToggleLike}
        isNowPlayingExpanded={isDesktopNowPlayingExpanded}
        onToggleNowPlaying={() => setIsDesktopNowPlayingExpanded(!isDesktopNowPlayingExpanded)}
        stageMode={stageMode}
        onSwitchStageMode={(mode) => {
          setStageMode(mode);
          if (mode === 'video') {
            setIsDesktopNowPlayingExpanded(true);
            if (engineMode !== 'yt-music') {
              handleSwitchEngineMode('yt-music');
            }
          }
        }}
        accentColor={accentColor}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* =====================================================================
          DESKTOP NOW PLAYING STAGE (Center Artwork + Right Queue/Lyrics/Related)
      ===================================================================== */}
      <DesktopNowPlayingStage
        isOpen={isDesktopNowPlayingExpanded}
        onClose={() => setIsDesktopNowPlayingExpanded(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onSelectTrack={(trk) => handleSelectTrack(trk, undefined, true)}
        queueTracks={playbackQueue.length > 0 ? playbackQueue : (displayedTracks.length > 0 ? displayedTracks : allKnownTracks)}
        stageMode={stageMode}
        onSwitchStageMode={(mode) => {
          setStageMode(mode);
          if (mode === 'video' && engineMode !== 'yt-music') {
            handleSwitchEngineMode('yt-music');
          }
        }}
        activeLyricIndex={activeLyricIndex}
        isLoadingLyrics={isLoadingLyrics}
        accentColor={accentColor}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
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
          if (mode === 'video') {
            setIsFullScreenPlayerOpen(true);
            if (engineMode !== 'yt-music') {
              handleSwitchEngineMode('yt-music');
            }
          }
        }}
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
        onToggleShuffle={handleToggleShuffle}
        isRepeat={isRepeat}
        repeatMode={repeatMode}
        onToggleRepeat={handleToggleRepeat}
        isLiked={isTrackLiked(currentTrack.id)}
        onToggleLike={handleToggleLike}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        activeLyricIndex={activeLyricIndex}
        isLoadingLyrics={isLoadingLyrics}
        queueTracks={playbackQueue}
        onSelectTrack={(trk) => handleSelectTrack(trk, undefined, true)}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onAddToQueue={handleAddToQueue}
        allAvailableTracks={allKnownTracks}
        playlists={allPlaylists}
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
        onToggleDark={() => handleThemeChange(isDark ? 'light' : 'dark')}
        currentTheme={appTheme}
        onSelectTheme={handleThemeChange}
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

      {/* =====================================================================
          SINGLETON GLOBAL YOUTUBE AUDIO/VIDEO ENGINE (Continuous Playback)
          Single permanent instance at app root, rendered top-most in DOM.
          - Stays continuously mounted across ALL screens (Home, Search, Library, DJ, Profile).
          - Holds active background playback on mobile and desktop without freezing.
          - When stageMode === 'video', matches the exact pixel bounds of the stage target!
      ===================================================================== */}
      {engineMode === 'yt-music' && (() => {
        const isVideoStageActive = Boolean(
          videoStageRect &&
          stageMode === 'video' &&
          (isFullScreenPlayerOpen || isDesktopNowPlayingExpanded)
        );
        return (
          <div
            id="mallsound-global-youtube-engine"
            aria-hidden={!isVideoStageActive}
            style={
              isVideoStageActive && videoStageRect
                ? {
                    position: 'fixed',
                    top: `${videoStageRect.top}px`,
                    left: `${videoStageRect.left}px`,
                    width: `${videoStageRect.width}px`,
                    height: `${videoStageRect.height}px`,
                    zIndex: 75,
                    opacity: 1,
                    pointerEvents: 'auto',
                  }
                : {
                    position: 'fixed',
                    bottom: '0px',
                    right: '0px',
                    width: '4px',
                    height: '4px',
                    zIndex: 1,
                    opacity: 0.05,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }
            }
            className={
              isVideoStageActive
                ? "transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                : "pointer-events-none border-0 shadow-none"
            }
          >
          {/* Two YouTube players: A and B. One is the audible "active" player,
              the other is the muted "standby" (pre-roll) player that is already
              playing the next track so a track change in the background only
              needs a seek + unmute on a playing player. */}
          <div
            className="absolute inset-0"
            style={{ opacity: activePlayer === 'A' ? 1 : 0, pointerEvents: activePlayer === 'A' ? 'auto' : 'none' }}
          >
          <YouTubeMusicPlayer
            videoId={activePlayer === 'A' ? currentYtVideoId : standbyVideoId}
            candidateIds={activePlayer === 'A' ? currentYtCandidates : standbyCandidates}
            isPlaying={activePlayer === 'A' ? isPlaying : true}
            volume={activePlayer === 'A' ? volume : 0}
            isMuted={activePlayer === 'A' ? isMuted : true}
            seekRequest={activePlayer === 'A' ? ytSeekRequest : standbySeekRequest}
            onTimeUpdate={(cur, dur) => {
              if (activePlayer === 'A') {
                setCurrentTimeSec(cur);
                if (dur > 0) {
                  if (currentTrack.durationSec > 30 && dur > currentTrack.durationSec * 2.2) {
                    setDurationSec(currentTrack.durationSec);
                  } else {
                    setDurationSec(dur);
                  }
                }
              } else {
                // Standby loop guard: keep the pre-roll playing forever so it
                // never reaches ENDED before the flip.
                if (dur > 0 && cur > dur - 15) {
                  setStandbySeekRequest({ sec: 0, nonce: Date.now() });
                }
              }
            }}
            onEnded={() => {
              if (activePlayer === 'A') handleNextTrack(true);
            }}
            onPlayingChange={(playing) => {
              if (activePlayer === 'A') {
                if (playing) {
                  setIsPlaying(true);
                }
              } else {
                setStandbyIsPlaying(playing);
                if (playing) dbg(`standby playing: ${standbyVideoId}`);
              }
            }}
            onFallbackToPreview={() => {
              if (activePlayer === 'A') {
                console.warn('[App] YouTube video unavailable, skipping to next track');
                showToast('⚠️ Lagu tidak tersedia di YouTube, memutar lagu berikutnya...');
                handleNextTrack(true);
              } else {
                dbg('standby fallback: video unavailable');
              }
            }}
          />
          </div>
          <div
            className="absolute inset-0"
            style={{ opacity: activePlayer === 'B' ? 1 : 0, pointerEvents: activePlayer === 'B' ? 'auto' : 'none' }}
          >
          <YouTubeMusicPlayer
            videoId={activePlayer === 'B' ? currentYtVideoId : standbyVideoId}
            candidateIds={activePlayer === 'B' ? currentYtCandidates : standbyCandidates}
            isPlaying={activePlayer === 'B' ? isPlaying : true}
            volume={activePlayer === 'B' ? volume : 0}
            isMuted={activePlayer === 'B' ? isMuted : true}
            seekRequest={activePlayer === 'B' ? ytSeekRequest : standbySeekRequest}
            onTimeUpdate={(cur, dur) => {
              if (activePlayer === 'B') {
                setCurrentTimeSec(cur);
                if (dur > 0) {
                  if (currentTrack.durationSec > 30 && dur > currentTrack.durationSec * 2.2) {
                    setDurationSec(currentTrack.durationSec);
                  } else {
                    setDurationSec(dur);
                  }
                }
              } else {
                if (dur > 0 && cur > dur - 15) {
                  setStandbySeekRequest({ sec: 0, nonce: Date.now() });
                }
              }
            }}
            onEnded={() => {
              if (activePlayer === 'B') handleNextTrack(true);
            }}
            onPlayingChange={(playing) => {
              if (activePlayer === 'B') {
                if (playing) {
                  setIsPlaying(true);
                }
              } else {
                setStandbyIsPlaying(playing);
                if (playing) dbg(`standby playing: ${standbyVideoId}`);
              }
            }}
            onFallbackToPreview={() => {
              if (activePlayer === 'B') {
                console.warn('[App] YouTube video unavailable, skipping to next track');
                showToast('⚠️ Lagu tidak tersedia di YouTube, memutar lagu berikutnya...');
                handleNextTrack(true);
              } else {
                dbg('standby fallback: video unavailable');
              }
            }}
          />
          </div>
        </div>
      );
    })()}

      {/* =====================================================================
          YOUTUBE MUSIC STYLE TRACK ACTION MODAL (Bottom Sheet)
      ===================================================================== */}
      <TrackActionModal
        isOpen={Boolean(actionModalTrack)}
        onClose={() => setActionModalTrack(null)}
        track={actionModalTrack}
        isLiked={actionModalTrack ? isTrackLiked(actionModalTrack.id) : false}
        onToggleLike={(trk) => handleToggleLike(trk)}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onStartRadio={handleStartRadio}
        playlists={allPlaylists}
        onAddTrackToPlaylist={handleAddTrackToPlaylistById}
        onCreatePlaylistWithTrack={handleCreatePlaylistWithTrack}
        onShowToast={showToast}
      />

      {/* =====================================================================
          FLOATING TOAST NOTIFICATION
      ===================================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full border border-white/20 shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-fade-in"
        >
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Debug panel (?debug=1) — shows what the player did in background */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug') && <DebugPanel />}
    </div>
  );
}

export default App;
