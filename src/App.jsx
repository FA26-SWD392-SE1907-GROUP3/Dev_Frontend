import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthPage from './components/auth/AuthPage';
import StudentWorkspace from './components/StudentWorkspace';
import Dashboard from './components/api/Dashboard';
import ApiContent from './components/api/ApiContent';
import Rubrics from './components/api/Rubrics';
import Monitor from './components/api/Monitor';
import { Sun, Moon } from 'lucide-react';
import { translations } from './i18n/translations';
import { request, setToken } from './services/api';

export default function App() {
  const [user,setUser] = useState(null), [loading,setLoading] = useState(true), [error,setError] = useState('');
  const [theme,setTheme] = useState(() => localStorage.getItem('aives-theme') || 'light');
  const [lang,setLang] = useState('vi'), [tab,setTab] = useState(''); const t=translations[lang];
  function clear() { setToken(null);sessionStorage.removeItem('aives-token');setUser(null); }
  function accept(result) { setToken(result.token);sessionStorage.setItem('aives-token',result.token);setUser(result.user);setTab(`${result.user.role.toLowerCase()}-dashboard`);setError(''); }
  useEffect(() => {
    const token=sessionStorage.getItem('aives-token');setToken(token);
    if(token)request('/auth/me',{ timeoutMs:15000 }).then(u => {setUser(u);setTab(`${u.role.toLowerCase()}-dashboard`);}).catch(e => {clear();setError(e.message);}).finally(() => setLoading(false));else setLoading(false);
    const expired=() => {clear();setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');};window.addEventListener('aives:unauthorized',expired);return () => window.removeEventListener('aives:unauthorized',expired);
  },[]);
  useEffect(() => {document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('aives-theme',theme);document.documentElement.lang=lang;},[theme,lang]);
  useEffect(() => { window.scrollTo(0, 0); }, [user?.userId, tab]);
  async function logout(){try{await request('/auth/logout',{method:'POST'});}catch{}finally{clear();}}
  if(loading)return <p className="p-8" role="status">Đang kiểm tra phiên đăng nhập...</p>;
  if(!user)return <AuthPage onAuthenticated={accept} sessionError={error} themeButton={<button className="theme-toggle" aria-label={theme==='light'?'Giao diện tối':'Giao diện sáng'} onClick={() => setTheme(theme==='light'?'dark':'light')}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</button>}/>;
  const role=user.role.toLowerCase(),section=tab.split('-').slice(1).join('-');
  const sections={users:'users',courses:'subjects',materials:'documents',questionbank:'questions',sessions:'exams'};
  return <div className="min-h-screen flex flex-col bg-canvas text-apptext"><Navbar currentRole={role} currentUser={{name:user.fullName,email:user.email}} onLogout={logout} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t}/>
    {role==='student'?<StudentWorkspace user={user}/>:<div className="app-layout flex flex-1"><Sidebar currentRole={role} activeTab={tab} setActiveTab={setTab} t={t}/><main className="min-w-0 flex-1 bg-canvas p-6 md:p-8 max-w-[1400px]">{section==='dashboard'?<Dashboard user={user} onNavigate={setTab}/>:section==='rubric'?<Rubrics/>:section==='monitor'?<Monitor/>:sections[section]?<ApiContent key={tab} user={user} section={sections[section]}/>:<p>Chọn chức năng trong menu.</p>}</main></div>}
  </div>;
}
