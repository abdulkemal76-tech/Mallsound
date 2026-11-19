export interface ThemeColorPreset {
  id: string;
  name: string;
  hex: string;
  glowHex: string;
  subtleHex: string;
  gradient: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    hex: '#8b5cf6',
    glowHex: 'rgba(139, 92, 246, 0.45)',
    subtleHex: 'rgba(139, 92, 246, 0.15)',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
  },
  {
    id: 'cyber-fuchsia',
    name: 'Cyber Fuchsia',
    hex: '#ec4899',
    glowHex: 'rgba(236, 72, 153, 0.45)',
    subtleHex: 'rgba(236, 72, 153, 0.15)',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
  },
  {
    id: 'ocean-cyan',
    name: 'Ocean Cyan',
    hex: '#06b6d4',
    glowHex: 'rgba(6, 182, 212, 0.45)',
    subtleHex: 'rgba(6, 182, 212, 0.15)',
    gradient: 'from-cyan-500 via-teal-600 to-blue-600',
  },
  {
    id: 'emerald-synth',
    name: 'Emerald Green',
    hex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.45)',
    subtleHex: 'rgba(16, 185, 129, 0.15)',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    hex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.45)',
    subtleHex: 'rgba(245, 158, 11, 0.15)',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    hex: '#f43f5e',
    glowHex: 'rgba(244, 63, 94, 0.45)',
    subtleHex: 'rgba(244, 63, 94, 0.15)',
    gradient: 'from-rose-600 via-pink-600 to-red-600',
  },
  {
    id: 'cobalt-blue',
    name: 'Cobalt Blue',
    hex: '#3b82f6',
    glowHex: 'rgba(59, 130, 246, 0.45)',
    subtleHex: 'rgba(59, 130, 246, 0.15)',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
  },
  {
    id: 'solar-lime',
    name: 'Solar Lime',
    hex: '#84cc16',
    glowHex: 'rgba(132, 204, 22, 0.45)',
    subtleHex: 'rgba(132, 204, 22, 0.15)',
    gradient: 'from-lime-500 via-emerald-600 to-teal-700',
  },
];

export const DEFAULT_THEME_COLOR = '#8b5cf6';

/**
 * Validates whether string is a valid hex color code
 */
export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex.trim());
}

/**
 * Converts Hex to RGBA string with opacity
 */
export function hexToRgba(hex: string, alpha = 1): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  }
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return `rgba(139, 92, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Applies custom accent color variables to DOM root and updates localStorage
 */
export function applyThemeAccent(hex: string): void {
  if (typeof window === 'undefined') return;
  const safeHex = isValidHexColor(hex) ? hex : DEFAULT_THEME_COLOR;
  const root = document.documentElement;

  root.style.setProperty('--accent-color', safeHex);
  root.style.setProperty('--accent-glow', hexToRgba(safeHex, 0.5));
  root.style.setProperty('--accent-subtle', hexToRgba(safeHex, 0.18));
  root.style.setProperty('--accent-border', hexToRgba(safeHex, 0.35));

  try {
    localStorage.setItem('mallsound_accent_color', safeHex);
  } catch {
    // ignore
  }
}

/**
 * Retrieves saved theme accent color from localStorage
 */
export function getSavedThemeAccent(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_COLOR;
  try {
    const saved = localStorage.getItem('mallsound_accent_color');
    if (saved && isValidHexColor(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return DEFAULT_THEME_COLOR;
}
