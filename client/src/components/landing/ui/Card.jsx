/**
 * Card primitive
 * Radius: 8px, Padding: 24/20/16, Border: 1px var(--border-grid)
 */
export function Card({
  children,
  className = '',
  padding = 'p-4 sm:p-5 lg:p-6',
  style = {},
  ...props
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-grid)',
        borderRadius: '8px',
        ...style,
      }}
      className={`border text-[var(--text-primary)] ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
