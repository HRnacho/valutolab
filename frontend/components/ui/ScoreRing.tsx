interface ScoreRingProps {
  value: number
  max?: number
  size?: number   // svg width/height in px, default 120
  className?: string
}

export function ScoreRing({ value, max = 5, size = 120, className = '' }: ScoreRingProps) {
  const r = 50
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(value, max) / max)
  const scale = size / 120

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-label={`Punteggio ${value} su ${max}`}
    >
      {/* Track */}
      <circle cx="60" cy="60" r={r} fill="none" stroke="#ECE6D8" strokeWidth="8" />
      {/* Fill */}
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke="#0E1A2B" strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        transform="rotate(-90 60 60)"
      />
      {/* Score */}
      <text
        x="60" y="62" textAnchor="middle" dominantBaseline="middle"
        style={{
          fontFamily: 'var(--font-space-grotesk), system-ui',
          fontSize: `${38 * scale}px`,
          fontWeight: 300,
          letterSpacing: '-0.04em',
          fill: '#0E1A2B',
        }}
      >
        {Number(value).toFixed(1).replace('.', ',')}
      </text>
      {/* Denominator */}
      <text
        x="60" y="82" textAnchor="middle"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: `${11 * scale}px`,
          letterSpacing: '0.08em',
          fill: '#6F7E96',
        }}
      >
        / {max.toFixed(1).replace('.', ',')}
      </text>
    </svg>
  )
}
