import { useState, useEffect, useRef } from 'react';

/**
 * ETACountdownBanner
 *
 * Full-width urgency banner shown only when flood water ETA is ≤ 30 minutes.
 *
 * Props:
 *   prediction — full flood prediction object from the flood API (may be null)
 */
export default function ETACountdownBanner({ prediction }) {
  // ── Guard: only render when overflowing and ETA ≤ 30 min ─────────────────
  const shouldShow =
    prediction?.riverStatus?.isOverflowing === true &&
    typeof prediction?.riverStatus?.etaMinutes === 'number' &&
    prediction.riverStatus.etaMinutes <= 30;

  const [secondsLeft, setSecondsLeft] = useState(() =>
    shouldShow ? Math.round(prediction.riverStatus.etaMinutes * 60) : 0
  );
  const [dismissed, setDismissed] = useState(false);

  const intervalRef = useRef(null);
  const dismissTimeoutRef = useRef(null);
  const audioPlayedRef = useRef(false);

  // ── Inject keyframe animation once ───────────────────────────────────────
  useEffect(() => {
    const styleId = 'civicax-eta-pulse-style';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        @keyframes civicax-eta-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%      { box-shadow: 0 0 12px 4px rgba(239,68,68,0.3); }
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // ── Reset countdown whenever prediction changes ───────────────────────────
  useEffect(() => {
    if (!shouldShow) return;

    const initial = Math.round(prediction.riverStatus.etaMinutes * 60);
    setSecondsLeft(initial);
    setDismissed(false);
    audioPlayedRef.current = false;

    // Start countdown interval
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction?.riverStatus?.etaMinutes, shouldShow]);

  // ── Play notification sound when countdown hits 0 ────────────────────────
  useEffect(() => {
    if (secondsLeft === 0 && shouldShow && !audioPlayedRef.current) {
      audioPlayedRef.current = true;
      // Attempt to play a short notification beep.
      // The base64 data URI below is a minimal silent placeholder;
      // replace with a real beep WAV in production.
      try {
        new Audio(
          'data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        ).play();
      } catch (_) {
        // Audio play blocked by browser autoplay policy — silent fallback
      }
    }
  }, [secondsLeft, shouldShow]);

  // ── Auto-reset dismissed state after 5 minutes (300 s) ───────────────────
  const handleDismiss = () => {
    setDismissed(true);
    dismissTimeoutRef.current = setTimeout(() => {
      setDismissed(false);
    }, 300_000); // 5 minutes
  };

  // ── Cleanup timeouts on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (!shouldShow || dismissed) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isArrived = secondsLeft <= 0;

  return (
    <div
      style={{
        background: isArrived ? '#EF4444' : 'rgba(239,68,68,0.15)',
        border: '1px solid #EF4444',
        borderRadius: 16,
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: 'civicax-eta-pulse 2s ease-in-out infinite',
      }}
    >
      {/* ── Left section ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {!isArrived ? (
          <>
            {/* Label */}
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: '0.875rem',   /* text-sm */
                color: '#991B1B',       /* text-red-800 */
                letterSpacing: '0.02em',
              }}
            >
              ⚠️ FLOOD WATER REACHING{' '}
              <span style={{ textTransform: 'uppercase' }}>
                {prediction.zoneName ?? 'YOUR ZONE'}
              </span>{' '}
              IN
            </p>

            {/* Countdown */}
            <p
              style={{
                margin: '2px 0',
                fontFamily: 'monospace',
                fontSize: '1.875rem',   /* text-3xl */
                fontWeight: 900,        /* font-black */
                color: '#B91C1C',       /* text-red-700 */
                lineHeight: 1.1,
              }}
            >
              {formatCountdown(secondsLeft)}
            </p>

            {/* Sub-text */}
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',    /* text-xs */
                color: '#DC2626',       /* text-red-600 */
              }}
            >
              Estimated arrival based on river velocity{' '}
              {prediction.riverStatus.velocityMs} m/s
            </p>
          </>
        ) : (
          /* Arrived state */
          <p
            style={{
              margin: 0,
              fontWeight: 900,          /* font-black */
              fontSize: '1.125rem',     /* text-lg */
              color: '#FFFFFF',
              letterSpacing: '0.03em',
            }}
          >
            🚨 FLOOD WATER HAS ARRIVED — EVACUATE IMMEDIATELY
          </p>
        )}
      </div>

      {/* ── Dismiss button ────────────────────────────────────────────────── */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: '1px solid #EF4444',
          borderRadius: 8,
          padding: '4px 10px',
          color: isArrived ? '#FFFFFF' : '#EF4444',
          cursor: 'pointer',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
        aria-label="Dismiss flood warning banner"
      >
        ✕
      </button>
    </div>
  );
}
