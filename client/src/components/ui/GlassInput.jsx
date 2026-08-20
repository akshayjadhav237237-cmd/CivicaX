import { useId } from "react";

/**
 * GlassInput — Styled glass input field with optional label, icon, error and helper text.
 * Uses CSS variables for complete dark/light mode compatibility.
 */
export function GlassInput({
  label,
  icon: Icon,
  className = '',
  id,
  error,
  helperText,
  style = {},
  ...inputProps
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          className={`w-full glass-input px-3.5 py-2.5 text-sm transition-all duration-200 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-red-500 focus:border-red-500' : ''}`}
          style={{
            background: 'var(--input-bg)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--input-border)'}`,
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            ...style,
          }}
          {...inputProps}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
      )}
    </div>
  );
}

/**
 * GlassTextarea — Glass-styled textarea with high contrast styling.
 */
export function GlassTextarea({
  label,
  className = '',
  id,
  rows = 4,
  error,
  helperText,
  style = {},
  ...props
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full glass-input px-3.5 py-2.5 text-sm resize-none transition-all duration-200 ${
          error ? 'border-red-500 focus:border-red-500' : ''
        }`}
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--input-border)'}`,
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          ...style,
        }}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
      )}
    </div>
  );
}

/**
 * GlassSelect — Glass-styled select dropdown.
 */
export function GlassSelect({
  label,
  children,
  className = '',
  id,
  error,
  helperText,
  style = {},
  ...props
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full glass-input px-3.5 py-2.5 text-sm cursor-pointer transition-all duration-200 ${
          error ? 'border-red-500 focus:border-red-500' : ''
        }`}
        style={{
          background: 'var(--input-bg)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--input-border)'}`,
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-xs font-medium text-red-500 mt-0.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
      )}
    </div>
  );
}
