interface EscoChipProps {
  label: string       // es. "Comunicare con gli altri"
  className?: string
}

export function EscoChip({ label, className = '' }: EscoChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 bg-paper-100 border border-paper-300 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-700 rounded-sm ${className}`}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-ink-900 inline-grid place-items-center flex-shrink-0">
        <span className="text-sienna-500 text-[9px] leading-none">★</span>
      </span>
      <span>
        <b className="font-semibold text-ink-900">ESCO v1.2</b>
        {label ? ` · ${label}` : ''}
      </span>
    </span>
  )
}
