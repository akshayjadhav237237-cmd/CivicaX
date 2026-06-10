import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import {
  LayoutDashboard,
  AlertTriangle,
  HardHat,
  ShieldAlert,
  Building2,
  Menu
} from 'lucide-react';

export function MobileTabBar() {
  const { user } = useAuth();
  const { isDark } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const mainItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle,   roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Civic',     path: '/civic',     icon: HardHat,         roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Safety',    path: '/safety',    icon: ShieldAlert,     roles: ['citizen', 'department_op', 'government', 'admin'] },
  ];

  const moreItems = [
    { name: 'Command Center', path: '/government', icon: Building2,    roles: ['government', 'admin'] },
    { name: 'Alert History',  path: '/alerts',     icon: AlertTriangle, roles: ['citizen', 'department_op', 'government', 'admin'] },
    { name: 'Profile',        path: '/profile',    icon: HardHat,       roles: ['citizen', 'department_op', 'government', 'admin'] },
  ];

  const visibleMain = mainItems.filter((item) => item.roles.includes(user?.role)).slice(0, 4);
  const visibleMore = moreItems.filter((item) => item.roles.includes(user?.role));

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
              `flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                isActive ? 'text-blue-500' : ''
              }`
            }
            style={({ isActive }) => ({ color: isActive ? '#3B82F6' : 'var(--text-muted)' })}
          >
            <item.icon size={20} className="mb-0.5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
        {visibleMore.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors"
            style={{ color: isOpen ? '#3B82F6' : 'var(--text-muted)' }}
          >
            <Menu size={20} className="mb-0.5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        )}
      </div>

      {/* Overflow menu */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="md:hidden fixed bottom-20 right-4 z-40 backdrop-blur-xl rounded-2xl p-2 shadow-xl flex flex-col gap-1 w-48"
            style={{
              background: 'var(--glass-bg-strong)',
              border: '1px solid var(--bg-card-border)',
            }}
          >
            {visibleMore.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={({ isActive }) => ({
                  background: isActive ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(219,234,254,1)') : 'transparent',
                  color: isActive ? '#3B82F6' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '400',
                })}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
            <div className="h-px my-1" style={{ background: 'var(--divider)' }} />
            <NavLink
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Profile</span>
            </NavLink>
          </div>
        </>
      )}
    </>
  );
}
