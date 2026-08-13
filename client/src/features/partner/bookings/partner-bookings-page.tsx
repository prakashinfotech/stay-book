import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ClipboardList, X } from 'lucide-react';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import { useModal } from '../../../hooks/useModal';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import NotificationModal from '../../../components/ui/NotificationModal';
import Modal from '../../../components/ui/Modal';
import PartnerLayout from '../partner-layout';

type StatusTab = 'ALL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'NO_SHOW',   label: 'No-show' },
];

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-ink text-right ${mono ? 'font-mono text-xs' : 'font-semibold'}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function PartnerBookingsPage() {
  const [tab, setTab]           = useState<StatusTab>('ALL');
  const [selected, setSelected] = useState<any>(null);
  const qc                      = useQueryClient();
  const { modal, show: showModal, close: closeModal } = useModal();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['partner-bookings', tab],
    queryFn: () => partnerApi.getBookings({ status: tab }),
    staleTime: 30_000,
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => partnerApi.markNoShow(id),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Booking marked as no-show' });
      qc.invalidateQueries({ queryKey: ['partner-bookings'] });
      setSelected(null);
    },
    onError: (e) => showModal({ type: 'error', title: 'Error', message: getApiError(e) }),
  });

  const bookings: any[] = data?.data?.data ?? [];
  const total: number   = data?.data?.total ?? 0;

  const isFutureConfirmed = (b: any) =>
    b.status === 'CONFIRMED' && new Date(b.checkin) > new Date();

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <PartnerLayout title="Bookings">
      {/* Pill tabs */}
      <div className="inline-flex gap-1 mb-6 p-1 bg-surface-elev border border-line rounded-full">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-surface text-ink shadow-card'
                : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isError && <ErrorBanner message={getApiError(error)} />}

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="bento-card p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-card border border-line/60 flex items-center justify-center text-primary-600 mb-3">
            <ClipboardList size={28} />
          </div>
          <p className="text-ink font-display font-semibold">No bookings found</p>
          {tab !== 'ALL' && (
            <button onClick={() => setTab('ALL')} className="mt-3 text-sm text-primary-600 hover:underline font-semibold">
              View all bookings
            </button>
          )}
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <div className="px-6 py-3 border-b border-line/60">
            <p className="text-sm text-muted">{total} booking{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/60 text-left bg-surface-elev/60">
                  {['Booking Ref', 'Guest', 'Property', 'Room', 'Check-in', 'Check-out', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="border-b border-line/40 hover:bg-surface-elev/50 cursor-pointer transition-colors"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted">{b.confirmationNumber}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{b.guestName}</td>
                    <td className="px-4 py-3 text-ink/80 max-w-[140px] truncate">{b.property?.name}</td>
                    <td className="px-4 py-3 text-ink/80 max-w-[120px] truncate">{b.roomType?.name}</td>
                    <td className="px-4 py-3 text-ink/80 whitespace-nowrap">{formatDate(b.checkin)}</td>
                    <td className="px-4 py-3 text-ink/80 whitespace-nowrap">{formatDate(b.checkout)}</td>
                    <td className="px-4 py-3 font-display font-bold gradient-text">{formatPrice(Number(b.totalPrice))}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {isFutureConfirmed(b) && (
                        <button
                          onClick={() => { if (confirm('Mark this booking as no-show?')) noShowMutation.mutate(b.id); }}
                          disabled={noShowMutation.isPending}
                          className="text-xs text-danger hover:underline font-semibold"
                        >
                          No-show
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Details" maxWidth="md">
        {selected && (
          <>
            <div className="space-y-3 text-sm">
              <Row label="Ref"       value={selected.confirmationNumber} mono />
              <Row label="Guest"     value={selected.guestName} />
              <Row label="Email"     value={selected.guestEmail} />
              <Row label="Phone"     value={selected.guestPhone} />
              <Row label="Country"   value={selected.guestCountry} />
              <Row label="Property"  value={selected.property?.name} />
              <Row label="Room"      value={selected.roomType?.name} />
              <Row label="Check-in"  value={formatDate(selected.checkin)} />
              <Row label="Check-out" value={formatDate(selected.checkout)} />
              <Row label="Adults"    value={String(selected.adults)} />
              <Row label="Total"     value={formatPrice(Number(selected.totalPrice))} />
              {selected.arrivalTime && <Row label="Arrival" value={selected.arrivalTime} />}
              {selected.specialRequests && (
                <div>
                  <p className="text-muted text-xs mb-1">Special requests</p>
                  <p className="text-ink bg-surface-elev rounded-md p-3 text-xs border border-line/60">{selected.specialRequests}</p>
                </div>
              )}
              {selected.cancellationReason && (
                <div>
                  <p className="text-muted text-xs mb-1">Cancellation reason</p>
                  <p className="text-ink text-xs">{selected.cancellationReason}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <p className="text-muted">Status</p>
                <Badge status={selected.status} />
              </div>
            </div>
            {isFutureConfirmed(selected) && (
              <button
                onClick={() => { if (confirm('Mark as no-show?')) noShowMutation.mutate(selected.id); }}
                disabled={noShowMutation.isPending}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-danger/10 text-danger border border-danger/30 font-semibold py-2.5 rounded-md text-sm hover:bg-danger/15 transition-colors disabled:opacity-60 btn-press"
              >
                <X size={14} /> Mark as No-show
              </button>
            )}
          </>
        )}
      </Modal>
      </PartnerLayout>
    </>
  );
}
