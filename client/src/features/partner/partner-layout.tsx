import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Wallet, PlusCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import ThemeToggle from '../../components/theme/theme-toggle';

interface Props {
  children: React.ReactNode;
  title: string;
  backTo?: string;
  backLabel?: string;
}

const NAV = [
  { to: '/partner/dashboard',  label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/partner/bookings',   label: 'Bookings',     Icon: ClipboardList },
  { to: '/partner/earnings',   label: 'Earnings',     Icon: Wallet },
  { to: '/partner/onboarding', label: 'Add Property', Icon: PlusCircle },
];

export default function PartnerLayout({ children, title, backTo, backLabel = 'Back' }: Props) {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { clear(); navigate('/login'); };

  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 relative flex flex-col text-white overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 [background-image:linear-gradient(160deg,hsl(var(--color-primary-700))_0%,hsl(var(--color-primary-500))_70%,hsl(var(--color-accent-500))_140%)]" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />

        <div className="relative z-10 px-5 py-5 border-b border-white/10">
          <p className="font-display font-extrabold text-xl leading-tight">StayBook</p>
          <p className="text-white/70 text-xs mt-0.5 uppercase tracking-widest">Partner Portal</p>
        </div>

        <nav className="relative z-10 flex-1 py-4 space-y-1 px-2">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-card backdrop-blur-md'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="relative z-10 px-4 py-4 border-t border-white/10 space-y-3">
          <div>
            <p className="text-white/70 text-[10px] uppercase tracking-widest mb-0.5">Signed in</p>
            <p className="text-white text-xs font-semibold truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors btn-press"
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-surface/80 border-b border-line/60 px-8 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-4 min-w-0">
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-600 font-semibold transition-colors"
              >
                <ArrowLeft size={14} /> {backLabel}
              </Link>
            )}
            <h1 className="font-display text-xl font-bold text-ink truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 bg-surface-elev border border-line rounded-full pl-1 pr-3 py-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-glow [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]">
                {initial}
              </div>
              <span className="text-sm text-ink font-semibold">
                {user?.firstName ?? user?.email}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
