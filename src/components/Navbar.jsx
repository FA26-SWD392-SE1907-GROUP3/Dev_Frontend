import React from 'react';
import { GraduationCap, Sun, Moon, Globe, LogOut } from 'lucide-react';

export default function Navbar({
  currentRole,
  setRole,
  currentUser,
  onLogout,
  lang,
  setLang,
  theme,
  setTheme,
  t
}) {
  const getRoleDisplayName = () => {
    switch (currentRole) {
      case 'admin':
        return `${t.adminPortal} (${currentUser?.name || 'Marcus Vance'})`;
      case 'lecturer':
        return `${t.lecturerPortal} (${currentUser?.name || 'TS. Hoàng Văn Thụ'})`;
      case 'student':
        return `${t.studentPortal} (${currentUser?.name || 'Nguyễn Hoàng Nam'})`;
      default:
        return '';
    }
  };

  return (
    <header className="bg-surface border-b border-appborder sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between text-xs transition-colors duration-200">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 font-bold text-sm tracking-tight text-primary">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span>{t.systemName}</span>
        </div>
        <span className="text-mutedtext/40 hidden md:inline">|</span>
        <span className="text-mutedtext font-medium hidden lg:inline">{t.systemFullTitle}</span>
      </div>

      {/* Current Role Identity Badge */}
      <div className="hidden md:flex items-center space-x-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
          currentRole === 'admin'
            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            : currentRole === 'lecturer'
            ? 'bg-blue-50 dark:bg-blue-950/50 text-primary border-blue-200 dark:border-blue-800'
            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
        }`}>
          {currentRole === 'admin'
            ? (t.filterAdmins || 'Quản trị viên')
            : currentRole === 'lecturer'
            ? (t.filterLecturers || 'Giảng viên')
            : (t.filterStudents || 'Sinh viên')}
        </span>
      </div>

      {/* Utility Controls: Language, Theme, User & Sign Out */}
      <div className="flex items-center space-x-2.5 text-xs">
        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
          className="h-8 px-2.5 rounded-lg border border-appborder bg-surface text-xs font-semibold text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-1.5 transition-colors shadow-xs"
          title={t.language}
        >
          <Globe className="w-3.5 h-3.5 text-mutedtext" />
          <span>{lang === 'en' ? 'VI' : 'EN'}</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-8 h-8 rounded-lg border border-appborder bg-surface text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-xs"
          title={t.theme}
        >
          {theme === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>

        {/* Logged in User & Sign Out */}
        <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-appborder">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-mutedtext font-medium truncate max-w-[150px]">
            {currentUser?.name || 'User'}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="h-8 px-2.5 rounded-lg border border-appborder bg-surface hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-mutedtext transition-colors flex items-center space-x-1"
          title={t.signOut}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.signOut}</span>
        </button>
      </div>
    </header>
  );
}
