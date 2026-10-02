import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/common/Toast';
import Login from './components/auth/Login';

// Translations
import { translations } from './i18n/translations';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminCourses from './components/admin/AdminCourses';
import AdminSettings from './components/admin/AdminSettings';
import AdminQuestionBank from './components/admin/AdminQuestionBank';
import AdminSessions from './components/admin/AdminSessions';

// Lecturer Components
import LecturerDashboard from './components/lecturer/LecturerDashboard';
import LecturerMaterials from './components/lecturer/LecturerMaterials';
import LecturerQuestionBank from './components/lecturer/LecturerQuestionBank';
import LecturerRubric from './components/lecturer/LecturerRubric';
import LecturerSessions from './components/lecturer/LecturerSessions';
import ExamWizard from './components/lecturer/ExamWizard';
import LecturerMonitor from './components/lecturer/LecturerMonitor';
import LecturerScoring from './components/lecturer/LecturerScoring';

// Student Components
import StudentExamList from './components/student/StudentExamList';
import StudentOralExam from './components/student/StudentOralExam';

// Mock Data
import {
  initialUsers,
  initialCourses,
  initialMaterials,
  initialQuestions,
  initialRubric,
  initialExamSessions,
  initialMonitorStudents,
  initialEvaluations,
  initialEvaluation,
  initialExamSettings,
} from './data/mockData';

