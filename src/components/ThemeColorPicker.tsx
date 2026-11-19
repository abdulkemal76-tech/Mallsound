import React from 'react';
import { Check, Palette, RotateCcw } from 'lucide-react';
import {
  THEME_COLOR_PRESETS,
  DEFAULT_THEME_COLOR,
  isValidHexColor,
} from '../theme/themeConfig';

export interface ThemeColorPickerProps {
  currentAccent: string;
  onSelectAccent: (hex: string) => void;
  className?: string;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  currentAccent,
  onSelectAccent,
  className = '',
}) => {
  const isCustomColor = !THEME_COLOR_PRESETS.some(
    (p) => p.hex.toLowerCase() === currentAccent.toLowerCase()
  );

  return (
    <div
      className={`p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 space-y-3.5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{
              backgroundColor: currentAccent,
              boxShadow: `0 0 12px ${currentAccent}66`,
            }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Warna Aksen Tema</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium text-white shadow-xs"
                style={{ backgroundColor: currentAccent }}
              >
                {currentAccent.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Ubah warna lampu aksen, tombol, dan navigasi sesuka hati
            </p>
          </div>
        </div>

        {currentAccent.toLowerCase() !== DEFAULT_THEME_COLOR.toLowerCase() && (
          <button
            type="button"
            onClick={() => onSelectAccent(DEFAULT_THEME_COLOR)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 hover:text-white transition-colors"
            title="Reset ke warna default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {THEME_COLOR_PRESETS.map((preset) => {
          const isSelected =
            preset.hex.toLowerCase() === currentAccent.toLowerCase();
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectAccent(preset.hex)}
              className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-white/50 bg-white/10 scale-105 shadow-md'
                  : 'border-slate-200 dark:border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }`}
              title={preset.name}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                style={{
                  backgroundColor: preset.hex,
                  boxShadow: isSelected
                    ? `0 0 14px ${preset.hex}`
                    : `0 0 6px ${preset.hex}44`,
                }}
              >
                {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </div>
              <span className="text-[9px] font-medium text-slate-700 dark:text-zinc-300 truncate w-full text-center">
                {preset.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Color Selector (Warna Bebas / Sesuka Hati) */}
      <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Native HTML5 Color Picker wrapped in custom styling */}
          <div className="relative w-8 h-8 rounded-xl overflow-hidden cursor-pointer border border-white/20 shadow-inner shrink-0">
            <input
              type="color"
              value={currentAccent}
              onChange={(e) => onSelectAccent(e.target.value)}
              className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer opacity-0"
              title="Pilih warna bebas sesuka hati"
            />
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: currentAccent }}
            >
              <Palette className="w-4 h-4 text-white/90 drop-shadow" />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
              Pilih Warna Bebas (RGB / Hex)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400">
              Klik kotak warna untuk spektrum lengkap
            </span>
          </div>
        </div>

        {/* Manual Hex Input */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">#</span>
          <input
            type="text"
            maxLength={7}
            value={currentAccent.replace('#', '')}
            onChange={(e) => {
              const val = `#${e.target.value.replace(/[^A-Fa-f0-9]/g, '')}`;
              if (val.length <= 7) {
                if (isValidHexColor(val)) {
                  onSelectAccent(val);
                }
              }
            }}
            placeholder="8b5cf6"
            className="w-16 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
