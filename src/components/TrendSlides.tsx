"use client";

import { useEffect, useRef } from "react";
import { useSlidesStore } from "@/store/slides-store";
import TrendChart from "./TrendChart";
import { formatValue } from "@/lib/format";
import type { TrendSlide } from "@/lib/trends-data";

const AUTOPLAY_MS = 5000;

export default function TrendSlides({ slides }: { slides: TrendSlide[] }) {
  const { current, autoPlay, setTotal, next, goTo } = useSlidesStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    setTotal(slides.length);
  }, [slides.length, setTotal]);

  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;

    const interval = setInterval(() => {
      if (!hoverRef.current && !document.hidden) {
        // Check for prefers-reduced-motion
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduceMotion) {
          next();
        }
      }
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [autoPlay, slides.length, next]);

  if (slides.length === 0) return null;

  const currentSlide = slides[current] || slides[0];
  const data = currentSlide.data;
  
  // Calcular delta
  let deltaValue = 0;
  let isPositive = true;
  let lastValue = 0;
  
  if (data.length >= 2) {
    lastValue = data[data.length - 1].value;
    const prevValue = data[data.length - 2].value;
    if (prevValue !== 0) {
      deltaValue = ((lastValue - prevValue) / prevValue) * 100;
      isPositive = deltaValue >= 0;
    }
  } else if (data.length === 1) {
    lastValue = data[0].value;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      next();
    } else if (e.key === "ArrowLeft") {
      useSlidesStore.getState().prev();
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-[var(--surface-1)] border border-[var(--border-hairline)] rounded-xl p-6 shadow-sm flex flex-col h-full min-h-0"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
      onFocus={() => (hoverRef.current = true)}
      onBlur={() => (hoverRef.current = false)}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Carrusel de tendencias"
    >
      <div className="flex items-start justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-[1.125rem] font-semibold text-[var(--foreground)] mb-1">
            {currentSlide.title}
          </h2>
          <div className="flex items-baseline gap-3">
            <span className="text-[1.5rem] font-semibold text-[var(--foreground)]">
              {formatValue(lastValue, currentSlide.unit)}
            </span>
            {data.length >= 2 && (
              <div
                className="flex items-center gap-1 text-[14px] font-medium"
                style={{ color: isPositive ? "var(--delta-good)" : "var(--delta-bad)" }}
              >
                <span aria-hidden="true">{isPositive ? "▲" : "▼"}</span>
                <span>{Math.abs(deltaValue).toFixed(1)}%</span>
                <span className="sr-only">
                  {isPositive ? "aumento de" : "descenso de"} {Math.abs(deltaValue).toFixed(1)}%
                </span>
                <span className="text-[var(--text-muted)] font-normal ml-1">
                  vs {data[data.length - 2].label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 mb-6" aria-live={autoPlay && !hoverRef.current ? "off" : "polite"}>
        <TrendChart key={currentSlide.id} slide={currentSlide} />
      </div>

      <div
        className="flex items-center justify-center gap-2 shrink-0"
        role="tablist"
        aria-label="Controles del carrusel"
        onKeyDown={handleKeyDown}
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            aria-controls={`panel-${s.id}`}
            aria-label={`Ir al slide ${s.title}`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => goTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] ${
              i === current ? "bg-[var(--foreground)]" : "bg-[var(--axis)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
