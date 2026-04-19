const TICKER_ITEMS = [
  "RRB NTPC Graduate · 8,113 पद जारी",
  "HPSC HCS 2026 · आवेदन 29 अप्रैल से",
  "HSSC CET Group C · 32,000 पद",
  "UPSC Civil Services 2026 · अधिसूचना जारी",
  "IBPS PO 2026 · आवेदन शुरू",
  "SSC CGL 2026 · परीक्षा तिथि घोषित",
];

export default function Ticker() {
  const text = TICKER_ITEMS.join("   ·   ");

  return (
    <div
      style={{
        background: "var(--ink-900)",
        borderBottom: "1px solid var(--ink-800)",
        overflow: "hidden",
        height: "28px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          color: "var(--ink-400)",
          whiteSpace: "nowrap",
          flexShrink: 0,
          padding: "0 12px",
          letterSpacing: "0.03em",
        }}
      >
        🔴 LIVE
      </span>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div
          className="ticker-track"
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "ticker 40s linear infinite",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "#ffffff",
            letterSpacing: "0.02em",
          }}
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
