import { useState } from "react";

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 375, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div
        className="relative overflow-hidden rounded-[44px] shadow-2xl"
        style={{
          background: "#0b0f1e",
          border: "8px solid #1a1f35",
          minHeight: 720,
        }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-7 pt-3 pb-1">
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>9:41</span>
          <div className="flex gap-1 items-center">
            <div style={{ width: 16, height: 10, borderRadius: 2, border: "1.5px solid #fff", position: "relative" }}>
              <div style={{ position: "absolute", left: 1, top: 1, bottom: 1, right: 4, background: "#fff", borderRadius: 1 }} />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function QRPattern() {
  return (
    <div style={{ width: 52, height: 52, background: "transparent", display: "grid", gridTemplateColumns: "repeat(7,7px)", gap: 1 }}>
      {Array.from({ length: 49 }).map((_, i) => {
        const row = Math.floor(i / 7);
        const col = i % 7;
        const isCorner =
          (row < 3 && col < 3) ||
          (row < 3 && col > 3) ||
          (row > 3 && col < 3);
        const filled = isCorner || (row === 3 && col === 3) || Math.random() > 0.55;
        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              background: filled ? "#4F6EF7" : "transparent",
              borderRadius: 1,
            }}
          />
        );
      })}
    </div>
  );
}

function HealthCard() {
  return (
    <div
      style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(135deg, #102060, #1a3a9e, #102060)",
        padding: 20,
        position: "relative",
      }}
    >
      {/* Gold bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: "rgba(201,134,10,0.4)" }} />

      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, background: "linear-gradient(135deg,#D4A017,#f0c040)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "#000", fontWeight: 900 }}>H</span>
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>IbnCeena</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 1, marginTop: 4 }}>STANDARD</div>
        </div>
        <QRPattern />
      </div>

      {/* Patient info */}
      <div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }}>PATIENT IDENTIFIER</div>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginBottom: 8 }}>John Doe</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>DOB: 12/04/1955</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>O+</span>
          <div style={{ borderRadius: 8, background: "rgba(0,0,0,0.35)", paddingInline: 10, paddingBlock: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>PIN: 542</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HealthCardSaveToPhotos() {
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handleShare() {
    setSharing(true);
    setTimeout(() => { setSharing(false); showToast("Shared via system sheet"); }, 1400);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); showToast("✓ Saved to your photo library"); }, 1400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#0d1117 0%,#161b27 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,110,247,0.15)", border: "1px solid rgba(79,110,247,0.3)", borderRadius: 20, paddingInline: 14, paddingBlock: 6, marginBottom: 16 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4F6EF7", display: "inline-block" }} />
          <span style={{ color: "#7b97ff", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>TASK #8 — SAVE TO PHOTOS</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.25 }}>
          Health Card · Save to Photos
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>
          Users can now save their Health Card directly to their device's camera roll — no network needed.
        </p>
      </div>

      {/* Toggle */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 4, gap: 2 }}>
        {(["before", "after"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: activeTab === tab ? (tab === "after" ? "rgba(79,110,247,0.25)" : "rgba(255,255,255,0.1)") : "transparent",
              color: activeTab === tab ? (tab === "after" ? "#7b97ff" : "#fff") : "rgba(255,255,255,0.45)",
              transition: "all 0.2s",
              outline: "none",
            }}
          >
            {tab === "before" ? "Before" : "After"}
          </button>
        ))}
      </div>

      {/* Phone preview */}
      <PhoneFrame>
        <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>Health Card{"\n"}Portal</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>Instant critical access linked{"\n"}to physical hardware.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", padding: 4 }}>
              {["Standard ID", "Geriatric Safety Pack"].map((t) => (
                <div key={t} style={{ padding: "8px 10px", borderRadius: 10, background: t === "Standard ID" ? "rgba(79,110,247,0.15)" : "transparent", border: t === "Standard ID" ? "1px solid rgba(79,110,247,0.3)" : "none" }}>
                  <span style={{ color: t === "Standard ID" ? "#7b97ff" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: t === "Standard ID" ? 600 : 400, lineHeight: 1.4, display: "block", textAlign: "center" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health card */}
          <HealthCard />

          {/* Buttons — before/after */}
          {activeTab === "before" ? (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 14,
                border: "1px solid rgba(79,110,247,0.35)",
                background: "rgba(79,110,247,0.12)",
                padding: "14px 0",
                color: "#7b97ff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Health Card
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              {/* Share button */}
              <button
                onClick={handleShare}
                disabled={sharing || saving}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderRadius: 14,
                  border: "1px solid rgba(79,110,247,0.35)",
                  background: "rgba(79,110,247,0.12)",
                  padding: "13px 0",
                  color: "#7b97ff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: sharing ? "default" : "pointer",
                  opacity: sharing ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  outline: "none",
                }}
              >
                {sharing ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                )}
                {sharing ? "Exporting…" : "Share"}
              </button>

              {/* Save to Photos button */}
              <button
                onClick={handleSave}
                disabled={saving || sharing}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "13px 0",
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  transition: "opacity 0.2s",
                  outline: "none",
                }}
              >
                {saving ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                {saving ? "Saving…" : "Save to Photos"}
              </button>
            </div>
          )}

          {/* Benefits card preview */}
          <div style={{ borderRadius: 16, border: "1.5px solid rgba(79,110,247,0.25)", background: "rgba(255,255,255,0.04)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <svg width="16" height="16" fill="#4F6EF7" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-9 7H5v-2h6v2zm8 0h-6v-2h6v2z"/></svg>
              <span style={{ color: "#7b97ff", fontWeight: 700, fontSize: 13 }}>Standard Benefits</span>
            </div>
            {["Digital Health Card", "2 Triage Pathways", "QR Emergency Access", "Medication Record"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ color: "#4F6EF7", fontSize: 14 }}>✓</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </PhoneFrame>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(30,40,70,0.95)",
            border: "1px solid rgba(79,110,247,0.4)",
            borderRadius: 14,
            padding: "12px 22px",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            zIndex: 999,
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* Change summary */}
      <div style={{ maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          What changed
        </div>
        {[
          { icon: "📦", label: "expo-media-library installed", desc: "Added to package.json dependencies" },
          { icon: "🔐", label: "Permission request built in", desc: "Asks for photo access gracefully; falls back with a clear message if denied" },
          { icon: "💾", label: "Saves PNG to camera roll", desc: "captureRef → MediaLibrary.saveToLibraryAsync — fully offline" },
          { icon: "↔️", label: "Share + Save buttons side by side", desc: "Refactored single Share button into a flex row; both buttons get equal width" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
