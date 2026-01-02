'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // States esistenti
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('all');

  // States email
  const [emailTemplate, setEmailTemplate] = useState('welcome');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  // States modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ email: '', fullName: '', password: '' });

  // 🆕 STATES PER CONTENUTI/QUESTIONS
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [validationStatus, setValidationStatus] = useState<any>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionFormData, setQuestionFormData] = useState({
    category: '',
    question_text: '',
    question_order: 1,
    is_active: true
  });

  const categories = [
    { value: 'communication', label: 'Comunicazione' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'teamwork', label: 'Lavoro di Squadra' },
    { value: 'time_management', label: 'Gestione del Tempo' },
    { value: 'adaptability', label: 'Adattabilità' },
    { value: 'creativity', label: 'Creatività' },
    { value: 'critical_thinking', label: 'Pensiero Critico' },
    { value: 'empathy', label: 'Empatia' },
    { value: 'resilience', label: 'Resilienza' },
    { value: 'negotiation', label: 'Negoziazione' },
    { value: 'decision_making', label: 'Decision Making' }
  ];

  // Check admin on mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/dashboard');
        return;
      }

      setLoading(false);
      fetchStats();
      fetchUsers();
      fetchAssessments();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/login');
    }
  };

  // Fetch functions esistenti
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/assessments`);
      setAssessments(response.data.assessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  // 🆕 FETCH QUESTIONS
  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/questions`);
      setQuestions(response.data.questions || []);
      
      // Fetch validation status
      const validationResponse = await axios.get(`${API_URL}/admin/questions/validate`);
      setValidationStatus(validationResponse.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Errore nel caricamento delle domande');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // 🆕 CREATE/UPDATE QUESTION
  const handleSaveQuestion = async () => {
    try {
      if (!questionFormData.category || !questionFormData.question_text) {
        alert('Categoria e testo domanda sono obbligatori');
        return;
      }

      if (editingQuestion) {
        // Update
        await axios.put(`${API_URL}/admin/questions/${editingQuestion.id}`, questionFormData);
        alert('Domanda aggiornata!');
      } else {
        // Create
        await axios.post(`${API_URL}/admin/questions`, questionFormData);
        alert('Domanda creata!');
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);
      setQuestionFormData({ category: '', question_text: '', question_order: 1, is_active: true });
      fetchQuestions();
    } catch (error: any) {
      console.error('Error saving question:', error);
      alert(error.response?.data?.message || 'Errore nel salvataggio');
    }
  };

  // 🆕 TOGGLE QUESTION ACTIVE/INACTIVE
  const handleToggleQuestion = async (questionId: string) => {
    try {
      await axios.put(`${API_URL}/admin/questions/${questionId}/toggle`);
      fetchQuestions();
    } catch (error: any) {
      console.error('Error toggling question:', error);
      alert(error.response?.data?.message || 'Errore nel cambio stato');
    }
  };

  // 🆕 DELETE QUESTION
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa domanda?')) return;

    try {
      await axios.delete(`${API_URL}/admin/questions/${questionId}`);
      alert('Domanda eliminata!');
      fetchQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      alert(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  };

  // 🆕 REORDER QUESTION (move up/down)
  const handleReorderQuestion = async (questionId: string, currentOrder: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    
    if (newOrder < 1) return; // Non può andare sotto 1

    try {
      await axios.put(`${API_URL}/admin/questions/${questionId}/reorder`, {
        newOrder
      });
      fetchQuestions();
    } catch (error: any) {
      console.error('Error reordering question:', error);
      alert(error.response?.data?.message || 'Errore nel riordino');
    }
  };

  // User management functions (esistenti)
  const handleCreateUser = async () => {
    try {
      await axios.post(`${API_URL}/admin/users/create`, newUserData);
      alert('Utente creato con successo!');
      setShowCreateUserModal(false);
      setNewUserData({ email: '', fullName: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Errore nella creazione utente');
    }
  };

  const handleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/block`, {
        blocked: !currentBlocked
      });
      alert(currentBlocked ? 'Utente sbloccato!' : 'Utente bloccato!');
      fetchUsers();
    } catch (error) {
      alert('Errore nell\'operazione');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro? Tutti i dati dell\'utente verranno eliminati.')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`);
      alert('Utente eliminato!');
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Errore nell\'eliminazione');
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo assessment?')) return;

    try {
      await axios.delete(`${API_URL}/admin/assessments/${assessmentId}`);
      alert('Assessment eliminato!');
      fetchAssessments();
    } catch (error) {
      alert('Errore nell\'eliminazione');
    }
  };

  // Email functions
  const emailTemplates = {
    welcome: {
      subject: 'Benvenuto su ValutoLab! 🎉',
      body: `Ciao {name},\n\nBenvenuto su ValutoLab!\n\nSiamo felici di averti con noi. Inizia subito il tuo primo assessment per scoprire le tue soft skills.\n\nBuona valutazione!\nIl Team ValutoLab`
    },
    reminder: {
      subject: 'Completa il tuo Assessment ⏰',
      body: `Ciao {name},\n\nHai un assessment in sospeso su ValutoLab.\n\nBastano solo 15 minuti per completarlo e ricevere il tuo report personalizzato!\n\nA presto,\nIl Team ValutoLab`
    },
    congratulations: {
      subject: 'Assessment Completato! 🎊',
      body: `Ciao {name},\n\nComplimenti! Hai completato il tuo assessment su ValutoLab.\n\nIl tuo report è pronto. Accedi alla dashboard per visualizzarlo e scaricarlo.\n\nGrazie,\nIl Team ValutoLab`
    }
  };

  const handleTemplateChange = (template: string) => {
    setEmailTemplate(template);
    const t = emailTemplates[template as keyof typeof emailTemplates];
    setEmailSubject(t.subject);
    setEmailBody(t.body);
  };

  const handleSelectRecipients = (group: string) => {
    let recipients: string[] = [];
    
    if (group === 'all') {
      recipients = users.map(u => u.email);
    } else if (group === 'completed') {
      const completedUserIds = assessments
        .filter(a => a.status === 'completed')
        .map(a => a.user_id);
      recipients = users
        .filter(u => completedUserIds.includes(u.id))
        .map(u => u.email);
    } else if (group === 'incomplete') {
      const incompleteUserIds = assessments
        .filter(a => a.status === 'in_progress')
        .map(a => a.user_id);
      recipients = users
        .filter(u => incompleteUserIds.includes(u.id))
        .map(u => u.email);
    } else if (group === 'selected') {
      recipients = users
        .filter(u => selectedUsers.has(u.id))
        .map(u => u.email);
    }

    setEmailRecipients(recipients);
  };

  const handleSendEmail = async () => {
    if (emailRecipients.length === 0) {
      alert('Seleziona almeno un destinatario');
      return;
    }

    if (!emailSubject || !emailBody) {
      alert('Oggetto e messaggio sono obbligatori');
      return;
    }

    if (!confirm(`Inviare email a ${emailRecipients.length} destinatari?`)) return;

    setSendingEmail(true);
    try {
      const response = await axios.post(`${API_URL}/admin/emails/send`, {
        recipients: emailRecipients,
        subject: emailSubject,
        body: emailBody
      });

      alert(response.data.message);
      setEmailRecipients([]);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Errore nell\'invio email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Export CSV
  const handleExportUsers = () => {
    const csv = [
      ['Email', 'Nome', 'Data Registrazione', 'Assessment Completati', 'Stato'].join(','),
      ...users.map(u => [
        u.email,
        u.full_name,
        new Date(u.created_at).toLocaleDateString('it-IT'),
        u.assessmentCount,
        u.is_blocked ? 'Bloccato' : 'Attivo'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valutolab-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportAssessments = () => {
    const csv = [
      ['ID', 'Utente', 'Email', 'Status', 'Score', 'Data Inizio', 'Data Completamento'].join(','),
      ...assessments.map(a => [
        a.id,
        a.userName,
        a.userEmail,
        a.status,
        a.total_score || 'N/A',
        new Date(a.created_at).toLocaleDateString('it-IT'),
        a.completed_at ? new Date(a.completed_at).toLocaleDateString('it-IT') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `valutolab-assessments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filtered data
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssessments = assessments.filter(a => {
    if (assessmentFilter === 'all') return true;
    return a.status === assessmentFilter;
  });

  // 🆕 Filtered questions by category
  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">Gestione piattaforma ValutoLab</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Panoramica
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Utenti
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'assessments'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Assessment
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'email'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ✉️ Email
            </button>
            {/* 🆕 TAB CONTENUTI */}
            <button
              onClick={() => {
                setActiveTab('contenuti');
                fetchQuestions();
              }}
              className={`px-4 py-2 font-medium ${
                activeTab === 'contenuti'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📚 Contenuti
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">Utenti Totali</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</div>
                <div className="text-xs text-green-600 mt-1">+{stats.newUsersLast7Days} ultimi 7gg</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">Assessment Totali</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAssessments}</div>
                <div className="text-xs text-blue-600 mt-1">+{stats.completedLast7Days} completati (7gg)</div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">Assessment Completati</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{stats.completedAssessments}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((stats.completedAssessments / stats.totalAssessments) * 100).toFixed(1)}% completion rate
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-sm text-gray-500">In Corso</div>
                <div className="text-3xl font-bold text-orange-600 mt-2">{stats.inProgressAssessments}</div>
                <div className="text-xs text-gray-500 mt-1">{stats.abandonedAssessments} abbandonati</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Statistiche Dettagliate</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Tempo Medio Completamento</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.avgCompletionTime} min</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Score Medio Generale</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.categoryAverages).length > 0
                      ? (Object.values(stats.categoryAverages).reduce((sum: number, value: unknown) => sum + parseFloat(value as string), 0) / Object.keys(stats.categoryAverages).length).toFixed(2)
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Score Medi per Categoria</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(stats.categoryAverages).map(([category, score]) => (
                    <div key={category} className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500 capitalize">{category.replace('_', ' ')}</div>
                      <div className="text-lg font-semibold text-purple-600">{score as string}/5.0</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Nuovo Utente
                </button>
                <input
                  type="text"
                  placeholder="Cerca utente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Reg.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('it-IT')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.assessmentCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.is_blocked ? 'Bloccato' : 'Attivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleBlockUser(user.id, user.is_blocked)}
                          className={`mr-2 px-3 py-1 rounded ${
                            user.is_blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          {user.is_blocked ? 'Sblocca' : 'Blocca'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <select
                  value={assessmentFilter}
                  onChange={(e) => setAssessmentFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tutti</option>
                  <option value="completed">Completati</option>
                  <option value="in_progress">In Corso</option>
                  <option value="abandoned">Abbandonati</option>
                </select>
              </div>
              <button
                onClick={handleExportAssessments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Assessments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssessments.map(assessment => (
                    <tr key={assessment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {assessment.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assessment.userEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          assessment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assessment.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assessment.total_score ? assessment.total_score.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assessment.created_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Invio Email Bulk</h3>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select
                  value={emailTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="welcome">Benvenuto</option>
                  <option value="reminder">Reminder Assessment</option>
                  <option value="congratulations">Congratulazioni</option>
                </select>
              </div>

              {/* Recipients Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Destinatari</label>
                <div className="flex space-x-2 mb-2">
                  <button
                    onClick={() => handleSelectRecipients('all')}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Tutti ({users.length})
                  </button>
                  <button
                    onClick={() => handleSelectRecipients('completed')}
                    className="px-4 py-2 bg-green-200 rounded hover:bg-green-300"
                  >
                    Completati
                  </button>
                  <button
                    onClick={() => handleSelectRecipients('incomplete')}
                    className="px-4 py-2 bg-orange-200 rounded hover:bg-orange-300"
                  >
                    In Corso
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {emailRecipients.length} destinatari selezionati
                </div>
              </div>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Oggetto</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Messaggio <span className="text-gray-400">(usa {'{name}'} per nome utente)</span>
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailRecipients.length === 0}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Invio in corso...' : `📧 Invia a ${emailRecipients.length} destinatari`}
              </button>
            </div>
          </div>
        )}

        {/* 🆕 CONTENUTI TAB */}
        {activeTab === 'contenuti' && (
          <div className="space-y-6">
            {/* Header + Actions */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Gestione Domande Assessment</h3>
                  <p className="text-sm text-gray-500">
                    Totale: {questions.length} domande | Attive: {questions.filter(q => q.is_active).length}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setQuestionFormData({ category: '', question_text: '', question_order: 1, is_active: true });
                    setShowQuestionModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Nuova Domanda
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Categoria:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">Tutte le categorie</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation Status */}
              {validationStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  validationStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {validationStatus.isValid ? '✅ Configurazione valida' : '⚠️ Configurazione non valida'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {validationStatus.totalActiveQuestions} / 72 domande attive
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Questions List */}
            {questionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Caricamento domande...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCategory !== 'all' ? (
                  // Single category view
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-lg">
                          {categories.find(c => c.value === selectedCategory)?.label}
                        </h4>
                        {validationStatus?.validation[selectedCategory] && (
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            validationStatus.validation[selectedCategory].isValid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {validationStatus.validation[selectedCategory].message}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="divide-y">
                      {filteredQuestions
                        .sort((a, b) => a.question_order - b.question_order)
                        .map((question, index) => (
                          <QuestionRow
                            key={question.id}
                            question={question}
                            onToggle={handleToggleQuestion}
                            onEdit={(q) => {
                              setEditingQuestion(q);
                              setQuestionFormData({
                                category: q.category,
                                question_text: q.question_text,
                                question_order: q.question_order,
                                is_active: q.is_active
                              });
                              setShowQuestionModal(true);
                            }}
                            onDelete={handleDeleteQuestion}
                            onReorder={handleReorderQuestion}
                            isFirst={index === 0}
                            isLast={index === filteredQuestions.length - 1}
                          />
                        ))}
                    </div>
                  </div>
                ) : (
                  // All categories view
                  categories.map(category => {
                    const categoryQuestions = questions
                      .filter(q => q.category === category.value)
                      .sort((a, b) => a.question_order - b.question_order);
                    
                    return (
                      <div key={category.value} className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{category.label}</h4>
                            {validationStatus?.validation[category.value] && (
                              <span className={`text-sm px-3 py-1 rounded-full ${
                                validationStatus.validation[category.value].isValid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {validationStatus.validation[category.value].message}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="divide-y">
                          {categoryQuestions.map((question, index) => (
                            <QuestionRow
                              key={question.id}
                              question={question}
                              onToggle={handleToggleQuestion}
                              onEdit={(q) => {
                                setEditingQuestion(q);
                                setQuestionFormData({
                                  category: q.category,
                                  question_text: q.question_text,
                                  question_order: q.question_order,
                                  is_active: q.is_active
                                });
                                setShowQuestionModal(true);
                              }}
                              onDelete={handleDeleteQuestion}
                              onReorder={handleReorderQuestion}
                              isFirst={index === 0}
                              isLast={index === categoryQuestions.length - 1}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🆕 QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingQuestion ? 'Modifica Domanda' : 'Nuova Domanda'}
            </h3>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={questionFormData.category}
                onChange={(e) => setQuestionFormData({ ...questionFormData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Seleziona categoria...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Testo Domanda <span className="text-red-500">*</span>
              </label>
              <textarea
                value={questionFormData.question_text}
                onChange={(e) => setQuestionFormData({ ...questionFormData, question_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Inserisci il testo della domanda..."
                required
              />
            </div>

            {/* Order (only when editing) */}
            {editingQuestion && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordine</label>
                <input
                  type="number"
                  min="1"
                  value={questionFormData.question_order}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}

            {/* Active Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={questionFormData.is_active}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Domanda attiva</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                {editingQuestion ? 'Salva Modifiche' : 'Crea Domanda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Crea Nuovo Utente</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Min. 6 caratteri"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Crea Utente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🆕 QUESTION ROW COMPONENT
function QuestionRow({
  question,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  isFirst,
  isLast
}: {
  question: any;
  onToggle: (id: string) => void;
  onEdit: (question: any) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, order: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-semibold text-gray-500">
              #{question.question_order}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              question.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {question.is_active ? 'Attiva' : 'Disattivata'}
            </span>
          </div>
          <p className="text-gray-900">{question.question_text}</p>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {/* Reorder buttons */}
          <button
            onClick={() => onReorder(question.id, question.question_order, 'up')}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Sposta su"
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(question.id, question.question_order, 'down')}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Sposta giù"
          >
            ↓
          </button>

          {/* Toggle Active */}
          <button
            onClick={() => onToggle(question.id)}
            className={`px-3 py-1 text-xs rounded ${
              question.is_active
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {question.is_active ? 'Disattiva' : 'Attiva'}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(question)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Modifica
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(question.id)}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}

