export default function InspectorLogo() {
  return (
    <div className="flex items-center gap-2.5 text-[var(--foreground)]">
      <svg
        width="30"
        height="30"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3" />
        <path
          d="M11 24 C16 16.5, 32 16.5, 37 24 C32 31.5, 16 31.5, 11 24 Z"
          stroke="currentColor"
          strokeWidth="2.6"
          fill="none"
        />
        <circle cx="24" cy="24" r="4.6" fill="var(--series-1)" />
      </svg>
      <span className="text-sm font-extrabold tracking-[0.25em]">
        INSPECTOR
      </span>
    </div>
  );
}
