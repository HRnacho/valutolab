'use client'

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
  questionNumber,
  totalQuestions
}: SituationalQuestionProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-purple-600">
            Domanda Situazionale {questionNumber} di {totalQuestions}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((questionNumber / totalQuestions) * 100)}% completato
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Situazione:</h3>
        <p className="text-gray-700 leading-relaxed bg-purple-50 p-6 rounded-lg border-l-4 border-purple-600">
          {situation}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Come agiresti?</h3>
      </div>

      <div className="space-y-4">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.label)}
            className={`w-full text-left p-6 rounded-lg border-2 transition-all duration-200 ${
              selectedOption === option.label
                ? 'border-purple-600 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 ${
                selectedOption === option.label
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {option.label}
              </div>
              <div className="flex-1">
                <p className={`text-base ${
                  selectedOption === option.label ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}>
                  {option.text}
                </p>
              </div>
              {selectedOption === option.label && (
                <div className="flex-shrink-0 ml-4">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}