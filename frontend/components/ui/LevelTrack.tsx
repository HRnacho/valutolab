interface LevelTrackProps {
  score: number
  className?: string
}

export function LevelTrack({ score, className = '' }: LevelTrackProps) {
  const currentIdx =
    score >= 4.1 ? 3 : score >= 3.1 ? 2 : score >= 2.1 ? 1 : 0

  const labels = ['Base', 'Intermedio', 'Avanzato', 'Esperto']

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-4 gap-0.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-3 ${
              i < currentIdx  ? 'bg-ink-900' :
              i === currentIdx ? 'bg-sienna-600' :
              'bg-paper-200'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-0.5 mt-1">
        {labels.map((label, i) => (
          <span
            key={i}
            className={`font-mono text-[9px] uppercase tracking-wider text-center ${
              i === currentIdx ? 'text-sienna-600 font-semibold' : 'text-ink-400'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
