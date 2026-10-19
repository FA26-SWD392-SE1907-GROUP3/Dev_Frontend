import React, { useState } from 'react';
import { AudioLines, ArrowRight, BookOpen, LockKeyhole, Mic, ShieldCheck, Sparkles, Check, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export default function AuthPage({ onAuthenticated, sessionError, themeButton }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api.login(email.trim(), password);
      if (!result?.authenticate || !result?.token) throw new Error('Backend không trả về JWT hợp lệ.');
      await onAuthenticated(result.token);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-page">
    <aside className="auth-story">
      <a href="/" className="brand auth-brand"><span className="brand-icon"><AudioLines size={24}/></span><strong>AIVES<span className="brand-dot">.</span></strong><span className="brand-tag">VIVA EXAM PLATFORM</span></a>
      <div className="story-body"><div className="story-eyebrow"><span/> HỌC TẬP · ĐỐI THOẠI · TIẾN BỘ</div>
        <h1>Mỗi câu trả lời.<br/>Một bước <em>tiến xa.</em></h1>
        <p>Không gian thi vấn đáp của AIVES, kết nối trực tiếp với Spring Boot và PostgreSQL Neon.</p>
        <div className="viva-card"><div className="viva-card-top"><span><Mic size={16}/> KHÔNG GIAN VẤN ĐÁP</span><span className="viva-label">AIVES</span></div><div className="waveform" aria-hidden="true">{Array.from({length:37},(_,i)=><i key={i} style={{height:`${12+(Math.sin(i*1.7)+1)*24+(i%4)*5}px`}}/>)}</div><div className="viva-caption"><span>Kiến thức của bạn. Tiếng nói của bạn.</span><AudioLines size={20}/></div></div>
        <div className="story-features"><span><BookOpen size={17}/> Ngân hàng câu hỏi</span><span><Sparkles size={17}/> Kỳ thi vấn đáp</span><span><ShieldCheck size={17}/> Bảo vệ bằng JWT</span></div>
      </div><div className="story-footer"><span>Thiết kế cho hành trình học tập của bạn.</span><span>AIVES / 2026</span></div>
    </aside>
    <main className="auth-main"><div className="auth-top"><span className="auth-mobile-brand">AIVES<span>.</span></span>{themeButton}</div>
      <div className="auth-form-wrap"><div className="auth-kicker"><LockKeyhole size={15}/> CỔNG TRUY CẬP AIVES</div><h2>Chào mừng trở lại.</h2><p className="auth-description">Đăng nhập bằng email và mật khẩu đã được quản trị viên cấp.</p>
        <form onSubmit={submit} className="auth-form"><fieldset disabled={busy}>
          <label>Email<input required type="email" autoComplete="username" placeholder="lecturer@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
          <div className="auth-password"><label htmlFor="auth-password">Mật khẩu</label><span className="password-field"><input id="auth-password" required type={showPassword?'text':'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></div>
          <p className="auth-helper"><ShieldCheck size={14}/> Xác thực tài khoản do backend Spring Boot xử lý.</p>
          {(error||sessionError)&&<p role="alert" className="auth-error">{error||sessionError}</p>}
          <button className="auth-submit" disabled={busy}>{busy?'Đang đăng nhập...':'Đăng nhập'}<ArrowRight size={18}/></button>
        </fieldset></form>
        <p className="auth-small">Backend hiện chưa có API đăng ký công khai hoặc Google Sign-In. Tài khoản mới do quản trị viên tạo.</p>
      </div><footer className="auth-footer"><span>© {new Date().getFullYear()} AIVES</span><span><Check size={13}/> Spring Boot · Neon</span></footer>
    </main>
  </div>;
}
