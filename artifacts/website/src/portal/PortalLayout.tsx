import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { HiveLogo } from "@/components/HiveLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  clearSession,
  getSession,
  logoutServer,
  statusLabel,
  type PublicAccount,
  type SessionState,
  type AccountStatus,
} from "./lib/store";
import { LogOut, ShieldAlert } from "lucide-react";

function statusBadgeVariant(status: AccountStatus): {
  className: string;
} {
  switch (status) {
    case "demo":
      return { className: "bg-primary/20 text-primary border border-primary/40" };
    case "verification_ongoing":
      return {
        className:
          "bg-amber-500/15 text-amber-400 border border-amber-500/40",
      };
    case "verified":
      return {
        className:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40",
      };
    default:
      return { className: "bg-primary/20 text-primary border border-primary/40" };
  }
}

export function useSession(): SessionState {
  const [session, setSessionState] = useState<SessionState>(() => getSession());
  useEffect(() => {
    const sync = () => setSessionState(getSession());
    window.addEventListener("hive-portal-session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("hive-portal-session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return session;
}

export function useCurrentAccount(): PublicAccount | null {
  return useSession().account;
}

export function PortalLayout({ children }: { children: ReactNode }) {
  const session = useSession();
  const account = session.account;
  const isDemoAnon = session.demo && !account;
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutServer();
    clearSession();
    navigate("/portal");
  };

  const loggedIn = !!session.sessionToken;

  return (
    <div className="dark min-h-[100dvh] bg-[hsl(240,6%,4%)] text-foreground font-sans">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <Link
            href="/portal"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="HIVE Emergency Portal home"
          >
            <HiveLogo size={30} />
            <span className="font-semibold tracking-tight leading-tight">
              HIVE <span className="text-primary">Emergency Portal</span>
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {loggedIn ? (
              <>
                {isDemoAnon ? (
                  <Badge className="bg-primary/20 text-primary border border-primary/40">
                    DEMO ACCESS
                  </Badge>
                ) : account ? (
                  <>
                    <Badge className={statusBadgeVariant(account.status).className}>
                      {statusLabel(account.status)}
                    </Badge>
                    <span className="hidden sm:inline text-sm text-muted-foreground max-w-[160px] truncate">
                      {account.fullName}
                    </span>
                  </>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/portal/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/portal/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-5 py-8 md:py-12">{children}</main>

      <footer className="border-t border-border/60 mt-8">
        <div className="container mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            For life-saving, last-minute clinical situations. Patient-consented, time-limited access only.
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/portal/pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/portal/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/" className="hover:text-primary transition-colors">
              Main site
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * Guard for protected pages. A valid server-issued session token is required.
 * Demo (anonymous) sessions are allowed but restricted to canned demo data by
 * the server.
 */
export function useProtected(): {
  allowed: boolean;
  isDemoAccess: boolean;
  account: PublicAccount | null;
} {
  const session = useSession();
  const allowed = !!session.sessionToken;
  const isDemoAccess = session.demo;
  return { allowed, isDemoAccess, account: session.account };
}
