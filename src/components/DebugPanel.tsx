import React, { useEffect, useState } from 'react';
import { BUILD_VERSION, clearDebugLog, getDebugLog, type DebugEntry } from '../services/debugLog';

// Tiny on-screen diagnostics panel, only rendered when the URL has ?debug=1.
// Lets the user screenshot / copy what the player did while the tab was hidden.
export const DebugPanel: React.FC = () => {
  const [entries, setEntries] = useState<DebugEntry[]>(() => getDebugLog());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setEntries(getDebugLog()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const copyLog = async () => {
    const text = entries.map((e) => `${e.t} ${e.msg}`).join('\n');
    try {
      await navigator.clipboard.writeText(`MallSound ${BUILD_VERSION}\n${text}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const shown = entries.slice(-40);

  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        color: '#a7f3d0',
        borderRadius: 10,
        padding: 10,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.5,
        maxHeight: '38vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ color: '#fff' }}>MallSound {BUILD_VERSION} — debug</strong>
        <span>
          <button
            onClick={copyLog}
            style={{ marginRight: 6, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 11 }}
          >
            {copied ? 'Disalin!' : 'Salin Log'}
          </button>
          <button
            onClick={() => { clearDebugLog(); setEntries([]); }}
            style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#374151', color: '#fff', fontSize: 11 }}
          >
            Hapus
          </button>
        </span>
      </div>
      {shown.length === 0 ? (
        <div style={{ color: '#9ca3af' }}>Belum ada log.</div>
      ) : (
        shown.map((e, i) => (
          <div key={i}>
            <span style={{ color: '#6b7280' }}>{e.t}</span> {e.msg}
          </div>
        ))
      )}
    </div>
  );
};
