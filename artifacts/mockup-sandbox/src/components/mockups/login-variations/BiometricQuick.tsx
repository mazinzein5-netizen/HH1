import './_group.css';
import {
  ScanFace,
  Fingerprint,
  Mail,
  MessageSquareText,
  KeyRound,
  ShieldCheck,
  UserPlus,
  UserRound,
  ChevronRight,
  Lock,
} from 'lucide-react';

export function BiometricQuick() {
  return (
    <div
      className="hive-scope min-h-screen w-full flex items-center justify-center"
      style={{ background: 'var(--hive-bg)' }}
    >
      <style>{`
        @keyframes hive-scan-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0; }
        }
        @keyframes hive-scan-line {
          0% { top: 8%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 92%; opacity: 0; }
        }
        @keyframes hive-ring-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes hive-dot-glow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        .hive-scope .hex-tex {
          background-image:
            radial-gradient(circle at 50% 40%, rgba(201,134,10,0.10), transparent 60%),
            url("data:image/svg+xml,%3Csvg width='56' height='96' viewBox='0 0 56 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%232a2a45' stroke-width='1'%3E%3Cpath d='M28 0l24 14v28L28 56 4 42V14z'/%3E%3Cpath d='M28 56l24 14v28M28 56L4 70v28'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>

      {/* Phone frame */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 380,
          height: 760,
          background: 'var(--hive-bg)',
          color: 'var(--hive-fg)',
        }}
      >
        {/* Honeycomb texture backdrop */}
        <div className="hex-tex absolute inset-0 opacity-[0.5] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(79,110,247,0.14), transparent 55%), radial-gradient(90% 60% at 50% 110%, rgba(201,134,10,0.10), transparent 60%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-6 pt-8 pb-6">
          {/* Brand row */}
          <div className="flex items-center gap-3">
            <HiveMark />
            <div className="leading-tight">
              <div className="text-[17px] font-bold tracking-tight">
                Health Hive
              </div>
              <div
                className="text-[11px] font-medium"
                style={{ color: 'var(--hive-gold-light)' }}
              >
                IbnCeena Health Ecosystem
              </div>
            </div>
          </div>

          {/* Welcome-back identity */}
          <div className="mt-8 flex flex-col items-center text-center">
            <p
              className="text-[12px] font-medium uppercase tracking-[0.2em]"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              Welcome back
            </p>

            {/* Biometric hero */}
            <div className="relative mt-6 mb-4 flex items-center justify-center">
              {/* pulse rings */}
              <span
                className="absolute rounded-full"
                style={{
                  width: 168,
                  height: 168,
                  border: '2px solid var(--hive-primary)',
                  animation: 'hive-scan-pulse 2.4s ease-out infinite',
                }}
              />
              <span
                className="absolute rounded-full"
                style={{
                  width: 168,
                  height: 168,
                  border: '2px solid var(--hive-gold)',
                  animation: 'hive-scan-pulse 2.4s ease-out infinite 1.2s',
                }}
              />
              {/* spinning progress ring */}
              <span
                className="absolute rounded-full"
                style={{
                  width: 150,
                  height: 150,
                  background:
                    'conic-gradient(from 0deg, transparent 0deg, var(--hive-primary) 90deg, transparent 200deg)',
                  WebkitMask:
                    'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
                  animation: 'hive-ring-spin 3s linear infinite',
                }}
              />

              {/* Face scan disc */}
              <div
                className="relative flex items-center justify-center rounded-full overflow-hidden"
                style={{
                  width: 134,
                  height: 134,
                  background:
                    'radial-gradient(circle at 50% 35%, rgba(79,110,247,0.28), var(--hive-card))',
                  border: '1px solid var(--hive-glass-border)',
                  boxShadow:
                    '0 0 40px rgba(79,110,247,0.35), inset 0 0 30px rgba(79,110,247,0.15)',
                }}
              >
                {/* scanning line */}
                <span
                  className="absolute left-3 right-3 h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, var(--hive-gold-bright), transparent)',
                    boxShadow: '0 0 10px var(--hive-gold-bright)',
                    animation: 'hive-scan-line 2.4s ease-in-out infinite',
                  }}
                />
                <ScanFace
                  className="relative"
                  style={{ width: 64, height: 64, color: 'var(--hive-primary-light)' }}
                  strokeWidth={1.4}
                />
              </div>
            </div>

            {/* Patient avatar + name */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center rounded-full text-[13px] font-bold"
                style={{
                  width: 34,
                  height: 34,
                  background: 'var(--hive-glass-gold)',
                  border: '1px solid var(--hive-glass-gold-border)',
                  color: 'var(--hive-gold-light)',
                }}
              >
                AC
              </div>
              <div className="text-left leading-tight">
                <div className="text-[15px] font-semibold">Aoife Callaghan</div>
                <div
                  className="text-[11px]"
                  style={{ color: 'var(--hive-muted-fg)' }}
                >
                  Patient ID · HH-4821-IE
                </div>
              </div>
            </div>

            <p
              className="mt-3 text-[12px]"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              Look at your device to sign in with Face ID
            </p>
          </div>

          {/* Primary CTA */}
          <button
            className="mt-6 w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.98]"
            style={{
              background:
                'linear-gradient(135deg, var(--hive-primary), var(--hive-primary-light))',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(79,110,247,0.4)',
            }}
          >
            <ScanFace style={{ width: 20, height: 20 }} strokeWidth={2} />
            Sign in with Face ID
          </button>

          {/* Fingerprint alt */}
          <button
            className="mt-3 w-full flex items-center justify-center gap-2.5 rounded-2xl py-3 text-[14px] font-medium transition-transform active:scale-[0.98]"
            style={{
              background: 'var(--hive-glass)',
              border: '1px solid var(--hive-glass-border)',
              color: 'var(--hive-fg)',
            }}
          >
            <Fingerprint
              style={{ width: 19, height: 19, color: 'var(--hive-gold-light)' }}
              strokeWidth={2}
            />
            Use fingerprint
          </button>

          {/* Passwordless divider */}
          <div className="mt-6 mb-3 flex items-center gap-3">
            <span
              className="h-px flex-1"
              style={{ background: 'var(--hive-border)' }}
            />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              Passwordless
            </span>
            <span
              className="h-px flex-1"
              style={{ background: 'var(--hive-border)' }}
            />
          </div>

          {/* Passwordless quick options */}
          <div className="grid grid-cols-2 gap-3">
            <PasswordlessTile
              icon={<Mail style={{ width: 18, height: 18 }} strokeWidth={2} />}
              label="Email magic link"
              sub="a.c…@mail.ie"
            />
            <PasswordlessTile
              icon={
                <MessageSquareText style={{ width: 18, height: 18 }} strokeWidth={2} />
              }
              label="One-time SMS code"
              sub="+353 ••• 4471"
            />
          </div>

          {/* Fallback + register + guest */}
          <div className="mt-auto pt-5 flex flex-col items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              <KeyRound style={{ width: 14, height: 14 }} strokeWidth={2} />
              Use password instead
            </button>

            <div className="flex items-center gap-2 w-full">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold"
                style={{
                  background: 'var(--hive-glass-gold)',
                  border: '1px solid var(--hive-glass-gold-border)',
                  color: 'var(--hive-gold-light)',
                }}
              >
                <UserPlus style={{ width: 15, height: 15 }} strokeWidth={2} />
                New patient
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--hive-border)',
                  color: 'var(--hive-muted-fg)',
                }}
              >
                <UserRound style={{ width: 15, height: 15 }} strokeWidth={2} />
                Guest demo
                <ChevronRight style={{ width: 13, height: 13 }} strokeWidth={2} />
              </button>
            </div>

            {/* Trust signal */}
            <div
              className="flex items-center gap-1.5 text-[10.5px] font-medium mt-1"
              style={{ color: 'var(--hive-muted-fg)' }}
            >
              <ShieldCheck
                style={{ width: 13, height: 13, color: 'var(--hive-gold)' }}
                strokeWidth={2}
              />
              GDPR Compliant · HSE Approved Framework
            </div>
            <div
              className="flex items-center gap-1 text-[9.5px]"
              style={{ color: 'var(--hive-muted-fg)', opacity: 0.75 }}
            >
              <Lock style={{ width: 10, height: 10 }} strokeWidth={2} />
              Clinical-grade triage · Emergency health card · Telemedicine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordlessTile({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      className="flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
      style={{
        background: 'var(--hive-card)',
        border: '1px solid var(--hive-border)',
      }}
    >
      <span
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 34,
          height: 34,
          background: 'var(--hive-glass)',
          color: 'var(--hive-primary-light)',
          border: '1px solid var(--hive-glass-border)',
        }}
      >
        {icon}
      </span>
      <span className="text-[12.5px] font-semibold leading-tight">{label}</span>
      <span
        className="text-[10.5px]"
        style={{ color: 'var(--hive-muted-fg)' }}
      >
        {sub}
      </span>
    </button>
  );
}

function HiveMark() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 40, height: 40 }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="bq-hex" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--hive-gold-bright)" />
            <stop offset="1" stopColor="var(--hive-gold)" />
          </linearGradient>
        </defs>
        <path
          d="M20 2l15.6 9v18L20 38 4.4 29V11z"
          fill="none"
          stroke="url(#bq-hex)"
          strokeWidth="1.6"
        />
        <path
          d="M20 10l8.7 5v10L20 30l-8.7-5V15z"
          fill="var(--hive-glass-gold)"
          stroke="url(#bq-hex)"
          strokeWidth="1.4"
        />
        <circle cx="20" cy="20" r="3.2" fill="var(--hive-gold-bright)" />
      </svg>
    </div>
  );
}
