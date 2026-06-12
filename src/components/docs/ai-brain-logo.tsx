export function AIBrainLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Brain (left) */}
      <path
        d="M82 40c-14 0-24 9-25 21-10 2-17 10-17 20 0 7 3 13 9 16-4 4-6 9-6 14 0 10 7 18 17 20 1 12 11 21 25 21h12V40H82z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M70 70c8 0 14 5 14 12M70 100c10 0 16 6 16 14M70 130c8 0 14-4 14-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Chip (right) */}
      <rect x="110" y="70" width="60" height="60" rx="8" stroke="currentColor" strokeWidth="3.5" />
      <rect x="125" y="85" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <text x="140" y="106" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" fontFamily="ui-sans-serif, system-ui">
        AI
      </text>

      {/* Chip pins */}
      {[80, 95, 110, 120].map((y, i) => (
        <line key={`l-${i}`} x1="100" y1={y} x2="110" y2={y} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {[80, 95, 110, 120].map((y, i) => (
        <line key={`r-${i}`} x1="170" y1={y} x2="180" y2={y} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {[120, 140, 160].map((x, i) => (
        <line key={`t-${i}`} x1={x} y1="60" x2={x} y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {[120, 140, 160].map((x, i) => (
        <line key={`b-${i}`} x1={x} y1="130" x2={x} y2="140" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* Sparkles */}
      <path d="M40 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="currentColor" opacity="0.85" />
      <path d="M180 160l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" opacity="0.7" />
      <circle cx="30" cy="170" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="185" cy="40" r="2.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
