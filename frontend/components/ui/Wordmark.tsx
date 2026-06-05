interface WordmarkProps {
  size?: number   // font-size in px, default 24
  variant?: 'default' | 'light'  // light = on dark backgrounds
  className?: string
}

export function Wordmark({ size = 24, variant = 'default', className = '' }: WordmarkProps) {
  return (
    <span
      className={`wordmark${variant === 'light' ? ' wordmark--light' : ''} ${className}`}
      style={{ fontSize: size }}
    >
      <span className="wordmark__blk wordmark__blk--ink">Valuto</span>
      <span className="wordmark__blk wordmark__blk--sienna">Lab</span>
    </span>
  )
}
