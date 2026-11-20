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
  const watchdogIntervalRef = useRef<number | null>(null);
  const watchdogTimeoutRef = useRef<number | null>(null);
  // How long the watchdog keeps retrying after a track change.
  // Background tabs throttle timers, so a retry may only fire once
  // a minute — the watchdog must therefore outlive the old 2.6 s
  // burst by a wide margin, and it also fires again the moment the
  // tab becomes visible (via resumeRequest).
  const WATCHDOG_MAX_MS = 120000;

  const stopPlayWatchdog = () => {
    if (watchdogIntervalRef.current !== null) {
      window.clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }
    if (watchdogTimeoutRef.current !== null) {
      window.clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }
  };

  // Returns true once the player is actually PLAYING (state 1).
  const attemptPlay = (): boolean => {
    if (!playerRef.current || !readyRef.current) return false;
    if (!isPlayingPropRef.current) return false;
    try {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        stopPlayWatchdog();
        return true;
      }
      playerRef.current.playVideo();
    } catch {
      try {
        playerRef.current.playVideo();
      } catch {
        // ignore — the watchdog will try again
      }
    }
    return false;
  };

  // playVideo() called right after loadVideoById() is silently
  // ignored when the tab is in background (autoplay policy) or the
  // player is still buffering/cued — and the old 3-shot retry
  // (350/1200/2600 ms) expired long before the next track had
  // buffered, leaving it stuck at 0:00 until the user reopened
  // the page. Keep retrying until the player reports PLAYING.
  const startPlayWatchdog = () => {
    stopPlayWatchdog();
    if (attemptPlay()) return;
    watchdogIntervalRef.current = window.setInterval(() => {
      attemptPlay();
    }, 1000);
    watchdogTimeoutRef.current = window.setTimeout(() => {
      stopPlayWatchdog();
    }, WATCHDOG_MAX_MS);
  };

  useEffect(() => {
    return () => stopPlayWatchdog();
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
          stopPlayWatchdog();
          playerRef.current.loadVideoById(videoId);
          if (isPlayingPropRef.current) {
            // Do not rely on this single call: in background it is
            // often swallowed. startPlayWatchdog() retries after
            // the player has buffered / been cued.
            attemptPlay();
            startPlayWatchdog();
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
              startPlayWatchdog();
            }
          },
          onStateChange: (e) => {
            if (e.data === 0) {
              stopPlayWatchdog();
              onEnded();
            } else if (e.data === 1) {
              stopPlayWatchdog();
              const dur = e.target.getDuration();
              if (dur > 0) {
                onTimeUpdate(e.target.getCurrentTime() || 0, dur);
              }
              onPlayingChange(true);
            } else if (e.data === 2) {
              // PAUSED (2): YouTube itself pauses the player when
              // play is blocked in a background tab. That is NOT
              // the user pressing pause — forwarding it would make
              // the app set isPlaying=false and stop every retry,
              // so the next track would never start until the page
              // is reopened. Keep retrying instead; a real user
              // pause goes through the isPlaying prop, not this.
              if (isPlayingPropRef.current) {
                startPlayWatchdog();
              } else {
                stopPlayWatchdog();
                onPlayingChange(false);
              }
            } else if (e.data === 3 || e.data === 5) {
              // BUFFERING (3) / CUED (5): the video is loaded but
              // not playing yet. This is the exact state the next
              // track used to get stuck in when backgrounded.
              if (isPlayingPropRef.current) {
                attemptPlay();
                startPlayWatchdog();
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
                startPlayWatchdog();
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
        startPlayWatchdog();
      } else {
        stopPlayWatchdog();
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
      startPlayWatchdog();
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
