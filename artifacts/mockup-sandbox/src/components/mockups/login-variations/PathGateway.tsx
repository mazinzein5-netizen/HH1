import {
  LogIn,
  UserPlus,
  Compass,
  Siren,
  ChevronRight,
  User,
  Lock,
  Fingerprint,
  ShieldCheck,
  Eye,
  ArrowLeft,
} from "lucide-react";
import "./_group.css";

function HiveMark({ size = 56 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id="pg-hex" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--hive-gold-light)" />
            <stop offset="100%" stopColor="var(--hive-gold)" />
          </linearGradient>
        </defs>
        <polygon
          points="50,4 91,27 91,73 50,96 9,73 9,27"
          fill="none"
          stroke="url(#pg-hex)"
          strokeWidth="5"
        />
        <polygon
          points="50,26 71,38 71,62 50,74 29,62 29,38"
          fill="url(#pg-hex)"
          opacity="0.95"
        />
        <polygon
          points="50,36 62,43 62,57 50,64 38,57 38,43"
          fill="var(--hive-bg)"
        />
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex justify-between items-center px-6 pt-3 pb-1">
      <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>9:41</span>
      <div className="flex gap-1.5 items-center">
        <div className="flex gap-0.5 items-end h-3">
          {[4, 6, 8, 10].map((h) => (
            <div
              key={h}
              style={{ width: 3, height: h, background: "#fff", borderRadius: 1 }}
            />
          ))}
        </div>
        <div
          style={{
            width: 16,
            height: 10,
            borderRadius: 2,
            border: "1.5px solid #fff",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 1,
              top: 1,
              bottom: 1,
              right: 4,
              background: "#fff",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function PathGateway() {
  return (
    <div
      className="hive-scope min-h-screen w-full flex items-start justify-center font-sans"
      style={{ background: "#05050c", padding: "24px 0" }}
    >
      <style>{`
        .hive-scope .pg-honeycomb {
          background-image:
            radial-gradient(circle at 20% 8%, rgba(201,134,10,0.16), transparent 42%),
            radial-gradient(circle at 88% 90%, rgba(79,110,247,0.14), transparent 45%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='96' viewBox='0 0 56 96'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.045' stroke-width='1'%3E%3Cpath d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/%3E%3Cpath d='M28 64 L56 80 L56 112 L28 128 L0 112 L0 80 Z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .hive-scope .pg-selected-ring {
          box-shadow: 0 0 0 1px var(--hive-glass-gold-border), 0 0 32px rgba(201,134,10,0.25);
        }
      `}</style>

      <div
        className="pg-honeycomb relative overflow-hidden"
        style={{
          width: 380,
          minHeight: 760,
          background: "var(--hive-bg)",
          borderRadius: 40,
          border: "1px solid var(--hive-border)",
        }}
      >
        <StatusBar />

        <div className="px-5 pt-4 pb-8">
          {/* Brand header */}
          <div className="flex flex-col items-center text-center">
            <HiveMark size={58} />
            <h1
              className="mt-3 font-bold tracking-tight"
              style={{ color: "var(--hive-fg)", fontSize: 24, letterSpacing: "-0.02em" }}
            >
              Health Hive
            </h1>
            <p
              className="mt-0.5 font-medium"
              style={{ color: "var(--hive-gold-light)", fontSize: 12, letterSpacing: "0.04em" }}
            >
              IbnCeena Health Ecosystem
            </p>
            <p className="mt-2" style={{ color: "var(--hive-muted-fg)", fontSize: 12.5 }}>
              Secure Patient Access Portal
            </p>
          </div>

          {/* Gateway prompt */}
          <div className="mt-6 mb-3 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "var(--hive-border)" }} />
            <span
              className="font-semibold uppercase"
              style={{ color: "var(--hive-muted-fg)", fontSize: 10.5, letterSpacing: "0.12em" }}
            >
              How would you like to continue?
            </span>
            <div className="h-px flex-1" style={{ background: "var(--hive-border)" }} />
          </div>

          {/* SELECTED path — Returning patient, form revealed */}
          <div
            className="pg-selected-ring rounded-2xl overflow-hidden"
            style={{
              background: "var(--hive-card)",
              border: "1px solid var(--hive-glass-gold-border)",
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  background: "var(--hive-glass-gold)",
                  border: "1px solid var(--hive-glass-gold-border)",
                }}
              >
                <LogIn size={20} style={{ color: "var(--hive-gold-light)" }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: "var(--hive-fg)", fontSize: 15 }}>
                    Returning patient
                  </span>
                  <span
                    className="font-semibold uppercase rounded-full px-1.5 py-0.5"
                    style={{
                      fontSize: 8.5,
                      letterSpacing: "0.06em",
                      color: "var(--hive-gold-bright)",
                      background: "var(--hive-gold-bg)",
                      border: "1px solid var(--hive-gold-border)",
                    }}
                  >
                    Selected
                  </span>
                </div>
                <p style={{ color: "var(--hive-muted-fg)", fontSize: 11.5 }}>
                  Sign in to your health record
                </p>
              </div>
              <ArrowLeft size={16} style={{ color: "var(--hive-muted-fg)" }} />
            </div>

            {/* Revealed form */}
            <div
              className="px-4 pb-4 pt-3"
              style={{ borderTop: "1px solid var(--hive-border)" }}
            >
              {/* Username */}
              <label
                className="block mb-1.5 font-medium"
                style={{ color: "var(--hive-muted-fg)", fontSize: 11 }}
              >
                Username or MRN
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl px-3 mb-3"
                style={{
                  height: 46,
                  background: "var(--hive-glass)",
                  border: "1px solid var(--hive-border)",
                }}
              >
                <User size={16} style={{ color: "var(--hive-muted-fg)" }} />
                <span style={{ color: "var(--hive-fg)", fontSize: 14 }}>aoife.murphy</span>
              </div>

              {/* Password */}
              <label
                className="block mb-1.5 font-medium"
                style={{ color: "var(--hive-muted-fg)", fontSize: 11 }}
              >
                Password
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl px-3 mb-1.5"
                style={{
                  height: 46,
                  background: "var(--hive-glass)",
                  border: "1px solid var(--hive-primary)",
                }}
              >
                <Lock size={16} style={{ color: "var(--hive-primary-light)" }} />
                <span
                  className="flex-1 tracking-widest"
                  style={{ color: "var(--hive-fg)", fontSize: 16, lineHeight: 1 }}
                >
                  ••••••••••
                </span>
                <Eye size={16} style={{ color: "var(--hive-muted-fg)" }} />
              </div>

              <div className="flex justify-end mb-3">
                <span style={{ color: "var(--hive-primary-light)", fontSize: 11.5 }}>
                  Forgot password?
                </span>
              </div>

              {/* Sign in button */}
              <button
                className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold"
                style={{
                  height: 48,
                  background:
                    "linear-gradient(135deg, var(--hive-gold-light), var(--hive-gold))",
                  color: "#1a0e00",
                  fontSize: 15,
                }}
              >
                Sign in securely
                <ChevronRight size={18} />
              </button>

              {/* Biometric */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: "var(--hive-glass)",
                    border: "1px solid var(--hive-glass-border)",
                  }}
                >
                  <Fingerprint size={16} style={{ color: "var(--hive-primary-light)" }} />
                  <span style={{ color: "var(--hive-muted-fg)", fontSize: 11.5 }}>
                    Use Face ID / fingerprint
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Other paths (collapsed) */}
          <div className="mt-3 space-y-2.5">
            <PathCard
              icon={<UserPlus size={20} style={{ color: "var(--hive-primary-light)" }} />}
              iconBg="rgba(79,110,247,0.14)"
              iconBorder="rgba(79,110,247,0.3)"
              title="New patient"
              subtitle="Register & set up your profile"
            />
            <PathCard
              icon={<Compass size={20} style={{ color: "var(--hive-muted-fg)" }} />}
              iconBg="var(--hive-glass)"
              iconBorder="var(--hive-glass-border)"
              title="Explore as guest"
              subtitle="Demo patient · no account needed"
            />
            <PathCard
              icon={<Siren size={20} style={{ color: "var(--hive-emergency)" }} />}
              iconBg="var(--hive-emergency-bg)"
              iconBorder="var(--hive-emergency-border)"
              title="Emergency access"
              subtitle="Open health card without login"
              danger
            />
          </div>

          {/* Trust footer */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} style={{ color: "var(--hive-gold-light)" }} />
              <span style={{ color: "var(--hive-muted-fg)", fontSize: 10.5, letterSpacing: "0.03em" }}>
                GDPR Compliant · HSE Approved Framework
              </span>
            </div>
            <p
              className="text-center"
              style={{ color: "#4a4f70", fontSize: 9.5, lineHeight: 1.5, maxWidth: 270 }}
            >
              Clinical-grade triage · Emergency health card · Telemedicine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PathCard({
  icon,
  iconBg,
  iconBorder,
  title,
  subtitle,
  danger = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  title: string;
  subtitle: string;
  danger?: boolean;
}) {
  return (
    <button
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
      style={{
        background: "var(--hive-card)",
        border: `1px solid ${danger ? "var(--hive-emergency-border)" : "var(--hive-border)"}`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 42, height: 42, background: iconBg, border: `1px solid ${iconBorder}` }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <span
          className="font-semibold"
          style={{ color: danger ? "var(--hive-emergency)" : "var(--hive-fg)", fontSize: 15 }}
        >
          {title}
        </span>
        <p style={{ color: "var(--hive-muted-fg)", fontSize: 11.5 }}>{subtitle}</p>
      </div>
      <ChevronRight size={18} style={{ color: "var(--hive-muted-fg)" }} />
    </button>
  );
}
