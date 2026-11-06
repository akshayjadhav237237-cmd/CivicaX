/**
 * ProvenanceFooter — Small mono line citing sources
 */
export function ProvenanceFooter({
  sources = 'NASA GPM IMERG, NASA SMAP, Open-Meteo, SRTM',
  updated,
  className = '',
}) {
  return (
    <div
      className={`text-[11px] font-mono text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-grid)] ${className}`}
    >
      <span>Sources: {sources}</span>
      {updated && <span>Updated {updated}</span>}
    </div>
  );
}
