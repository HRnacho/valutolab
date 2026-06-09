import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost'
}

const variants: Record<string, string> = {
  primary:   'bg-ink-900 text-paper-50 hover:bg-ink-800',
  accent:    'bg-sienna-600 text-paper-50 hover:bg-sienna-700',
  secondary: 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper-50',
  ghost:     'text-ink-700 hover:text-sienna-700',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`px-[22px] py-[13px] text-[15px] font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
