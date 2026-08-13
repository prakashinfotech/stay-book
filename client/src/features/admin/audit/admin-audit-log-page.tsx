import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import AdminLayout from '../admin-layout';

const ENTITY_TYPES = ['ALL', 'PROPERTY', 'USER', 'BOOKING', 'KYC'] as const;

export default function AdminAuditLogPage() {
  const [filter, setFilter] = useState<typeof ENTITY_TYPES[number]>('ALL');
  const [page, setPage] = useState(1);

  const logsQ = useQuery({
    queryKey: ['admin-audit-logs', filter, page],
    queryFn: () => adminApi.getAuditLogs({
      entityType: filter === 'ALL' ? undefined : filter,
      page,
      limit: 50,
    }),
    staleTime: 30_000,
  });

  const logs = logsQ.data?.data?.data ?? [];
  const total = logsQ.data?.data?.total ?? 0;
  const totalPages = logsQ.data?.data?.totalPages ?? 1;

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE')) return 'text-emerald-600 bg-emerald-50';
    if (action.includes('REJECT')) return 'text-red-600 bg-red-50';
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <AdminLayout title="Audit Log">
      {logsQ.isError && <ErrorBanner message={getApiError(logsQ.error)} />}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {ENTITY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => { setFilter(t); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === t
                ? 'bg-[#003580] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {logsQ.isLoading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No audit log entries</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-200">
                  <th className="px-6 py-3 font-medium text-gray-500">Timestamp</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Admin</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Action</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Entity</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Entity ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {log.admin.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.entityType}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {log.entityId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {log.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
