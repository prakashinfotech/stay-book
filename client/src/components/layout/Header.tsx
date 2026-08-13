import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BedDouble, Plane, Hotel, Car, Ticket,
  HelpCircle, ChevronDown, LogOut, Briefcase, ShieldCheck, BookMarked,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import ThemeToggle from '../theme/theme-toggle';

const CATEGORIES = [
  { label: 'Stays',          Icon: BedDouble, to: '/',  active: true  },
  { label: 'Flights',        Icon: Plane,     to: null, active: false },
  { label: 'Flight + Hotel', Icon: Hotel,     to: null, active: false },
  { label: 'Car rental',     Icon: Car,       to: null, active: false },
  { label: 'Attractions',    Icon: Ticket,    to: null, active: false },
];

export default function Header() {
  const { user, accessToken, clear } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try { await authApi.logout(); } catch { /* ignore */ }
    clear();
    navigate('/login');
  };

  const isPartner = user?.role === 'PARTNER';
  const isAdmin   = user?.role === 'ADMIN';
  const isOnStays = location.pathname === '/';

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-surface/75 border-b border-line/60 shadow-soft">
      {/* ── Row 1 — Utility bar ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0.5 shrink-0">
          <span className="font-display font-extrabold text-xl tracking-tight gradient-text">
            StayBook
          </span>
          <span className="text-accent-500 text-xl font-extrabold">.</span>
        </Link>

        {/* Right utility */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:flex" />

          {/* Help */}
          <button
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-ink hover:bg-surface-elev transition-colors btn-press"
            title="Help"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>

          {/* List property / Partner Dashboard */}
          {!isPartner && !isAdmin && (
            <Link
              to={accessToken ? '/partner/dashboard' : '/register'}
              className="hidden md:inline-flex items-center text-ink/80 text-sm font-semibold hover:text-ink hover:bg-surface-elev px-3 py-1.5 rounded-md transition-colors"
            >
              List your property
            </Link>
          )}

          {/* Account */}
          {accessToken ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-surface-elev hover:bg-surface border border-line rounded-xl px-2 py-1.5 transition-colors btn-press"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow">
                  {(user?.firstName?.[0] ?? user?.email?.[0])?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-ink text-xs font-semibold leading-none">
                    {user?.firstName ?? 'Account'}
                  </p>
                  {isPartner && <p className="text-accent-600 text-[10px] mt-0.5 font-semibold">Partner</p>}
                  {isAdmin   && <p className="text-danger text-[10px] mt-0.5 font-semibold">Admin</p>}
                </div>
                <ChevronDown size={14} className="text-muted" />
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-card shadow-lift py-1 z-50 animate-fade-up">
                  <div className="px-4 py-3 border-b border-line/60">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user?.firstName ?? ''} {user?.lastName ?? ''}
                    </p>
                    <p className="text-xs text-muted truncate">{user?.email}</p>
                  </div>

                  {!isPartner && !isAdmin && (
                    <DropItem to="/trips" Icon={BookMarked} label="My Stay Bookings" onClick={() => setOpen(false)} />
                  )}
                  {isPartner && (
                    <DropItem to="/partner/dashboard" Icon={Briefcase} label="Partner Dashboard" onClick={() => setOpen(false)} />
                  )}
                  {isAdmin && (
                    <DropItem to="/admin/dashboard" Icon={ShieldCheck} label="Admin Panel" onClick={() => setOpen(false)} />
                  )}
                  <div className="border-t border-line/60 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors font-medium"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="text-ink text-sm font-semibold hover:bg-surface-elev px-3 py-1.5 rounded-md transition-colors"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="text-white text-sm font-bold px-4 py-1.5 rounded-md shadow-card hover:shadow-glow hover:-translate-y-0.5 transition-all btn-press [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-primary-700))_100%)]"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2 — Category tabs (customer only) ────────────────────── */}
      {!isPartner && !isAdmin && (
        <div className="border-t border-line/40">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(({ label, Icon, to }) => (
              to ? (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-t-md transition-colors shrink-0 ${
                    isOnStays && label === 'Stays'
                      ? 'text-primary-600 border-b-2 border-primary-500'
                      : 'text-muted hover:text-ink border-b-2 border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  title="Coming soon"
                  className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap text-muted/50 cursor-not-allowed shrink-0 border-b-2 border-transparent"
                >
                  <Icon size={16} />
                  {label}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function DropItem({
  to, Icon, label, onClick,
}: {
  to: string;
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-elev transition-colors font-medium"
    >
      <Icon size={16} /> {label}
    </Link>
  );
}
