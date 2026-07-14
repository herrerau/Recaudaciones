"use client";

import { useUIStore } from "@/store/ui-store";

export default function ChatPanel() {
  const chatOpen = useUIStore((state) => state.chatOpen);

  if (!chatOpen) return null;

  return (
    <aside className="w-80 shrink-0 flex flex-col border-l border-[var(--border-hairline)] bg-[var(--surface-1)] h-full shadow-sm">
      <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Comentarios del equipo</h2>
        <button
          onClick={() => useUIStore.getState().setChatOpen(false)}
          className="text-[var(--text-muted)] hover:text-[var(--foreground)]"
          aria-label="Cerrar panel de comentarios"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="text-sm">
            <p className="font-medium text-[var(--foreground)] mb-1">Analista G.R.T.I.</p>
            <p className="text-[var(--text-secondary)]">El incremento en recaudación este mes se debe a los pagos extraordinarios del ISLR.</p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--foreground)] mb-1">Director de Recaudación</p>
            <p className="text-[var(--text-secondary)]">Revisar los pagos sin conciliar en la región Capital; hay un pico inusual.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
