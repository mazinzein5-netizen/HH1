import './_group.css';
import {
  Hexagon,
  Fingerprint,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  Eye,
  Siren,
  Droplet,
  AlertTriangle,
  HeartPulse,
  QrCode,
  KeyRound,
  ChevronRight,
} from 'lucide-react';

export function EmergencyEntry() {
  return (
    <div
      className="hive-scope min-h-screen w-full flex items-center justify-center font-sans"
      style={{ backgroundColor: 'var(--hive-bg)' }}
    >
      <style>{`
        @keyframes hive-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,71,87,0.45); }
          70% { box-shadow: 0 0 0 12px rgba(255,71,87,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,71,87,0); }
        }
        .hive-scope .emergency-pulse { animation: hive-pulse-ring 2.2s ease-out infinite; }
      `}</style>

      {/* Phone frame */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 380,
          height: 760,
          backgroundColor: 'var(--hive-bg)',
          color: 'var(--hive-fg)',
        }}
      >
        {/* Honeycomb background texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.5,
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='96' viewBox='0 0 56 96'><g fill='none' stroke='%23C9860A' stroke-width='1' stroke-opacity='0.09'><path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/><path d='M28 32 L56 48 L56 80 L28 96 L0 80 L0 48 Z'/></g></svg>\")",
            backgroundSize: '56px 96px',
          }}
        />
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,110,247,0.18), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-8 -right-16 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,71,87,0.16), transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full px-6 pt-9 pb-5 overflow-hidden">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 44, height: 44 }}
            >
              <Hexagon
                className="absolute"
                style={{ width: 44, height: 44, color: 'var(--hive-gold)' }}
                strokeWidth={1.5}
              />
              <Hexagon
                className="absolute"
                style={{ width: 26, height: 26, color: 'var(--hive-gold-light)', fill: 'var(--hive-glass-gold)' }}
                strokeWidth={1.5}
              />
              <HeartPulse style={{ width: 15, height: 15, color: 'var(--hive-gold-bright)' }} />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-bold tracking-tight">Health Hive</span>
              </div>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: 'var(--hive-muted-fg)' }}
              >
                by IbnCeena
              </span>
            </div>
            <span
              className="ml-auto text-[9px] font-semibold px-2 py-1 rounded-full"
              style={{
                color: 'var(--hive-gold-light)',
                backgroundColor: 'var(--hive-glass-gold)',
                border: '1px solid var(--hive-glass-gold-border)',
              }}
            >
              TRIAGE POINT
            </span>
          </div>

          <p className="mt-4 text-[13px] font-semibold" style={{ color: 'var(--hive-fg)' }}>
            Secure Patient Access Portal
          </p>
          <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: 'var(--hive-muted-fg)' }}>
            Clinical-grade triage · Emergency health card · Telemedicine
          </p>

          {/* ============ ZONE 1: Secure Sign In ============ */}
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              backgroundColor: 'var(--hive-card)',
              border: '1px solid var(--hive-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lock style={{ width: 13, height: 13, color: 'var(--hive-primary-light)' }} />
              <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'var(--hive-fg)' }}>
                Patient Sign In
              </span>
            </div>

            {/* Username field */}
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 h-11 mb-2.5"
              style={{ backgroundColor: 'var(--hive-bg)', border: '1px solid var(--hive-border)' }}
            >
              <User style={{ width: 15, height: 15, color: 'var(--hive-muted-fg)' }} />
              <span className="text-[12.5px]" style={{ color: 'var(--hive-fg)' }}>
                aoife.murphy
              </span>
            </div>

            {/* Password field */}
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 h-11 mb-3"
              style={{ backgroundColor: 'var(--hive-bg)', border: '1px solid var(--hive-border)' }}
            >
              <KeyRound style={{ width: 15, height: 15, color: 'var(--hive-muted-fg)' }} />
              <span className="text-[13px] tracking-[0.25em]" style={{ color: 'var(--hive-fg)' }}>
                ••••••••
              </span>
              <Eye className="ml-auto" style={{ width: 15, height: 15, color: 'var(--hive-muted-fg)' }} />
            </div>

            {/* Sign in row + biometric */}
            <div className="flex items-center gap-2.5">
              <button
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold"
                style={{ backgroundColor: 'var(--hive-primary)', color: '#fff' }}
              >
                Sign In
                <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
              <button
                className="flex items-center justify-center h-11 w-11 rounded-xl"
                style={{
                  backgroundColor: 'var(--hive-glass)',
                  border: '1px solid var(--hive-glass-border)',
                }}
              >
                <Fingerprint style={{ width: 20, height: 20, color: 'var(--hive-primary-light)' }} />
              </button>
            </div>

            {/* New patient */}
            <div className="flex items-center justify-between mt-3">
              <button className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--hive-gold-light)' }}>
                <UserPlus style={{ width: 13, height: 13 }} />
                New patient? Register
              </button>
              <button className="text-[11px]" style={{ color: 'var(--hive-muted-fg)' }}>
                Forgot?
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hive-border)' }} />
            <span className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'var(--hive-muted-fg)' }}>
              OR IN AN EMERGENCY
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--hive-border)' }} />
          </div>

          {/* ============ ZONE 2: Emergency Access (expanded state) ============ */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--hive-emergency-bg)',
              border: '1.5px solid var(--hive-emergency-border)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className="emergency-pulse flex items-center justify-center rounded-full"
                style={{ width: 26, height: 26, backgroundColor: 'var(--hive-emergency)' }}
              >
                <Siren style={{ width: 15, height: 15, color: '#fff' }} />
              </span>
              <div className="leading-tight">
                <span className="text-[12px] font-bold" style={{ color: '#ffb3bb' }}>
                  Emergency Access
                </span>
                <p className="text-[9.5px]" style={{ color: 'rgba(255,179,187,0.7)' }}>
                  No login needed · Responder / Carer
                </p>
              </div>
            </div>

            {/* Emergency health card */}
            <div
              className="rounded-xl p-3 flex gap-3"
              style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid var(--hive-emergency-border)' }}
            >
              {/* Left: QR + PIN */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 58, height: 58, backgroundColor: '#fff' }}
                >
                  <QrCode style={{ width: 46, height: 46, color: '#0b0b14' }} />
                </div>
                <div className="text-center">
                  <span className="text-[8px] font-medium" style={{ color: 'rgba(255,179,187,0.7)' }}>
                    ACCESS PIN
                  </span>
                  <div className="text-[13px] font-bold tracking-[0.15em]" style={{ color: '#fff' }}>
                    4 7 9 2
                  </div>
                </div>
              </div>

              {/* Right: critical info */}
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-bold" style={{ color: '#fff' }}>
                    Aoife Murphy
                  </span>
                  <span className="text-[8.5px]" style={{ color: 'rgba(255,179,187,0.7)' }}>
                    Age 34
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Droplet style={{ width: 12, height: 12, color: 'var(--hive-emergency)' }} />
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Blood type
                  </span>
                  <span
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--hive-emergency)', color: '#fff' }}
                  >
                    O−
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <AlertTriangle style={{ width: 12, height: 12, color: 'var(--hive-gold-bright)', marginTop: 1 }} />
                  <span className="text-[9.5px] leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Allergies: <span className="font-semibold">Penicillin, Peanuts</span>
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <HeartPulse style={{ width: 12, height: 12, color: 'var(--hive-emergency)', marginTop: 1 }} />
                  <span className="text-[9.5px] leading-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Conditions: <span className="font-semibold">Type 1 Diabetes, Asthma</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              className="w-full mt-3 flex items-center justify-center gap-2 h-10 rounded-xl text-[12px] font-bold"
              style={{ backgroundColor: 'var(--hive-emergency)', color: '#fff' }}
            >
              Open Full Emergency Card
              <ChevronRight style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Guest / demo access */}
          <button
            className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[12px] font-medium"
            style={{
              backgroundColor: 'var(--hive-glass)',
              border: '1px solid var(--hive-glass-border)',
              color: 'var(--hive-fg)',
            }}
          >
            <Eye style={{ width: 14, height: 14, color: 'var(--hive-muted-fg)' }} />
            Continue as Guest — Demo Patient
          </button>

          {/* Trust / compliance signal */}
          <div className="mt-auto pt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck style={{ width: 12, height: 12, color: 'var(--hive-gold-light)' }} />
            <span className="text-[9.5px] font-medium" style={{ color: 'var(--hive-muted-fg)' }}>
              GDPR Compliant · HSE Approved Framework
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
