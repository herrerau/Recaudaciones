import Sidebar from "@/components/Sidebar";
import PanelToggles from "@/components/PanelToggles";
import TrendSlides from "@/components/TrendSlides";
import ChatPanel from "@/components/ChatPanel";
import RefreshCountdown from "@/components/RefreshCountdown";
import { getTrendSlides } from "@/lib/trends-data";

export default async function Home() {
  const slides = await getTrendSlides();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        <header className="h-14 border-b border-[var(--border-hairline)] flex items-center justify-between px-6 shrink-0 bg-[var(--background)]">
          <div className="flex items-center gap-6">
            <h1 className="text-[1.125rem] font-semibold text-[var(--foreground)]">
              Panorama Nacional
            </h1>
            <RefreshCountdown refreshInterval={60} />
          </div>
          <PanelToggles />
        </header>

        <div className="flex-1 p-6 flex flex-col min-h-0 overflow-auto">
          {/* Aquí pasamos los slides obtenidos directamente desde Metabase SSR */}
          <TrendSlides slides={slides} />
        </div>
      </main>

      <ChatPanel />
    </div>
  );
}
