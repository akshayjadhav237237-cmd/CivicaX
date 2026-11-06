import { forwardRef } from 'react';

/**
 * Shared Button primitive
 * Variants: primary, ghost, critical
 * Height: 44px, Radius: 6px
 * Transition: 150ms cubic-bezier(0.22, 1, 0.36, 1)
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    children,
    className = '',
    onClick,
    type = 'button',
    disabled = false,
    icon: Icon,
    ...props
  },
  ref
) {
  const baseClasses =
    'h-[44px] px-5 rounded-[6px] text-sm font-semibold inline-flex items-center justify-center gap-2 select-none cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
    ghost:
      'bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
    critical:
      'bg-[var(--alert-red-fill)] text-[var(--alert-red-text)] border border-[var(--alert-red-border)] hover:opacity-90',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
});
