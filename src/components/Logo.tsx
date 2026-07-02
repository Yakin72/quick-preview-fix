export function Logo({ className = "size-10" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="souklg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.18 155)" />
            <stop offset="100%" stopColor="oklch(0.45 0.22 165)" />
          </linearGradient>
          <linearGradient id="soukgold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.88 0.16 82)" />
            <stop offset="100%" stopColor="oklch(0.72 0.18 65)" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#souklg)" />
        <path d="M14 30c0-4 4-6 8-6s8 2 8 6" stroke="url(#soukgold)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="18" cy="18" r="2.5" fill="url(#soukgold)" />
        <circle cx="30" cy="18" r="2.5" fill="url(#soukgold)" />
        <path d="M12 34h24" stroke="url(#soukgold)" strokeWidth="2.5" strokeLinecap="round" />
        <text x="24" y="42" textAnchor="middle" fontSize="6" fontWeight="900" fill="oklch(0.98 0.02 82)" fontFamily="Cairo, sans-serif">DZ</text>
      </svg>
    </div>
  );
}
