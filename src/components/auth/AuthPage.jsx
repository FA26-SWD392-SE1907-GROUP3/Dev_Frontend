import React, { useRef, useState } from 'react';
import { AudioLines, ArrowRight, BookOpen, LockKeyhole, Mic, ShieldCheck, Sparkles, Check, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export default function AuthPage({ onAuthenticated, sessionError, themeButton }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'), [fullName, setFullName] = useState(''), [confirmation, setConfirmation] = useState('');
  const [success, setSuccess] = useState('');
  const inFlight = useRef(false);
  const registering = mode === 'register';
  async function submit(e) {
    e.preventDefault();
    if(inFlight.current)return;
    if(registering && password!==confirmation){setError('Mật khẩu xác nhận không khớp.');return;}
    if(registering && new TextEncoder().encode(password).length>72){setError('Mật khẩu quá dài; tối đa 72 byte UTF-8.');return;}
    inFlight.current=true;setBusy(true); setError('');setSuccess('');
    try {
      if(registering){
        const result=await api.register({fullName:fullName.trim(),email:email.trim(),password,confirmPassword:confirmation});
        setSuccess(result.message || 'Đăng ký thành công. Vui lòng chờ Admin phân quyền và kích hoạt tài khoản.');
        setMode('login');setPassword('');setConfirmation('');setFullName('');return;
      }
      const result = await api.login(email.trim(), password);
      if (!result?.authenticate || !result?.token) throw new Error('Backend không trả về JWT hợp lệ.');
      await onAuthenticated(result.token);
    } catch (err) { setError(err.message); }
    finally { inFlight.current=false;setBusy(false); }
  }
  return <div className="auth-page">
    <aside className="auth-story">
      <a href="/" className="brand auth-brand"><span className="brand-icon"><AudioLines size={24}/></span><strong>AIVES<span className="brand-dot">.</span></strong><span className="brand-tag">VIVA EXAM PLATFORM</span></a>
      <div className="story-body"><div className="story-eyebrow"><span/> HỌC TẬP · ĐỐI THOẠI · TIẾN BỘ</div>
        <h1>Mỗi câu trả lời.<br/>Một bước <em>tiến xa.</em></h1>
        <p>Không gian học tập và thi vấn đáp của AIVES, kết nối giảng viên và sinh viên.</p>
        <div className="viva-card"><div className="viva-card-top"><span><Mic size={16}/> KHÔNG GIAN VẤN ĐÁP</span><span className="viva-label">AIVES</span></div><div className="waveform" aria-hidden="true">{Array.from({length:37},(_,i)=><i key={i} style={{height:`${12+(Math.sin(i*1.7)+1)*24+(i%4)*5}px`}}/>)}</div><div className="viva-caption"><span>Kiến thức của bạn. Tiếng nói của bạn.</span><AudioLines size={20}/></div></div>
        <div className="story-features"><span><BookOpen size={17}/> Ngân hàng câu hỏi</span><span><Sparkles size={17}/> Kỳ thi vấn đáp</span><span><ShieldCheck size={17}/> Bảo vệ bằng JWT</span></div>
      </div><div className="story-footer"><span>Thiết kế cho hành trình học tập của bạn.</span><span>AIVES / 2026</span></div>
    </aside>
    <main className="auth-main"><div className="auth-top"><span className="auth-mobile-brand">AIVES<span>.</span></span>{themeButton}</div>
      <div className="auth-form-wrap"><div className="auth-kicker"><LockKeyhole size={15}/> CỔNG TRUY CẬP AIVES</div><h2>{registering?'Tạo tài khoản AIVES.':'Chào mừng trở lại.'}</h2><p className="auth-description">{registering?'Đăng ký thông tin của bạn. Admin sẽ phân vai trò và kích hoạt tài khoản.':'Đăng nhập bằng email và mật khẩu. Tài khoản mới cần được Admin phân quyền.'}</p>
        {success&&<p role="status" className="auth-success">{success}</p>}
        <form onSubmit={submit} className="auth-form"><fieldset disabled={busy}>
          {registering&&<label>Họ và tên<input required autoComplete="name" maxLength={150} placeholder="Nguyễn Văn An" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>}
          <label>Email<input required type="email" autoComplete="username" placeholder="lecturer@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
          <div className="auth-password"><label htmlFor="auth-password">Mật khẩu</label><span className="password-field"><input id="auth-password" required minLength={registering?8:undefined} maxLength={registering?72:undefined} type={showPassword?'text':'password'} autoComplete={registering?'new-password':'current-password'} placeholder="Nhập mật khẩu" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></div>
          {registering&&<label>Xác nhận mật khẩu<input required type={showPassword?'text':'password'} autoComplete="new-password" maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}
          <p className="auth-helper"><ShieldCheck size={14}/> {registering?'Vai trò do Admin quyết định sau khi đăng ký.':'Thông tin tài khoản của bạn được bảo vệ.'}</p>
          {(error||sessionError)&&<p role="alert" className="auth-error">{error||sessionError}</p>}
          <button className="auth-submit" disabled={busy}>{busy?(registering?'Đang đăng ký...':'Đang đăng nhập...'):(registering?'Đăng ký':'Đăng nhập')}<ArrowRight size={18}/></button>
        </fieldset></form>
        <p className="auth-small">{registering?'Đã có tài khoản? ':'Chưa có tài khoản? '}<button type="button" disabled={busy} className="auth-mode-toggle" onClick={()=>{setMode(registering?'login':'register');setError('');setSuccess('');setPassword('');setConfirmation('');}}>{registering?'Quay lại đăng nhập':'Tạo tài khoản'}</button></p>
      </div><footer className="auth-footer"><span>© {new Date().getFullYear()} AIVES</span><span><Check size={13}/> Spring Boot · Neon</span></footer>
    </main>
  </div>;
}
