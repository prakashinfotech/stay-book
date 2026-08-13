import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, ChevronDown } from 'lucide-react';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { useModal } from '../../../hooks/useModal';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import NotificationModal from '../../../components/ui/NotificationModal';
import PartnerLayout from '../partner-layout';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export default function PartnerAvailabilityPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { modal, show: showModal, close: closeModal } = useModal();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data: propData } = useQuery({
    queryKey: ['partner-properties'],
    queryFn: partnerApi.getProperties,
    staleTime: 60_000,
  });

  const properties: any[] = propData?.data ?? [];
  const property = properties.find((p: any) => p.id === propertyId);
  const roomTypes: any[] = property?.roomTypes ?? [];

  const activeRoom = selectedRoom || roomTypes[0]?.id || '';

  const { data: avData, isLoading, isError, error } = useQuery({
    queryKey: ['partner-availability', propertyId, year, month],
    queryFn: () => partnerApi.getAvailability(propertyId!, year, month),
    enabled: !!propertyId,
    staleTime: 30_000,
  });

  const avRows: any[] = avData?.data ?? [];

  const avMap = avRows.reduce<Record<string, { isBlocked: boolean; bookingId: string | null }>>((acc, row) => {
    if (row.roomType?.id === activeRoom) {
      acc[toDateStr(new Date(row.date))] = { isBlocked: row.isBlocked, bookingId: row.bookingId };
    }
    return acc;
  }, {});

  const saveMutation = useMutation({
    mutationFn: (dates: { date: string; roomTypeId: string; isBlocked: boolean }[]) =>
      partnerApi.updateAvailability(propertyId!, dates),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Availability saved' });
      setPending({});
      qc.invalidateQueries({ queryKey: ['partner-availability', propertyId] });
    },
    onError: (e) => showModal({ type: 'error', title: 'Error', message: getApiError(e) }),
  });

  const toggleDate = (dateStr: string) => {
    const today = toDateStr(now);
    if (dateStr < today) return;
    const booked = avMap[dateStr]?.bookingId;
    if (booked) { showModal({ type: 'error', title: 'Cannot Modify', message: 'Date has an active booking and cannot be modified' }); return; }

    const current = pending[dateStr] ?? avMap[dateStr]?.isBlocked ?? false;
    setPending(p => ({ ...p, [dateStr]: !current }));
  };

  const handleSave = () => {
    if (!activeRoom) { showModal({ type: 'error', title: 'Select Room', message: 'Select a room type first' }); return; }
    const dates = Object.entries(pending).map(([date, isBlocked]) => ({ date, roomTypeId: activeRoom, isBlocked }));
    if (!dates.length) { showModal({ type: 'info', title: 'No Changes', message: 'No changes to save' }); return; }
    saveMutation.mutate(dates);
  };

  const dates = getDatesInMonth(year, month);
  const firstDow = dates[0].getDay();

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const getCellState = (dateStr: string) => {
    if (pending[dateStr] !== undefined) return pending[dateStr] ? 'pending-block' : 'pending-unblock';
    const av = avMap[dateStr];
    if (!av) return 'available';
    if (av.bookingId) return 'booked';
    if (av.isBlocked) return 'blocked';
    return 'available';
  };

  const cellStyles: Record<string, string> = {
    'available':       'bg-surface border-line text-ink hover:bg-green-50 hover:border-green-400 cursor-pointer',
    'blocked':         'bg-surface-elev border-line text-muted/70 hover:bg-surface hover:border-gray-400 cursor-pointer',
    'booked':          'bg-primary-500/10 border-primary-500/30 text-primary-600 cursor-not-allowed',
    'pending-block':   'bg-red-50 border-red-300 text-red-600 cursor-pointer ring-2 ring-red-200',
    'pending-unblock': 'bg-green-50 border-green-300 text-green-700 cursor-pointer ring-2 ring-green-200',
  };

  if (!propData && !isLoading) {
    return (
      <PartnerLayout title="Availability Calendar" backTo="/partner/dashboard" backLabel="Dashboard">
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-10 text-center max-w-lg">
          <p className="text-3xl mb-3">🏨</p>
          <p className="text-ink font-semibold">Property not found</p>
          <p className="text-sm text-muted/70 mt-1">Could not load property data. Go back and try again.</p>
        </div>
      </PartnerLayout>
    );
  }

  if (propData && roomTypes.length === 0) {
    return (
      <PartnerLayout title="Availability Calendar">
        <div className="bg-surface rounded-2xl border border-dashed border-line p-10 text-center max-w-lg">
          <p className="text-3xl mb-3">🛏</p>
          <p className="text-ink font-semibold">No room types configured yet</p>
          <p className="text-sm text-muted/70 mt-2 max-w-sm mx-auto">
            Your property <strong className="text-muted">{property?.name}</strong> doesn't have any room types.
            Add at least one room type with a price before managing availability.
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-5 inline-block">
            Room types define beds, occupancy, and pricing — customers need them to book.
          </p>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <PartnerLayout title="Availability Calendar" backTo="/partner/dashboard" backLabel="Dashboard">
      {isError && <ErrorBanner message={getApiError(error)} />}

      <div className="bento-card p-5 mb-6 flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-8">
        {/* Room selector */}
        {roomTypes.length > 0 && (
          <div className="lg:w-72 shrink-0">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
              <BedDouble size={12} /> Room Type
            </label>
            <div className="relative">
              <select
                value={activeRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                className="w-full appearance-none rounded-md border border-line bg-surface pl-3.5 pr-10 py-2.5 text-sm font-semibold text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
              >
                {roomTypes.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
            </div>
          </div>
        )}

        {/* Vertical divider on desktop */}
        {roomTypes.length > 0 && (
          <div className="hidden lg:block w-px self-stretch bg-line/70" />
        )}

        {/* Legend */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
            Status legend
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {[
              { dot: 'bg-surface border border-line',                           label: 'Available' },
              { dot: 'bg-surface-elev border border-line',                      label: 'Blocked' },
              { dot: 'bg-primary-500/15 border border-primary-500/40',          label: 'Booked' },
              { dot: 'bg-red-50 border border-red-300 dark:bg-red-500/20 dark:border-red-500/50',  label: 'Pending block' },
              { dot: 'bg-green-50 border border-green-300 dark:bg-green-500/20 dark:border-green-500/50', label: 'Pending unblock' },
            ].map(l => (
              <div
                key={l.label}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-elev/60"
              >
                <span className={`w-3.5 h-3.5 rounded ${l.dot}`} />
                <span className="text-ink font-medium whitespace-nowrap">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-elev transition-colors text-muted">←</button>
          <h2 className="text-base font-bold text-ink">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-elev transition-colors text-muted">→</button>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted/70 py-2">{d}</div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
              {dates.map(date => {
                const dateStr = toDateStr(date);
                const isPast  = dateStr < toDateStr(now);
                const state   = getCellState(dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isPast && toggleDate(dateStr)}
                    disabled={isPast || state === 'booked'}
                    className={`
                      rounded-lg border text-sm p-2 text-center transition-all select-none
                      ${isPast ? 'text-gray-300 bg-surface-elev border-line cursor-not-allowed' : cellStyles[state]}
                    `}
                    title={state === 'booked' ? 'Has active booking' : ''}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    {state === 'booked' && <span className="block text-[9px] mt-0.5">booked</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Save bar */}
        {Object.keys(pending).length > 0 && (
          <div className="border-t border-line px-6 py-4 flex items-center justify-between bg-amber-50">
            <p className="text-sm text-amber-700 font-medium">
              {Object.keys(pending).length} date{Object.keys(pending).length !== 1 ? 's' : ''} changed — unsaved
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPending({})}
                className="px-4 py-2 text-sm text-muted hover:text-gray-900 font-medium"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
      </PartnerLayout>
    </>
  );
}
