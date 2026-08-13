import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import { formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import AdminLayout from '../admin-layout';

const ROLE_FILTERS = ['ALL', 'CUSTOMER', 'PARTNER', 'ADMIN'] as const;

const roleColor: Record<string, string> = {
  ADMIN:    'text-purple-700 bg-purple-50 border-purple-200',
  PARTNER:  'text-blue-700 bg-blue-50 border-blue-200',
  CUSTOMER: 'text-green-700 bg-green-50 border-green-200',
};

export default function AdminUsersPage() {
  const [role, setRole] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', role, page],
    queryFn: () => adminApi.getUsers({ role: role === 'ALL' ? undefined : role, page, limit: 20 }),
    staleTime: 30_000,
  });

  const result = data?.data;
  const users: any[] = result?.data ?? [];
  const meta = result ? { total: result.total, totalPages: result.totalPages } : null;

  return (
    <AdminLayout title="Users">
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {ROLE_FILTERS.map(r => (
          <button
            key={r}
            onClick={() => { setRole(r); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              role === r
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {r}
          </button>
        ))}
        {meta && (
          <span className="ml-auto text-sm text-gray-400 self-center">{meta.total} users</span>
        )}
      </div>

      {isError && <ErrorBanner message={getApiError(error)} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Verified</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Bookings</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-full ${roleColor[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.emailVerified
                        ? <span className="text-green-600 font-medium">✓ Yes</span>
                        : <span className="text-gray-400">No</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u._count?.bookings ?? 0}</td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {meta.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
