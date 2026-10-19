import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthPage from './components/auth/AuthPage';
import StudentWorkspace from './components/StudentWorkspace';
import Dashboard from './components/api/Dashboard';
import ApiContent from './components/api/ApiContent';
import ChangePassword from './components/common/ChangePassword';
import Rubrics from './components/api/Rubrics';
import Monitor from './components/api/Monitor';
import { Sun, Moon } from 'lucide-react';
import { translations } from './i18n/translations';
import { api, decodeJwt, setToken } from './services/api';

export default function App() {
  const [user,setUser] = useState(null), [loading,setLoading] = useState(true), [error,setError] = useState('');
  const [theme,setTheme] = useState(() => localStorage.getItem('aives-theme') || 'light');
  const [lang,setLang] = useState('vi'), [tab,setTab] = useState('');
  const t=translations[lang];
  function clear() { setToken(null); sessionStorage.removeItem('aives-token'); setUser(null); }
  async function accept(token) {
    const jwt = decodeJwt(token);
    if(!jwt)throw new Error('JWT không hợp lệ hoặc đã hết hạn.');
    setToken(token);
    try {
      const person = await api.me(jwt.id);
      const profile = { ...jwt, ...person, id: person.id || jwt.id, role: person.role || jwt.role };
      sessionStorage.setItem('aives-token',token);
      setUser(profile); setTab(`${profile.role.toLowerCase()}-dashboard`); setError('');
    } catch(e) { clear(); throw e; }
  }
  useEffect(() => {
    const saved=sessionStorage.getItem('aives-token');
    if(saved)accept(saved).catch(()=>{clear();setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');}).finally(()=>setLoading(false));
    else setLoading(false);
    const unauthorized=()=>{clear();setError('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.');};
    window.addEventListener('aives:unauthorized',unauthorized);
    return ()=>window.removeEventListener('aives:unauthorized',unauthorized);
  },[]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('aives-theme',theme);document.documentElement.lang=lang;},[theme,lang]);
  useEffect(()=>{window.scrollTo(0,0);},[user?.id,tab]);
  function logout() { /* JWT stateless: no /auth/logout endpoint in the uploaded backend. */ clear(); }
  if(loading)return <p className="p-8" role="status">Đang kiểm tra phiên đăng nhập...</p>;
  if(!user)return <AuthPage onAuthenticated={accept} sessionError={error} themeButton={<button className="theme-toggle" aria-label="Đổi giao diện" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</button>}/>;
  const role=user.role.toLowerCase(), section=tab.split('-').slice(1).join('-');
  const sections={users:'users',courses:'courses',materials:'materials',questionbank:'questions',sessions:'exams'};
  return <div className="min-h-screen flex flex-col bg-canvas text-apptext"><Navbar currentRole={role} currentUser={{name:user.fullName||user.email,email:user.email}} onLogout={logout} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t}/>
    {role==='student'?<StudentWorkspace user={user}/>:<div className="app-layout flex flex-1"><Sidebar currentRole={role} activeTab={tab} setActiveTab={setTab} t={t}/><main className="min-w-0 flex-1 bg-canvas p-6 md:p-8 max-w-[1400px]">{section==='dashboard'?<><Dashboard user={user} onNavigate={setTab}/><ChangePassword user={user}/></>:section==='rubric'?<Rubrics/>:section==='monitor'?(user.role==='LECTURER'?<Monitor/>:<p>Chỉ giảng viên được giám sát ca thi.</p>):sections[section]?<ApiContent key={tab} user={user} section={sections[section]}/>:<p>Chọn chức năng trong menu.</p>}</main></div>}
  </div>;
}
