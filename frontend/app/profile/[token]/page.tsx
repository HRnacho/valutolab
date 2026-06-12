'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Wordmark } from '@/components/ui/Wordmark'

interface ProfileData {
  name: string
  completedAt: string
  totalScore: number
  results: Array<{ category: string; score: number }>
}

function getEscoLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 4.1) return { label: 'Esperto',     color: '#1B4332', bg: '#D1FAE5', border: '#6EE7B7' }
  if (score >= 3.1) return { label: 'Avanzato',    color: '#2D6A4F', bg: '#ECFDF5', border: '#A7F3D0' }
  if (score >= 2.1) return { label: 'Intermedio',  color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' }
  return               { label: 'Base',         color: '#7F1D1D', bg: '#FEF2F2', border: '#FCA5A5' }
}

function getBarColor(score: number): string {
  if (score >= 4.1) return '#1B4332'
  if (score >= 3.1) return '#2D6A4F'
  if (score >= 2.1) return '#D4A017'
  return '#C0392B'
}

export default function PublicProfilePage() {
  const params = useParams()
  const token  = params.token as string

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/share/${token}`)
        if (!res.ok) throw new Error('Profilo non trovato')
        const data = await res.json()
        if (data.success) setProfile(data.profile)
        else setError(data.error)
      } catch {
        setError('Impossibile caricare il profilo')
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchProfile()
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
    </div>
  )

  if (error || !profile) return (
    <div className="min-h-screen bg-paper-100 font-body flex flex-col">
      <header className="border-b border-paper-200 bg-paper-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Wordmark size={18} />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-md-ink p-10 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-sienna-600 mx-auto" />
          <div>
            <h1 className="text-[18px] font-semibold text-ink-900 mb-1">Profilo non disponibile</h1>
            <p className="text-[13px] text-ink-400">{error || 'Questo profilo non esiste o è stato disattivato.'}</p>
          </div>
          <a href="https://valutolab.com" className="inline-block text-[13px] text-sienna-600 hover:underline">
            Vai a ValutoLab
          </a>
        </div>
      </div>
    </div>
  )

  const sorted      = [...profile.results].sort((a, b) => b.score - a.score)
  const overallEsco = getEscoLevel(profile.totalScore)
  const completedDate = new Date(profile.completedAt).toLocaleDateString('it-IT', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-paper-100 font-body text-ink-900">

      {/* Header */}
      <header className="border-b border-paper-200 bg-paper-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-center">
          <Wordmark size={18} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-4">

        {/* Hero card — sfondo scuro */}
        <div className="bg-ink-900 rounded-md overflow-hidden">
          <div className="p-8">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-paper-400 mb-4">
              Profilo Competenze Verificato
            </p>
            <h1 className="text-[26px] font-semibold text-paper-50 mb-1">{profile.name}</h1>
            <p className="text-[13px] text-paper-400 mb-6">Assessment completato: {completedDate}</p>

            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-paper-400 mb-1">Punteggio generale</p>
                <p className="text-[36px] font-bold text-paper-50 leading-none">
                  {Number(profile.totalScore).toFixed(1)}
                  <span className="text-[18px] font-normal text-paper-400">/5,0</span>
                </p>
              </div>
              <div>
                <span
                  className="inline-block px-3 py-1.5 text-[12px] font-semibold rounded-sm"
                  style={{ background: overallEsco.bg, color: overallEsco.color, border: `1px solid ${overallEsco.border}` }}
                >
                  {overallEsco.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sezione competenze */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink p-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-400 mb-5">
            Competenze valutate ({sorted.length})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sorted.map((skill, i) => {
              const esco    = getEscoLevel(skill.score)
              const barPct  = Math.round((skill.score / 5) * 100)
              const barColor = getBarColor(skill.score)
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink-800">{skill.category}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                        style={{ background: esco.bg, color: esco.color, border: `1px solid ${esco.border}` }}
                      >
                        {esco.label}
                      </span>
                      <span className="text-[13px] font-semibold text-ink-700">
                        {skill.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-paper-200 rounded-sm h-1.5">
                    <div
                      className="h-1.5 rounded-sm transition-all duration-500"
                      style={{ width: `${barPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer card */}
        <div className="bg-paper-50 border border-paper-200 rounded-md shadow-sm-ink px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wordmark size={16} />
          </div>
          <a
            href="https://valutolab.com/trial"
            className="text-[13px] text-sienna-600 hover:underline font-medium"
          >
            Crea il tuo Assessment →
          </a>
        </div>

        {/* CTA esterno */}
        <div className="text-center py-6 space-y-3">
          <p className="text-[14px] text-ink-500">
            Vuoi misurare anche tu le tue soft skills?
          </p>
          <a
            href="https://valutolab.com/trial"
            className="inline-block px-8 py-3 bg-ink-900 text-paper-50 text-[14px] font-semibold rounded-sm hover:bg-ink-700 transition-colors"
          >
            Inizia l&apos;Assessment →
          </a>
        </div>

      </main>
    </div>
  )
}
