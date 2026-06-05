export type EscoLevel = 'Base' | 'Intermedio' | 'Avanzato' | 'Esperto'

export function scoreToLevel(score: number): EscoLevel {
  if (score >= 4.1) return 'Esperto'
  if (score >= 3.1) return 'Avanzato'
  if (score >= 2.1) return 'Intermedio'
  return 'Base'
}

const colors: Record<EscoLevel, string> = {
  Base:       '#B0473A',
  Intermedio: '#C68A2E',
  Avanzato:   '#4F7A53',
  Esperto:    '#2D5F73',
}

interface LevelPillProps {
  level: EscoLevel
  className?: string
}

export function LevelPill({ level, className = '' }: LevelPillProps) {
  return (
    <span
      className={`inline-block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase text-paper-50 px-[10px] py-[5px] rounded-sm ${className}`}
      style={{ background: colors[level] }}
    >
      {level}
    </span>
  )
}
