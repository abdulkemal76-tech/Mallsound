export type ThemeMode =
  | 'dark'
  | 'light'
  | 'latte'
  | 'violet'
  | 'ocean'
  | 'emerald'
  | 'sunset';

export interface AppThemePreset {
  id: ThemeMode;
  name: string;
  category: 'Gelap' | 'Terang' | 'Warna Panggung';
  description: string;
  isLight: boolean;
  bgHex: string;
  surfaceHex: string;
  borderHex: string;
  textPrimary: string;
  textSecondary: string;
  accentDefault: string;
  previewGradient: string;
}

export const APP_THEME_PRESETS: AppThemePreset[] = [
  {
    id: 'dark',
    name: 'OLED Midnight',
    category: 'Gelap',
    description: 'Hitam pekat OLED hemat baterai & kontras tajam',
    isLight: false,
    bgHex: '#0a0a0c',
    surfaceHex: 'rgba(255, 255, 255, 0.05)',
    borderHex: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    accentDefault: '#8b5cf6',
    previewGradient: 'from-neutral-950 via-zinc-900 to-black',
  },
  {
    id: 'light',
    name: 'Studio Light',
    category: 'Terang',
    description: 'Mode terang modern, bersih, jernih & nyaman di siang hari',
    isLight: true,
    bgHex: '#f8fafc',
    surfaceHex: '#ffffff',
    borderHex: 'rgba(15, 23, 42, 0.08)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    accentDefault: '#7c3aed',
    previewGradient: 'from-slate-100 via-white to-slate-200',
  },
  {
    id: 'latte',
    name: 'Vanilla Latte',
    category: 'Terang',
    description: 'Nuansa krem hangat lembut ala cafe akustik',
    isLight: true,
    bgHex: '#fcfaf6',
    surfaceHex: '#ffffff',
    borderHex: 'rgba(120, 80, 50, 0.1)',
    textPrimary: '#261a12',
    textSecondary: '#786455',
    accentDefault: '#d97706',
    previewGradient: 'from-amber-100 via-orange-50 to-amber-200',
  },
  {
    id: 'violet',
    name: 'Cyber Rave',
    category: 'Warna Panggung',
    description: 'Nuansa ungu neon futuristik khas panggung musik elektronik',
    isLight: false,
    bgHex: '#0c051f',
    surfaceHex: 'rgba(139, 92, 246, 0.12)',
    borderHex: 'rgba(139, 92, 246, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#c4b5fd',
    accentDefault: '#a855f7',
    previewGradient: 'from-violet-950 via-purple-900 to-indigo-950',
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    category: 'Warna Panggung',
    description: 'Biru laut dalam tenang dengan sentuhan cyan elektrik',
    isLight: false,
    bgHex: '#041325',
    surfaceHex: 'rgba(6, 182, 212, 0.12)',
    borderHex: 'rgba(6, 182, 212, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#a5f3fc',
    accentDefault: '#06b6d4',
    previewGradient: 'from-cyan-950 via-blue-900 to-slate-950',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    category: 'Warna Panggung',
    description: 'Hijau zamrud alami menyejukkan mata',
    isLight: false,
    bgHex: '#03170e',
    surfaceHex: 'rgba(16, 185, 129, 0.12)',
    borderHex: 'rgba(16, 185, 129, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#a7f3d0',
    accentDefault: '#10b981',
    previewGradient: 'from-emerald-950 via-teal-900 to-neutral-950',
  },
  {
    id: 'sunset',
    name: 'Sunset Ruby',
    category: 'Warna Panggung',
    description: 'Kombinasi merah ruby dan magenta senja yang memikat',
    isLight: false,
    bgHex: '#1c0512',
    surfaceHex: 'rgba(244, 63, 94, 0.12)',
    borderHex: 'rgba(244, 63, 94, 0.25)',
    textPrimary: '#ffffff',
    textSecondary: '#fecdd3',
    accentDefault: '#f43f5e',
    previewGradient: 'from-rose-950 via-pink-900 to-neutral-950',
  },
];

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
export const DEFAULT_THEME_MODE: ThemeMode = 'dark';

export function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex.trim());
}

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

export function getThemeConfig(themeId: ThemeMode): AppThemePreset {
  return (
    APP_THEME_PRESETS.find((t) => t.id === themeId) || APP_THEME_PRESETS[0]
  );
}

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

export function applyAppTheme(themeId: ThemeMode, customAccent?: string): AppThemePreset {
  const preset = getThemeConfig(themeId);
  if (typeof window === 'undefined') return preset;

  const root = document.documentElement;
  root.setAttribute('data-theme', preset.id);

  if (preset.isLight) {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  root.style.setProperty('--app-bg', preset.bgHex);
  root.style.setProperty('--app-surface', preset.surfaceHex);
  root.style.setProperty('--app-surface-border', preset.borderHex);
  root.style.setProperty('--app-text-primary', preset.textPrimary);
  root.style.setProperty('--app-text-secondary', preset.textSecondary);

  // Set document body and meta theme-color tag
  document.body.style.backgroundColor = preset.bgHex;
  document.body.style.color = preset.textPrimary;

  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', preset.bgHex);

  const accentToApply = customAccent || getSavedThemeAccent() || preset.accentDefault;
  applyThemeAccent(accentToApply);

  try {
    localStorage.setItem('mallsound_app_theme', preset.id);
  } catch {
    // ignore
  }

  return preset;
}

export function getSavedAppTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME_MODE;
  try {
    const saved = localStorage.getItem('mallsound_app_theme') as ThemeMode;
    if (saved && APP_THEME_PRESETS.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return DEFAULT_THEME_MODE;
}
