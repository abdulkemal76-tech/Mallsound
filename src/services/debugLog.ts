// MallSound debug log — ring buffer persisted to localStorage so a background
// playback failure on the user's phone can be inspected afterwards.
// Enabled always (cheap); the on-screen panel only shows with ?debug=1.
export const BUILD_VERSION = 'v87-pisah-import-rata-bayangan';

const KEY = 'mallsound_debug_log';
const MAX_ENTRIES = 120;

export interface DebugEntry {
  t: string;
  msg: string;
}

function readLog(): DebugEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function dbg(msg: string) {
  try {
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const entries = readLog();
    entries.push({ t: ts, msg });
    while (entries.length > MAX_ENTRIES) entries.shift();
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
  try {
    console.log(`[dbg ${BUILD_VERSION}] ${msg}`);
  } catch {
    // ignore
  }
}

export function getDebugLog(): DebugEntry[] {
  return readLog();
}

export function clearDebugLog() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
