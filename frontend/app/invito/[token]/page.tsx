'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Wordmark } from '@/components/ui/Wordmark'
import { Button } from '@/components/ui/Button'

const SKILL_LABELS: Record<string, string> = {
  communication:    'Comunicazione',
  leadership:       'Leadership',
  problem_solving:  'Problem Solving',
  teamwork:         'Lavoro di Squadra',
  time_management:  'Gestione del Tempo',
  adaptability:     'Adattabilità',
  creativity:       'Creatività',
  critical_thinking:'Pensiero Critico',
  empathy:          'Empatia',
  resilience:       'Resilienza',
  negotiation:      'Negoziazione',
  decision_making:  'Decision Making',
}

export default function InvitoPublicPage() {
  const router = useRouter()
  const params = useParams()
  const token  = params.token as string

  const [loading, setLoading] = useState(true)
  const [invite, setInvite]   = useState<any>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    validateInvite()
  }, [token])

  const validateInvite = async () => {
    try {
      const apiUrl   = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/organizations/invite/${token}/validate`)
      const data     = await response.json()

      if (data.success && data.invite.valid) {
        setInvite(data.invite)
        if (data.invite.focus_config_id) {
          localStorage.setItem('invite_focus_config_id', data.invite.focus_config_id)
        } else {
          localStorage.removeItem('invite_focus_config_id')
        }
      } else if (data.invite?.expired) {
        setError('Questo invito è scaduto')
      } else if (data.invite?.completed) {
        setError('Hai già completato questo assessment')
      } else {
        setError('Invito non valido')
      }
    } catch {
      setError("Errore nel caricamento dell'invito")
    } finally {
      setLoading(false)
    }
  }

  const handleStartAssessment = () => {
    localStorage.setItem('invite_token', token)
    router.push('/assessment')
  }

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Header */}
      <header className="border-b border-paper-200 bg-paper-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Wordmark size={18} />
        </div>
      </header>

      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          {/* Loading */}
          {loading && (
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-10 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-sienna-600 mx-auto" />
              <div>
                <h1 className="text-[18px] font-semibold text-ink-900 mb-1">Invito non disponibile</h1>
                <p className="text-[13px] text-ink-400">{error}</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="text-[13px] text-ink-400 hover:text-ink-700 transition-colors underline"
              >
                Torna alla home
              </button>
            </div>
          )}

          {/* Valid invite */}
          {!loading && invite && (
            <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-8 space-y-6">

              {/* Eyebrow + titolo */}
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-sienna-600 mb-3">
                  Invito Assessment
                </p>
                <h1 className="text-[22px] font-semibold text-ink-900 mb-1">
                  Ciao {invite.candidate_name}!
                </h1>
                <p className="text-[14px] text-ink-500">
                  <span className="font-semibold text-ink-800">{invite.organization_name}</span> ti ha invitato a completare un assessment professionale.
                </p>
              </div>

              {/* Box Focus (solo se presente) */}
              {invite.focus_config_id && invite.focus_skills && invite.focus_skills.length > 0 && (
                <div className="border border-paper-300 rounded-sm bg-paper-200 p-4 space-y-2">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-500">
                    Competenze valutate
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {invite.focus_skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-sienna-100 text-sienna-800 text-[11px] font-medium rounded-sm border border-sienna-200"
                      >
                        {SKILL_LABELS[skill] || skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Box info */}
              <div className="border border-paper-300 rounded-sm bg-paper-200 p-4">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-500 mb-3">
                  Cosa ti aspetta
                </p>
                <ul className="space-y-2">
                  {[
                    'Domande di autovalutazione',
                    '40 minuti per completarlo',
                    'Analisi qualitativa personalizzata',
                    `I risultati saranno condivisi con ${invite.organization_name}`,
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-ink-700">
                      <CheckCircle className="w-3.5 h-3.5 text-ink-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleStartAssessment}
                  className="w-full justify-center"
                >
                  Inizia l&apos;Assessment →
                </Button>
                <p className="text-[11px] text-ink-400 text-center">
                  Rispondendo in modo sincero otterrai un profilo più accurato. I tuoi dati sono protetti.
                </p>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  )
}
