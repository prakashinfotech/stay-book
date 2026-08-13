import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import AdminLayout from '../admin-layout';

function StatCard({
  label,
  value,
  sub,
  color,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

export default function AdminDashboardPage() {
  const statsQ = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats, staleTime: 60_000 });

  const stats = statsQ.data?.data;
  const recent: any[] = stats?.recentBookings ?? [];

  return (
    <AdminLayout title="Dashboard">
      {statsQ.isError && <ErrorBanner message={getApiError(statsQ.error)} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsQ.isLoading ? (
          <div className="col-span-4 py-8 flex justify-center"><Spinner /></div>
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              color="text-[#1a1a2e]"
              href="/admin/users"
            />
            <StatCard
              label="Properties"
              value={stats?.totalProperties ?? 0}
              sub={`${stats?.activeProperties ?? 0} active`}
              color="text-[#003580]"
              href="/admin/properties"
            />
            <StatCard
              label="Total Bookings"
              value={stats?.totalBookings ?? 0}
              sub={`${stats?.confirmedBookings ?? 0} confirmed`}
              color="text-emerald-600"
              href="/admin/bookings"
            />
            <StatCard
              label="Platform Revenue"
              value={formatPrice(stats?.revenueLifetime ?? 0)}
              sub={`${formatPrice(stats?.revenueThisMonth ?? 0)} this month`}
              color="text-orange-500"
              href="/admin/bookings"
            />
            <StatCard
              label="Pending Approvals"
              value={stats?.pendingPropertyCount ?? 0}
              color="text-amber-600"
              href="/admin/approvals"
            />
            <StatCard
              label="KYC Queue"
              value={stats?.pendingKycCount ?? 0}
              color="text-purple-600"
              href="/admin/kyc"
            />
          </>
        )}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Recent Bookings</h2>
          <Link
            to="/admin/bookings"
            className="text-sm text-[#003580] font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {statsQ.isLoading && (
          <div className="py-10 flex justify-center"><Spinner /></div>
        )}

        {!statsQ.isLoading && recent.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No bookings yet</p>
        )}

        {recent.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Confirmation</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Guest</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Property</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Check-in</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{b.confirmationNumber}</td>
                    <td className="px-6 py-4 text-gray-800">{b.guestName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {b.property.name}
                      <span className="text-gray-400 ml-1">· {b.roomType.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(b.checkin)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{formatPrice(Number(b.totalPrice))}</td>
                    <td className="px-6 py-4"><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[
          { to: '/admin/approvals',  label: 'Property Approvals', desc: 'Review pending property submissions', icon: '✓' },
          { to: '/admin/kyc',        label: 'KYC Review',         desc: 'Manage partner legal documents',     icon: '📄' },
          { to: '/admin/users',      label: 'Manage Users',       desc: 'View and filter all registered users', icon: '👥' },
          { to: '/admin/properties', label: 'Manage Properties',  desc: 'Review listings and update status',  icon: '🏨' },
          { to: '/admin/bookings',   label: 'Manage Bookings',    desc: 'View all bookings platform-wide',   icon: '📋' },
          { to: '/admin/audit-log',  label: 'Audit Log',          desc: 'View all admin actions',            icon: '📊' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#003580]/20 transition-all group"
          >
            <p className="text-2xl mb-2">{item.icon}</p>
            <p className="font-semibold text-gray-800 group-hover:text-[#003580] transition-colors">{item.label}</p>
            <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
