import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../i18n';
import {
  LayoutDashboard,
  AlertTriangle,
  HardHat,
  ShieldAlert,
  Building2,
  Menu,
  User,
  History,
  FileSpreadsheet
} from 'lucide-react';

export function MobileTabBar() {
  const { user } = useAuth();
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const mainItems = [
    { name: t('nav.dashboard', null, 'Dashboard'), path: '/dashboard', icon: LayoutDashboard, roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: t('nav.emergency', null, 'Emergency'), path: '/emergency', icon: AlertTriangle,   roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: t('nav.civic', null, 'Civic'),         path: '/civic',     icon: HardHat,         roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: t('nav.safety', null, 'Safety'),       path: '/safety',    icon: ShieldAlert,     roles: ['citizen', 'department_op', 'government', 'admin'] },
  ];

  const moreItems = [
    { name: t('nav.government', null, 'Command Center'),           path: '/government',        icon: Building2,       roles: ['government', 'admin'] },
    { name: t('nav.damage_assessment', null, 'Damage Assessment'), path: '/damage-assessment',icon: FileSpreadsheet, roles: ['government', 'admin', 'department_op'] },
    { name: t('nav.alerts', null, 'Alert History'),                path: '/alerts',            icon: History,         roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: t('nav.profile', null, 'Profile'),                     path: '/profile',           icon: User,            roles: ['citizen', 'department_op', 'government', 'admin'] },
  ];

  const visibleMain = mainItems.filter((item) => item.roles.includes(user?.role)).slice(0, 4);
  const visibleMore = moreItems.filter((item) => item.roles.includes(user?.role));

  const activeColor = isDark ? '#60A5FA' : '#2563EB';
  const inactiveColor = isDark ? '#CBD5E1' : '#64748B';

  return (
    <>
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-nav z-40 flex items-center justify-around px-2 pb-safe"
        style={{ borderTop: '1px solid var(--bg-card-border)', borderRight: 'none' }}
      >
        {visibleMain.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors select-none ${
                isActive ? 'font-semibold' : 'font-medium'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? activeColor : inactiveColor,
            })}
          >
            <item.icon size={20} className="mb-0.5" />
            <span className="text-[10px] truncate max-w-full px-0.5 text-center">{item.name}</span>
          </NavLink>
        ))}
        {visibleMore.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors select-none cursor-pointer"
            style={{ color: isOpen ? activeColor : inactiveColor }}
          >
            <Menu size={20} className="mb-0.5" />
            <span className="text-[10px] font-medium">{t("common.more", null, "More")}</span>
          </button>
        )}
      </div>

      {/* Overflow menu */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-20 right-4 z-40 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-52"
            style={{
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--bg-card-border)',
              boxShadow: 'var(--glass-shadow-heavy)',
            }}
          >
            {visibleMore.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all select-none hover:bg-black/5 dark:hover:bg-white/5"
                style={({ isActive }) => ({
                  background: isActive
                    ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)')
                    : 'transparent',
                  color: isActive ? activeColor : 'var(--text-primary)',
                  fontWeight: isActive ? '600' : '500',
                })}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}
    </>
  );
}
