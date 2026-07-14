"use client";

import { useUIStore } from "@/store/ui-store";
import InspectorLogo from "./InspectorLogo";
import Image from "next/image";

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-[var(--border-hairline)] bg-[var(--background)] h-full">
      <div className="p-6">
        <InspectorLogo />
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {/* Mock navigation */}
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-[var(--surface-1)] text-[var(--foreground)] border border-[var(--border-hairline)] shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Tendencias
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--gridline)] hover:text-[var(--foreground)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Regiones
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-[var(--gridline)] hover:text-[var(--foreground)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Aduanas
        </a>
      </nav>

      <div className="p-6 mt-auto">
        <Image src="/seniat-light.png" alt="SENIAT" width={188} height={62} className="dark:hidden" priority />
        <Image src="/seniat-dark.png" alt="SENIAT" width={188} height={62} className="hidden dark:block" priority />
      </div>
    </aside>
  );
}
