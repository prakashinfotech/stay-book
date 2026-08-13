import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { useModal } from '../../hooks/useModal';
import { BookingListItem } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { getApiError } from '../../utils/error';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Badge from '../../components/ui/Badge';
import NotificationModal from '../../components/ui/NotificationModal';

type Tab = 'past' | 'cancelled';

function classifyBooking(b: BookingListItem): Tab {
  if (b.status === 'CANCELLED') return 'cancelled';
  return 'past';
}

const TAB_LABELS: Record<Tab, string> = {
  past:      'Past',
  cancelled: 'Cancelled',
};

export default function TripsPage() {
  const navigate    = useNavigate();
  const [activeTab, setActiveTab]     = useState<Tab>('past');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { modal, show: showModal, close: closeModal } = useModal();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn:  () => bookingsApi.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Booking cancelled' });
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setActiveTab('cancelled');
    },
    onError: (err) => {
      setConfirmingId(null);
      showModal({ type: 'error', title: 'Error', message: getApiError(err) });
    },
  });

  const allBookings: BookingListItem[] = data?.data ?? [];
  const tabBookings = allBookings.filter(b => classifyBooking(b) === activeTab);

  const counts: Record<Tab, number> = {
    past:      allBookings.filter(b => classifyBooking(b) === 'past').length,
    cancelled: allBookings.filter(b => classifyBooking(b) === 'cancelled').length,
  };

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <div className="min-h-screen bg-bg">
        <Header />
      <PageWrapper>
        <h1 className="font-display text-3xl font-extrabold text-ink mb-2">My Stay Booked</h1>
        <p className="text-sm text-muted mb-6">Manage your past and cancelled stays.</p>

        {/* Tab bar — 3D pills */}
        <div className="inline-flex gap-1 mb-6 p-1 bg-surface-elev border border-line rounded-full">
          {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'relative inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all',
                activeTab === tab
                  ? 'bg-surface text-ink shadow-card'
                  : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              {TAB_LABELS[tab]}
              {counts[tab] > 0 && (
                <span className={[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  activeTab === tab ? 'bg-primary-500/15 text-primary-600' : 'bg-line text-muted',
                ].join(' ')}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}
        {isError && <ErrorBanner message={getApiError(error)} />}

        {!isLoading && !isError && tabBookings.length === 0 && (
          <div className="text-center py-20 bento-card p-10">
            <SearchIcon size={36} className="mx-auto text-muted mb-3" />
            <p className="text-ink font-display font-semibold mb-1">
              {activeTab === 'past' ? 'No past bookings yet.' : 'No cancelled bookings.'}
            </p>
            {activeTab === 'past' && (
              <a href="/" className="text-sm text-primary-600 hover:underline font-semibold">
                Start searching →
              </a>
            )}
          </div>
        )}

        {tabBookings.length > 0 && (
          <div className="space-y-4">
            {tabBookings.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <BookingCard
                  booking={b}
                  confirming={confirmingId === b.id}
                  cancelling={cancelMutation.isPending && cancelMutation.variables === b.id}
                  onView={() => navigate(`/trips/${b.id}`, { state: { booking: b } })}
                  onRequestCancel={() => setConfirmingId(b.id)}
                  onConfirmCancel={() => cancelMutation.mutate(b.id)}
                  onDismissCancel={() => setConfirmingId(null)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </PageWrapper>
      </div>
    </>
  );
}

function BookingCard({
  booking, confirming, cancelling, onView, onRequestCancel, onConfirmCancel, onDismissCancel,
}: {
  booking:         BookingListItem;
  confirming:      boolean;
  cancelling:      boolean;
  onView:          () => void;
  onRequestCancel: () => void;
  onConfirmCancel: () => void;
  onDismissCancel: () => void;
}) {
  const isCancellable = booking.status === 'CONFIRMED';

  const statusStrip =
    booking.status === 'CANCELLED' ? 'bg-danger' :
    booking.status === 'COMPLETED' ? 'bg-primary-500' :
    booking.status === 'NO_SHOW'   ? 'bg-muted' :
                                     'bg-success';

  return (
    <div
      className="relative bento-card p-6 cursor-pointer overflow-hidden"
      onClick={onView}
    >
      {/* Status gradient strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStrip}`} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 className="font-display font-bold text-ink">{booking.property.name}</h3>
            <Badge status={booking.status} />
          </div>
          <p className="text-sm text-muted">{booking.property.city}</p>
          <p className="text-sm text-muted">{booking.roomType.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-display font-extrabold gradient-text">
            {formatPrice(Number(booking.totalPrice))}
          </p>
          <p className="text-xs text-muted">total</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {([
          ['Check-in',       formatDate(booking.checkin)],
          ['Check-out',      formatDate(booking.checkout)],
          ['Confirmation #', booking.confirmationNumber],
          ['PIN',            booking.pin],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted text-xs uppercase tracking-wider">{label}</dt>
            <dd className="font-semibold text-ink font-mono tracking-wide">{value}</dd>
          </div>
        ))}
      </dl>

      {isCancellable && !confirming && (
        <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="danger" size="sm" onClick={onRequestCancel}>
            Cancel booking
          </Button>
        </div>
      )}

      {isCancellable && confirming && (
        <div
          className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-danger mb-3">
            Are you sure you want to cancel this trip?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onDismissCancel} disabled={cancelling}>
              No, keep it
            </Button>
            <Button variant="danger" size="sm" loading={cancelling} onClick={onConfirmCancel}>
              Yes, cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
