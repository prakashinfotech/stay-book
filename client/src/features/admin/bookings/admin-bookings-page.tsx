import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import AdminLayout from '../admin-layout';

const STATUS_FILTERS = ['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export default function AdminBookingsPage() {
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-bookings', status, page],
    queryFn: () => adminApi.getBookings({ status: status === 'ALL' ? undefined : status, page, limit: 20 }),
    staleTime: 30_000,
  });

  const result = data?.data;
  const bookings: any[] = result?.data ?? [];
  const meta = result ? { total: result.total, totalPages: result.totalPages } : null;

  return (
    <AdminLayout title="Bookings">
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
          <span className="ml-auto text-sm text-gray-400 self-center">{meta.total} bookings</span>
        )}
      </div>

      {isError && <ErrorBanner message={getApiError(error)} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No bookings found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500">Confirmation</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Guest</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Property</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Room</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Check-in</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Check-out</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Total</th>
                  <th className="px-5 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {b.confirmationNumber}
                    </td>
                    <td className="px-5 py-4 text-gray-800 whitespace-nowrap">{b.guestName}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                      {b.property.name}
                      <span className="text-gray-400 text-xs ml-1">· {b.property.city}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{b.roomType.name}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDate(b.checkin)}</td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDate(b.checkout)}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">
                      {formatPrice(Number(b.totalPrice))}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap"><Badge status={b.status} /></td>
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
