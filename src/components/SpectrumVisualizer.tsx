import React, { useEffect, useRef } from 'react';
import { studioAudioEngine } from '../services/audioEngine';

interface SpectrumVisualizerProps {
  isPlaying: boolean;
  height?: number;
  barCount?: number;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  isPlaying,
  height = 56,
  barCount = 32,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const freqData = new Uint8Array(64);
    let animId = 0;

    const render = () => {
      studioAudioEngine.getFrequencyData(freqData);
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

      for (let i = 0; i < barCount; i++) {
        const rawVal = freqData[i] || 0;
        const normalized = isPlaying ? Math.max(0.08, rawVal / 255) : 0.06;
        const barHeight = Math.max(3, normalized * (h - 4));
        const x = i * (barWidth + gap);
        const y = h - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, '#f59e0b'); // amber-500
        gradient.addColorStop(1, '#d97706'); // amber-600

        ctx.fillStyle = isPlaying ? gradient : 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={height}
      className="w-full block"
      aria-label="Visualisasi spektrum frekuensi audio"
    />
  );
};
