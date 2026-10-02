import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  HelpCircle,
  CalendarDays,
  FileText,
  BookmarkCheck,
  Tv,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ currentRole, activeTab, setActiveTab, t }) {
  const adminMenuItems = [
    { id: 'admin-dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'admin-users', label: t.navUsers, icon: Users },
    { id: 'admin-courses', label: t.navCourses, icon: BookOpen },
    { id: 'admin-settings', label: t.navSettings, icon: Settings },
    { id: 'admin-questionbank', label: t.navQuestionBank, icon: HelpCircle },
    { id: 'admin-sessions', label: t.navSessions, icon: CalendarDays },
  ];

  const lecturerMenuItems = [
    { id: 'lecturer-dashboard', label: t.navDashboard, icon: LayoutDashboard, section: t.sectionOverview },
    { id: 'lecturer-materials', label: t.navMaterials, icon: FileText, section: t.sectionContent },
    { id: 'lecturer-questionbank', label: t.navQuestionBank, icon: HelpCircle },
    { id: 'lecturer-rubric', label: t.navRubric, icon: BookmarkCheck },
    { id: 'lecturer-sessions', label: t.navSessions, icon: CalendarDays, section: t.sectionSessions },
    { id: 'lecturer-monitor', label: t.navMonitor, icon: Tv },
    { id: 'lecturer-scoring', label: t.navScoring, icon: CheckCircle2, section: t.sectionEvaluation },
  ];

  const items = currentRole === 'admin' ? adminMenuItems : lecturerMenuItems;

  return (
    <aside className="w-[230px] shrink-0 bg-surface border-r border-appborder flex flex-col justify-between min-h-[calc(100vh-48px)] transition-colors duration-200">
      <div>
        {/* Workspace Title Header */}
        <div className="px-5 py-4 border-b border-appborder/60">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-mutedtext">{t.faculty}</div>
          <div className="text-sm font-semibold text-apptext mt-0.5 truncate">
            {currentRole === 'admin' ? t.adminPortal : t.lecturerPortal}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className="pt-3 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-mutedtext">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary-light font-semibold'
                      : 'text-mutedtext hover:text-apptext hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Human-in-the-Loop Footer indicator */}
      <div className="p-4 border-t border-appborder bg-canvas text-[11px] text-mutedtext transition-colors">
        <div className="flex items-center space-x-2 text-apptext">
          <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-semibold">{t.humanInTheLoop}</span>
        </div>
        <p className="text-[10px] text-mutedtext mt-1 leading-normal">
          {t.humanInTheLoopNote}
        </p>
      </div>
    </aside>
  );
}
