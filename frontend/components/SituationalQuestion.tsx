'use client'

import { Check } from 'lucide-react'

interface Option {
  label: string
  text: string
  skill_weights: Record<string, number>
}

interface SituationalQuestionProps {
  situation: string
  options: Option[]
  selectedOption: string | null
  onSelect: (option: string) => void
  questionNumber: number
  totalQuestions: number
}

export default function SituationalQuestion({
  situation,
  options,
  selectedOption,
  onSelect,
}: SituationalQuestionProps) {
  return (
    <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-8">

      {/* Etichetta sezione */}
      <span className="inline-block mb-5 text-[10px] font-semibold uppercase tracking-eyebrow text-sienna-600 bg-sienna-50 border border-sienna-300 px-3 py-1 rounded-sm">
        Scenario situazionale
      </span>

      {/* Testo situazione */}
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-500 mb-3">
          Situazione
        </p>
        <p className="font-body text-[15px] text-ink-800 leading-relaxed border-l-2 border-sienna-400 pl-4">
          {situation}
        </p>
      </div>

      {/* Domanda */}
      <p className="font-display text-[16px] font-medium text-ink-900 mb-5">
        Come agiresti?
      </p>

      {/* Opzioni */}
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.label)}
            className={`w-full text-left px-5 py-4 rounded-sm border transition-all font-body text-[14px] flex items-start gap-4 ${
              selectedOption === option.label
                ? 'border-ink-900 bg-ink-900 text-paper-50'
                : 'border-paper-200 bg-paper-50 text-ink-800 hover:border-ink-500 hover:bg-paper-100'
            }`}
          >
            {/* Label lettera */}
            <span className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center text-[11px] font-bold font-mono mt-0.5 ${
              selectedOption === option.label
                ? 'bg-paper-50 text-ink-900'
                : 'bg-paper-200 text-ink-600'
            }`}>
              {option.label}
            </span>

            {/* Testo opzione */}
            <span className="flex-1 leading-relaxed">
              {option.text}
            </span>

            {/* Check se selezionata */}
            {selectedOption === option.label && (
              <Check className="flex-shrink-0 w-4 h-4 text-sienna-400 mt-1" strokeWidth={2} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
