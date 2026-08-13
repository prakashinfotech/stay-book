import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hotel, Building2, AlertTriangle, Plus, Edit3, Eye, Calendar, ArrowRight,
  MapPin, BedDouble, ClipboardList, Globe, type LucideIcon,
} from 'lucide-react';
import { partnerApi } from '../../../api/partner.api';
import { propertiesApi } from '../../../api/properties.api';
import { getApiError } from '../../../utils/error';
import { formatPrice } from '../../../utils/format';
import { useModal } from '../../../hooks/useModal';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import NotificationModal from '../../../components/ui/NotificationModal';
import PartnerLayout from '../partner-layout';

function StatCard({
  label, value, sub, accent, Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: 'primary' | 'success' | 'accent';
  Icon: LucideIcon;
}) {
  const skin = {
    primary: 'from-primary-500/15 to-primary-700/10 text-primary-600',
    success: 'from-success/15 to-emerald-400/10 text-success',
    accent:  'from-accent-500/15 to-accent-600/10 text-accent-600',
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative bento-card p-6 overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${skin} opacity-50 pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted font-semibold uppercase tracking-widest">{label}</p>
          <p className="font-display text-3xl font-extrabold text-ink mt-2">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <Icon size={20} className="text-muted shrink-0" />
      </div>
    </motion.div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success ring-1 ring-success/30',
  DRAFT:  'bg-accent-500/15 text-accent-600 ring-1 ring-accent-500/30',
  PAUSED: 'bg-muted/15 text-muted ring-1 ring-muted/30',
};

export default function PartnerDashboardPage() {
  const summaryQ    = useQuery({ queryKey: ['partner-summary'],    queryFn: partnerApi.getSummary,    staleTime: 60_000 });
  const propertiesQ = useQuery({ queryKey: ['partner-properties'], queryFn: partnerApi.getProperties, staleTime: 60_000 });

  const summary    = summaryQ.data?.data;
  const properties = propertiesQ.data?.data ?? [];

  const qc = useQueryClient();
  const { modal, show: showModal, close: closeModal } = useModal();
  const publishMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.publish(id),
    onSuccess: () => {
      showModal({ type: 'success', title: 'Success', message: 'Property is now live!' });
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
      qc.invalidateQueries({ queryKey: ['partner-summary'] });
    },
    onError: (e) => showModal({ type: 'error', title: 'Error', message: getApiError(e) }),
  });

  const totalRooms = properties.reduce((s: number, p: any) => s + (p.roomTypes?.length ?? 0), 0);
  const totalBookings = properties.reduce((s: number, p: any) => s + (p._count?.bookings ?? 0), 0);

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <PartnerLayout title="Dashboard">
      {summaryQ.isError && <ErrorBanner message={getApiError(summaryQ.error)} />}

      {/* Customer visibility hint */}
      {properties.some((p: any) => p.status === 'ACTIVE' && (p.roomTypes?.length ?? 0) === 0) && (
        <div className="mb-6 p-4 rounded-2xl bg-accent-500/10 border border-accent-500/30 text-sm text-ink flex items-start gap-3">
          <AlertTriangle size={20} className="text-accent-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-bold text-ink">Some properties aren&apos;t visible to customers yet</p>
            <p className="text-xs text-muted mt-1">
              Properties need at least one <strong className="text-ink">room type with a price</strong> to appear in customer search results.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
        {summaryQ.isLoading ? (
          <div className="col-span-4 py-6 flex justify-center"><Spinner /></div>
        ) : (
          <>
            <StatCard label="Total Properties"   value={summary?.totalProperties ?? properties.length} Icon={Building2}     accent="primary" />
            <StatCard label="Active Bookings"    value={summary?.activeBookings  ?? 0}                  Icon={ClipboardList} accent="success" sub="with future check-out" />
            <StatCard label="Room Types Listed"  value={totalRooms}                                     Icon={BedDouble}     accent="accent" sub="across all properties" />
            <StatCard label="Revenue This Month" value={formatPrice(summary?.monthlyRevenue ?? 0)}      Icon={Globe}         accent="primary" sub={`${totalBookings} lifetime bookings`} />
          </>
        )}
      </div>

      {/* Properties list — table style */}
      <div className="bento-card overflow-hidden" data-aos="fade-up" data-aos-delay="100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/60">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Your Properties</h2>
            <p className="text-xs text-muted mt-0.5">
              {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} · manage details, availability and publishing
            </p>
          </div>
          <Link
            to="/partner/onboarding"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-white shadow-card hover:-translate-y-0.5 transition-all btn-press px-4 py-2 rounded-md [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]"
          >
            <Plus size={14} /> Add Property
          </Link>
        </div>

        {propertiesQ.isLoading && <div className="py-12 flex justify-center"><Spinner /></div>}
        {propertiesQ.isError && (
          <div className="p-6">
            <ErrorBanner message={getApiError(propertiesQ.error)} />
          </div>
        )}

        {!propertiesQ.isLoading && properties.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-card border border-line/60 flex items-center justify-center text-primary-600 mb-3">
              <Building2 size={28} />
            </div>
            <p className="font-display font-bold text-ink">No properties yet</p>
            <p className="text-sm text-muted mt-1 mb-5">List your first property to start receiving bookings</p>
            <Link
              to="/partner/onboarding"
              className="inline-flex items-center gap-1.5 text-white font-bold text-sm px-6 py-2.5 rounded-md shadow-lift hover:-translate-y-0.5 transition-all btn-press [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]"
            >
              Add your first property <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {properties.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line/60 bg-surface-elev/60 text-left">
                  {['Property', 'Location', 'Category', 'Room Types', 'Bookings', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map((p: any, i: number) => {
                  const roomCount = p.roomTypes?.length ?? 0;
                  const bookingCount = p._count?.bookings ?? 0;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      className="border-b border-line/40 hover:bg-surface-elev/40 transition-colors group"
                    >
                      {/* Property cell — image + name */}
                      <td className="px-4 py-3.5 min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-elev border border-line/60 flex items-center justify-center text-muted shrink-0 relative overflow-hidden">
                            <Hotel size={20} />
                            {p.images?.[0] && (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-ink truncate max-w-[200px]">{p.name}</p>
                            {p.starRating && (
                              <p className="text-xs text-muted mt-0.5">
                                {'★'.repeat(Math.round(p.starRating))}
                                <span className="ml-1 text-muted/70">{p.starRating} stars</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1 text-ink/85 text-sm">
                          <MapPin size={12} className="text-muted shrink-0" />
                          {p.city}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 text-xs font-semibold capitalize">
                          {p.category?.toLowerCase()}
                        </span>
                      </td>

                      {/* Room Types */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5">
                          <BedDouble size={14} className="text-muted shrink-0" />
                          <span className="font-semibold text-ink">{roomCount}</span>
                          {roomCount === 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-600 bg-accent-500/15 ring-1 ring-accent-500/30 px-1.5 py-0.5 rounded-full font-semibold ml-1">
                              <AlertTriangle size={9} /> none
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bookings */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5">
                          <ClipboardList size={14} className="text-muted shrink-0" />
                          <span className="font-semibold text-ink">{bookingCount}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? ''}`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/partner/properties/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-elev hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={12} /> Edit
                          </Link>
                          <Link
                            to={`/partner/properties/${p.id}/availability`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-500/10 hover:bg-primary-500/15 text-xs font-semibold text-primary-600 transition-colors"
                            title="Availability"
                          >
                            <Calendar size={12} /> Calendar
                          </Link>
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => publishMutation.mutate(p.id)}
                              disabled={publishMutation.isPending || roomCount === 0}
                              title={roomCount === 0 ? 'Add a room type before publishing' : 'Make this property visible to customers'}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success/15 hover:bg-success/20 text-xs font-semibold text-success transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {publishMutation.isPending && publishMutation.variables === p.id
                                ? 'Publishing…'
                                : <><ArrowRight size={12} /> Publish</>}
                            </button>
                          )}
                          {p.status === 'ACTIVE' && (
                            <Link
                              to={`/property/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-success/15 hover:bg-success/20 text-xs font-semibold text-success transition-colors"
                              title="View as customer"
                            >
                              <Eye size={12} /> View
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </PartnerLayout>
    </>
  );
}
