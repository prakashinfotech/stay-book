import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api/admin.api';
import { getApiError } from '../../../utils/error';
import { useModal } from '../../../hooks/useModal';
import NotificationModal from '../../../components/ui/NotificationModal';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Button from '../../../components/ui/Button';
import AdminLayout from '../admin-layout';

export default function AdminApprovalsPage() {
  const [search, setSearch] = useState('');
  const { modal, show: showModal, close: closeModal } = useModal();
  const queryClient = useQueryClient();

  const approvalQ = useQuery({
    queryKey: ['admin-pending-properties', search],
    queryFn: () => adminApi.getPendingProperties({ q: search, page: 1, limit: 50 }),
    staleTime: 30_000,
  });

  const approveMut = useMutation({
    mutationFn: (propertyId: string) => adminApi.approveProperty(propertyId),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Property approved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => showModal({ type: 'error', title: 'Error', message: getApiError(error) }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ propertyId, reason }: { propertyId: string; reason: string }) =>
      adminApi.rejectProperty(propertyId, reason),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Property rejected successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => showModal({ type: 'error', title: 'Error', message: getApiError(error) }),
  });

  const properties = approvalQ.data?.data?.data ?? [];

  return (
    <AdminLayout title="Property Approvals">
      {approvalQ.isError && <ErrorBanner message={getApiError(approvalQ.error)} />}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by property name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        />
      </div>

      {/* Properties Grid */}
      {approvalQ.isLoading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No pending property approvals</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map((prop: any) => (
            <div key={prop.id} className="bg-white rounded-lg border border-gray-200 p-6 flex gap-6">
              {/* Thumbnail */}
              {prop.images?.[0]?.url && (
                <img
                  src={prop.images[0].url}
                  alt={prop.name}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800">{prop.name}</h3>
                <p className="text-sm text-gray-600">
                  {prop.city} · {prop.category}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Owner: {prop.owner.firstName} {prop.owner.lastName} ({prop.owner.email})
                </p>
                <p className="text-xs text-gray-500">
                  {prop._count.roomTypes} rooms · {prop._count.bookings} bookings
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => approveMut.mutate(prop.id)}
                  loading={approveMut.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve
                </Button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason:');
                    if (reason) rejectMut.mutate({ propertyId: prop.id, reason });
                  }}
                  disabled={rejectMut.isPending}
                  className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal modal={modal} onClose={closeModal} />
    </AdminLayout>
  );
}
