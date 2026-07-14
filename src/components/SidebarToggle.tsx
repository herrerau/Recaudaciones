"use client";

import { useUIStore } from "@/store/ui-store";

export default function SidebarToggle() {
  const { toggleSidebar } = useUIStore();

  return (
    <button
      onClick={toggleSidebar}
      className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--gridline)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--series-1)]"
      aria-label="Alternar menú lateral"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  );
}
