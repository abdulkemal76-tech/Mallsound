import React, { useEffect, useRef } from 'react';
import { dbg } from '../services/debugLog';

// Persistent play watchdog: keep retrying playVideo() (muted while the tab
// is hidden) for up to 120 s after a track load. Background tabs throttle
// timers, so the old 6 s retry window could expire before a single retry
// ran — and the later unmuted retries were blocked by autoplay policy,
// leaving the new track stuck on CUED/PAUSED until the user reopened the tab.
const WATCHDOG_MAX_MS = 120000;

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
}

interface YouTubeMusicPlayerProps {
  videoId: string | null;
  candidateIds?: string[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  seekRequest: { sec: number; nonce: number } | null;
  onTimeUpdate: (currentSec: number, durationSec: number) => void;
  onEnded: () => void;
  onPlayingChange: (playing: boolean) => void;
  onFallbackToPreview?: () => void;
}

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({
  videoId,
  candidateIds = [],
  isPlaying,
  volume,
  isMuted,
  seekRequest,
  onTimeUpdate,
  onEnded,
  onPlayingChange,
  onFallbackToPreview,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const readyRef = useRef(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const candidateIndexRef = useRef<number>(0);
  const candidatesRef = useRef<string[]>(candidateIds);
  const isPlayingPropRef = useRef<boolean>(isPlaying);

  // === STALE CLOSURE FIX ===
  // The YouTube player's onStateChange is a closure created once at player init.
  // If we capture `onEnded` directly, it will always see the state from the first render.
  // Using refs ensures onStateChange always calls the LATEST callback version.
  const onEndedRef = useRef(onEnded);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onFallbackToPreviewRef = useRef(onFallbackToPreview);

  const hasEndedTriggeredRef = useRef(false);
  const ignoreEndUntilRef = useRef<number>(0);
  const lastLoadedAtRef = useRef<number>(Date.now());
  const lastWatchdogLogRef = useRef<number>(0);

  // Mute state probe (for the debug log) and a "make sure this play
  // attempt is muted" helper. Chrome's autoplay check treats a video as
  // muted when it is muted OR its volume is 0, so we do both — if the
  // YT player's mute flag doesn't stick to a freshly cued video,
  // setVolume(0) is the second line of defence.
  const getMuteState = () => {
    try {
      const p = playerRef.current as unknown as { isMuted?: () => boolean; getVolume?: () => number } | null;
      return {
        muted: typeof p?.isMuted === 'function' ? p.isMuted() : null,
        vol: typeof p?.getVolume === 'function' ? p.getVolume() : null,
      };
    } catch {
      return { muted: null, vol: null };
    }
  };
  const muteForBackground = (target: YTPlayerInstance) => {
    try { target.setVolume(0); } catch {}
    try { target.mute(); } catch {}
  };

  const triggerEndedOnce = (reason: string) => {
    if (hasEndedTriggeredRef.current) return;
    if (Date.now() < ignoreEndUntilRef.current) return;
    hasEndedTriggeredRef.current = true;
    console.log(`[YouTube Player] ⏩ Track ended trigger: ${reason}`);
    onEndedRef.current();
  };

  // Keep all callback refs up-to-date every render (no dep array = runs every render)
  useEffect(() => {
    onEndedRef.current = onEnded;
    onPlayingChangeRef.current = onPlayingChange;
    onTimeUpdateRef.current = onTimeUpdate;
    onFallbackToPreviewRef.current = onFallbackToPreview;
    isPlayingPropRef.current = isPlaying;
  });

  useEffect(() => {
    const list = candidateIds.length > 0 ? candidateIds : videoId ? [videoId] : [];
    candidatesRef.current = list;
    const found = videoId ? list.indexOf(videoId) : -1;
    candidateIndexRef.current = found >= 0 ? found : 0;
  }, [videoId, candidateIds]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // Initialize or update videoId
  useEffect(() => {
    if (!videoId) return;

    let timerId: number | null = null;

    const initOrLoad = () => {
      if (!window.YT || !window.YT.Player) {
        timerId = window.setTimeout(initOrLoad, 150);
        return;
      }

      if (playerRef.current && readyRef.current) {
        if (currentVideoIdRef.current !== videoId) {
          currentVideoIdRef.current = videoId;
          hasEndedTriggeredRef.current = false;
          lastLoadedAtRef.current = Date.now();
          ignoreEndUntilRef.current = Date.now() + 3500;
          dbg(`YT loadVideoById: ${videoId} hidden=${document.hidden}`);
          try {
            // CUE instead of LOAD: loadVideoById fires an immediate (unmuted)
            // autoplay attempt that races the mute() below — in a hidden tab
            // Chrome blocks that unmuted attempt and the player gets stuck
            // on UNSTARTED (-1) while every later playVideo() is ignored.
            // cueVideoById only loads the video (state CUED); we then mute
            // first and play explicitly, so the play attempt is muted.
            const cue = (playerRef.current as unknown as { cueVideoById?: (id: string) => void }).cueVideoById;
            if (typeof cue === 'function') {
              cue.call(playerRef.current, videoId);
            } else {
              playerRef.current.loadVideoById(videoId);
            }
          } catch {
            // ignore
          }
          if (isPlayingPropRef.current) {
            try {
              if (document.hidden) {
                muteForBackground(playerRef.current);
              }
              playerRef.current.playVideo();
            } catch {}
          } else {
            try {
              playerRef.current.pauseVideo();
            } catch {}
          }
        }
        return;
      }

      if (!containerRef.current) return;
      currentVideoIdRef.current = videoId;
      hasEndedTriggeredRef.current = false;
      lastLoadedAtRef.current = Date.now();
      ignoreEndUntilRef.current = Date.now() + 3500;

      playerRef.current = new window.YT.Player(containerRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: isPlayingPropRef.current ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          widget_referrer: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            hasEndedTriggeredRef.current = false;
            lastLoadedAtRef.current = Date.now();
            ignoreEndUntilRef.current = Date.now() + 3500;
            try {
              const iframe = (e.target as any).getIframe?.();
              if (iframe) {
                iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                iframe.setAttribute(
                  'allow',
                  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                );
              }
            } catch {
              // ignore
            }
            e.target.setVolume(Math.round(volume * 100));
            if (isMuted) {
              e.target.mute();
            } else {
              e.target.unMute();
            }
            if (isPlayingPropRef.current) {
              if (document.hidden) {
                try { e.target.mute(); } catch {}
              }
              try {
                e.target.playVideo();
              } catch {
                // ignore
              }
            }
          },
          onStateChange: (e) => {
            dbg(`YT state: ${e.data} (0=ENDED 1=PLAYING 2=PAUSED 3=BUFFERING 5=CUED -1=UNSTARTED) hidden=${document.hidden}`);
            if (e.data === 0) {
              // ENDED
              triggerEndedOnce('onStateChange ENDED (data=0)');
            } else if (e.data === 5 || e.data === -1) {
              // State 5 = CUED, State -1 = UNSTARTED
              // In mobile background tabs, YouTube defaults to CUED or UNSTARTED.
              // Force playVideo() with muted bypass if document is hidden:
              if (isPlayingPropRef.current) {
                if (document.hidden) {
                  muteForBackground(e.target);
                }
                try {
                  e.target.playVideo();
                } catch {
                  // ignore
                }
              }
            } else if (e.data === 1) {
              // State 1 = PLAYING
              onPlayingChangeRef.current(true);
              if (!isMuted && volume > 0) {
                setTimeout(() => {
                  try {
                    e.target.unMute();
                    e.target.setVolume(Math.round(volume * 100));
                  } catch {}
                }, 250);
              }

              const dur = e.target.getDuration();
              const cur = e.target.getCurrentTime() || 0;
              if (dur > 0) {
                onTimeUpdateRef.current(cur, dur);
                if (dur > 5 && cur < dur - 5) {
                  hasEndedTriggeredRef.current = false;
                }
              }
            } else if (e.data === 2) {
              // State 2 = PAUSED
              const cur = e.target.getCurrentTime() || 0;
              const dur = e.target.getDuration() || 0;
              if (dur > 5 && cur >= dur - 1.2 && Date.now() > ignoreEndUntilRef.current) {
                triggerEndedOnce(`onStateChange PAUSED at end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)})`);
                return;
              }

              if (isPlayingPropRef.current && Date.now() - lastLoadedAtRef.current < WATCHDOG_MAX_MS) {
                if (document.hidden) {
                  muteForBackground(e.target);
                }
                try {
                  e.target.playVideo();
                } catch {}
              }
              // Never report a background auto-pause as a user pause:
              // the app must keep expecting playback so watchdogs keep retrying.
              if (!document.hidden) {
                onPlayingChangeRef.current(false);
              }
            }
          },
          onError: (e) => {
            console.warn('[YouTube Player] Error code:', e.data, 'Current ID:', currentVideoIdRef.current);
            hasEndedTriggeredRef.current = false;
            lastLoadedAtRef.current = Date.now();
            ignoreEndUntilRef.current = Date.now() + 3500;
            const list = candidatesRef.current;
            const nextIdx = candidateIndexRef.current + 1;
            if (nextIdx < list.length) {
              candidateIndexRef.current = nextIdx;
              const nextVid = list[nextIdx];
              currentVideoIdRef.current = nextVid;
              try {
                if (document.hidden) {
                  muteForBackground(e.target);
                }
                const cueNext = (e.target as unknown as { cueVideoById?: (id: string) => void }).cueVideoById;
                if (typeof cueNext === 'function') {
                  cueNext.call(e.target, nextVid);
                } else {
                  e.target.loadVideoById(nextVid);
                }
                if (isPlayingPropRef.current) {
                  if (document.hidden) {
                    muteForBackground(e.target);
                  }
                  e.target.playVideo();
                }
              } catch {
                // ignore
              }
            } else {
              console.warn('[YouTube Player] All candidate videos failed or unavailable, advancing queue');
              onFallbackToPreviewRef.current?.();
            }
          },
        },
      });
    };

    initOrLoad();
    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [videoId]);

  // Sync Play / Pause state
  useEffect(() => {
    if (!playerRef.current || !readyRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Sync Volume / Mute
  useEffect(() => {
    if (!playerRef.current || !readyRef.current) return;
    try {
      playerRef.current.setVolume(Math.round(volume * 100));
      if (isMuted || volume === 0) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch {
      // ignore
    }
  }, [volume, isMuted]);

  // Sync Seek Request
  useEffect(() => {
    if (!seekRequest || !playerRef.current || !readyRef.current) return;
    try {
      hasEndedTriggeredRef.current = false;
      ignoreEndUntilRef.current = Date.now() + 1500;
      playerRef.current.seekTo(seekRequest.sec, true);
      if (isPlayingPropRef.current) {
        playerRef.current.playVideo();
      }
    } catch {
      // ignore
    }
  }, [seekRequest]);

  // Active progress poller & end-of-track detection (runs every 250ms)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!playerRef.current || !readyRef.current || !isPlaying) return;
      try {
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (dur > 0) {
          onTimeUpdate(cur, dur);

          // Proactive queue advance if video reaches the end
          if (dur > 5 && cur >= dur - 0.75 && Date.now() > ignoreEndUntilRef.current) {
            triggerEndedOnce(`progress reached end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)})`);
          }
        }
      } catch {
        // ignore
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, onTimeUpdate]);

  // Aggressive background playback poller & wake-up watchdog (runs every 400ms even in background tabs)
  useEffect(() => {
    const resumeInterval = window.setInterval(() => {
      if (!isPlayingPropRef.current || !playerRef.current || !readyRef.current) return;
      try {
        const timeSinceLoad = Date.now() - lastLoadedAtRef.current;
        const stateGetter = (playerRef.current as unknown as { getPlayerState?: () => number }).getPlayerState;
        const st = typeof stateGetter === 'function' ? stateGetter.call(playerRef.current) : -1;
        const cur = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() || 0 : 0;
        const dur = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() || 0 : 0;

        // 1. RECENTLY LOADED AUTO-START (Essential for background playback on mobile):
        // When a new video is loaded in background, mobile browsers pause or cue it (st: 5, -1, 2).
        // Force playVideo() (muted while hidden) until playback actually starts (st === 1),
        // for up to WATCHDOG_MAX_MS — background tabs throttle timers, so a 6 s window
        // could expire before a single retry ran.
        if (timeSinceLoad < WATCHDOG_MAX_MS && st !== 1) {
          if (Date.now() - lastWatchdogLogRef.current > 5000) {
            lastWatchdogLogRef.current = Date.now();
            const ms = getMuteState();
            dbg(`watchdog retry play: st=${st} muted=${ms.muted} vol=${ms.vol} sinceLoad=${Math.round(timeSinceLoad / 1000)}s hidden=${document.hidden}`);
          }
          if (document.hidden) {
            muteForBackground(playerRef.current);
          }
          try {
            playerRef.current.playVideo();
          } catch {}
          return;
        }

        // 2. ENDED DETECTION: If state is ENDED (0), or reached end of duration in background
        if (Date.now() > ignoreEndUntilRef.current) {
          if (st === 0) {
            triggerEndedOnce('background watchdog st === 0 (ENDED)');
            return;
          }
          if (dur > 5 && (cur >= dur - 0.8 || (st === 2 && cur >= dur - 1.5))) {
            triggerEndedOnce(`background watchdog reached end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)}, st=${st})`);
            return;
          }
        }

        // 3. MID-TRACK PAUSE REVIVAL: If unexpectedly paused/cued while document is hidden and NOT at track end
        const isBackground = document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus());
        if (isBackground && (st === 2 || st === 5 || st === -1) && (dur <= 0 || cur < dur - 2.5)) {
          // Unmuted playVideo() is blocked by autoplay policy in background tabs —
          // always mute first while hidden; the PLAYING handler unmutes after start.
          if (document.hidden) {
            muteForBackground(playerRef.current);
          }
          playerRef.current.playVideo();
        }
      } catch {
        // ignore
      }
    }, 400);

    return () => window.clearInterval(resumeInterval);
  }, []);

  // Immediate revival on visibility change or window focus
  useEffect(() => {
    const handleVisOrFocus = () => {
      dbg(`visibility: ${document.visibilityState} focus=${document.hasFocus()} isPlaying=${isPlayingPropRef.current}`);
      if (isPlayingPropRef.current && playerRef.current && readyRef.current) {
        try {
          playerRef.current.playVideo();
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisOrFocus);
    window.addEventListener('focus', handleVisOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisOrFocus);
      window.removeEventListener('focus', handleVisOrFocus);
    };
  }, []);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:object-cover">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
