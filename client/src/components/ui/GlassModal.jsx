import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * GlassModal — Centered modal with blurred overlay backdrop.
 * Adapts to dark mode via CSS variables.
 */
export function GlassModal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto glass-modal-surface`}
              style={{
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: '24px',
                boxShadow: 'var(--glass-shadow-heavy)',
                color: 'var(--text-primary)',
              }}
            >
              {/* Header */}
              {title && (
                <div
                  className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: '1px solid var(--divider)' }}
                >
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="p-1.5 rounded-full transition-colors"
                    style={{ background: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="p-6" style={{ color: 'var(--text-primary)' }}>{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
