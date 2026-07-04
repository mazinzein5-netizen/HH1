import './_group.css';
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  BadgeCheck,
  User,
  KeyRound,
  Eye,
  ChevronRight,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Server,
} from 'lucide-react';

function HiveMark() {
  return (
    <div className="relative" style={{ width: 58, height: 58 }}>
      <svg viewBox="0 0 100 100" width="58" height="58" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="tfp-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c518" />
            <stop offset="55%" stopColor="#d4a017" />
            <stop offset="100%" stopColor="#8b5e00" />
          </linearGradient>
        </defs>
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          fill="none"
          stroke="url(#tfp-gold)"
          strokeWidth="4"
          opacity="0.9"
        />
        <polygon
          points="50,22 74,36 74,64 50,78 26,64 26,36"
          fill="rgba(201,134,10,0.14)"
          stroke="url(#tfp-gold)"
          strokeWidth="3"
        />
        <g>
          <ShieldCheck
            style={{ position: 'absolute', left: 17, top: 17, width: 24, height: 24 }}
            color="#f5c518"
            strokeWidth={2.2}
          />
        </g>
      </svg>
    </div>
  );
}

export function TrustFirstPortal() {
  return (
    <div
      className="hive-scope min-h-screen w-full font-sans antialiased"
      style={{ background: 'var(--hive-bg)', color: 'var(--hive-fg)' }}
    >
      <style>{`
        .hive-scope .tfp-honeycomb {
          background-image:
            radial-gradient(circle at 20% 8%, rgba(79,110,247,0.10), transparent 42%),
            radial-gradient(circle at 85% 0%, rgba(201,134,10,0.12), transparent 40%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.035' stroke-width='1.4'%3E%3Cpath d='M28 0 L56 16 L56 50 L28 66 L0 50 L0 16 Z'/%3E%3Cpath d='M28 66 L56 82 L56 116 L28 132 L0 116 L0 82 Z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .hive-scope .tfp-shine {
          background: linear-gradient(90deg, transparent, rgba(245,197,24,0.5), transparent);
        }
      `}</style>

      <div className="tfp-honeycomb min-h-screen flex flex-col px-5 pt-6 pb-6">
        {/* Secure connection ribbon */}
        <div
          className="flex items-center justify-center gap-2 mx-auto rounded-full px-3.5 py-1.5 mb-5"
          style={{
            background: 'var(--hive-glass-gold)',
            border: '1px solid var(--hive-glass-gold-border)',
          }}
        >
          <Lock size={12} color="var(--hive-gold-light)" strokeWidth={2.6} />
          <span
            className="text-[10.5px] font-semibold tracking-wide"
            style={{ color: 'var(--hive-gold-light)' }}
          >
            SECURE CONNECTION · TLS 1.3 ENCRYPTED
          </span>
        </div>

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-1">
          <HiveMark />
          <div className="leading-tight">
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-[22px] font-extrabold tracking-tight">Health Hive</h1>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: 'var(--hive-gold-light)',
                  background: 'var(--hive-gold-bg)',
                  border: '1px solid var(--hive-gold-border)',
                }}
              >
                IbnCeena
              </span>
            </div>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--hive-fg)' }}>
              Secure Patient Access Portal
            </p>
          </div>
        </div>
        <p className="text-[10.5px] mb-4 ml-[70px]" style={{ color: 'var(--hive-muted-fg)' }}>
          Clinical-grade triage · Emergency health card · Telemedicine
        </p>

        {/* Reassurance banner */}
        <div
          className="rounded-2xl p-3.5 mb-4 flex items-start gap-3"
          style={{
            background: 'linear-gradient(145deg, rgba(79,110,247,0.10), rgba(255,255,255,0.03))',
            border: '1px solid var(--hive-glass-border)',
          }}
        >
          <div
            className="shrink-0 rounded-xl flex items-center justify-center"
            style={{
              width: 38,
              height: 38,
              background: 'rgba(79,110,247,0.18)',
              border: '1px solid rgba(79,110,247,0.35)',
            }}
          >
            <ShieldCheck size={20} color="var(--hive-primary-light)" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold leading-snug">
              Your health records are protected
            </p>
            <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--hive-muted-fg)' }}>
              End-to-end encrypted. Only you and your care team can access your clinical data.
            </p>
          </div>
        </div>

        {/* Credential card */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'var(--hive-card)',
            border: '1px solid var(--hive-border)',
            boxShadow: '0 16px 40px -20px rgba(0,0,0,0.8)',
          }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[14px] font-bold">Sign in to your account</h2>
            <span
              className="flex items-center gap-1 text-[9.5px] font-semibold px-2 py-1 rounded-full"
              style={{
                color: '#7CE7A8',
                background: 'rgba(46,213,115,0.12)',
                border: '1px solid rgba(46,213,115,0.3)',
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: '#2ed573' }}
              />
              VERIFIED PORTAL
            </span>
          </div>

          {/* Username */}
          <label className="block text-[10.5px] font-medium mb-1.5" style={{ color: 'var(--hive-muted-fg)' }}>
            Patient username or IHI number
          </label>
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 mb-3"
            style={{
              height: 46,
              background: 'var(--hive-bg)',
              border: '1px solid var(--hive-border)',
            }}
          >
            <User size={17} color="var(--hive-muted-fg)" />
            <span className="text-[13px]" style={{ color: 'var(--hive-fg)' }}>
              aoife.brennan
            </span>
          </div>

          {/* Password */}
          <label className="block text-[10.5px] font-medium mb-1.5" style={{ color: 'var(--hive-muted-fg)' }}>
            Password
          </label>
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 mb-2"
            style={{
              height: 46,
              background: 'var(--hive-bg)',
              border: '1px solid var(--hive-primary)',
              boxShadow: '0 0 0 3px rgba(79,110,247,0.15)',
            }}
          >
            <KeyRound size={17} color="var(--hive-primary-light)" />
            <span className="text-[15px] tracking-[0.25em] flex-1" style={{ color: 'var(--hive-fg)' }}>
              ••••••••
            </span>
            <Eye size={16} color="var(--hive-muted-fg)" />
          </div>

          <div className="flex items-center justify-between mb-3.5">
            <label className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--hive-muted-fg)' }}>
              <span
                className="inline-flex items-center justify-center rounded"
                style={{
                  width: 15,
                  height: 15,
                  background: 'var(--hive-primary)',
                  border: '1px solid var(--hive-primary)',
                }}
              >
                <CheckCircle2 size={11} color="#fff" strokeWidth={0} fill="#fff" />
              </span>
              Trust this device
            </label>
            <span className="text-[10.5px] font-medium" style={{ color: 'var(--hive-primary-light)' }}>
              Forgot password?
            </span>
          </div>

          {/* Sign in button */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] mb-2.5"
            style={{
              height: 48,
              background: 'linear-gradient(180deg, var(--hive-primary-light), var(--hive-primary))',
              color: '#fff',
              boxShadow: '0 10px 24px -10px rgba(79,110,247,0.7)',
            }}
          >
            <Lock size={16} strokeWidth={2.4} />
            Sign in securely
            <ArrowRight size={16} strokeWidth={2.4} />
          </button>

          {/* Biometric alt */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl font-medium text-[12.5px]"
            style={{
              height: 44,
              background: 'var(--hive-glass)',
              border: '1px solid var(--hive-glass-border)',
              color: 'var(--hive-fg)',
            }}
          >
            <Fingerprint size={18} color="var(--hive-gold-light)" />
            Use Face ID / biometric login
          </button>
        </div>

        {/* New patient + Guest */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <button
            className="flex flex-col items-start gap-1 rounded-xl p-3 text-left"
            style={{
              background: 'var(--hive-card)',
              border: '1px solid var(--hive-border)',
            }}
          >
            <UserPlus size={17} color="var(--hive-gold-light)" />
            <span className="text-[12px] font-semibold">New patient</span>
            <span className="text-[9.5px] leading-tight" style={{ color: 'var(--hive-muted-fg)' }}>
              Register securely
            </span>
          </button>
          <button
            className="flex flex-col items-start gap-1 rounded-xl p-3 text-left"
            style={{
              background: 'var(--hive-card)',
              border: '1px solid var(--hive-border)',
            }}
          >
            <ChevronRight size={17} color="var(--hive-muted-fg)" />
            <span className="text-[12px] font-semibold">Guest access</span>
            <span className="text-[9.5px] leading-tight" style={{ color: 'var(--hive-muted-fg)' }}>
              Demo patient
            </span>
          </button>
        </div>

        {/* Trust / compliance footer */}
        <div className="mt-auto pt-5">
          <div
            className="rounded-xl p-3"
            style={{
              background: 'var(--hive-glass)',
              border: '1px solid var(--hive-glass-border)',
            }}
          >
            <div className="flex items-center justify-center gap-4 mb-2.5">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={15} color="var(--hive-gold-light)" />
                <span className="text-[10px] font-semibold">GDPR Compliant</span>
              </div>
              <div className="h-3 w-px" style={{ background: 'var(--hive-border)' }} />
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} color="var(--hive-primary-light)" />
                <span className="text-[10px] font-semibold">HSE Approved Framework</span>
              </div>
            </div>
            <div
              className="flex items-center justify-center gap-1.5 text-[9px]"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              <Server size={11} />
              Data hosted in EU · ISO 27001 certified infrastructure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