export default function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    role: 'lecturer',
    name: 'TS. Hoàng Văn Thụ',
    email: 'thuhv@fpt.edu.vn',
  });

  // Localization & Theme states
  const [lang, setLang] = useState('vi'); // Default to Vietnamese as requested!
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'

  const t = translations[lang] || translations.en;

  // Active view states
  const [currentRole, setCurrentRole] = useState('lecturer');
  const [activeTab, setActiveTab] = useState('lecturer-dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStudentInExam, setIsStudentInExam] = useState(false);
  const [toast, setToast] = useState(null);

  // Collections
  const [users, setUsers] = useState(initialUsers);
  const [courses, setCourses] = useState(initialCourses);
  const [materials, setMaterials] = useState(initialMaterials);
  const [questions, setQuestions] = useState(initialQuestions);
  const [rubric, setRubric] = useState(initialRubric);
  const [examSessions, setExamSessions] = useState(initialExamSessions);
  const [monitorStudents, setMonitorStudents] = useState(initialMonitorStudents);
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('eval-1');
  const [settings, setSettings] = useState(initialExamSettings);

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const showToast = (message) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => setToast(null), 3200);
  };

  const handleLogin = (role, name, email) => {
    setCurrentRole(role);
    setCurrentUser({ role, name, email });
    setIsLoggedIn(true);
    setIsWizardOpen(false);
    setIsStudentInExam(false);

    if (role === 'admin') {
      setActiveTab('admin-dashboard');
    } else if (role === 'lecturer') {
      setActiveTab('lecturer-dashboard');
    }
    showToast(lang === 'vi' ? `Đăng nhập thành công: ${name}` : `Welcome back, ${name}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast(lang === 'vi' ? 'Đã đăng xuất khỏi hệ thống.' : 'Signed out successfully.');
  };

  const handleSetRole = (role) => {
    setCurrentRole(role);
    setIsWizardOpen(false);
    setIsStudentInExam(false);

    if (role === 'admin') {
      setCurrentUser({ role: 'admin', name: 'Marcus Vance', email: 'admin@fpt.edu.vn' });
      setActiveTab('admin-dashboard');
    } else if (role === 'lecturer') {
      setCurrentUser({ role: 'lecturer', name: 'TS. Hoàng Văn Thụ', email: 'thuhv@fpt.edu.vn' });
      setActiveTab('lecturer-dashboard');
    } else if (role === 'student') {
      setCurrentUser({ role: 'student', name: 'Nguyễn Hoàng Nam', email: 'namnhse184920@fpt.edu.vn' });
    }
  };

  // If not logged in, show Login Screen
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={handleLogin}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-apptext transition-colors duration-200">
      {/* Top Application Navbar with Role Switcher, Language & Theme toggle, Logout */}
      <Navbar
        currentRole={currentRole}
        setRole={handleSetRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        t={t}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* STUDENT WORKSPACE (NO SIDEBAR IN EXAM MODE) */}
        {currentRole === 'student' ? (
          <main className="flex-1 flex flex-col overflow-y-auto bg-canvas transition-colors">
            {isStudentInExam ? (
              <StudentOralExam
                onExitToPortal={() => setIsStudentInExam(false)}
                onShowToast={showToast}
                lang={lang}
                t={t}
              />
            ) : (
              <StudentExamList
                onJoinExam={() => setIsStudentInExam(true)}
                t={t}
              />
            )}
          </main>
        ) : (
          /* ADMIN & LECTURER DESKTOP WORKSPACE (SIDEBAR + CONTENT) */
          <>
            <Sidebar
              currentRole={currentRole}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsWizardOpen(false);
              }}
              t={t}
            />

            <main className="flex-1 bg-canvas p-6 md:p-8 overflow-y-auto max-w-[1400px] transition-colors">
              {/* ADMIN VIEWS */}
              {currentRole === 'admin' && (
                <>
                  {activeTab === 'admin-dashboard' && (
                    <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} t={t} />
                  )}
                  {activeTab === 'admin-users' && (
                    <AdminUsers users={users} setUsers={setUsers} onShowToast={showToast} t={t} />
                  )}
                  {activeTab === 'admin-courses' && (
                    <AdminCourses courses={courses} setCourses={setCourses} onShowToast={showToast} t={t} />
                  )}
                  {activeTab === 'admin-settings' && (
                    <AdminSettings settings={settings} setSettings={setSettings} onShowToast={showToast} t={t} />
                  )}
                  {activeTab === 'admin-questionbank' && (
                    <AdminQuestionBank questions={questions} t={t} />
                  )}
                  {activeTab === 'admin-sessions' && (
                    <AdminSessions examSessions={examSessions} t={t} />
                  )}
                </>
              )}

              {/* LECTURER VIEWS */}
              {currentRole === 'lecturer' && (
                <>
                  {isWizardOpen ? (
                    <ExamWizard
                      courses={courses}
                      questions={questions}
                      examSessions={examSessions}
                      setExamSessions={setExamSessions}
                      onClose={() => setIsWizardOpen(false)}
                      onFinish={() => {
                        setIsWizardOpen(false);
                        setActiveTab('lecturer-sessions');
                      }}
                      onShowToast={showToast}
                      t={t}
                    />
                  ) : (
                    <>
                      {activeTab === 'lecturer-dashboard' && (
                        <LecturerDashboard
                          onNavigate={(tab) => setActiveTab(tab)}
                          onOpenWizard={() => setIsWizardOpen(true)}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-materials' && (
                        <LecturerMaterials
                          materials={materials}
                          setMaterials={setMaterials}
                          questions={questions}
                          setQuestions={setQuestions}
                          onShowToast={showToast}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-questionbank' && (
                        <LecturerQuestionBank
                          questions={questions}
                          setQuestions={setQuestions}
                          onShowToast={showToast}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-rubric' && (
                        <LecturerRubric
                          rubric={rubric}
                          setRubric={setRubric}
                          onShowToast={showToast}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-sessions' && (
                        <LecturerSessions
                          examSessions={examSessions}
                          onOpenWizard={() => setIsWizardOpen(true)}
                          onOpenMonitor={() => setActiveTab('lecturer-monitor')}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-monitor' && (
                        <LecturerMonitor
                          monitorStudents={monitorStudents}
                          onReviewTranscript={(student) => {
                            if (student) {
                              const found = evaluations.find(
                                (e) => e.studentId === student.studentId || e.studentName === student.name
                              );
                              if (found) setSelectedEvaluationId(found.id);
                            }
                            setActiveTab('lecturer-scoring');
                          }}
                          onShowToast={showToast}
                          t={t}
                        />
                      )}
                      {activeTab === 'lecturer-scoring' && (
                        <LecturerScoring
                          evaluations={evaluations}
                          setEvaluations={setEvaluations}
                          selectedEvaluationId={selectedEvaluationId}
                          setSelectedEvaluationId={setSelectedEvaluationId}
                          onBack={() => setActiveTab('lecturer-monitor')}
                          onShowToast={showToast}
                          t={t}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </main>
          </>
        )}
      </div>

      {/* Floating System Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
