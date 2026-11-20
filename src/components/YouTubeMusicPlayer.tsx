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
  getPlayerState: () => number;
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
  resumeRequest?: { nonce: number } | null;
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
  resumeRequest,
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
  const retryTimersRef = useRef<number[]>([]);

  // playVideo() called once right after loadVideoById() is silently
  // ignored when the tab is in background (autoplay policy) or the
  // player is still buffering/cued. Retry a few times instead of
  // leaving the next track stuck at 0:00.
  const clearPlayRetries = () => {
    retryTimersRef.current.forEach((id) => window.clearTimeout(id));
    retryTimersRef.current = [];
  };

  const attemptPlay = () => {
    if (!playerRef.current || !readyRef.current) return;
    if (!isPlayingPropRef.current) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state !== 1) {
        playerRef.current.playVideo();
      }
    } catch {
      try {
        playerRef.current.playVideo();
      } catch {
        // ignore — a later retry will try again
      }
    }
  };

  const schedulePlayRetries = () => {
    clearPlayRetries();
    [350, 1200, 2600].forEach((delay) => {
      retryTimersRef.current.push(
        window.setTimeout(() => {
          attemptPlay();
        }, delay)
      );
    });
  };

  useEffect(() => {
    return () => clearPlayRetries();
  }, []);

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
          clearPlayRetries();
          playerRef.current.loadVideoById(videoId);
          if (isPlayingPropRef.current) {
            // Do not rely on this single call: in background it is
            // often swallowed. schedulePlayRetries() retries after
            // the player has buffered / been cued.
            attemptPlay();
            schedulePlayRetries();
          } else {
            playerRef.current.pauseVideo();
          }
        }
        return;
      }

      if (!containerRef.current) return;
      currentVideoIdRef.current = videoId;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: isPlayingPropRef.current ? 1 : 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            e.target.setVolume(Math.round(volume * 100));
            if (isMuted) {
              e.target.mute();
            } else {
              e.target.unMute();
            }
            if (isPlayingPropRef.current) {
              e.target.playVideo();
              schedulePlayRetries();
            }
          },
          onStateChange: (e) => {
            if (e.data === 0) {
              clearPlayRetries();
              onEnded();
            } else if (e.data === 1) {
              clearPlayRetries();
              const dur = e.target.getDuration();
              if (dur > 0) {
                onTimeUpdate(e.target.getCurrentTime() || 0, dur);
              }
              onPlayingChange(true);
            } else if (e.data === 2) {
              onPlayingChange(false);
            } else if (e.data === 3 || e.data === 5) {
              // BUFFERING (3) / CUED (5): the video is loaded but
              // not playing yet. This is the exact state the next
              // track used to get stuck in when backgrounded.
              if (isPlayingPropRef.current) {
                attemptPlay();
                schedulePlayRetries();
              }
            }
          },
          onError: (e) => {
            // If video is non-embeddable (101, 150) or unavailable, automatically try next candidate!
            const list = candidatesRef.current;
            const nextIdx = candidateIndexRef.current + 1;
            if (nextIdx < list.length) {
              candidateIndexRef.current = nextIdx;
              const nextVid = list[nextIdx];
              currentVideoIdRef.current = nextVid;
              e.target.loadVideoById(nextVid);
              if (isPlayingPropRef.current) {
                e.target.playVideo();
                schedulePlayRetries();
              }
            } else {
              onFallbackToPreview?.();
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
        schedulePlayRetries();
      } else {
        clearPlayRetries();
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore
    }
  }, [isPlaying]);

  // Resume after returning from background: App fires this when
  // document becomes visible again while isPlaying is true. The
  // normal [isPlaying] effect above does not re-run in that case
  // because isPlaying never changed.
  useEffect(() => {
    if (!resumeRequest || !playerRef.current || !readyRef.current) return;
    if (!isPlayingPropRef.current) return;
    try {
      playerRef.current.playVideo();
      schedulePlayRetries();
    } catch {
      // ignore
    }
  }, [resumeRequest]);

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

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
