import React, { useState } from 'react';
import { GraduationCap, Shield, UserCheck, BookOpen, Sun, Moon, Globe, X, Loader2 } from 'lucide-react';

export default function Login({ onLogin, lang, setLang, theme, setTheme, t }) {
  const [email, setEmail] = useState('s.jenkins@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  
  // Google OAuth Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authAccountName, setAuthAccountName] = useState('');

  const googleAccounts = [
    {
      name: 'Nguyễn Hoàng Nam',
      email: 'namnhse184920@fpt.edu.vn',
      role: 'student',
      label: 'Sinh viên SE184920 - ĐH FPT',
      avatarColor: 'bg-emerald-600',
      initials: 'NH'
    },
    {
      name: 'TS. Hoàng Văn Thụ',
      email: 'thuhv@fpt.edu.vn',
      role: 'lecturer',
      label: 'Giảng viên Bộ môn SE - ĐH FPT',
      avatarColor: 'bg-blue-600',
      initials: 'HT'
    },
    {
      name: 'Marcus Vance',
      email: 'admin@fpt.edu.vn',
      role: 'admin',
      label: 'Phòng Khảo thí & ĐBCL FPT',
      avatarColor: 'bg-purple-600',
      initials: 'MV'
    }
  ];

  const handleSelectGoogleAccount = (acc) => {
    setIsAuthenticating(true);
    setAuthAccountName(`${acc.name} (${acc.email})`);
    setTimeout(() => {
      setIsAuthenticating(false);
      setShowGoogleModal(false);
      onLogin(acc.role, acc.name, acc.email);
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.includes('admin') || email.includes('vance')) {
      onLogin('admin', 'Marcus Vance', email);
    } else if (email.includes('student') || email.includes('wright') || email.includes('nam') || email.includes('se')) {
      onLogin('student', 'Nguyễn Hoàng Nam', email);
    } else {
      onLogin('lecturer', 'TS. Hoàng Văn Thụ', email);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-apptext transition-colors duration-200">
      {/* Sticky Top Header - Always visible when scrolling */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-appborder px-4 sm:px-8 py-2.5 transition-colors duration-200 shadow-2xs">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-primary font-bold text-sm tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span>{t.systemName}</span>
            </div>
            <span className="text-mutedtext/40 hidden sm:inline">|</span>
            <span className="text-mutedtext font-medium text-xs hidden md:inline">
              {t.systemFullTitle}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="h-9 px-3 rounded-lg border border-appborder bg-surface text-xs font-semibold text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors shadow-xs"
              title={t.language}
            >
              <Globe className="w-3.5 h-3.5 text-mutedtext" />
              <span>{lang === 'en' ? 'Tiếng Việt' : 'English'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-9 h-9 rounded-lg border border-appborder bg-surface text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-xs"
              title={t.theme}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card Scrollable Container */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 py-8 sm:py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-surface rounded-2xl border border-appborder p-8 shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-apptext tracking-tight">
              {t.loginWelcome}
            </h1>
            <p className="text-xs text-mutedtext leading-relaxed">
              {t.loginDesc}
            </p>
          </div>

          {/* Google / Gmail SSO Login Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full h-11 px-4 rounded-xl border border-appborder bg-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-apptext flex items-center justify-center space-x-3 transition-all shadow-xs hover:border-primary/60 group"
            >
              {/* Official Google 4-Color Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-medium text-apptext group-hover:text-primary transition-colors">
                {t.loginWithGoogle}
              </span>
            </button>
          </div>

          {/* Quick 1-Click Role Login */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-mutedtext text-center">
              {t.selectRoleToDemo}
            </div>

            <div className="space-y-2">
              {/* Lecturer Button */}
              <button
                type="button"
                onClick={() => onLogin('lecturer', 'TS. Hoàng Văn Thụ', 'thuhv@fpt.edu.vn')}
                className="w-full p-3 rounded-xl border border-appborder hover:border-primary bg-canvas hover:bg-primary-light/40 transition-all text-left flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-apptext group-hover:text-primary transition-colors">
                    {t.loginLecturerBtn}
                  </div>
                  <div className="text-[11px] text-mutedtext truncate">
                    {t.loginLecturerRole}
                  </div>
                </div>
              </button>

              {/* Student Button */}
              <button
                type="button"
                onClick={() => onLogin('student', 'Nguyễn Hoàng Nam', 'namnhse184920@fpt.edu.vn')}
                className="w-full p-3 rounded-xl border border-appborder hover:border-primary bg-canvas hover:bg-primary-light/40 transition-all text-left flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-apptext group-hover:text-primary transition-colors">
                    {t.loginStudentBtn}
                  </div>
                  <div className="text-[11px] text-mutedtext truncate">
                    {t.loginStudentRole}
                  </div>
                </div>
              </button>

              {/* Admin Button */}
              <button
                type="button"
                onClick={() => onLogin('admin', 'Marcus Vance', 'admin@fpt.edu.vn')}
                className="w-full p-3 rounded-xl border border-appborder hover:border-primary bg-canvas hover:bg-primary-light/40 transition-all text-left flex items-center space-x-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-apptext group-hover:text-primary transition-colors">
                    {t.loginAdminBtn}
                  </div>
                  <div className="text-[11px] text-mutedtext truncate">
                    {t.loginAdminRole}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-appborder"></div>
            <span className="flex-shrink mx-3 text-[11px] text-mutedtext">{t.orEnterCredentials}</span>
            <div className="flex-grow border-t border-appborder"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.emailPlaceholder}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.passwordPlaceholder}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold flex items-center justify-center transition-all shadow-xs"
            >
              {t.loginAction}
            </button>
          </form>
        </div>
      </div>
    </main>

      {/* Google OAuth Account Picker Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-appborder rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-appborder flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-apptext">
                    {lang === 'vi' ? 'Đăng nhập bằng Google' : 'Sign in with Google'}
                  </h3>
                  <p className="text-[11px] text-mutedtext">
                    AIVES - FPT University Single Sign-On
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-mutedtext hover:text-apptext flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {isAuthenticating ? (
                <div className="py-10 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <div className="text-sm font-semibold text-apptext">
                    {t.googleOAuthAuthenticating}
                  </div>
                  <p className="text-xs text-mutedtext">
                    {authAccountName}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-apptext">
                      {t.googleAccountChooserTitle}
                    </h4>
                    <p className="text-xs text-mutedtext">
                      {t.googleAccountChooserSub}
                    </p>
                  </div>

                  {/* List of University Google Accounts */}
                  <div className="space-y-2 border-y border-appborder py-3">
                    {googleAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className="w-full p-3 rounded-xl border border-transparent hover:border-appborder hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center space-x-3 text-left transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-full ${acc.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                          {acc.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-apptext group-hover:text-primary transition-colors flex items-center justify-between">
                            <span>{acc.name}</span>
                            <span className="text-[10px] font-normal text-mutedtext uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              {acc.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-mutedtext font-mono truncate">
                            {acc.email}
                          </div>
                          <div className="text-[10px] text-mutedtext/80 truncate">
                            {acc.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Security Policy Notice - Role is strictly bound to institution account */}
                  <div className="bg-canvas border border-appborder rounded-xl p-3 flex items-start space-x-2.5 text-xs text-mutedtext">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-semibold text-apptext">
                        {lang === 'vi' ? 'Bảo mật phân quyền ĐH FPT:' : 'FPT Security Policy:'}
                      </span>{' '}
                      {lang === 'vi'
                        ? 'Tài khoản Google Workspace được phân quyền và gán vai trò tự động theo danh bạ Đại học FPT. Người dùng không thể tự chọn hoặc can thiệp vai trò để đảm bảo an ninh kỳ thi.'
                        : 'Google Workspace accounts are strictly bound to their verified institution roles. Arbitrary role selection is prevented for exam integrity.'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-canvas border-t border-appborder flex items-center justify-between text-[11px] text-mutedtext">
              <span>Google OAuth 2.0 &bull; SSL Encrypted</span>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="hover:underline text-apptext"
              >
                {lang === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-mutedtext py-3 border-t border-appborder/50 bg-canvas mt-auto">
        {t.faculty} &bull; {t.humanInTheLoopNote}
      </footer>
    </div>
  );
}
