import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';

/**
 * GlassButton — Liquid glass button with primary/danger/ghost variants.
 * Ghost variant adapts automatically in dark mode via CSS variables.
 */
export function GlassButton({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  size = 'md',
  ariaLabel,
}) {
  const { isDark } = useThemeStore();
  const sizeClasses = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-2.5 text-sm', lg: 'px-8 py-3 text-base' };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
    },
    danger: {
      background: 'linear-gradient(135deg, #F87171 0%, #EF4444 50%, #DC2626 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)',
    },
    ghost: {
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(12px)',
      color: isDark ? '#F1F5F9' : '#1E293B',
      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(203,213,225,0.7)',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(31,38,135,0.06)',
    },
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`font-semibold rounded-full cursor-pointer transition-all duration-200 flex items-center gap-2 justify-center ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </motion.button>
  );
}
