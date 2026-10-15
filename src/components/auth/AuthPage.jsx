import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, ArrowRight, Check, Eye, EyeOff, ShieldCheck, BookOpen, Mic, Sparkles, LockKeyhole } from 'lucide-react';
import { request } from '../../services/api';

let googleScript;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) googleScript = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = resolve; script.onerror = () => { script.remove(); googleScript = null; reject(new Error('Không tải được đăng nhập Google. Hãy thử lại.')); };
    document.head.appendChild(script);
  });
  return googleScript;
}
export default function AuthPage({ onAuthenticated, sessionError, themeButton }) {
  const [mode, setMode] = useState('login'), [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', confirm: '' });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [googleConfig, setGoogleConfig] = useState(null), [googleError, setGoogleError] = useState(''), [googleVersion, setGoogleVersion] = useState(0);
  const googleContainer = useRef(null), onSuccess = useRef(onAuthenticated), googleBusy = useRef(false);
  const register = mode === 'register';
  useEffect(() => { onSuccess.current = onAuthenticated; }, [onAuthenticated]);
  useEffect(() => {
    const abort = new AbortController();
    request('/auth/google/config', { signal: abort.signal }).then(setGoogleConfig).catch(e => { if (e.name !== 'AbortError') setGoogleError(e.message); });
    return () => abort.abort();
  }, [googleVersion]);
  useEffect(() => {
    if (!googleConfig?.enabled) return;
    let disposed = false; setGoogleError('');
    Promise.all([loadGoogle(), request('/auth/google/challenge')]).then(([, { nonce }]) => {
      if (disposed || !googleContainer.current) return;
      window.google.accounts.id.initialize({ client_id: googleConfig.clientId, nonce, auto_select: false, callback: async ({ credential }) => {
        if (disposed || googleBusy.current) return;
        googleBusy.current = true; setBusy(true); setError('');
        try { onSuccess.current(await request('/auth/google', { method: 'POST', body: { credential, nonce } })); }
        catch (e) { setError(e.message); setGoogleVersion(v => v + 1); }
        finally { googleBusy.current = false; setBusy(false); }
      } });
      googleContainer.current.replaceChildren();
      window.google.accounts.id.renderButton(googleContainer.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'vi', width: Math.min(360, googleContainer.current.clientWidth || 320) });
    }).catch(e => { if (!disposed) setGoogleError(e.message); });
    return () => { disposed = true; };
  }, [googleConfig, googleVersion]);
  function change(name) { return e => setForm(f => ({ ...f, [name]: e.target.value })); }
  function switchMode(next) { setMode(next); setError(''); setForm(f => ({ ...f, password: '', confirm: '' })); }
  async function submit(e) {
    e.preventDefault(); if (busy) return; setError('');
    if (register && form.password !== form.confirm) { setError('Mật khẩu xác nhận chưa khớp.'); return; }
    if (register && new TextEncoder().encode(form.password).length > 72) { setError('Mật khẩu tối đa 72 byte UTF-8.'); return; }
    setBusy(true);
    try {
      const body = register ? { username: form.username.trim(), password: form.password, fullName: form.fullName.trim(), email: form.email.trim() } : { username: form.username.trim(), password: form.password };
      onAuthenticated(await request(register ? '/auth/register' : '/auth/login', { method: 'POST', body }));
    } catch (e) { setError(e.status === 401 ? 'Tên đăng nhập hoặc mật khẩu chưa đúng.' : e.message); }
    finally { setBusy(false); }
  }
  return <div className="auth-page">
    <aside className="auth-story">
      <a href="/" className="brand auth-brand"><span className="brand-icon"><AudioLines size={24} /></span><strong>AIVES<span className="brand-dot">.</span></strong><span className="brand-tag">VIVA EXAM PLATFORM</span></a>
      <div className="story-body"><div className="story-eyebrow"><span /> HỌC TẬP · ĐỐI THOẠI · TIẾN BỘ</div>
        <h1>Mỗi câu trả lời.<br />Một bước <em>tiến xa.</em></h1>
        <p>Không gian thi vấn đáp thông minh, giúp giảng viên tổ chức kỳ thi và sinh viên tự tin thể hiện kiến thức.</p>
        <div className="viva-card"><div className="viva-card-top"><span><Mic size={16} /> KHÔNG GIAN VẤN ĐÁP</span><span className="viva-label">AIVES</span></div><div className="waveform" aria-hidden="true">{Array.from({ length: 37 }, (_, i) => <i key={i} style={{ height: `${12 + (Math.sin(i * 1.7) + 1) * 24 + (i % 4) * 5}px` }} />)}</div><div className="viva-caption"><span>Kiến thức của bạn. Tiếng nói của bạn.</span><AudioLines size={20} /></div></div>
        <div className="story-features"><span><BookOpen size={17} /> Ngân hàng câu hỏi</span><span><Sparkles size={17} /> Phỏng vấn với AI</span><span><ShieldCheck size={17} /> Lưu vết minh bạch</span></div>
      </div><div className="story-footer"><span>Thiết kế cho hành trình học tập của bạn.</span><span>01 — AIVES</span></div>
    </aside>
    <main className="auth-main"><div className="auth-top"><span className="auth-mobile-brand">AIVES<span>.</span></span>{themeButton}</div>
      <div className="auth-form-wrap"><div className="auth-kicker"><LockKeyhole size={15} /> CỔNG TRUY CẬP AIVES</div><h2>{register ? 'Bắt đầu hành trình.' : 'Chào mừng trở lại.'}</h2><p className="auth-description">{register ? 'Tạo tài khoản sinh viên để tham gia các kỳ thi của bạn.' : 'Đăng nhập để tiếp tục vào không gian học tập của bạn.'}</p>
        <div className="auth-tabs" aria-label="Chọn đăng nhập hoặc đăng ký"><button type="button" disabled={busy} className={!register ? 'active' : ''} onClick={() => switchMode('login')}>Đăng nhập</button><button type="button" disabled={busy} className={register ? 'active' : ''} onClick={() => switchMode('register')}>Tạo tài khoản</button></div>
        <form onSubmit={submit} className="auth-form"><fieldset disabled={busy}>
          {register && <><label>Họ và tên<input required maxLength={100} autoComplete="name" placeholder="Nguyễn Minh An" value={form.fullName} onChange={change('fullName')} /></label><label>Email<input required type="email" maxLength={100} autoComplete="email" placeholder="ban@example.com" value={form.email} onChange={change('email')} /></label></>}
          <label>Tên đăng nhập<input required autoComplete="username" maxLength={50} minLength={register ? 3 : undefined} pattern={register ? '[A-Za-z0-9_.\\-]{3,50}' : undefined} title={register ? '3–50 ký tự: chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.' : undefined} placeholder="Nhập tên đăng nhập" value={form.username} onChange={change('username')} /></label>
          <div className="auth-password"><label htmlFor="auth-password">Mật khẩu</label><span className="password-field"><input id="auth-password" required type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} maxLength={register ? 72 : undefined} placeholder={register ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'} value={form.password} onChange={change('password')} /><button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></div>
          {register && <label>Xác nhận mật khẩu<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={form.confirm} onChange={change('confirm')} /></label>}
          {!register && <p className="auth-helper"><ShieldCheck size={14} /> Phiên đăng nhập được bảo vệ bằng xác thực tài khoản.</p>}
          {(error || sessionError) && <p role="alert" className="auth-error">{error || sessionError}</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Đang xử lý...' : register ? 'Tạo tài khoản' : 'Đăng nhập'}<ArrowRight size={18} /></button>
        </fieldset></form>
        <div className="auth-divider"><span />hoặc tiếp tục với<span /></div>
        <div className={`google-area ${busy ? 'google-busy' : ''}`} aria-busy={busy}><div ref={googleContainer} />{!googleConfig?.enabled && <button className="google-unavailable" disabled><GoogleIcon /> Tiếp tục với Google</button>}</div>
        {googleConfig && !googleConfig.enabled && <p className="auth-small">Đăng nhập Google sẽ khả dụng khi được quản trị viên cấu hình.</p>}
        {googleError && <div className="auth-small" role="alert">{googleError} <button type="button" onClick={() => setGoogleVersion(v => v + 1)}>Thử lại</button></div>}
        <p className="auth-bottom">{register ? 'Đã có tài khoản?' : 'Bạn mới đến AIVES?'} <button disabled={busy} onClick={() => switchMode(register ? 'login' : 'register')}>{register ? 'Đăng nhập ngay' : 'Tạo tài khoản sinh viên'} <ArrowRight size={13} /></button></p>
      </div><footer className="auth-footer"><span>© {new Date().getFullYear()} AIVES</span><span><Check size={13} /> Sẵn sàng cho kỳ thi của bạn</span></footer>
    </main>
  </div>;
}
function GoogleIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.06.96-3.38.96-2.6 0-4.8-1.76-5.58-4.13H3.08v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.42 13.91a6 6 0 0 1 0-3.82V7.5H3.08a10 10 0 0 0 0 9l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.5l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>; }
