/**
 * GlassCard — Liquid glass surface wrapper component.
 * Uses CSS variables so it automatically adapts to dark/light mode with sharp contrast.
 * @param {'default'|'subtle'|'strong'|'interactive'} [variant]
 */
export function GlassCard({
  children,
  className = '',
  onClick,
  padding = 'p-5',
  variant = 'default',
  style = {},
  ...props
}) {
  const variantBg = {
    default: 'var(--bg-card)',
    subtle: 'var(--bg-card-subtle)',
    strong: 'var(--glass-bg-strong)',
    interactive: 'var(--bg-card)',
  };

  return (
    <div
      className={`glass-card ${padding} ${
        variant === 'interactive' || onClick
          ? 'cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all duration-200'
          : ''
      } ${className}`}
      onClick={onClick}
      style={{
        background: variantBg[variant] || 'var(--bg-card)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
        color: 'var(--text-primary)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
