import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu, Search, Sun, Moon } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { GlassDrawer } from '../ui/GlassDrawer';
import { GlassTimeline } from '../ui/GlassTimeline';

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useThemeStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const pathMap = {
    '/dashboard':  'Dashboard',
    '/emergency':  'Emergency Responder',
    '/civic':      'Civic Manager',
    '/safety':     'Safety Watch',
    '/government': 'Command Center',
    '/alerts':     'Alert History',
    '/profile':    'User Profile',
    '/admin':      'Admin Panel',
  };
  const title = pathMap[location.pathname] || 'CivicaX';

  const handleNotificationClick = (id) => { markAsRead(id); };

  const notificationEvents = notifications.map(n => ({
    id: n.id,
    label: n.title,
    description: n.body,
    timestamp: n.createdAt,
    color: n.isRead ? '#94A3B8' : '#3B82F6',
  }));

  return (
    <>
      <header
        className="h-16 w-full flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-sm"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--bg-card-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-primary)' }}
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search */}
          <div
            className="hidden sm:flex items-center rounded-full px-4 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-400/30 transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search ID or Zone..."
              className="bg-transparent border-none outline-none text-sm px-2 w-48"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 hover:scale-110"
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
            }}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark
              ? <Sun size={18} color="#FCD34D" />
              : <Moon size={18} color="#6366F1" />
            }
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2.5 rounded-full shadow-sm transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
            onClick={() => setIsDrawerOpen(true)}
            aria-label="View notifications"
          >
            <Bell size={20} style={{ color: 'var(--text-primary)' }} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full font-bold border-2 border-white shadow-sm cursor-help"
            style={{ background: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE', color: isDark ? '#60A5FA' : '#1D4ED8' }}
            title={`${user?.name} (${user?.role})`}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <GlassDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Notifications" width="400px">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{unreadCount} unread</span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-semibold text-blue-500 hover:text-blue-400">
              Mark all read
            </button>
          )}
        </div>
        <div onClick={(e) => {
          const id = e.target.closest('[data-id]')?.dataset.id;
          if (id) handleNotificationClick(id);
        }}>
          {notificationEvents.map(event => (
            <div
              key={event.id}
              data-id={event.id}
              className="cursor-pointer p-2 -mx-2 rounded-lg transition-colors"
              style={{ ':hover': { background: 'var(--hover-bg)' } }}
            >
              <GlassTimeline events={[event]} />
            </div>
          ))}
          {notificationEvents.length === 0 && (
            <p className="text-sm text-center mt-10" style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
          )}
        </div>
      </GlassDrawer>
    </>
  );
}
