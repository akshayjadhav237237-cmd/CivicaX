/**
 * Skeleton primitive — Shimmer 1500ms, respects reduced motion
 */
export function Skeleton({ className = '', style = {}, height, width }) {
  return (
    <div
      style={{
        height,
        width,
        ...style,
      }}
      className={`landing-skeleton ${className}`}
      aria-hidden="true"
    />
  );
}
