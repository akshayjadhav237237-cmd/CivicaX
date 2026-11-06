/**
 * SectionHeader — Eyebrow + H2 + Lead
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  className = '',
}) {
  const alignClass =
    align === 'center' ? 'text-center items-center mx-auto' : 'text-left items-start';

  return (
    <div className={`flex flex-col mb-10 sm:mb-14 ${alignClass} ${className}`}>
      {eyebrow && (
        <span className="eyebrow mb-2 sm:mb-3 block">
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className="landing-h2 mb-3 sm:mb-4">
          {title}
        </h2>
      )}
      {lead && (
        <p className="body-lg">
          {lead}
        </p>
      )}
    </div>
  );
}
