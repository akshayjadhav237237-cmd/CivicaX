import { useId } from "react";

/**
 * GlassInput — Styled glass input field with optional label and icon.
 * Uses CSS variables for dark mode compatibility.
 */
export function GlassInput({ label, icon: Icon, className = '', id, ...inputProps }) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--text-secondary)' }}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          className={`w-full glass-input px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 ${Icon ? 'pl-9' : ''}`}
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
          {...inputProps}
        />
      </div>
    </div>
  );
}

/**
 * GlassTextarea — Glass-styled textarea.
 */
export function GlassTextarea({ label, className = '', id, rows = 4, ...props }) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</label>}
      <textarea
        id={inputId}
        rows={rows}
        className="w-full px-4 py-2.5 text-sm resize-none transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
        {...props}
      />
    </div>
  );
}

/**
 * GlassSelect — Glass-styled select dropdown.
 */
export function GlassSelect({ label, children, className = '', id, ...props }) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</label>}
      <select
        id={inputId}
        className="w-full px-4 py-2.5 text-sm cursor-pointer transition-all duration-200"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
