import React, { useEffect, useRef } from 'react';

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
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
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
  const hasEndedTriggeredRef = useRef<boolean>(false);
  const ignoreEndUntilRef = useRef<number>(0);

  // === STALE CLOSURE FIX ===
  // The YouTube player's onStateChange is a closure created once at player init.
  // If we capture `onEnded` directly, it will always see the state from the first render.
  // Using refs ensures onStateChange always calls the LATEST callback version.
  const onEndedRef = useRef(onEnded);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onFallbackToPreviewRef = useRef(onFallbackToPreview);

  const triggerEndedOnce = (reason: string) => {
    if (hasEndedTriggeredRef.current) return;
    if (Date.now() < ignoreEndUntilRef.current) return;
    hasEndedTriggeredRef.current = true;
    console.log(`[YouTube Player] 🎵 Advancing queue: ${reason}`);
    try {
      onEndedRef.current();
    } catch (err) {
      console.error('[YouTube Player] Error during onEnded callback:', err);
    }
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
          ignoreEndUntilRef.current = Date.now() + 2500;
          try {
            playerRef.current.loadVideoById(videoId);
            if (isPlayingPropRef.current) {
              playerRef.current.playVideo();
            } else {
              playerRef.current.pauseVideo();
            }
          } catch {
            // ignore
          }
        }
        return;
      }

      if (!containerRef.current) return;
      currentVideoIdRef.current = videoId;
      hasEndedTriggeredRef.current = false;
      ignoreEndUntilRef.current = Date.now() + 2500;

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
            ignoreEndUntilRef.current = Date.now() + 2500;
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
              try {
                e.target.playVideo();
              } catch {
                // ignore
              }
            }
          },
          onStateChange: (e) => {
            if (e.data === 0) {
              // Use unified trigger to guarantee single next-track call
              triggerEndedOnce('onStateChange ENDED (data=0)');
            } else if (e.data === 1) {
              const dur = e.target.getDuration();
              const cur = e.target.getCurrentTime() || 0;
              if (dur > 0) {
                onTimeUpdateRef.current(cur, dur);
                if (dur > 5 && cur < dur - 5) {
                  hasEndedTriggeredRef.current = false;
                }
              }
              onPlayingChangeRef.current(true);
            } else if (e.data === 2) {
              // If paused right at the end of track, trigger ended
              try {
                const cur = e.target.getCurrentTime() || 0;
                const dur = e.target.getDuration() || 0;
                if (dur > 5 && cur >= dur - 1.2) {
                  triggerEndedOnce(`onStateChange PAUSED at end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)})`);
                  return;
                }
              } catch {}
              onPlayingChangeRef.current(false);
            }
          },
          onError: (e) => {
            console.warn('[YouTube Player] Error code:', e.data, 'Current ID:', currentVideoIdRef.current);
            hasEndedTriggeredRef.current = false;
            ignoreEndUntilRef.current = Date.now() + 2500;
            const list = candidatesRef.current;
            const nextIdx = candidateIndexRef.current + 1;
            if (nextIdx < list.length) {
              candidateIndexRef.current = nextIdx;
              const nextVid = list[nextIdx];
              currentVideoIdRef.current = nextVid;
              try {
                e.target.loadVideoById(nextVid);
                if (isPlayingPropRef.current) {
                  e.target.playVideo();
                }
              } catch {
                // ignore
              }
            } else {
              console.warn('[YouTube Player] All candidate videos failed or unavailable, triggering audio fallback / queue advance');
              onFallbackToPreviewRef.current?.();
              triggerEndedOnce('all candidates failed');
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
          if (dur > 5 && cur >= dur - 0.75) {
            triggerEndedOnce(`progress reached end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)})`);
          }
        }
      } catch {
        // ignore
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, onTimeUpdate]);

  // Aggressive background playback poller & wake-up watchdog (runs every 500ms even in background tabs)
  useEffect(() => {
    const resumeInterval = window.setInterval(() => {
      if (!isPlayingPropRef.current || !playerRef.current || !readyRef.current) return;
      try {
        const cur = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() || 0 : 0;
        const dur = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() || 0 : 0;
        const stateGetter = (playerRef.current as unknown as { getPlayerState?: () => number }).getPlayerState;
        const st = typeof stateGetter === 'function' ? stateGetter.call(playerRef.current) : -1;

        // 1. ENDED DETECTION: If state is ENDED (0), or reached end of duration in background
        if (st === 0) {
          triggerEndedOnce('background watchdog st === 0 (ENDED)');
          return;
        }
        if (dur > 5 && (cur >= dur - 0.8 || (st === 2 && cur >= dur - 1.5))) {
          triggerEndedOnce(`background watchdog reached end (cur=${cur.toFixed(1)}, dur=${dur.toFixed(1)}, st=${st})`);
          return;
        }

        // 2. MID-TRACK PAUSE REVIVAL: If unexpectedly paused/cued while document is hidden and NOT at track end
        const isBackground = document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus());
        if (isBackground && (st === 2 || st === 5 || st === -1) && (dur <= 0 || cur < dur - 2.5)) {
          playerRef.current.playVideo();
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => window.clearInterval(resumeInterval);
  }, []);

  // Immediate revival on visibility change or window focus
  useEffect(() => {
    const handleVisOrFocus = () => {
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
