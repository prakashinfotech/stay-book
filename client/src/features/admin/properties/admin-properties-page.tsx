import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import { formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import AdminLayout from '../admin-layout';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'DRAFT', 'PAUSED'] as const;

const statusColor: Record<string, string> = {
  ACTIVE: 'text-green-700 bg-green-50 border-green-200',
  DRAFT:  'text-yellow-700 bg-yellow-50 border-yellow-200',
  PAUSED: 'text-gray-600 bg-gray-100 border-gray-200',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['PAUSED'],
  DRAFT:  ['ACTIVE'],
  PAUSED: ['ACTIVE'],
};

export default function AdminPropertiesPage() {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-properties', status, page],
    queryFn: () => adminApi.getProperties({ status: status === 'ALL' ? undefined : status, page, limit: 20 }),
    staleTime: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => adminApi.updatePropertyStatus(id, s),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ['admin-properties'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => setActionError(getApiError(e)),
  });

  const result = data?.data;
  const properties: any[] = result?.data ?? [];
  const meta = result ? { total: result.total, totalPages: result.totalPages } : null;

  return (
    <AdminLayout title="Properties">
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              status === s
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
        {meta && (
          <span className="ml-auto text-sm text-gray-400 self-center">{meta.total} properties</span>
        )}
      </div>

      {isError && <ErrorBanner message={getApiError(error)} />}
      {actionError && <ErrorBanner message={actionError} />}

      {isLoading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center text-sm text-gray-400">
          No properties found
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
              {p.images?.[0] ? (
                <img src={p.images[0].url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">🏨</div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.city} · {p.category}</p>
                <p className="text-xs text-gray-400">
                  Owner: {p.owner?.firstName ?? ''} {p.owner?.lastName ?? ''} ({p.owner?.email})
                </p>
                <p className="text-xs text-gray-400">
                  {p._count?.roomTypes ?? 0} room types · {p._count?.bookings ?? 0} bookings · Listed {formatDate(p.createdAt)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-full ${statusColor[p.status] ?? ''}`}>
                  {p.status}
                </span>
                <div className="flex gap-1">
                  {(STATUS_TRANSITIONS[p.status] ?? []).map(next => (
                    <button
                      key={next}
                      onClick={() => updateStatus.mutate({ id: p.id, s: next })}
                      disabled={updateStatus.isPending}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors disabled:opacity-40 ${
                        next === 'ACTIVE'
                          ? 'text-green-700 border-green-200 hover:bg-green-50'
                          : next === 'PAUSED'
                          ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                          : 'text-red-600 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      → {next}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
