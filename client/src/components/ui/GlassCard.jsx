/**
 * GlassCard — Liquid glass surface wrapper component.
 * Uses CSS variables so it automatically adapts to dark/light mode.
 */
export function GlassCard({ children, className = '', onClick, padding = 'p-5' }) {
  return (
    <div
      className={`glass-card ${padding} ${className}`}
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
      }}
    >
      {children}
    </div>
  );
}
