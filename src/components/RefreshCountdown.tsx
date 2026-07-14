"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshCountdown({ refreshInterval = 60 }: { refreshInterval?: number }) {
  const [timeLeft, setTimeLeft] = useState(refreshInterval);
  const router = useRouter();

  useEffect(() => {
    if (timeLeft <= 0) {
      // Pedimos a Next.js que re-renderice la página con los datos nuevos
      router.refresh();
      setTimeLeft(refreshInterval);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, refreshInterval, router]);

  const progress = ((refreshInterval - timeLeft) / refreshInterval) * 100;

  return (
    <div className="flex items-center gap-3 bg-[var(--surface)] px-3 py-1.5 rounded-full border border-[var(--border-hairline)] shadow-sm">
      <div className="text-[11px] text-[var(--muted-foreground)] tracking-wide uppercase font-medium">
        Refresco en <span className="font-mono text-[var(--foreground)] ml-1">{timeLeft}s</span>
      </div>
      <div className="w-16 h-1 bg-[var(--border-hairline)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
