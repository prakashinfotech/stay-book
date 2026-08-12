import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, CreditCard, TrendingUp, Percent } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import PartnerLayout from '../partner-layout';

function EarningCard({
  label, value, sub, Icon, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  accent: 'primary' | 'success' | 'accent' | 'muted';
}) {
  const skin = {
    primary: 'from-primary-500/15 to-primary-700/10 text-primary-600',
    success: 'from-success/15 to-emerald-400/10 text-success',
    accent:  'from-accent-500/15 to-accent-600/10 text-accent-600',
    muted:   'from-muted/12 to-muted/5 text-muted',
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
          <p className="font-display text-2xl font-extrabold text-ink mt-2">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <Icon size={20} className="text-muted shrink-0" />
      </div>
    </motion.div>
  );
}

export default function PartnerEarningsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['partner-earnings'],
    queryFn: partnerApi.getEarnings,
    staleTime: 60_000,
  });

  const summary         = data?.data?.summary;
  const bookings: any[] = data?.data?.bookings ?? [];

  return (
    <PartnerLayout title="Earnings">
      {isError && <ErrorBanner message={getApiError(error)} />}

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <EarningCard label="This Month"      value={formatPrice(summary?.thisMonth ?? 0)} sub="Revenue" Icon={TrendingUp} accent="primary" />
            <EarningCard label="Last Month"      value={formatPrice(summary?.lastMonth ?? 0)} sub="Revenue" Icon={Wallet}     accent="muted" />
            <EarningCard label="Lifetime Total"  value={formatPrice(summary?.lifetime ?? 0)}  sub="All time" Icon={CreditCard} accent="success" />
            <EarningCard label="Commission Rate" value={`${((summary?.commissionRate ?? 0.12) * 100).toFixed(0)}%`} sub="Platform fee" Icon={Percent} accent="accent" />
          </div>

          <div className="rounded-2xl bg-gradient-card border border-primary-500/20 px-5 py-3 text-sm text-ink mb-6 flex items-center gap-3">
            <CreditCard size={18} className="text-primary-600 shrink-0" />
            Payout disbursement is processed monthly. Bank transfer integration coming in Phase 2.
          </div>

          <div className="bento-card overflow-hidden" data-aos="fade-up" data-aos-delay="100">
            <div className="px-6 py-4 border-b border-line/60">
              <h2 className="font-display text-base font-bold text-ink">Booking Payouts</h2>
            </div>

            {bookings.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-card border border-line/60 flex items-center justify-center text-primary-600 mb-3">
                  <Wallet size={28} />
                </div>
                <p className="text-muted">No earnings yet — confirmed bookings will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line/60 text-left bg-surface-elev/60">
                      {['Booking Ref', 'Property', 'Room', 'Check-out', 'Total', 'Commission (12%)', 'Your Payout', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} className="border-b border-line/40 hover:bg-surface-elev/50">
                        <td className="px-4 py-3 font-mono text-xs text-muted">{b.confirmationNumber}</td>
                        <td className="px-4 py-3 text-ink max-w-[140px] truncate font-medium">{b.property}</td>
                        <td className="px-4 py-3 text-ink/80 max-w-[120px] truncate">{b.roomType}</td>
                        <td className="px-4 py-3 text-ink/80 whitespace-nowrap">{formatDate(b.checkoutDate)}</td>
                        <td className="px-4 py-3 text-ink font-semibold">{formatPrice(b.total)}</td>
                        <td className="px-4 py-3 text-danger">- {formatPrice(b.commission)}</td>
                        <td className="px-4 py-3 font-display font-bold text-success">{formatPrice(b.payout)}</td>
                        <td className="px-4 py-3"><Badge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line bg-surface-elev/80">
                      <td colSpan={6} className="px-4 py-3 font-display font-bold text-ink">Total Payout</td>
                      <td className="px-4 py-3 font-display font-extrabold gradient-text text-base">
                        {formatPrice(bookings.reduce((s, b) => s + b.payout, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PartnerLayout>
  );
}
