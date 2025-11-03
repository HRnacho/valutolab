'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface Assessment {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  total_score: number | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState<Assessment[]>([])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load user's assessments
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

      if (assessmentsData) {
        setAssessments(assessmentsData)
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  const inProgressAssessments = assessments.filter(a => a.status === 'in_progress')
  const completedAssessments = assessments.filter(a => a.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard ValutoLab</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Benvenuto, {user?.user_metadata?.full_name || user?.email}! 👋
          </h2>
          <p className="text-gray-600">
            Email: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Assessment in Progress */}
        {inProgressAssessments.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ⚠️ Assessment in Corso
            </h3>
            {inProgressAssessments.map((assessment) => (
              <div key={assessment.id} className="mb-4">
                <p className="text-gray-700 mb-3">
                  Hai un assessment iniziato il{' '}
                  {new Date(assessment.started_at).toLocaleDateString('it-IT')}
                </p>
                
                  href={`/assessment/${assessment.id}`}
                  className="inline-block bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition font-semibold"
                >
                  Riprendi Assessment →
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Completed Assessments */}
        {completedAssessments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ✅ Assessment Completati
            </h3>
            <div className="space-y-3">
              {completedAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Assessment del {new Date(assessment.completed_at!).toLocaleDateString('it-IT')}
                    </p>
                    {assessment.total_score && (
                      <p className="text-sm text-gray-600">
                        Punteggio: {assessment.total_score.toFixed(1)}/5.0
                      </p>
                    )}
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 font-semibold">
                    Vedi Risultati →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Assessment Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Nuovo Assessment</h3>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-6">
              {inProgressAssessments.length > 0
                ? 'Completa l\'assessment in corso prima di iniziarne uno nuovo.'
                : 'Inizia un nuovo assessment per valutare le tue soft skills.'}
            </p>
            
              href="/assessment"
              className={`inline-block px-6 py-3 rounded-lg transition font-semibold ${
                inProgressAssessments.length > 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              onClick={(e) => {
                if (inProgressAssessments.length > 0) {
                  e.preventDefault()
                  alert('Completa l\'assessment in corso prima di iniziarne uno nuovo!')
                }
              }}
            >
              Inizia Nuovo Assessment
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}