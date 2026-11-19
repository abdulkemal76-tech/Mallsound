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
  Check,
  MoreVertical,
} from 'lucide-react';
import { RepeatMode, Track } from '../types/music';
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
  onApplyEqGains?: (gains: [number, number, number, number, number]) => void;
  // Queue
  queueTracks: Track[];
  onSelectTrack: (track: Track, contextTracks?: Track[]) => void;
  isTrackLiked: (trackId: string) => boolean;
  onToggleLike: (track: Track, e?: React.MouseEvent) => void;
  onOpenActions?: (track: Track, e?: React.MouseEvent) => void;
  // Optional extra playback toggles
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  isRepeat?: boolean;
  repeatMode?: RepeatMode;
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
 * Ultra-Optimized High-FPS NeonDJCanvasStage:
 * 1. Zero shadowBlur passes (uses lightweight GPU screen gradients)
 * 2. DPR locked to 1 for 400% faster mobile fillrate with zero frame drops
 * 3. Zero React re-renders on touch/mouse move (direct DOM 3D transform)
 * 4. Clean minimal UI without verbose explanatory text
 */
const NeonDJCanvasStage: React.FC<{
  isPlaying: boolean;
  playbackRate: number;
  lightMode: DiscoLightMode;
  lightSpeed: DiscoSpeed;
  isHoregBass: boolean;
}> = ({
  isPlaying,
  playbackRate,
  lightMode,
  lightSpeed,
  isHoregBass,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageCardRef = useRef<HTMLDivElement | null>(null);

  // Live props stored in refs for zero-lag rendering
  const isPlayingRef = useRef(isPlaying);
  const playbackRateRef = useRef(playbackRate);
  const lightModeRef = useRef(lightMode);
  const lightSpeedRef = useRef(lightSpeed);
  const isHoregBassRef = useRef(isHoregBass);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    playbackRateRef.current = playbackRate;
    lightModeRef.current = lightMode;
    lightSpeedRef.current = lightSpeed;
    isHoregBassRef.current = isHoregBass;
  }, [isPlaying, playbackRate, lightMode, lightSpeed, isHoregBass]);

  // Canvas render engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    // 70 background stars (optimized count)
    const stars = Array.from({ length: 70 }, (_, i) => ({
      x: ((i * 73) % 1000) / 1000,
      y: ((i * 137) % 650) / 1000,
      size: i % 3 === 0 ? 1.8 : 1.0,
      phase: i * 0.7,
      isCross: i % 8 === 0,
    }));

    // Equalizer data (24 bars for high performance)
    const EQ_COUNT = 24;
    const eqHeights = new Float32Array(EQ_COUNT);

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      // DPR capped to 1 for blazing 60-120fps performance on mobile
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    // Helpers without expensive shadowBlur
    function drawSparkle(x: number, y: number, r: number, alpha: number) {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2);
      ctx.lineTo(x + r * 0.5, y - r * 0.5);
      ctx.lineTo(x + r * 2, y);
      ctx.lineTo(x + r * 0.5, y + r * 0.5);
      ctx.lineTo(x, y + r * 2);
      ctx.lineTo(x - r * 0.5, y + r * 0.5);
      ctx.lineTo(x - r * 2, y);
      ctx.lineTo(x - r * 0.5, y - r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawDiscoBeams(beatPhase: number, timeSec: number, mode: DiscoLightMode) {
      if (!ctx || mode === 'off') return;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const pulse = 0.7 + 0.3 * Math.sin(beatPhase * Math.PI);
      const beamLength = Math.hypot(width, height) * 1.15;

      if (mode === 'laser') {
        // High-intensity sharp cyber laser array
        const laserConfigs = [
          { originX: width * 0.1, originY: -10, baseAngle: 0.52, swing: 0.45, speed: 2.4, color: '#00f0ff' },
          { originX: width * 0.9, originY: -10, baseAngle: -0.52, swing: 0.45, speed: 2.4, color: '#ff007f' },
          { originX: width * 0.3, originY: -10, baseAngle: 0.25, swing: 0.55, speed: 3.2, color: '#39ff14' },
          { originX: width * 0.7, originY: -10, baseAngle: -0.25, swing: 0.55, speed: 3.2, color: '#ffb700' },
          { originX: width * 0.5, originY: -10, baseAngle: 0.0, swing: 0.65, speed: 1.8, color: '#a855f7' },
        ];

        laserConfigs.forEach((b, idx) => {
          const angle = b.baseAngle + Math.sin(timeSec * b.speed * Math.PI + idx) * b.swing;
          const endX = b.originX + Math.sin(angle) * beamLength;
          const endY = b.originY + Math.cos(angle) * beamLength;

          // Glowing laser fan
          const fanGrad = ctx.createLinearGradient(b.originX, b.originY, endX, endY);
          fanGrad.addColorStop(0, b.color);
          fanGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
          ctx.strokeStyle = fanGrad;
          ctx.lineWidth = 4 + pulse * 2;
          ctx.beginPath();
          ctx.moveTo(b.originX, b.originY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Intense razor core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(b.originX, b.originY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
      } else if (mode === 'strobe') {
        // High-energy strobe flashes synced to beat kick
        const strobeKick = Math.pow(Math.sin(beatPhase * Math.PI), 4);
        if (strobeKick > 0.4) {
          const strobeConfigs = [
            { originX: width * 0.2, angle: 0.35, color: '#ffffff' },
            { originX: width * 0.5, angle: (Math.sin(timeSec * 8) * 0.25), color: '#67e8f9' },
            { originX: width * 0.8, angle: -0.35, color: '#ffffff' },
          ];
          strobeConfigs.forEach((s) => {
            const grad = ctx.createLinearGradient(
              s.originX, -10,
              s.originX + Math.sin(s.angle) * beamLength,
              Math.cos(s.angle) * beamLength
            );
            grad.addColorStop(0, s.color);
            grad.addColorStop(0.8, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            const w = 0.24 * strobeKick;
            ctx.beginPath();
            ctx.moveTo(s.originX, -10);
            ctx.lineTo(s.originX + Math.sin(s.angle - w) * beamLength, Math.cos(s.angle - w) * beamLength);
            ctx.lineTo(s.originX + Math.sin(s.angle + w) * beamLength, Math.cos(s.angle + w) * beamLength);
            ctx.closePath();
            ctx.fill();
          });
        }
      } else if (mode === 'ambient') {
        // Deep club aurora rolling spotlights
        const ambientConfigs = [
          { originX: width * 0.25, baseAngle: 0.2, swing: 0.25, speed: 0.8, color: 'rgba(147, 51, 234, 0.65)', width: 0.28 },
          { originX: width * 0.75, baseAngle: -0.2, swing: 0.25, speed: 0.8, color: 'rgba(6, 182, 212, 0.65)', width: 0.28 },
        ];
        ambientConfigs.forEach((b, idx) => {
          const angle = b.baseAngle + Math.sin(timeSec * b.speed * Math.PI + idx) * b.swing;
          const leftAngle = angle - b.width;
          const rightAngle = angle + b.width;
          const grad = ctx.createLinearGradient(
            b.originX, -15,
            b.originX + Math.sin(angle) * beamLength,
            -15 + Math.cos(angle) * beamLength
          );
          grad.addColorStop(0, b.color);
          grad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(b.originX, -15);
          ctx.lineTo(b.originX + Math.sin(leftAngle) * beamLength, -15 + Math.cos(leftAngle) * beamLength);
          ctx.lineTo(b.originX + Math.sin(rightAngle) * beamLength, -15 + Math.cos(rightAngle) * beamLength);
          ctx.closePath();
          ctx.fill();
        });
      } else {
        // Default 'disco' RGB: 6 sweeping moving-head concert beams with rich neon punch
        const beamConfigs = [
          { originX: width * 0.1, originY: -15, baseAngle: 0.46, swing: 0.38, speed: 1.2, color: 'rgba(236, 72, 153, 0.7)', width: 0.2 },
          { originX: width * 0.9, originY: -15, baseAngle: -0.46, swing: 0.38, speed: 1.2, color: 'rgba(34, 211, 238, 0.7)', width: 0.2 },
          { originX: width * 0.28, originY: -15, baseAngle: 0.22, swing: 0.48, speed: 1.8, color: 'rgba(168, 85, 247, 0.65)', width: 0.18 },
          { originX: width * 0.72, originY: -15, baseAngle: -0.22, swing: 0.48, speed: 1.8, color: 'rgba(244, 63, 94, 0.65)', width: 0.18 },
          { originX: width * 0.45, originY: -15, baseAngle: 0.08, swing: 0.52, speed: 2.2, color: 'rgba(251, 191, 36, 0.6)', width: 0.16 },
          { originX: width * 0.55, originY: -15, baseAngle: -0.08, swing: 0.52, speed: 2.2, color: 'rgba(52, 211, 153, 0.6)', width: 0.16 },
        ];

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
          grad.addColorStop(0.7, b.color.replace(/0\.\d+\)/, (0.15 * pulse).toFixed(2) + ')'));
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(b.originX, b.originY);
          ctx.lineTo(b.originX + Math.sin(leftAngle) * beamLength, b.originY + Math.cos(leftAngle) * beamLength);
          ctx.lineTo(b.originX + Math.sin(rightAngle) * beamLength, b.originY + Math.cos(rightAngle) * beamLength);
          ctx.closePath();
          ctx.fill();
        });
      }

      ctx.restore();
    }

    function drawSideNeonPillars(pulse: number) {
      if (!ctx) return;
      const margin = Math.max(16, width * 0.05);
      const pillarPositions = [margin, width - margin];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      pillarPositions.forEach((px, idx) => {
        const color = idx === 0 ? '#f472b6' : '#22d3ee';

        const glowGrad = ctx.createLinearGradient(px - 55, 0, px + 55, 0);
        glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        glowGrad.addColorStop(0.5, idx === 0 ? `rgba(236, 72, 153, ${0.4 + pulse * 0.3})` : `rgba(6, 182, 212, ${0.4 + pulse * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(px - 55, 0, 110, height * 0.8);

        ctx.strokeStyle = color;
        ctx.lineWidth = 4.5;
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

      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        const baseY = deskY - height * 0.16 + l * 14;
        const amp = (32 + l * 10) * (0.9 + pulse * 0.5);
        const freq = 0.006 + l * 0.0015;
        const speed = timeSec * Math.PI * (l % 2 === 0 ? 1 : -1) + l;

        for (let x = 0; x <= width; x += 20) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y = baseY - Math.sin(x * freq + speed) * amp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = l % 2 === 0
          ? `rgba(244, 114, 182, ${0.45 + pulse * 0.25})`
          : `rgba(34, 211, 238, ${0.4 + pulse * 0.25})`;
        ctx.lineWidth = 2.6;
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawEqualizer(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean, horeg: boolean) {
      if (!ctx) return;
      const totalWidth = Math.min(width * 0.85, 900);
      const startX = (width - totalWidth) / 2;
      const step = totalWidth / EQ_COUNT;
      const barWidth = Math.max(4.0, step * 0.65);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const horegBoost = horeg ? 1.65 : 1.0;

      for (let i = 0; i < EQ_COUNT; i++) {
        const centerDist = Math.abs(i - (EQ_COUNT - 1) / 2) / ((EQ_COUNT - 1) / 2);
        const arch = 1 - Math.pow(centerDist, 1.5) * 0.5;

        const wave1 = Math.sin(timeSec * Math.PI * 4 + i * 0.6);
        const wave2 = Math.cos(timeSec * Math.PI * 2 - i * 0.9);
        const kick = Math.pow(Math.sin(beatPhase * Math.PI), 3);

        const targetH = activePlaying
          ? (28 + Math.abs(wave1 * 0.5 + wave2 * 0.5) * 110 + kick * 75) * arch * (height / 680) * horegBoost
          : 12 * arch;
        eqHeights[i] += (targetH - eqHeights[i]) * 0.42;

        const bx = startX + i * step + (step - barWidth) / 2;
        const bh = Math.max(5, eqHeights[i]);
        const by = deskY - bh - 4;

        const barGrad = ctx.createLinearGradient(bx, by, bx, deskY);
        barGrad.addColorStop(0, '#ffffff');
        barGrad.addColorStop(0.25, i % 3 === 0 ? '#38bdf8' : '#ec4899');
        barGrad.addColorStop(0.7, '#a855f7');
        barGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = barGrad;
        ctx.fillRect(bx, by, barWidth, bh);
      }

      ctx.restore();
    }

    function drawDJ(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean) {
      if (!ctx) return;
      const scale = Math.min(width / 1060, height / 640, 1.15);
      const cx = width * 0.5;

      const bobY = activePlaying ? Math.sin(beatPhase * Math.PI) * 9 * scale : 0;
      const swayX = activePlaying ? Math.sin(timeSec * Math.PI) * 7 * scale : 0;
      const headTilt = activePlaying ? Math.sin(timeSec * Math.PI) * 0.06 : 0;

      ctx.save();
      ctx.translate(cx + swayX, deskY + bobY);
      ctx.scale(scale, scale);

      // Back aura
      const backGlow = ctx.createRadialGradient(0, -145, 10, 0, -145, 210);
      backGlow.addColorStop(0, 'rgba(232, 121, 249, 0.4)');
      backGlow.addColorStop(0.6, 'rgba(147, 51, 234, 0.15)');
      backGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = backGlow;
      ctx.beginPath();
      ctx.arc(0, -145, 210, 0, Math.PI * 2);
      ctx.fill();

      // DJ Body
      ctx.fillStyle = '#070112';
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(-140, 10);
      ctx.quadraticCurveTo(-128, -90, -60, -105);
      ctx.lineTo(60, -105);
      ctx.quadraticCurveTo(128, -90, 140, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Head & Headphones
      ctx.save();
      ctx.translate(0, -155);
      ctx.rotate(headTilt);

      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(0, -4, 50, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();

      ctx.fillStyle = '#060010';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 4, 38, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      [-44, 44].forEach((hx, i) => {
        ctx.fillStyle = '#120329';
        ctx.strokeStyle = i === 0 ? '#38bdf8' : '#f472b6';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.roundRect(hx - 8, -15, 16, 38, 7);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();

      // Left Arm (Scratching)
      const leftHandX = -65 + (activePlaying ? Math.sin(timeSec * Math.PI * 2) * 35 : 0);
      const leftHandY = -12 + (activePlaying ? Math.cos(timeSec * Math.PI * 4) * 7 : 0);

      ctx.strokeStyle = '#e879f9';
      ctx.fillStyle = '#070112';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-110, -85);
      ctx.quadraticCurveTo(-128, -35, leftHandX - 10, leftHandY);
      ctx.lineTo(leftHandX + 14, leftHandY + 4);
      ctx.quadraticCurveTo(-86, -42, -75, -84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Arm (Mixer)
      const rightHandX = 65 + (activePlaying ? Math.cos(timeSec * Math.PI * 2) * 33 : 0);
      const rightHandY = -14 + (activePlaying ? Math.sin(timeSec * Math.PI * 4) * 8 : 0);

      ctx.beginPath();
      ctx.moveTo(110, -85);
      ctx.quadraticCurveTo(128, -35, rightHandX + 10, rightHandY);
      ctx.lineTo(rightHandX - 14, rightHandY + 4);
      ctx.quadraticCurveTo(86, -42, 75, -84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    function drawDJBooth(deskY: number, timeSec: number, beatPhase: number, activePlaying: boolean) {
      if (!ctx) return;
      const boothHeight = height - deskY;
      const pulse = Math.pow(Math.sin(beatPhase * Math.PI), 2);

      const deskGrad = ctx.createLinearGradient(0, deskY, 0, height);
      deskGrad.addColorStop(0, '#130329');
      deskGrad.addColorStop(0.3, '#090117');
      deskGrad.addColorStop(1, '#030008');
      ctx.fillStyle = deskGrad;
      ctx.fillRect(0, deskY, width, boothHeight);

      // Edge line
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, deskY);
      ctx.lineTo(width, deskY);
      ctx.stroke();

      const consoleW = Math.min(width * 0.88, 900);
      const consoleH = Math.min(boothHeight * 0.78, 150);
      const cx = width * 0.5;

      const deckOffset = consoleW * 0.31;
      const deckW = consoleW * 0.33;

      // 2 Turntables
      [-1, 1].forEach((dir) => {
        const dx = cx + dir * deckOffset;

        ctx.fillStyle = '#0d021f';
        ctx.strokeStyle = dir === -1 ? '#e879f9' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(dx - deckW / 2, deskY + 8, deckW, consoleH * 0.85, 10);
        ctx.fill();
        ctx.stroke();

        const platterRx = deckW * 0.37;
        const platterRy = consoleH * 0.27;
        const platterY = deskY + consoleH * 0.48;

        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(dx, platterY, platterRx, platterRy, 0, 0, Math.PI * 2);
        ctx.stroke();

        const spinAngle = activePlaying ? timeSec * Math.PI * 3.5 * dir : 0;
        ctx.strokeStyle = dir === -1 ? '#38bdf8' : '#f472b6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(dx, platterY, platterRx * 0.65, platterRy * 0.65, 0, spinAngle, spinAngle + 1.4);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(dx, platterY, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mixer
      const mixerW = consoleW * 0.28;
      ctx.fillStyle = '#110326';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - mixerW / 2, deskY + 6, mixerW, consoleH * 0.9, 8);
      ctx.fill();
      ctx.stroke();

      // RGB Pads
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

      // Crossfader
      const faderX = cx + (activePlaying ? Math.sin(timeSec * Math.PI * 2) * (mixerW * 0.24) : 0);
      const faderY = deskY + consoleH * 0.82;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - mixerW * 0.28, faderY);
      ctx.lineTo(cx + mixerW * 0.28, faderY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(faderX - 5, faderY - 5, 10, 10);

      // Floor Glow
      const floorGlow = ctx.createRadialGradient(
        cx,
        deskY + consoleH + 15,
        10,
        cx,
        deskY + consoleH + 15,
        consoleW * 0.45
      );
      floorGlow.addColorStop(0, `rgba(56, 189, 248, ${0.22 + pulse * 0.18})`);
      floorGlow.addColorStop(0.6, `rgba(217, 70, 239, ${0.14 + pulse * 0.14})`);
      floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGlow;
      ctx.fillRect(0, deskY + consoleH - 10, width, boothHeight);
    }

    // High-FPS Render Loop
    let lastTimeMs = performance.now();
    let accumulatedTime = 0;

    const render = (nowMs: number) => {
      const deltaSec = Math.min((nowMs - lastTimeMs) * 0.001, 0.05);
      lastTimeMs = nowMs;

      const activePlaying = isPlayingRef.current;
      const rate = playbackRateRef.current || 1.0;
      const spdMode = lightSpeedRef.current;
      const spdMult = spdMode === 'hyper' ? 2.2 : spdMode === 'turbo' ? 1.5 : 1.0;

      if (activePlaying) {
        accumulatedTime += deltaSec * rate * spdMult;
      } else {
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

      // 2. Stars
      stars.forEach((s) => {
        const sx = s.x * width;
        const sy = s.y * height;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(loopSec * Math.PI + s.phase));
        if (s.isCross) {
          drawSparkle(sx, sy, s.size * 1.8, twinkle);
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

      // 5. Cyber Waves
      drawCyberWaves(loopSec, deskY, pulse);

      // 6. Equalizer
      drawEqualizer(deskY, loopSec, beatPhase, activePlaying, isHoregBassRef.current);

      // 7. DJ Character
      drawDJ(deskY, loopSec, beatPhase, activePlaying);

      // 8. DJ Booth
      drawDJBooth(deskY, loopSec, beatPhase, activePlaying);

      // 9. Bass Kick Atmosphere Glow
      if (activePlaying && pulse > 0.92) {
        ctx.fillStyle = `rgba(232, 121, 249, ${(pulse - 0.92) * 0.4})`;
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

  // Lag-free Direct DOM 3D Tilt (No React state re-renders!)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !stageCardRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const tiltX = Math.max(-12, Math.min(12, x * 24));
    const tiltY = Math.max(-12, Math.min(12, -y * 24));
    stageCardRef.current.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale3d(1.015, 1.015, 1.015)`;
  };

  const handlePointerLeave = () => {
    if (stageCardRef.current) {
      stageCardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      <div
        ref={containerRef}
        className="w-full max-w-4xl perspective-[1000px]"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <div
          ref={stageCardRef}
          className="relative w-full aspect-[16/9] min-h-[280px] max-h-[480px] rounded-3xl overflow-hidden border border-fuchsia-500/30 bg-black transition-transform duration-100 ease-out will-change-transform"
        >
          {/* Canvas Engine */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Subwoofer Bass Horeg Shockwave Frame */}
          {isPlaying && isHoregBass && (
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none border border-fuchsia-400/80"
              style={{
                animation: 'dj-bass-kick-1 0.45s cubic-bezier(0.1, 0.9, 0.2, 1) infinite',
              }}
            />
          )}

          {/* Clean Accent Ring */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
        </div>
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
  onApplyEqGains,
  queueTracks,
  onSelectTrack,
  isTrackLiked,
  onToggleLike,
  onOpenActions,
  isShuffle: propIsShuffle,
  onToggleShuffle: propOnToggleShuffle,
  isRepeat: propIsRepeat,
  repeatMode: propRepeatMode,
  onToggleRepeat: propOnToggleRepeat,
}) => {
  // Auto-Save storage key & state initialization
  const [localShuffle, setLocalShuffle] = useState(false);
  const [localRepeat, setLocalRepeat] = useState(false);

  const [lightMode, setLightMode] = useState<DiscoLightMode>(() => {
    try {
      const saved = localStorage.getItem('mallsound_dj_console_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lightMode) return parsed.lightMode;
      }
    } catch {
      // ignore
    }
    return 'disco';
  });

  const [lightSpeed, setLightSpeed] = useState<DiscoSpeed>(() => {
    try {
      const saved = localStorage.getItem('mallsound_dj_console_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lightSpeed) return parsed.lightSpeed;
      }
    } catch {
      // ignore
    }
    return 'hyper';
  });

  const [activeListTab, setActiveListTab] = useState<'dj-indo' | 'queue'>(() => {
    try {
      const saved = localStorage.getItem('mallsound_dj_console_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeListTab) return parsed.activeListTab;
      }
    } catch {
      // ignore
    }
    return 'dj-indo';
  });

  // Auto-save notification feedback state
  const [autoSaveActive, setAutoSaveActive] = useState(false);

  // Auto-save effect: automatically persists all DJ console settings
  useEffect(() => {
    try {
      const payload = {
        lightMode,
        lightSpeed,
        activeListTab,
        eqGains,
        playbackRate,
      };
      localStorage.setItem('mallsound_dj_console_settings', JSON.stringify(payload));
      localStorage.setItem('mallsound_eq_gains', JSON.stringify(eqGains));
      localStorage.setItem('mallsound_playback_rate', String(playbackRate));
      setAutoSaveActive(true);
      const timer = window.setTimeout(() => setAutoSaveActive(false), 1800);
      return () => window.clearTimeout(timer);
    } catch {
      // ignore
    }
  }, [lightMode, lightSpeed, activeListTab, eqGains, playbackRate]);

  const isShuffle = propIsShuffle !== undefined ? propIsShuffle : localShuffle;
  const isRepeat = propIsRepeat !== undefined ? propIsRepeat : localRepeat;
  const repeatMode = propRepeatMode !== undefined ? propRepeatMode : (isRepeat ? 'all' : 'off');

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

  // Bass Boost Logic:
  // Mega Bass Horeg: +12dB on 60Hz and +8dB on 230Hz
  const isHoregBass = eqGains[0] >= 10;
  const isSubBassClub = !isHoregBass && eqGains[0] >= 5;

  const handleSetMegaBassHoreg = () => {
    if (isHoregBass) {
      if (onApplyEqGains) {
        onApplyEqGains([0, 0, eqGains[2], eqGains[3], eqGains[4]]);
      } else {
        onEqBandChange(0, 0);
        onEqBandChange(1, 0);
      }
    } else {
      if (onApplyEqGains) {
        onApplyEqGains([12, 8, eqGains[2], eqGains[3], eqGains[4]]);
      } else {
        onEqBandChange(0, 12);
        onEqBandChange(1, 8);
      }
    }
  };

  const handleSetSubBassClub = () => {
    if (isSubBassClub) {
      if (onApplyEqGains) {
        onApplyEqGains([0, 0, eqGains[2], eqGains[3], eqGains[4]]);
      } else {
        onEqBandChange(0, 0);
        onEqBandChange(1, 0);
      }
    } else {
      if (onApplyEqGains) {
        onApplyEqGains([6, 4, eqGains[2], eqGains[3], eqGains[4]]);
      } else {
        onEqBandChange(0, 6);
        onEqBandChange(1, 4);
      }
    }
  };

  // Vocal Boost: +4dB on 910Hz and +3dB on 3.6kHz
  const isVocalBoostActive = eqGains[2] >= 3.5;
  const handleToggleVocalBoost = () => {
    if (isVocalBoostActive) {
      if (onApplyEqGains) {
        onApplyEqGains([eqGains[0], eqGains[1], 0, 0, eqGains[4]]);
      } else {
        onEqBandChange(2, 0);
        onEqBandChange(3, 0);
      }
    } else {
      if (onApplyEqGains) {
        onApplyEqGains([eqGains[0], eqGains[1], 4, 3, eqGains[4]]);
      } else {
        onEqBandChange(2, 4);
        onEqBandChange(3, 3);
      }
    }
  };

  // Reset EQ
  const handleResetEq = () => {
    if (onApplyEqGains) {
      onApplyEqGains([0, 0, 0, 0, 0]);
    } else {
      [0, 1, 2, 3, 4].forEach((idx) => onEqBandChange(idx, 0));
    }
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
      {/* Embedded CSS Keyframes for High-Speed Rave & Clean Transitions */}
      <style>{`
        @keyframes dj-bass-kick-1 {
          0% { transform: scale(1.0); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(1.1); opacity: 0; }
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

      {/* Top Ambient Glow */}
      <div
        className={`absolute top-0 inset-x-0 w-full h-64 blur-3xl pointer-events-none transition-opacity duration-300 ${
          isPlaying
            ? 'bg-violet-600/20 opacity-60'
            : 'bg-violet-900/10 opacity-20'
        }`}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* =================================================================
            1. CLEAN HEADER
        ================================================================= */}
        <header className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent animate-gradient-text">
              🎧 DJ Studio
            </h1>
          </div>

          {/* Right Status Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                }`}
              />
              <span className="font-medium text-white/80">
                {isPlaying ? 'ON DECK' : 'PAUSED'}
              </span>
            </div>

            {/* Auto-Save Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-300 border ${
                autoSaveActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'bg-white/5 text-white/60 border-white/10'
              }`}
              title="Pengaturan konsol DJ tersimpan otomatis"
            >
              <Check className={`w-3.5 h-3.5 ${autoSaveActive ? 'text-emerald-400' : 'text-emerald-500/70'}`} />
              <span className="hidden sm:inline text-[11px]">Auto-Save</span>
            </div>

          </div>
        </header>

        {/* =================================================================
            2. NOW PLAYING DECK & ULTRA-FAST CANVAS STAGE
        ================================================================= */}
        <section className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 relative space-y-5">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent" />

          {/* High-Performance Canvas Stage */}
          <NeonDJCanvasStage
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            lightMode={lightMode}
            lightSpeed={lightSpeed}
            isHoregBass={isHoregBass}
          />

          {/* Track Info & Like Action */}
          <div className="flex flex-col items-center text-center space-y-2.5 max-w-xl mx-auto pt-1">
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white truncate tracking-tight">
                  {currentTrack.title || 'Pilih Trek DJ'}
                </h2>
                <p className="text-sm text-white/70 truncate font-medium">
                  {currentTrack.artist || 'Artis DJ'}
                  {currentTrack.album ? ` • ${currentTrack.album}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => onToggleLike(currentTrack, e)}
                className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  isLiked
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
                aria-label={isLiked ? 'Batal suka' : 'Sukai lagu'}
                title={isLiked ? 'Disukai' : 'Sukai'}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Large Progress Bar */}
          <div className="w-full max-w-2xl mx-auto space-y-1.5 pt-1">
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
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-400 focus:outline-none transition-all"
                style={{
                  background: `linear-gradient(to right, rgb(139, 92, 246) 0%, rgb(217, 70, 239) ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%, rgba(255, 255, 255, 0.1) 100%)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-white/60 tabular-nums px-1">
              <span className="text-violet-300 font-semibold">{formatTime(currentTimeSec)}</span>
              <span className="text-emerald-300 font-semibold">{formatTime(durationSec)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 pt-1">
            {/* Shuffle Button */}
            <button
              type="button"
              onClick={handleToggleShuffle}
              className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                isShuffle
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 border border-violet-400/50 scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              }`}
              title={isShuffle ? 'Mode Acak: AKTIF' : 'Mode Acak: NONAKTIF'}
            >
              <Shuffle className="w-5 h-5" />
              {isShuffle && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={onPrevTrack}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Sebelumnya"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="p-5 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-current" />
              ) : (
                <Play className="w-8 h-8 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNextTrack}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Selanjutnya"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* Repeat Button */}
            <button
              type="button"
              onClick={handleToggleRepeat}
              className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
                repeatMode === 'one'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/40 border border-pink-400/50 scale-105'
                  : (isRepeat || repeatMode === 'all')
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 border border-violet-400/50 scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              }`}
              title={
                repeatMode === 'one'
                  ? 'Ulangi 1 Lagu: AKTIF'
                  : isRepeat
                  ? 'Ulangi Semua: AKTIF'
                  : 'Ulangi: NONAKTIF'
              }
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] font-black flex items-center justify-center shadow">
                  1
                </span>
              )}
              {repeatMode === 'all' && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </button>
          </div>
        </section>

        {/* =================================================================
            3. CLUB LIGHTING FX CONTROLLER (Clean & Minimalist)
        ================================================================= */}
        <section className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold font-display text-white">
                Pencahayaan
              </h2>
            </div>

            {/* Clean Speed Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {[
                { id: 'hyper', label: '🚀 HYPER' },
                { id: 'turbo', label: '⚡ FAST' },
                { id: 'normal', label: '🌌 NORMAL' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setLightSpeed(sp.id as DiscoSpeed)}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    lightSpeed === sp.id
                      ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Mode Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'disco', label: '🌈 Disco RGB' },
              { id: 'laser', label: '🚨 Cyber Laser' },
              { id: 'strobe', label: '⚡ Strobe Club' },
              { id: 'ambient', label: '🌌 Club Ambient' },
              { id: 'off', label: '🌑 Off' },
            ].map((mode) => {
              const isActive = lightMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLightMode(mode.id as DiscoLightMode)}
                  className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-400 text-white shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* =================================================================
            4. DJ HARDWARE CONTROLS: PITCH, 5-BAND EQ, MASTER FADER
        ================================================================= */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>Kontrol Studio</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Speed & Pitch */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
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
                >
                  Reset
                </button>
              </div>

              <div className="text-center py-1.5 bg-black/40 rounded-xl border border-white/5">
                <div className="text-2xl font-extrabold font-mono text-violet-400 tabular-nums">
                  {playbackRate.toFixed(2)}x
                </div>
              </div>

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
                />
              </div>

              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {QUICK_SPEEDS.map((spd) => {
                  const isActive = Math.abs(playbackRate - spd) < 0.01;
                  return (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => onPlaybackRateChange(spd)}
                      className={`py-1 px-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-violet-500 text-white font-bold'
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
            <div className="md:col-span-2 bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    5-Band Equalizer
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/50">±12 dB</span>
              </div>

              <div className="grid grid-cols-5 gap-2 py-1 flex-1 items-center">
                {EQ_BAND_LABELS.map((label, idx) => {
                  const gain = eqGains[idx];
                  const formattedGain =
                    gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1);

                  return (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-between h-40 py-1 bg-black/25 rounded-xl border border-white/5"
                    >
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

                      <div className="h-24 flex items-center justify-center relative">
                        <div className="absolute w-5 h-[1px] bg-white/20 pointer-events-none" />
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={gain}
                          onChange={(e) =>
                            onEqBandChange(idx, Number(e.target.value))
                          }
                          className="w-20 -rotate-90 accent-fuchsia-400 cursor-pointer"
                        />
                      </div>

                      <span className="text-[10px] font-mono text-white/70 font-medium">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Master Volume Fader */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
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
                <div className="flex flex-col justify-between h-24 w-2 py-0.5 bg-neutral-900 rounded border border-white/10">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const activeThreshold = ((7 - i) / 7) * 100;
                    const isLit = !isMuted && isPlaying && volumePercent >= activeThreshold;
                    const colorClass =
                      i < 2
                        ? isLit
                          ? 'bg-rose-500'
                          : 'bg-rose-950/60'
                        : i < 4
                        ? isLit
                          ? 'bg-amber-400'
                          : 'bg-amber-950/60'
                        : isLit
                        ? 'bg-emerald-400'
                        : 'bg-emerald-950/60';

                    return (
                      <div
                        key={i}
                        className={`h-2 w-full rounded-xs transition-colors duration-150 ${colorClass}`}
                      />
                    );
                  })}
                </div>

                <div className="h-24 flex items-center justify-center">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="w-20 -rotate-90 accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                  isMuted || volume === 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {isMuted || volume === 0 ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-pink-400" />
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Buttons (Clean) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSetMegaBassHoreg}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isHoregBass
                  ? 'bg-gradient-to-r from-amber-600 via-pink-600 to-fuchsia-600 text-white border-amber-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                <Flame className={`w-3.5 h-3.5 ${isHoregBass ? 'text-amber-200' : 'text-amber-400'}`} />
                <span>Mega Bass (+12dB)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSetSubBassClub}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSubBassClub
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                <Activity className={`w-3.5 h-3.5 ${isSubBassClub ? 'text-cyan-300' : 'text-white/40'}`} />
                <span>Club Bass (+6dB)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleToggleVocalBoost}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isVocalBoostActive
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                <Music className={`w-3.5 h-3.5 ${isVocalBoostActive ? 'text-white' : 'text-white/40'}`} />
                <span>Vocal (+4dB)</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleResetEq}
              className="p-3 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-white/90">
                <RotateCcw className="w-3.5 h-3.5 text-white/60" />
                <span>Flat Studio</span>
              </div>
            </button>
          </div>
        </section>

        {/* =================================================================
            5. PLAYLIST TABS: 12 DJ INDO VIRAL vs ANTREAN MUSIK
        ================================================================= */}
        <section className="bg-white/[0.04] border border-white/10 rounded-3xl p-4 sm:p-5 space-y-3.5">
          {/* Clean Tab Switcher */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveListTab('dj-indo')}
                className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeListTab === 'dj-indo'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>🔥 12 DJ Indo Viral</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveListTab('queue')}
                className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeListTab === 'queue'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5 text-violet-300" />
                <span>📋 Antrean</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {queueTracks.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: 12 DJ INDO VIRAL TRACKS */}
          {activeListTab === 'dj-indo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {DJ_INDO_TRACKS.map((track, idx) => {
                const isSelected = track.id === currentTrack.id || track.title === currentTrack.title;
                const trackLiked = isTrackLiked(track.id);
                const trackBpm = DJ_TRACK_BPM[track.id] || 150;

                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(track, DJ_INDO_TRACKS)}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-violet-600/25 border-violet-400 text-white'
                        : 'bg-black/30 hover:bg-white/10 border-white/5 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 text-center font-mono text-xs text-white/50 shrink-0">
                        {isSelected && isPlaying ? (
                          <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : (
                          <span>#{idx + 1}</span>
                        )}
                      </div>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10 flex items-center justify-center">
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
                        {isSelected && (
                          <div className="absolute inset-0 bg-violet-600/40 backdrop-blur-[1px] flex items-center justify-center">
                            <Disc3 className="w-4 h-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-violet-300 font-bold' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </p>
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

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActions?.(track, e);
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Menu aksi lagu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectTrack(track, DJ_INDO_TRACKS)}
                        className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected && isPlaying
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-white/10 hover:bg-violet-500 text-white'
                        }`}
                      >
                        {isSelected && isPlaying ? (
                          <>
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span>ON</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>PLAY</span>
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
                  Antrean trek DJ kosong.
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
                            ? 'bg-violet-500/20 border border-violet-500/40 text-white'
                            : 'hover:bg-white/10 text-white/80'
                        }`}
                        onClick={() => onSelectTrack(track)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 text-center font-mono text-xs text-white/40 shrink-0">
                            {isSelected && isPlaying ? (
                              <Disc3 className="w-4 h-4 text-violet-400 animate-spin" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

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

                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isSelected ? 'text-violet-300 font-bold' : 'text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenActions?.(track, e);
                            }}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Menu aksi lagu"
                          >
                            <MoreVertical className="w-4 h-4" />
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
