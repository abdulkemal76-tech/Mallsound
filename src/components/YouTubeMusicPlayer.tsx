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

  useEffect(() => {
    isPlayingPropRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    candidatesRef.current = candidateIds.length > 0 ? candidateIds : videoId ? [videoId] : [];
    candidateIndexRef.current = 0;
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
          playerRef.current.loadVideoById(videoId);
          if (isPlayingPropRef.current) {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
          }
        }
        return;
      }

      if (!containerRef.current) return;
      currentVideoIdRef.current = videoId;

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
              onEnded();
            } else if (e.data === 1) {
              const dur = e.target.getDuration();
              if (dur > 0) {
                onTimeUpdate(e.target.getCurrentTime() || 0, dur);
              }
              onPlayingChange(true);
            } else if (e.data === 2) {
              onPlayingChange(false);
            }
          },
          onError: (e) => {
            console.warn('[YouTube Player] Error code:', e.data);
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
      playerRef.current.seekTo(seekRequest.sec, true);
      if (isPlayingPropRef.current) {
        playerRef.current.playVideo();
      }
    } catch {
      // ignore
    }
  }, [seekRequest]);

  // Poll Current Time for Synced Lyrics & Progress Scrubber
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!playerRef.current || !readyRef.current || !isPlaying) return;
      try {
        const cur = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        if (dur > 0) {
          onTimeUpdate(cur, dur);
        }
      } catch {
        // ignore
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, onTimeUpdate]);

  // Aggressive background playback poller: automatically revives YouTube audio when screen turns off or desktop window is minimized/blurred
  useEffect(() => {
    const resumeInterval = window.setInterval(() => {
      const isBackground = document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus());
      if (isBackground && isPlayingPropRef.current && playerRef.current && readyRef.current) {
        try {
          const stateGetter = (playerRef.current as unknown as { getPlayerState?: () => number }).getPlayerState;
          if (typeof stateGetter === 'function') {
            const st = stateGetter.call(playerRef.current);
            if (st === 2 || st === 5 || st === -1) {
              playerRef.current.playVideo();
            }
          }
        } catch {
          // ignore
        }
      }
    }, 600);

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
