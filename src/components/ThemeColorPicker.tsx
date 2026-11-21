import React from 'react';
import { Check, Palette, RotateCcw, Sun, Moon, Sparkles } from 'lucide-react';
import {
  THEME_COLOR_PRESETS,
  APP_THEME_PRESETS,
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_MODE,
  ThemeMode,
  isValidHexColor,
} from '../theme/themeConfig';

export interface ThemeColorPickerProps {
  currentAccent: string;
  onSelectAccent: (hex: string) => void;
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  className?: string;
}

export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = ({
  currentAccent,
  onSelectAccent,
  currentTheme = DEFAULT_THEME_MODE,
  onSelectTheme,
  className = '',
}) => {
  const isCustomColor = !THEME_COLOR_PRESETS.some(
    (p) => p.hex.toLowerCase() === currentAccent.toLowerCase()
  );

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/5 space-y-6 ${className}`}
    >
      {/* =====================================================================
          1. FULL-APP BACKGROUND THEME SELECTOR (Terang, Gelap, & Warna Panggung)
      ===================================================================== */}
      {onSelectTheme && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Warna Background & Tema Aplikasi
                </h4>
                <p className="text-[11px] text-white/60">
                  Ubah warna tampilan keseluruhan: Terang, Gelap OLED, atau Warna Konser
                </p>
              </div>
            </div>

            {currentTheme !== DEFAULT_THEME_MODE && (
              <button
                type="button"
                onClick={() => onSelectTheme(DEFAULT_THEME_MODE)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Kembali ke Gelap OLED"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {APP_THEME_PRESETS.map((preset) => {
              const isSelected = preset.id === currentTheme;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectTheme(preset.id)}
                  className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    isSelected
                      ? 'border-violet-400 scale-[1.02]'
                      : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: preset.bgHex,
                  }}
                >
                  {/* Subtle top gradient swatch */}
                  <div
                    className={`h-8 w-full rounded-lg bg-gradient-to-r ${preset.previewGradient} border border-white/10 flex items-center justify-between px-2.5 shadow-inner`}
                  >
                    <div className="flex items-center gap-1.5">
                      {preset.isLight ? (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-violet-300" />
                      )}
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: preset.accentDefault }}
                      />
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <p
                      className="text-xs font-bold truncate"
                      style={{ color: preset.textPrimary }}
                    >
                      {preset.name}
                    </p>
                    <p
                      className="text-[10px] line-clamp-2 mt-0.5"
                      style={{ color: preset.textSecondary }}
                    >
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. ACCENT COLOR CUSTOMIZER (Warna Garis, Tombol & Glow)
      ===================================================================== */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
              style={{
                backgroundColor: currentAccent,
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Warna Aksen & Garis Lagu</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium text-white shadow-xs"
                  style={{ backgroundColor: currentAccent }}
                >
                  {currentAccent.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Pilih warna pencahayaan fader, indikator durasi lagu, dan tombol aktif
              </p>
            </div>
          </div>

          {currentAccent.toLowerCase() !== DEFAULT_THEME_COLOR.toLowerCase() && (
            <button
              type="button"
              onClick={() => onSelectAccent(DEFAULT_THEME_COLOR)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Reset ke warna ungu default"
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
                    ? 'border-white/50 bg-white/10 scale-105'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
                title={preset.name}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                  style={{
                    backgroundColor: preset.hex,
                  }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </div>
                <span className="text-[9px] font-medium text-white/80 truncate w-full text-center">
                  {preset.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom HEX Input */}
        <div className="flex items-center gap-2 pt-1">
          <label
            htmlFor="custom-theme-hex"
            className="text-[11px] text-white/70 font-medium shrink-0"
          >
            Warna Kustom HEX:
          </label>
          <div className="relative flex-1 max-w-xs flex items-center">
            <input
              id="custom-theme-hex"
              type="text"
              placeholder="#8b5cf6"
              maxLength={7}
              value={currentAccent}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (isValidHexColor(val)) {
                  onSelectAccent(val);
                }
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-violet-500 uppercase"
            />
            <input
              type="color"
              aria-label="Pilih warna dengan color picker"
              value={isValidHexColor(currentAccent) ? currentAccent : DEFAULT_THEME_COLOR}
              onChange={(e) => onSelectAccent(e.target.value)}
              className="absolute right-1 w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
          {isCustomColor && (
            <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Kustom Aktif
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
