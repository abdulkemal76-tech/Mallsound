import React, { useId, useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Disc3,
  RotateCcw,
  Zap,
  Music,
  Heart,
  Sliders,
  Sparkles,
  Radio,
  Gauge,
  ListMusic,
  Flame,
  Sun,
  Activity,
  Compass,
} from 'lucide-react';
import { Track } from '../types/music';
import { DJ_INDO_TRACKS } from '../data/djIndoTracks';

export type DiscoLightMode = 'disco' | 'strobe' | 'laser' | 'ambient' | 'off';
export type DiscoSpeed = 'hyper' | 'turbo' | 'normal';

export interface DJPageProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  // Playback control
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  // EQ
  eqGains: [number, number, number, number, number];
  onEqBandChange: (idx: number, val: number) => void;
  // Queue
  queueTracks: Track[];
  onSelectTrack: (track: Track) => void;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  // Optional extra playback toggles
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  onToggleRepeat?: () => void;
}

const EQ_BAND_LABELS = ['60Hz', '230Hz', '910Hz', '3.6kHz', '14kHz'];
const QUICK_SPEEDS = [0.75, 1.0, 1.25, 1.5];

// Estimated BPM map for DJ Indo tracks
const DJ_TRACK_BPM: Record<string, number> = {
  dj_ublag_ublag: 155,
  dj_sia_sia_mengharap: 150,
  dj_karna_su_sayang: 132,
  dj_malam_pagi: 130,
  dj_tabrak_tabrak: 152,
  dj_komang: 148,
  dj_sial_mahalini: 150,
  dj_domba_kuring: 158,
  dj_cikini_gondangdia: 146,
  dj_alay: 154,
  dj_santri_pekok: 160,
  dj_stecu_pargoy: 152,
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * NeonDJCanvasStage:
 * High-performance HTML5 Canvas animation engine rendered natively in React.
 * Featuring:
 * 1. 110 twinkling cosmic background stars & cross glints
 * 2. 5 volumetric moving spotlights with dynamic sweeping angles & colors
 * 3. Left & right neon pillars with wide atmospheric club wash
 * 4. 5 undulating cyber audio waveforms moving to the beat
 * 5. 32-bar energetic vertical neon equalizer with round caps
 * 6. Detailed animated DJ silhouette with headphones (head-bobbing, hand-scratching)
 * 7. Reflective DJ booth with dual spinning turntables, strobe ticks, crossfader, and 4x2 RGB pads
 * 8. Beat-reactive Mega Bass Horeg (+12dB) screen shake & shockwaves
 * 9. Strobe Blitz flash hits on beat drops
 * 10. Interactive 3D tilt motion control on touch / mouse drag
 */
const NeonDJCanvasStage: React.FC<{
  isPlaying: boolean;
  playbackRate: number;
  lightMode: DiscoLightMode;
  lightSpeed: DiscoSpeed;
  isManualBlitz: boolean;
  isBurstingBlitz: boolean;
  isHoregBass: boolean;
  coverUrl?: string;
  title?: string;
}> = ({
  isPlaying,
  playbackRate,
  lightMode,
  lightSpeed,
  isManualBlitz,
  isBurstingBlitz,
  isHoregBass,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  // Live props stored in refs for zero-lag rendering in animation loop
  const isPlayingRef = useRef(isPlaying);
  const playbackRateRef = useRef(playbackRate);
  const lightModeRef = useRef(lightMode);
  const lightSpeedRef = useRef(lightSpeed);
  const isHoregBassRef = useRef(isHoregBass);
  const isBlitzRef = useRef(isManualBlitz || isBurstingBlitz);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    playbackRateRef.current = playbackRate;
    lightModeRef.current = lightMode;
    lightSpeedRef.current = lightSpeed;
    isHoregBassRef.current = isHoregBass;
    isBlitzRef.current = isManualBlitz || isBurstingBlitz;
  }, [isPlaying, playbackRate, lightMode, lightSpeed, isManualBlitz, isBurstingBlitz, isHoregBass]);

  // Canvas render engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // 110 background stars
    const stars = Array.from({ length: 110 }, (_, i) => ({
      x: ((i * 73) % 1000) / 1000,
      y: ((i * 137) % 650) / 1000,
      size: i % 3 === 0 ? 2.2 : 1.2,
      phase: i * 0.7,
      isCross: i % 11 === 0,
    }));

    // Equalizer data
    const EQ_COUNT = 32;
    const eqHeights = new Float32Array(EQ_COUNT);

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Helpers
    function drawSparkle(x: number, y: number, r: number, alpha: number, color: string) {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2.4);
      ctx.quadraticCurveTo(x, y, x + r * 2.4, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 2.4);
      ctx.quadraticCurveTo(x, y, x, y - r * 2.4);
      ctx.quadraticCurveTo(x, y, x - r * 2.4, y);
      ctx.fill();
      ctx.restore();
    }

    function drawDiscoBeams(beatPhase: number, timeSec: number, mode: DiscoLightMode) {
      if (!ctx || mode === 'off') return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const beamConfigs = [
        { originX: width * 0.14, originY: -20, baseAngle: 0.42, swing: 0.35, speed: 1.0, color: 'rgba(236, 72, 153, 0.32)', width: 0.16 },
        { originX: width * 0.86, originY: -20, baseAngle: -0.42, swing: 0.35, speed: 1.0, color: 'rgba(34, 211, 238, 0.3)', width: 0.16 },
        { originX: width * 0.32, originY: -20, baseAngle: 0.18, swing: 0.45, speed: 2.0, color: 'rgba(192, 38, 211, 0.28)', width: 0.13 },
        { originX: width * 0.68, originY: -20, baseAngle: -0.18, swing: 0.45, speed: 2.0, color: 'rgba(168, 85, 247, 0.28)', width: 0.13 },
        { originX: width * 0.50, originY: -30, baseAngle: 0.0, swing: 0.52, speed: 0.5, color: 'rgba(244, 114, 182, 0.25)', width: 0.22 },
      ];

      const pulse = 0.65 + 0.35 * Math.pow(Math.sin(beatPhase * Math.PI), 2);
      const beamLength = Math.hypot(width, height) * 1.15;

      beamConfigs.forEach((b, idx) => {
        const angle = b.baseAngle + Math.sin(timeSec * b.speed * Math.PI + idx) * b.swing;
        const leftAngle = angle - b.width;
        const rightAngle = angle + b.width;

        const grad = ctx.createLinearGradient(
          b.originX,
          b.originY,
          b.originX + Math.sin(angle) * beamLength,
          b.originY + Math.cos(angle) * beamLength
        );
        grad.addColorStop(0, b.color);
        grad.addColorStop(0.65, b.color.replace(/0\.\d+\)/, (0.12 * pulse).toFixed(2) + ')'));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(b.originX, b.originY);
        ctx.lineTo(b.originX + Math.sin(leftAngle) * beamLength, b.originY + Math.cos(leftAngle) * beamLength);
        ctx.lineTo(b.originX + Math.sin(rightAngle) * beamLength, b.originY + Math.cos(rightAngle) * beamLength);
        ctx.closePath();
        ctx.fill();
      });

      ctx.restore();
    }

    function drawSideNeonPillars(pulse: number) {
      if (!ctx) return;
      const margin = Math.max(20, width * 0.06);
      const pillarPositions = [margin, width - margin];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      pillarPositions.forEach((px, idx) => {
        const color = idx === 0 ? '#f0abfc' : '#67e8f9';
        const glow = idx === 0 ? '#d946ef' : '#06b6d4';

        const glowGrad = ctx.createLinearGradient(px - 50, 0, px + 50, 0);
        glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        glowGrad.addColorStop(0.5, idx === 0 ? `rgba(217, 70, 239, ${0.25 + pulse * 0.2})` : `rgba(6, 182, 212, ${0.22 + pulse * 0.2})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(px - 50, 0, 100, height * 0.78);

        ctx.strokeStyle = color;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18 + pulse * 14;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height * 0.76);
        ctx.stroke();
      });

      ctx.restore();
    }

    function drawCyberWaves(timeSec: number, deskY: number, pulse: number) {
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const waveLayers = 5;
      for (let l = 0; l < waveLayers; l++) {
        ctx.beginPath();
        const baseY = deskY - height * 0.16 + l * 10;
        const amp = (28 + l * 8) * (0.75 + pulse * 0.45);
        const freq = 0.006 + l * 0.0012;
        const speed = timeSec * Math.PI * (l % 2 === 0 ? 1 : -1) + l;

        for (let x = 0; x <= width; x += 14) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y = baseY - Math.sin(x * freq + speed) * amp * envelope - Math.cos(x * freq * 1.8 - speed) * (amp * 0.4) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = l % 2 === 0
          ? `rgba(232, 121, 249, ${0.24 + pulse * 0.16})`
          : `rgba(34, 211, 238, ${0.2 + pulse * 0.16})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawEqualizer(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean, horeg: boolean) {
      if (!ctx) return;
      const totalWidth = Math.min(width * 0.8, 880);
      const startX = (width - totalWidth) / 2;
      const step = totalWidth / EQ_COUNT;
      const barWidth = Math.max(3.5, step * 0.55);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const horegBoost = horeg ? 1.45 : 1.0;

      for (let i = 0; i < EQ_COUNT; i++) {
        const centerDist = Math.abs(i - (EQ_COUNT - 1) / 2) / ((EQ_COUNT - 1) / 2);
        const arch = 1 - Math.pow(centerDist, 1.6) * 0.55;

        const wave1 = Math.sin(timeSec * Math.PI * 4 + i * 0.55);
        const wave2 = Math.cos(timeSec * Math.PI * 2 - i * 0.85);
        const kick = Math.pow(Math.sin(beatPhase * Math.PI), 3);

        const targetH = activePlaying
          ? (26 + Math.abs(wave1 * 0.5 + wave2 * 0.5) * 105 + kick * 65) * arch * (height / 720) * horegBoost
          : 12 * arch;
        eqHeights[i] += (targetH - eqHeights[i]) * 0.38;

        const bx = startX + i * step + (step - barWidth) / 2;
        const bh = Math.max(6, eqHeights[i]);
        const by = deskY - bh - 4;

        const barGrad = ctx.createLinearGradient(bx, by, bx, deskY);
        barGrad.addColorStop(0, '#ffffff');
        barGrad.addColorStop(0.25, i % 3 === 0 ? '#67e8f9' : '#f472b6');
        barGrad.addColorStop(0.85, '#c026d3');
        barGrad.addColorStop(1, 'rgba(192, 38, 211, 0)');

        ctx.fillStyle = barGrad;
        ctx.shadowColor = i % 3 === 0 ? '#06b6d4' : '#e879f9';
        ctx.shadowBlur = 12;

        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, barWidth, bh, [radius, radius, 0, 0]);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawDJ(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean) {
      if (!ctx) return;
      const scale = Math.min(width / 1080, height / 640, 1.15);
      const cx = width * 0.5;

      // Head-bobbing & body bounce
      const bobY = activePlaying ? Math.sin(beatPhase * Math.PI) * 9.5 * scale : 2;
      const swayX = activePlaying ? Math.sin(timeSec * Math.PI) * 7.5 * scale : 0;
      const headTilt = activePlaying ? Math.sin(timeSec * Math.PI) * 0.07 : 0;

      ctx.save();
      ctx.translate(cx + swayX, deskY + bobY);
      ctx.scale(scale, scale);

      // Back aura
      const backGlow = ctx.createRadialGradient(0, -145, 15, 0, -145, 230);
      backGlow.addColorStop(0, 'rgba(232, 121, 249, 0.42)');
      backGlow.addColorStop(0.55, 'rgba(147, 51, 234, 0.18)');
      backGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = backGlow;
      ctx.beginPath();
      ctx.arc(0, -145, 230, 0, Math.PI * 2);
      ctx.fill();

      // DJ Body & Shoulders
      ctx.fillStyle = '#070112';
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(-145, 10);
      ctx.quadraticCurveTo(-132, -92, -62, -108);
      ctx.lineTo(62, -108);
      ctx.quadraticCurveTo(132, -92, 145, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head & Headphones
      ctx.save();
      ctx.translate(0, -158);
      ctx.rotate(headTilt);

      // Headphone Arch
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -4, 52, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();

      // Head Shape
      ctx.fillStyle = '#060010';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 4, 40, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Earcups (Cyan & Magenta)
      [-45, 45].forEach((hx, i) => {
        ctx.fillStyle = '#120329';
        ctx.strokeStyle = i === 0 ? '#38bdf8' : '#f472b6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(hx - 9, -16, 18, 40, 8);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // Left Arm & Hand (Scratching Left Turntable)
      const leftHandX = -68 + (activePlaying ? Math.sin(timeSec * Math.PI * 2) * 36 : 0);
      const leftHandY = -12 + (activePlaying ? Math.cos(timeSec * Math.PI * 4) * 8 : 0);

      ctx.strokeStyle = '#e879f9';
      ctx.fillStyle = '#070112';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-112, -88);
      ctx.quadraticCurveTo(-130, -35, leftHandX - 10, leftHandY);
      ctx.lineTo(leftHandX + 14, leftHandY + 4);
      ctx.quadraticCurveTo(-86, -42, -75, -86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Arm & Hand (Mixer Fader Control)
      const rightHandX = 68 + (activePlaying ? Math.cos(timeSec * Math.PI * 2) * 34 : 0);
      const rightHandY = -14 + (activePlaying ? Math.sin(timeSec * Math.PI * 4) * 9 : 0);

      ctx.beginPath();
      ctx.moveTo(112, -88);
      ctx.quadraticCurveTo(130, -35, rightHandX + 10, rightHandY);
      ctx.lineTo(rightHandX - 14, rightHandY + 4);
      ctx.quadraticCurveTo(86, -42, 75, -86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function drawDJBooth(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean) {
      if (!ctx) return;
      const boothHeight = height - deskY;
      const pulse = Math.pow(Math.sin(beatPhase * Math.PI), 2);

      // Desk Gradient Surface
      const deskGrad = ctx.createLinearGradient(0, deskY, 0, height);
      deskGrad.addColorStop(0, '#130329');
      deskGrad.addColorStop(0.25, '#090117');
      deskGrad.addColorStop(1, '#030008');
      ctx.fillStyle = deskGrad;
      ctx.fillRect(0, deskY, width, boothHeight);

      // Neon Horizontal Edge Line
      ctx.save();
      ctx.strokeStyle = '#f0abfc';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, deskY);
      ctx.lineTo(width, deskY);
      ctx.stroke();
      ctx.restore();

      const consoleW = Math.min(width * 0.88, 920);
      const consoleH = Math.min(boothHeight * 0.78, 155);
      const cx = width * 0.5;

      const deckOffset = consoleW * 0.31;
      const deckW = consoleW * 0.33;

      // Draw 2 Turntables
      [-1, 1].forEach((dir) => {
        const dx = cx + dir * deckOffset;

        ctx.save();
        ctx.fillStyle = '#0d021f';
        ctx.strokeStyle = dir === -1 ? '#e879f9' : '#38bdf8';
        ctx.shadowColor = dir === -1 ? '#d946ef' : '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(dx - deckW / 2, deskY + 8, deckW, consoleH * 0.85, 12);
        ctx.fill();
        ctx.stroke();

        const platterRx = deckW * 0.37;
        const platterRy = consoleH * 0.27;
        const platterY = deskY + consoleH * 0.48;

        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(dx, platterY, platterRx, platterRy, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Spinning strobe marks
        const spinAngle = activePlaying ? timeSec * Math.PI * 3.5 * dir : 0;
        ctx.strokeStyle = dir === -1 ? '#38bdf8' : '#f472b6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(dx, platterY, platterRx * 0.65, platterRy * 0.65, 0, spinAngle, spinAngle + 1.4);
        ctx.stroke();

        // Spindle center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(dx, platterY, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Center Mixer
      const mixerW = consoleW * 0.28;
      ctx.save();
      ctx.fillStyle = '#110326';
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - mixerW / 2, deskY + 6, mixerW, consoleH * 0.9, 10);
      ctx.fill();
      ctx.stroke();

      // Blinking RGB Pads
      const cols = 4;
      const rows = 2;
      const padW = (mixerW * 0.72) / cols;
      const padH = (consoleH * 0.24) / rows;
      const padStartX = cx - (mixerW * 0.72) / 2;
      const padStartY = deskY + consoleH * 0.52;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const active = activePlaying && ((r * cols + c + Math.floor(timeSec * 5)) % 3) === 0;
          ctx.fillStyle = active
            ? c % 2 === 0
              ? '#f472b6'
              : '#22d3ee'
            : 'rgba(192, 38, 211, 0.25)';
          ctx.beginPath();
          ctx.roundRect(padStartX + c * padW + 2, padStartY + r * padH + 2, padW - 4, padH - 4, 3);
          ctx.fill();
        }
      }

      // Moving crossfader
      const faderX = cx + (activePlaying ? Math.sin(timeSec * Math.PI * 2) * (mixerW * 0.24) : 0);
      const faderY = deskY + consoleH * 0.82;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - mixerW * 0.28, faderY);
      ctx.lineTo(cx + mixerW * 0.28, faderY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(faderX - 6, faderY - 5, 12, 10);
      ctx.restore();

      // Floor Glow
      const floorGlow = ctx.createRadialGradient(
        cx,
        deskY + consoleH + 15,
        10,
        cx,
        deskY + consoleH + 15,
        consoleW * 0.45
      );
      floorGlow.addColorStop(0, `rgba(56, 189, 248, ${0.24 + pulse * 0.2})`);
      floorGlow.addColorStop(0.5, `rgba(217, 70, 239, ${0.16 + pulse * 0.16})`);
      floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGlow;
      ctx.fillRect(0, deskY + consoleH - 10, width, boothHeight);
    }

    // Main 60 FPS Render Loop
    let lastTimeMs = performance.now();
    let accumulatedTime = 0;

    const render = (nowMs: number) => {
      const deltaSec = Math.min((nowMs - lastTimeMs) * 0.001, 0.1);
      lastTimeMs = nowMs;

      const activePlaying = isPlayingRef.current;
      const rate = playbackRateRef.current || 1.0;
      const spdMode = lightSpeedRef.current;
      const spdMult = spdMode === 'hyper' ? 2.2 : spdMode === 'turbo' ? 1.5 : 1.0;

      if (activePlaying) {
        accumulatedTime += deltaSec * rate * spdMult;
      } else {
        // Slow ambient idle
        accumulatedTime += deltaSec * 0.25;
      }

      const LOOP_DURATION = 2.0;
      const loopSec = accumulatedTime % LOOP_DURATION;
      const beatPhase = (loopSec * 2) % 1;
      const pulse = Math.pow(Math.sin(beatPhase * Math.PI), 2);
      const deskY = height * 0.72;

      // 1. Sky Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#04000a');
      bgGrad.addColorStop(0.55, '#120229');
      bgGrad.addColorStop(1, '#1e043d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars & Galaxy Glints
      stars.forEach((s) => {
        const sx = s.x * width;
        const sy = s.y * height;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(loopSec * Math.PI + s.phase));
        if (s.isCross) {
          drawSparkle(sx, sy, s.size * 2.2, twinkle, '#f0abfc');
        } else {
          ctx.fillStyle = `rgba(245, 208, 254, ${twinkle})`;
          ctx.beginPath();
          ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Neon Side Pillars
      drawSideNeonPillars(pulse);

      // 4. Volumetric Disco Spotlights
      drawDiscoBeams(beatPhase, loopSec, lightModeRef.current);

      // 5. Neon Undulating Cyber Waves
      drawCyberWaves(loopSec, deskY, pulse);

      // 6. 32-Bar Neon Equalizer
      drawEqualizer(deskY, loopSec, beatPhase, activePlaying, isHoregBassRef.current);

      // 7. DJ Character
      drawDJ(deskY, loopSec, beatPhase, activePlaying);

      // 8. DJ Booth & Turntables
      drawDJBooth(deskY, loopSec, beatPhase, activePlaying);

      // 9. Strobe Blitz Overlays
      if (isBlitzRef.current) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(0, 0, width, height);
      } else if (activePlaying && pulse > 0.88) {
        ctx.fillStyle = `rgba(232, 121, 249, ${(pulse - 0.88) * 0.45})`;
        ctx.fillRect(0, 0, width, height);
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 3D Motion Control (Tracks cursor or touch on the stage)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({
      x: Math.max(-16, Math.min(16, x * 32)),
      y: Math.max(-16, Math.min(16, -y * 32)),
    });
    setIsInteracting(true);
  };

  const handlePointerLeave = () => {
    setIsInteracting(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      {/* 3D Perspective Motion Stage Wrapper */}
      <div
        className="w-full max-w-4xl perspective-[1000px] transition-transform duration-300"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] min-h-[300px] max-h-[500px] rounded-3xl overflow-hidden border-2 border-fuchsia-500/40 shadow-[0_25px_70px_rgba(168,85,247,0.45)] bg-black transition-transform ease-out"
          style={{
            transform: isInteracting
              ? `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale3d(1.02, 1.02, 1.02)`
              : isPlaying
              ? 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
              : 'none',
            animation: !isInteracting && isPlaying ? 'dj-stage-float 5s ease-in-out infinite' : 'none',
            transformStyle: 'preserve-3d',
            transitionDuration: isInteracting ? '90ms' : '600ms',
          }}
        >
          {/* Native HTML5 Canvas DJ Loop */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{
              animation: isPlaying && isHoregBass ? 'dj-horeg-stage-shake 0.1s infinite alternate' : 'none',
            }}
          />

          {/* Subwoofer Bass Horeg Shockwave Frame */}
          {isPlaying && isHoregBass && (
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none border-2 border-fuchsia-400/90 shadow-[0_0_40px_rgba(236,72,153,0.9)]"
              style={{
                animation: 'dj-bass-kick-1 0.45s cubic-bezier(0.1, 0.9, 0.2, 1) infinite',
              }}
            />
          )}

          {/* Interactive Motion Badge at Top-Right */}
          <div className="absolute top-3 right-3 z-25 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wider uppercase text-cyan-300">
            <Compass className={`w-3.5 h-3.5 ${isInteracting ? 'animate-spin text-amber-300' : 'text-cyan-400'}`} />
            <span>{isInteracting ? '3D TILT AKTIF' : 'MOTION CONTROL 3D'}</span>
          </div>

          {/* Live Audio Glow Accent Frame */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20 pointer-events-none" />
        </div>
      </div>

      {/* Helpful Hint Pill */}
      <div className="text-[11px] text-white/50 pt-2 flex items-center gap-1.5 font-medium">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Sentuh & geser layar / gerakkan kursor mouse untuk kontrol gerak 3D panggung DJ</span>
      </div>
    </div>
  );
};

export const DJPage: React.FC<DJPageProps> = ({
  currentTrack,
  isPlaying,
  currentTimeSec,
  durationSec,
  onTogglePlay,
  onSeek,
  onNextTrack,
  onPrevTrack,
  playbackRate,
  onPlaybackRateChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  eqGains,
  onEqBandChange,
  queueTracks,
  onSelectTrack,
  isTrackLiked,
  onToggleLike,
  isShuffle: propIsShuffle,
  onToggleShuffle: propOnToggleShuffle,
  isRepeat: propIsRepeat,
  onToggleRepeat: propOnToggleRepeat,
}) => {
  // Local states
  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState(false);
  const [lightMode, setLightMode] = useState<DiscoLightMode>('disco');
  const [lightSpeed, setLightSpeed] = useState<DiscoSpeed>('hyper');
  const [isManualBlitz, setIsManualBlitz] = useState(false);
  const [isBurstingBlitz, setIsBurstingBlitz] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [activeListTab, setActiveListTab] = useState<'dj-indo' | 'queue'>('dj-indo');

  const burstTimerRef = useRef<number | null>(null);

  const isShuffle = propIsShuffle !== undefined ? propIsShuffle : localShuffle;
  const isRepeat = propIsRepeat !== undefined ? propIsRepeat : localRepeat;

  const handleToggleShuffle = () => {
    if (propOnToggleShuffle) {
      propOnToggleShuffle();
    } else {
      setLocalShuffle((prev) => !prev);
    }
  };

  const handleToggleRepeat = () => {
    if (propOnToggleRepeat) {
      propOnToggleRepeat();
    } else {
      setLocalRepeat((prev) => !prev);
    }
  };

  // Rapid Fire Burst Blitz Function (Fires 15 rapid flashes!)
  const triggerRapidBurstBlitz = () => {
    if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    setIsBurstingBlitz(true);
    setBurstCount((prev) => prev + 1);

    // Burst lasts 1.25 seconds of rapid strobe fire
    burstTimerRef.current = window.setTimeout(() => {
      setIsBurstingBlitz(false);
    }, 1250);
  };

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    };
  }, []);

  // Bass Boost Logic:
  // Mega Bass Horeg: +12dB on 60Hz and +8dB on 230Hz (Indonesian Sound System Horeg)
  const isHoregBass = eqGains[0] >= 11 && eqGains[1] >= 7.5;
  // Sub-Bass Club: +6dB on 60Hz and +4dB on 230Hz
  const isSubBassClub = !isHoregBass && eqGains[0] >= 5.5 && eqGains[1] >= 3.5;

  const handleSetMegaBassHoreg = () => {
    if (isHoregBass) {
      onEqBandChange(0, 0);
      onEqBandChange(1, 0);
    } else {
      onEqBandChange(0, 12);
      onEqBandChange(1, 8);
    }
  };

  const handleSetSubBassClub = () => {
    if (isSubBassClub) {
      onEqBandChange(0, 0);
      onEqBandChange(1, 0);
    } else {
      onEqBandChange(0, 6);
      onEqBandChange(1, 4);
    }
  };

  // Vocal Boost: +4dB on 910Hz and 3.6kHz
  const isVocalBoostActive = eqGains[2] >= 3.5 && eqGains[3] >= 3.5;
  const handleToggleVocalBoost = () => {
    if (isVocalBoostActive) {
      onEqBandChange(2, 0);
      onEqBandChange(3, 0);
    } else {
      onEqBandChange(2, 4);
      onEqBandChange(3, 4);
    }
  };

  // Reset EQ: All bands to 0dB
  const handleResetEq = () => {
    [0, 1, 2, 3, 4].forEach((idx) => onEqBandChange(idx, 0));
  };

  const isLiked = isTrackLiked(currentTrack.id);
  const progressPercent = durationSec > 0 ? Math.min(100, (currentTimeSec / durationSec) * 100) : 0;
  const volumePercent = isMuted ? 0 : Math.round(volume * 100);

  // Derived or estimated BPM
  const trackIdClean = currentTrack.id.toLowerCase();
  const knownBpm = DJ_TRACK_BPM[trackIdClean] || currentTrack.synthConfig?.bpm || 150;
  const displayBpm = Math.round(knownBpm * playbackRate);

  const scrubberId = useId();

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-violet-500 selection:text-white pb-28">
      {/* Embedded CSS Keyframes for High-Speed Rave, 3D Tilt & Cyber Stage */}
      <style>{`
        @keyframes dj-stage-float {
          0% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0); }
          33% { transform: perspective(1000px) rotateX(2deg) rotateY(-2.5deg) translateY(-3px); }
          66% { transform: perspective(1000px) rotateX(-2deg) rotateY(2.5deg) translateY(2px); }
          100% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0); }
        }
        @keyframes dj-bass-kick-1 {
          0% { transform: scale(1.0); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(1.16); opacity: 0; }
        }
        @keyframes dj-horeg-stage-shake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1.5px, 1.5px); }
          50% { transform: translate(1.5px, -1.5px); }
          75% { transform: translate(-1.5px, -1px); }
          100% { transform: translate(1px, 1px); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      {/* Top Ambient Glow Backdrop with Beat Flash Reaction */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 blur-3xl pointer-events-none transition-all duration-150 ${
          isBurstingBlitz || isManualBlitz
            ? 'bg-gradient-to-b from-white/40 via-cyan-500/30 to-transparent opacity-95'
            : isPlaying
            ? 'bg-gradient-to-b from-violet-600/35 via-fuchsia-600/25 to-transparent opacity-85'
            : 'bg-gradient-to-b from-violet-900/15 to-transparent opacity-40'
        }`}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* =================================================================
            1. HEADER: "🎧 DJ Studio & Disco Club"
        ================================================================= */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>MallSound Cyber DJ Arena • Motion Control 3D</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent animate-gradient-text">
              🎧 DJ Club & Motion Arena
            </h1>
            <p className="text-xs sm:text-sm text-white/70">
              Panggung DJ neon 3D interaktif, lampu rave hiper-ngebut, dentuman sub-bass horeg, dan lagu full album.
            </p>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Live Playback Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                }`}
              />
              <span className="font-medium text-white/80">
                {isPlaying ? 'ON DECK' : 'PAUSED'}
              </span>
            </div>

            {/* Live BPM Counter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur text-xs font-mono text-amber-400">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayBpm} BPM</span>
            </div>

            {/* Bass Horeg Status */}
            {isHoregBass && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-xs font-bold text-fuchsia-300 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>HOREG +12dB</span>
              </div>
            )}
          </div>
        </header>

        {/* =================================================================
            2. NOW PLAYING DECK & NEON DJ CANVAS STAGE (Full Native Canvas Engine)
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Deck Lighting Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent" />

          {/* Canvas DJ Motion Stage */}
          <NeonDJCanvasStage
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            lightMode={lightMode}
            lightSpeed={lightSpeed}
            isManualBlitz={isManualBlitz}
            isBurstingBlitz={isBurstingBlitz}
            isHoregBass={isHoregBass}
            coverUrl={currentTrack.coverUrl}
            title={currentTrack.title}
          />

          {/* Track Info & Like Action */}
          <div className="flex flex-col items-center text-center space-y-3 max-w-xl mx-auto pt-1">
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-white truncate tracking-tight">
                  {currentTrack.title || 'Pilih Trek DJ'}
                </h2>
                <p className="text-sm sm:text-base text-white/70 truncate font-medium">
                  {currentTrack.artist || 'Artis DJ'}
                  {currentTrack.album ? ` • ${currentTrack.album}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => onToggleLike(currentTrack, e)}
                className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isLiked
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.35)]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
                aria-label={isLiked ? 'Batal suka' : 'Sukai lagu'}
                title={isLiked ? 'Disukai' : 'Sukai'}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {currentTrack.genre && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {currentTrack.genre}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ⚡ {displayBpm} BPM
              </span>
              {durationSec > 600 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  💿 FULL MIX ({Math.round(durationSec / 60)} MENIT)
                </span>
              )}
              {isHoregBass && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Sub-Bass Horeg (+12dB)
                </span>
              )}
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="w-full max-w-2xl mx-auto space-y-2 pt-1">
            <div className="relative group flex items-center">
              <label htmlFor={scrubberId} className="sr-only">
                Garis waktu pemutaran DJ
              </label>
              <input
                id={scrubberId}
                type="range"
                min={0}
                max={Math.max(1, durationSec)}
                step={0.1}
                value={currentTimeSec}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="w-full h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-400 focus:outline-none transition-all"
                style={{
                  background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(217, 70, 239) ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-white/60 tabular-nums px-1">
              <span className="text-violet-300 font-semibold">{formatTime(currentTimeSec)}</span>
              <span className="text-emerald-300 font-semibold">{formatTime(durationSec)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1">
            {/* Shuffle */}
            <button
              type="button"
              onClick={handleToggleShuffle}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isShuffle
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              }`}
              aria-label="Acak pemutaran"
              title={isShuffle ? 'Acak Aktif' : 'Acak Nonaktif'}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* Prev Track */}
            <button
              type="button"
              onClick={onPrevTrack}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Trek sebelumnya"
              title="Sebelumnya"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Giant Play / Pause Button with Glow */}
            <button
              type="button"
              onClick={onTogglePlay}
              className="p-5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:shadow-[0_0_45px_rgba(217,70,239,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label={isPlaying ? 'Jeda pemutaran' : 'Mulai pemutaran'}
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={onNextTrack}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Trek selanjutnya"
              title="Selanjutnya"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={handleToggleRepeat}
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                isRepeat
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              }`}
              aria-label="Ulangi pemutaran"
              title={isRepeat ? 'Ulangi Aktif' : 'Ulangi Nonaktif'}
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* =================================================================
            3. CLUB LIGHTING FX CONTROLLER (Lampu Disco, Flash & Laser)
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Pencahayaan Panggung Disco & Laser
              </h2>
            </div>

            {/* Speed Selector (Ngebut Mode!) */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
              <span className="text-[10px] text-white/60 font-semibold px-2 uppercase tracking-wider">
                Kecepatan:
              </span>
              {[
                { id: 'hyper', label: '🚀 HYPER NGEBUT' },
                { id: 'turbo', label: '⚡ CEPAT' },
                { id: 'normal', label: '🌌 SANTAI' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setLightSpeed(sp.id as DiscoSpeed)}
                  className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    lightSpeed === sp.id
                      ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'disco', label: '🌈 Disco RGB', desc: 'Lampu bergerak warna-warni' },
              { id: 'strobe', label: '⚡ Strobe Blitz', desc: 'Flash kilat rave frekuensi tinggi' },
              { id: 'laser', label: '🚨 Laser Cyber', desc: 'Sinar laser neon membelah deck' },
              { id: 'ambient', label: '🌌 Club Ambient', desc: 'Nuansa club malam hangat' },
              { id: 'off', label: '🌑 Off', desc: 'Pencahayaan dinonaktifkan' },
            ].map((mode) => {
              const isActive = lightMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLightMode(mode.id as DiscoLightMode)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-pink-600/30 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.45)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold font-display">{mode.label}</span>
                  <span className="text-[10px] text-white/50 pt-1">{mode.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Dual Blitz Control Buttons (Burst Rapid-Fire + Continuous Hold) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* 1. Rapid Burst Blitz (15 Flashes Machine-Gun Fire!) */}
            <button
              type="button"
              onClick={triggerRapidBurstBlitz}
              className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                isBurstingBlitz
                  ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,1)] scale-[0.98]'
                  : 'bg-gradient-to-r from-cyan-500/25 via-fuchsia-500/25 to-pink-500/25 hover:from-cyan-500/35 hover:to-pink-500/35 text-cyan-200 border-cyan-400/50 hover:border-cyan-300'
              }`}
              title="Klik untuk menembakkan 15 rentetan blitz kilat cepat sekaligus!"
            >
              <Zap className={`w-5 h-5 ${isBurstingBlitz ? 'text-amber-400 animate-spin' : 'text-cyan-300'}`} />
              <span>
                {isBurstingBlitz
                  ? `💥 NEMBAK CEPAT! (BURST #${burstCount})`
                  : '⚡ TEMBAK BURST CEPAT (15x FLASH)'}
              </span>
            </button>

            {/* 2. Continuous Manual Flash Hold Button */}
            <button
              type="button"
              onMouseDown={() => setIsManualBlitz(true)}
              onMouseUp={() => setIsManualBlitz(false)}
              onTouchStart={() => setIsManualBlitz(true)}
              onTouchEnd={() => setIsManualBlitz(false)}
              className={`py-3.5 px-4 rounded-2xl border flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wider transition-all select-none cursor-pointer ${
                isManualBlitz
                  ? 'bg-amber-300 text-black border-amber-200 shadow-[0_0_40px_rgba(251,191,36,1)] scale-[0.98]'
                  : 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 hover:from-amber-500/30 hover:to-violet-500/30 text-amber-200 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Tahan tombol ini untuk menembak blitz terus-menerus tanpa henti!"
            >
              <Flame className={`w-5 h-5 ${isManualBlitz ? 'text-amber-500 animate-bounce' : 'text-amber-300'}`} />
              <span>
                {isManualBlitz ? '🔥 BLITZ MENYALA TERUS! (TAHAN)' : '⚡ TEMBAK BLITZ MANUAL (TAHAN / KLIK)'}
              </span>
            </button>
          </div>
        </section>

        {/* =================================================================
            4. DJ HARDWARE CONTROLS: PITCH, 5-BAND EQ, MASTER FADER
        ================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-400" />
              <span>Panel Kontrol DJ Studio</span>
            </h2>
            <span className="text-xs text-white/50">Studio Equalizer & Pitch Hardware</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Speed & Pitch */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Pitch & Tempo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onPlaybackRateChange(1.0)}
                  className="text-[11px] font-mono text-white/50 hover:text-violet-300 underline cursor-pointer"
                  title="Kembalikan tempo ke 1.00x normal"
                >
                  Reset
                </button>
              </div>

              {/* Digital Speed Readout */}
              <div className="text-center py-2 bg-black/40 rounded-xl border border-white/5">
                <div className="text-3xl font-extrabold font-mono text-violet-400 tabular-nums">
                  {playbackRate.toFixed(2)}x
                </div>
                <div className="text-[11px] font-mono text-white/50">
                  {playbackRate === 1.0
                    ? 'Tempo Asli (±0%)'
                    : `${playbackRate > 1.0 ? '+' : ''}${Math.round(
                        (playbackRate - 1.0) * 100
                      )}% Pitch`}
                </div>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.01}
                  value={playbackRate}
                  onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg accent-violet-400 cursor-pointer"
                  aria-label="Kecepatan pitch pemutaran"
                />
              </div>

              {/* Quick Speeds */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {QUICK_SPEEDS.map((spd) => {
                  const isActive = Math.abs(playbackRate - spd) < 0.01;
                  return (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onPlaybackRateChange(spd)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-violet-500 text-white font-bold shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                          : 'bg-white/10 hover:bg-white/20 text-white/80'
                      }`}
                    >
                      {spd.toFixed(2)}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5-Band Equalizer Mini */}
            <div className="md:col-span-2 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    5-Band Equalizer Studio
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/50">-12 dB s/d +12 dB</span>
              </div>

              {/* 5 Vertical Sliders */}
              <div className="grid grid-cols-5 gap-2 py-2 flex-1 items-center">
                {EQ_BAND_LABELS.map((label, idx) => {
                  const gain = eqGains[idx];
                  const formattedGain =
                    gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1);

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-between h-44 py-1 bg-black/25 rounded-xl border border-white/5"
                    >
                      {/* Gain Value Display */}
                      <span
                        className={`text-[10px] font-mono font-semibold tabular-nums ${
                          gain > 0
                            ? 'text-fuchsia-400'
                            : gain < 0
                            ? 'text-rose-400'
                            : 'text-white/60'
                        }`}
                      >
                        {formattedGain}
                      </span>

                      {/* Vertical Slider Wrapper */}
                      <div className="h-28 flex items-center justify-center relative">
                        <div className="absolute w-6 h-[1px] bg-white/20 pointer-events-none" />
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={gain}
                          onChange={(e) =>
                            onEqBandChange(idx, Number(e.target.value))
                          }
                          className="w-24 -rotate-90 accent-fuchsia-400 cursor-pointer"
                          aria-label={`Equalizer frekuensi ${label}`}
                        />
                      </div>

                      {/* Frequency Label */}
                      <span className="text-[10px] font-mono text-white/70 font-medium">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-white/50 text-center">
                Geser ke atas untuk dorongan (boost), ke bawah untuk potongan (cut).
              </div>
            </div>

            {/* Master Volume Fader */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    Master Fader
                  </span>
                </div>
                <span className="text-xs font-mono text-pink-400 font-bold tabular-nums">
                  {volumePercent}%
                </span>
              </div>

              <div className="flex items-center justify-center gap-4 py-1 flex-1">
                {/* Visual LED VU Meter */}
                <div className="flex flex-col justify-between h-28 w-2 py-0.5 bg-neutral-900 rounded border border-white/10">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const activeThreshold = ((7 - i) / 7) * 100;
                    const isLit = !isMuted && isPlaying && volumePercent >= activeThreshold;
                    const colorClass =
                      i < 2
                        ? isLit
                          ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          : 'bg-rose-950/60'
                        : i < 4
                        ? isLit
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'bg-amber-950/60'
                        : isLit
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-emerald-950/60';

                    return (
                      <div
                        key={i}
                        className={`h-2 w-full rounded-xs transition-colors duration-150 ${colorClass}`}
                      />
                    );
                  })}
                </div>

                {/* Vertical Slider */}
                <div className="h-28 flex items-center justify-center">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="w-24 -rotate-90 accent-pink-500 cursor-pointer"
                    aria-label="Volume utama"
                  />
                </div>
              </div>

              {/* Mute Button Toggle */}
              <button
                type="button"
                onClick={onToggleMute}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                  isMuted || volume === 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>Bisu (Muted)</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span>Matikan Suara</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* =================================================================
              5. BASS YANG LEBIH NENDANG & EFEK STUDIO INSTAN
          ================================================================= */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                  Bass Horeg & Efek Suara Panggung
                </span>
              </div>
              <span className="text-xs text-white/50">Dentuman Sub-Bass Khas Sound System Indo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* MEGA BASS HOREG (+12dB) */}
              <button
                type="button"
                onClick={handleSetMegaBassHoreg}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isHoregBass
                    ? 'bg-gradient-to-br from-amber-600 via-pink-600 to-fuchsia-600 text-white border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Mega Bass Horeg
                  </span>
                  <Flame
                    className={`w-4 h-4 ${
                      isHoregBass ? 'text-amber-200 animate-bounce' : 'text-amber-400/60'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/80">
                  +12dB 60Hz & +8dB 230Hz (Nendang!)
                </div>
                <div className="text-[10px] font-mono font-bold tracking-wider">
                  {isHoregBass ? '🔥 AKTIF (HOREG)' : 'NONAKTIF'}
                </div>
              </button>

              {/* SUB-BASS CLUB (+6dB) */}
              <button
                type="button"
                onClick={handleSetSubBassClub}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isSubBassClub
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Sub-Bass Club
                  </span>
                  <Activity
                    className={`w-4 h-4 ${
                      isSubBassClub ? 'text-cyan-300' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +6dB 60Hz & +4dB 230Hz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isSubBassClub ? 'AKTIF (CLUB)' : 'NONAKTIF'}
                </div>
              </button>

              {/* Vocal Boost (+4dB) */}
              <button
                type="button"
                onClick={handleToggleVocalBoost}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isVocalBoostActive
                    ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.02]'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider">
                    Vocal Clarity
                  </span>
                  <Music
                    className={`w-4 h-4 ${
                      isVocalBoostActive ? 'text-white' : 'text-white/40'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-white/70">
                  +4dB 910Hz & 3.6kHz
                </div>
                <div className="text-[10px] font-mono font-semibold">
                  {isVocalBoostActive ? 'AKTIF' : 'NONAKTIF'}
                </div>
              </button>

              {/* Treble Crisp or Reset Flat */}
              <button
                type="button"
                onClick={handleResetEq}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-left transition-all cursor-pointer flex flex-col justify-between h-28 active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-display uppercase tracking-wider text-white/90">
                    Flat Studio
                  </span>
                  <RotateCcw className="w-4 h-4 text-white/60 group-hover:-rotate-90 transition-transform duration-300" />
                </div>
                <div className="text-[11px] text-white/60">
                  Kembalikan semua frekuensi ke 0 dB
                </div>
                <div className="text-[10px] font-mono text-cyan-300 font-semibold">
                  RESET FLAT
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* =================================================================
            6. PLAYLIST TABS: 12 DJ INDO VIRAL vs ANTREAN MUSIK
        ================================================================= */}
        <section className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
          {/* Tab Bar Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveListTab('dj-indo')}
                className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeListTab === 'dj-indo'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>🔥 12 DJ Indo Viral (Full Song & Mixtape)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveListTab('queue')}
                className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeListTab === 'queue'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <ListMusic className="w-4 h-4 text-violet-300" />
                <span>📋 Antrean Musik</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {queueTracks.length}
                </span>
              </button>
            </div>

            <span className="text-xs text-white/50">
              {activeListTab === 'dj-indo'
                ? 'Semua lagu full berdurasi menit s/d mixtape panjang!'
                : 'Daftar trek antrean musik aktif saat ini'}
            </span>
          </div>

          {/* TAB 1: 12 DJ INDO VIRAL TRACKS */}
          {activeListTab === 'dj-indo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {DJ_INDO_TRACKS.map((track, idx) => {
                const isSelected = track.id === currentTrack.id || track.title === currentTrack.title;
                const trackLiked = isTrackLiked(track.id);
                const trackBpm = DJ_TRACK_BPM[track.id] || 150;

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(track)}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-violet-600/25 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.01]'
                        : 'bg-black/30 hover:bg-white/10 border-white/5 text-white/90'
                    }`}
                  >
                    {/* Left: Index + Cover + Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-5 text-center font-mono text-xs text-white/50 shrink-0">
                        {isSelected && isPlaying ? (
                          <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : (
                          <span>#{idx + 1}</span>
                        )}
                      </div>

                      {/* Cover with DJ Vinyl Badge */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10 flex items-center justify-center">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Music className="w-5 h-5 text-white/40" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-violet-600/40 backdrop-blur-[1px] flex items-center justify-center">
                            <Disc3 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Title, Artist, Genre Badge */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-violet-300 font-bold' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </p>
                        </div>
                        <p className="text-xs text-white/60 truncate font-medium">
                          {track.artist}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {track.genre}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20">
                            {trackBpm} BPM
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                            {formatTime(track.durationSec)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Duration, Like & Deck Button */}
                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(track, e);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          trackLiked
                            ? 'text-pink-400'
                            : 'text-white/40 hover:text-white'
                        }`}
                        aria-label={trackLiked ? 'Batal suka' : 'Suka'}
                      >
                        <Heart className={`w-4 h-4 ${trackLiked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTrack(track)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected && isPlaying
                            ? 'bg-emerald-500 text-neutral-950 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                            : 'bg-white/10 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {isSelected && isPlaying ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span>ON AIR</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>PUTAR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ACTIVE QUEUE TRACKS */}
          {activeListTab === 'queue' && (
            <div>
              {queueTracks.length === 0 ? (
                <div className="py-12 text-center text-white/50 text-sm">
                  Antrean trek DJ kosong. Pilih musik untuk dimasukkan ke antrean.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
                  {queueTracks.map((track, idx) => {
                    const isSelected = track.id === currentTrack.id;
                    const trackLiked = isTrackLiked(track.id);

                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer pt-3 ${
                          isSelected
                            ? 'bg-violet-500/20 border border-violet-500/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                            : 'hover:bg-white/10 text-white/80'
                        }`}
                        onClick={() => onSelectTrack(track)}
                      >
                        {/* Left: Index / Sound wave & Cover art */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 text-center font-mono text-xs text-white/40 shrink-0">
                            {isSelected && isPlaying ? (
                              <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          {/* Small Cover Art */}
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10 flex items-center justify-center">
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Music className="w-4 h-4 text-white/40" />
                            )}
                          </div>

                          {/* Title & Artist */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isSelected ? 'text-violet-300 font-bold' : 'text-white'
                                }`}
                              >
                                {track.title}
                              </p>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-violet-400 text-neutral-950 shrink-0">
                                  Now
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        {/* Right: Duration & Like */}
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs font-mono text-white/60 tabular-nums">
                            {formatTime(track.durationSec)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike(track, e);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              trackLiked
                                ? 'text-pink-400'
                                : 'text-white/40 hover:text-white'
                            }`}
                            aria-label={trackLiked ? 'Batal suka' : 'Suka'}
                          >
                            <Heart
                              className={`w-4 h-4 ${trackLiked ? 'fill-current' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
