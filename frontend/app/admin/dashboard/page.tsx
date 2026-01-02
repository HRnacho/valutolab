'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Types
interface Stats {
  totalUsers: number;
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  averageScore: string;
  categoryAverages: { [key: string]: string };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_admin: boolean;
}

interface Assessment {
  id: string;
  user_id: string;
  status: string;
  total_score: number | null;
  created_at: string;
  completed_at: string | null;
  user_profiles: {
    full_name: string;
    email: string;
  };
}

interface Question {
  id: number;
  category: string;
  question_text: string;
  question_order: number;
  is_active: boolean;
  created_at: string;
}

interface ValidationIssue {
  category: string;
  active: number;
  required: number;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assessments' | 'email' | 'questions'>('overview');
  
  // Stats state
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    inProgressAssessments: 0,
    averageScore: '0.00',
    categoryAverages: {}
  });

  // Users state
  const [users, setUsers] = useState<User[]>([]);

  // Assessments state
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    category: 'communication',
    question_text: '',
    question_order: 1,
    is_active: true
  });

  // Category labels
  const categoryLabels: { [key: string]: string } = {
    communication: 'Comunicazione',
    leadership: 'Leadership',
    problemSolving: 'Problem Solving',
    teamwork: 'Lavoro di Squadra',
    timeManagement: 'Gestione del Tempo',
    adaptability: 'Adattabilità',
    creativity: 'Creatività',
    criticalThinking: 'Pensiero Critico',
    empathy: 'Empatia',
    resilience: 'Resilienza',
    negotiation: 'Negoziazione',
    decisionMaking: 'Decision Making'
  };

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !profile || !profile.is_admin) {
          alert('Accesso negato. Solo admin.');
          router.push('/dashboard');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (loading) return;

    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'assessments') {
      fetchAssessments();
    } else if (activeTab === 'questions') {
      fetchQuestions();
      validateQuestions();
    }
  }, [activeTab, loading]);

  // Get auth token
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('Errore nel caricamento delle statistiche');
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Errore nel caricamento degli utenti');
    }
  };

  // Fetch assessments
  const fetchAssessments = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch assessments');

      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      alert('Errore nel caricamento degli assessment');
    }
  };

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch questions');

      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Errore nel caricamento delle domande');
    }
  };

  // Validate questions
  const validateQuestions = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/questions/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to validate questions');

      const data = await response.json();
      setValidationIssues(data.issues || []);
    } catch (error) {
      console.error('Error validating questions:', error);
    }
  };

  // Create/Update question
  const handleSaveQuestion = async () => {
    try {
      const token = await getAuthToken();
      const url = editingQuestion 
        ? `${API_URL}/admin/questions/${editingQuestion.id}`
        : `${API_URL}/admin/questions`;
      
      const method = editingQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionForm)
      });

      if (!response.ok) throw new Error('Failed to save question');

      alert(editingQuestion ? 'Domanda aggiornata!' : 'Domanda creata!');
      setShowQuestionModal(false);
      setEditingQuestion(null);
      setQuestionForm({
        category: 'communication',
        question_text: '',
        question_order: 1,
        is_active: true
      });
      fetchQuestions();
      validateQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Errore nel salvare la domanda');
    }
  };

  // Toggle question active status
  const handleToggleQuestion = async (id: number) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/questions/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to toggle question');

      fetchQuestions();
      validateQuestions();
    } catch (error) {
      console.error('Error toggling question:', error);
      alert('Errore nel modificare lo stato');
    }
  };

  // Reorder question
  const handleReorderQuestion = async (id: number, direction: 'up' | 'down') => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/questions/${id}/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction })
      });

      if (!response.ok) throw new Error('Failed to reorder question');

      fetchQuestions();
    } catch (error) {
      console.error('Error reordering question:', error);
      alert('Errore nel riordinare');
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa domanda?')) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/admin/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete question');

      alert('Domanda eliminata');
      fetchQuestions();
      validateQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Errore nell\'eliminare la domanda');
    }
  };

  // Open edit modal
  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      category: question.category,
      question_text: question.question_text,
      question_order: question.question_order,
      is_active: question.is_active
    });
    setShowQuestionModal(true);
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Filter questions by category
  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  // Group questions by category
  const questionsByCategory: { [key: string]: Question[] } = {};
  filteredQuestions.forEach(q => {
    if (!questionsByCategory[q.category]) {
      questionsByCategory[q.category] = [];
    }
    questionsByCategory[q.category].push(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm">Gestione piattaforma ValutoLab</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Panoramica
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Utenti
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assessments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Assessment
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'email'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📧 Email
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Contenuti
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Utenti Totali</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Assessment Totali</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAssessments}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Completati</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedAssessments}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">In Corso</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.inProgressAssessments}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Media Punteggio Generale</h3>
              <p className="text-4xl font-bold text-purple-600">{stats.averageScore} / 5.0</p>
            </div>

            {Object.keys(stats.categoryAverages).length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Media per Categoria</h3>
                <div className="space-y-3">
                  {Object.entries(stats.categoryAverages).map(([category, avg]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-700">{categoryLabels[category] || category}</span>
                      <span className="font-semibold text-purple-600">{avg} / 5.0</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Gestione Utenti</h2>
              <p className="text-sm text-gray-600 mt-1">Totale: {users.length} utenti</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Registrazione</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.is_admin ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">User</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Gestione Assessment</h2>
              <p className="text-sm text-gray-600 mt-1">Totale: {assessments.length} assessment</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map(assessment => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.user_profiles?.full_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.user_profiles?.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assessment.status === 'completed' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completato</span>
                        ) : assessment.status === 'in_progress' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">In Corso</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{assessment.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.total_score ? `${assessment.total_score.toFixed(2)}/5.0` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Gestione Email</h2>
            <p className="text-gray-600">Funzionalità in arrivo...</p>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Validation Warnings */}
            {validationIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Attenzione: Validazione Domande</h3>
                <ul className="space-y-1">
                  {validationIssues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-yellow-700">
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">Gestione Domande Assessment</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Totale: {questions.length} domande | Attive: {questions.filter(q => q.is_active).length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionForm({
                        category: 'communication',
                        question_text: '',
                        question_order: 1,
                        is_active: true
                      });
                      setShowQuestionModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Nuova Domanda
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 mr-2">Categoria:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Tutte le categorie</option>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div className="p-6">
                {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      {categoryLabels[category] || category}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({categoryQuestions.length} domande)
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {categoryQuestions
                        .sort((a, b) => a.question_order - b.question_order)
                        .map(question => (
                          <QuestionRow
                            key={question.id}
                            question={question}
                            onToggle={handleToggleQuestion}
                            onEdit={handleEditQuestion}
                            onDelete={handleDeleteQuestion}
                            onReorder={handleReorderQuestion}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                {editingQuestion ? 'Modifica Domanda' : 'Nuova Domanda'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={questionForm.category}
                  onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Testo Domanda</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Inserisci il testo della domanda..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordine</label>
                <input
                  type="number"
                  min="1"
                  value={questionForm.question_order}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={questionForm.is_active}
                  onChange={(e) => setQuestionForm({ ...questionForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Domanda attiva
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={!questionForm.question_text.trim()}
              >
                {editingQuestion ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Question Row Component
interface QuestionRowProps {
  question: Question;
  onToggle: (id: number) => void;
  onEdit: (question: Question) => void;
  onDelete: (id: number) => void;
  onReorder: (id: number, direction: 'up' | 'down') => void;
}

function QuestionRow({ question, onToggle, onEdit, onDelete, onReorder }: QuestionRowProps) {
  return (
    <div className={`p-4 border rounded-lg ${question.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
              #{question.question_order}
            </span>
            {!question.is_active && (
              <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-600 rounded">
                Disattiva
              </span>
            )}
          </div>
          <p className={`text-sm ${question.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
            {question.question_text}
          </p>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onReorder(question.id, 'up')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            title="Sposta su"
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(question.id, 'down')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            title="Sposta giù"
          >
            ↓
          </button>
          <button
            onClick={() => onToggle(question.id)}
            className={`px-3 py-1 text-xs font-semibold rounded ${
              question.is_active 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {question.is_active ? 'Disattiva' : 'Attiva'}
          </button>
          <button
            onClick={() => onEdit(question)}
            className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Modifica
          </button>
          <button
            onClick={() => onDelete(question.id)}
            className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}
