"use client";

import { useUIStore } from "@/store/ui-store";

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

export default function PanelToggles() {
  const { toggleSidebar, toggleChat } = useUIStore();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--gridline)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)]"
        aria-label="Alternar menú lateral"
      >
        <MenuIcon />
      </button>
      <button
        onClick={toggleChat}
        className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--gridline)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)]"
        aria-label="Alternar panel de comentarios"
      >
        <ChatIcon />
      </button>
    </div>
  );
}
