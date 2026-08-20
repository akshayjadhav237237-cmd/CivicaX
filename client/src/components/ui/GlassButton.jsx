import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';

/**
 * GlassButton — Liquid glass button with primary/danger/ghost/secondary variants.
 * Guarantees sharp, high-contrast text and borders across light and dark modes.
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
  style = {},
  icon: Icon,
  ...props
}) {
  const { isDark } = useThemeStore();
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
      fontWeight: 600,
    },
    danger: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
      fontWeight: 600,
    },
    safe: {
      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #15803D 100%)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
      fontWeight: 600,
    },
    ghost: {
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: isDark ? '#F8FAFC' : '#0F172A',
      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(148, 163, 184, 0.5)',
      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
      fontWeight: 600,
    },
    secondary: {
      background: isDark ? 'rgba(51, 65, 85, 0.75)' : 'rgba(241, 245, 249, 0.9)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      color: isDark ? '#F8FAFC' : '#0F172A',
      border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(203, 213, 225, 0.8)',
      boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
      fontWeight: 600,
    },
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`rounded-full cursor-pointer transition-all duration-200 flex items-center gap-2 justify-center select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      style={{
        ...(variantStyles[variant] || variantStyles.primary),
        ...style,
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </motion.button>
  );
}
