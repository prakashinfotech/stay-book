import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface Props { children: React.ReactNode; title: string }

const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: '📊' },
  { to: '/admin/approvals',  label: 'Approvals',  icon: '✓' },
  { to: '/admin/kyc',        label: 'KYC',        icon: '📄' },
  { to: '/admin/users',      label: 'Users',      icon: '👥' },
  { to: '/admin/properties', label: 'Properties', icon: '🏨' },
  { to: '/admin/bookings',   label: 'Bookings',   icon: '📋' },
  { to: '/admin/audit-log',  label: 'Audit Log',  icon: '📝' },
];

export default function AdminLayout({ children, title }: Props) {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { clear(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#f2f6fa] flex">
      <aside className="w-56 bg-[#1a1a2e] flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-white font-bold text-lg leading-tight">StayBook</p>
          <p className="text-purple-300 text-xs mt-0.5">Admin Portal</p>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-purple-200 text-xs truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left text-xs text-purple-300 hover:text-white transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-sm font-bold">
              {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {user?.firstName ?? user?.email}
            </span>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
