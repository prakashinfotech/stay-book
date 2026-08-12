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

const TABS = ['KYC_PENDING', 'KYC_APPROVED', 'KYC_REJECTED'] as const;

export default function AdminKycPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('KYC_PENDING');
  const [search, setSearch] = useState('');
  const { modal, show: showModal, close: closeModal } = useModal();
  const queryClient = useQueryClient();

  const kycQ = useQuery({
    queryKey: ['admin-kyc', tab, search],
    queryFn: () => adminApi.getAllKyc({ kycStatus: tab, q: search, page: 1, limit: 50 }),
    staleTime: 30_000,
  });

  const approveMut = useMutation({
    mutationFn: (kycId: string) => adminApi.approveKyc(kycId),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'KYC approved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => showModal({ type: 'error', title: 'Error', message: getApiError(error) }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ kycId, reason }: { kycId: string; reason: string }) =>
      adminApi.rejectKyc(kycId, reason),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'KYC rejected successfully!' });
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => showModal({ type: 'error', title: 'Error', message: getApiError(error) }),
  });

  const kycs = kycQ.data?.data?.data ?? [];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'KYC_APPROVED': return 'Approved';
      case 'KYC_REJECTED': return 'Rejected';
      default: return 'Pending';
    }
  };

  return (
    <AdminLayout title="KYC Management">
      {kycQ.isError && <ErrorBanner message={getApiError(kycQ.error)} />}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              tab === t
                ? 'border-[#003580] text-[#003580]'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {getStatusLabel(t)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by partner name or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003580]/20"
        />
      </div>

      {/* KYC List */}
      {kycQ.isLoading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : kycs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No KYC submissions in this status</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="px-6 py-3 font-medium text-gray-500">Partner</th>
                <th className="px-6 py-3 font-medium text-gray-500">Property</th>
                <th className="px-6 py-3 font-medium text-gray-500">Entity Type</th>
                <th className="px-6 py-3 font-medium text-gray-500">Submitted</th>
                {tab === 'KYC_PENDING' && <th className="px-6 py-3 font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {kycs.map((kyc: any) => (
                <tr key={kyc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">
                        {kyc.firstName} {kyc.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{kyc.property.owner.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{kyc.property.name}</td>
                  <td className="px-6 py-4 capitalize text-gray-600">{kyc.entityType}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(kyc.createdAt).toLocaleDateString()}</td>
                  {tab === 'KYC_PENDING' && (
                    <td className="px-6 py-4 flex gap-2">
                      <Button
                        onClick={() => approveMut.mutate(kyc.id)}
                        loading={approveMut.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1"
                      >
                        Approve
                      </Button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) rejectMut.mutate({ kycId: kyc.id, reason });
                        }}
                        disabled={rejectMut.isPending}
                        className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal modal={modal} onClose={closeModal} />
    </AdminLayout>
  );
}
