/**
 * 8px "+" crosshair SVG (#64748B) at the four corners of a container
 */
export function CornerCrosshairs() {
  const CrossSvg = ({ className }) => (
    <svg
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`corner-crosshair ${className}`}
    >
      <path d="M4 0V8M0 4H8" stroke="#64748B" strokeWidth="1" />
    </svg>
  );

  return (
    <>
      <CrossSvg className="tl" />
      <CrossSvg className="tr" />
      <CrossSvg className="bl" />
      <CrossSvg className="br" />
    </>
  );
}
