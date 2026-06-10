import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * GlassDrawer — Right-side sliding drawer for notifications and detail panels.
 * Adapts to dark mode via CSS variables.
 */
export function GlassDrawer({ isOpen, onClose, title, children, width = '380px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full z-50 flex flex-col glass-drawer-surface"
            style={{
              width,
              background: 'var(--glass-bg-strong)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              borderLeft: '1px solid var(--bg-card-border)',
              boxShadow: 'var(--glass-shadow-heavy)',
              color: 'var(--text-primary)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--divider)' }}
            >
              <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-full transition-colors"
                style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
