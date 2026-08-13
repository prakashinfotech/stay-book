import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Copy, MapPin, Calendar, Users, BedDouble,
  ClipboardList, IdCard, Clock, Phone, Mail, Printer, Search as SearchIcon, RefreshCw, Hotel,
  type LucideIcon,
} from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { BookingListItem } from '../../types';
import { formatDate, formatPrice, formatNights } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/ui/Spinner';

const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed; top: -10px; width: 8px; height: 14px; border-radius: 2px;
  animation: confetti-fall linear forwards;
  pointer-events: none; z-index: 9999;
}
`;
const COLORS = ['#4F46E5', '#818CF8', '#F97066', '#10B981', '#F59E0B', '#A78BFA'];

function spawnConfetti() {
  const style = document.createElement('style');
  style.textContent = CONFETTI_CSS;
  document.head.appendChild(style);
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.animationDuration = `${2 + Math.random() * 2}s`;
    el.style.animationDelay = `${Math.random() * 1.5}s`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function CopyButton({ value }: { value: string }) {
  const copy = () => { navigator.clipboard.writeText(value).catch(() => undefined); };
  return (
    <button
      onClick={copy}
      title="Copy"
      className="ml-2 text-muted hover:text-primary-600 transition-colors btn-press"
    >
      <Copy size={14} />
    </button>
  );
}

const STATUS_CONFIG: Record<string, { label: string; headline: string; tone: 'success' | 'danger' | 'primary' | 'muted' }> = {
  CONFIRMED: { label: 'Confirmed', headline: 'Your booking is confirmed',          tone: 'success' },
  CANCELLED: { label: 'Cancelled', headline: 'This booking has been cancelled',    tone: 'danger'  },
  COMPLETED: { label: 'Completed', headline: 'Your stay has been completed',       tone: 'primary' },
  NO_SHOW:   { label: 'No Show',   headline: 'This booking was marked as no-show', tone: 'muted'   },
};

const TONE_CLASSES: Record<string, { container: string; text: string }> = {
  success: { container: 'bg-success/10 border-success/30',     text: 'text-success' },
  danger:  { container: 'bg-danger/10  border-danger/30',      text: 'text-danger'  },
  primary: { container: 'bg-primary-500/10 border-primary-500/30', text: 'text-primary-600' },
  muted:   { container: 'bg-muted/10  border-muted/30',        text: 'text-muted'   },
};

export default function TripDetailPage() {
  const { bookingId }  = useParams<{ bookingId: string }>();
  const location       = useLocation();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewBooking   = searchParams.get('confirmed') === 'true';
  const confettiFired  = useRef(false);

  const stateBooking = location.state?.booking as BookingListItem | undefined;
  const hasFullData  = !!stateBooking?.property;

  const { data: listData, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn:  () => bookingsApi.getById(bookingId!),
    enabled:  !hasFullData && !!bookingId,
  });

  const booking: BookingListItem | undefined = hasFullData
    ? stateBooking
    : listData?.data as BookingListItem | undefined;

  useEffect(() => {
    if (isNewBooking && booking && !confettiFired.current) {
      confettiFired.current = true;
      spawnConfetti();
    }
  }, [isNewBooking, booking]);

  if (!hasFullData && isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <PageWrapper>
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        </PageWrapper>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <PageWrapper>
          <div className="text-center py-20 bento-card p-10">
            <p className="text-muted mb-4">Booking not found.</p>
            <Link to="/trips" className="text-primary-600 hover:underline text-sm font-semibold">
              ← Back to My Stay Booked
            </Link>
          </div>
        </PageWrapper>
      </div>
    );
  }

  const status   = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
  const tone     = TONE_CLASSES[status.tone];
  const nights   = formatNights(booking.checkin, booking.checkout);
  const guestStr = [
    `${booking.adults} adult${booking.adults !== 1 ? 's' : ''}`,
    booking.children ? `${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <style>{`@media print { header, .no-print { display: none !important; } body { background: white; } }`}</style>

      <PageWrapper>
        {!isNewBooking && (
          <button
            onClick={() => navigate('/trips')}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-semibold mb-5 no-print"
          >
            <ArrowLeft size={14} /> My Stay Booked
          </button>
        )}

        {isNewBooking ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6 rounded-3xl border border-success/30 bg-gradient-to-br from-success/10 via-success/5 to-primary-500/5 p-6 sm:p-8 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shrink-0 shadow-glow text-white">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-success uppercase tracking-widest mb-1">Payment successful</p>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2">Booking Confirmed!</h1>
                  <p className="text-sm text-muted">
                    A confirmation has been sent to <span className="font-semibold text-ink">{booking.guestName}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0 min-w-[200px] glass-card px-4 py-3">
                  <div>
                    <p className="text-xs text-muted mb-0.5">Confirmation #</p>
                    <div className="flex items-center">
                      <span className="font-bold font-mono tracking-wide text-ink text-sm">
                        {booking.confirmationNumber}
                      </span>
                      <CopyButton value={booking.confirmationNumber} />
                    </div>
                  </div>
                  <div className="border-t border-line/60 pt-2">
                    <p className="text-xs text-muted mb-0.5">PIN code</p>
                    <div className="flex items-center">
                      <span className="font-display font-extrabold font-mono tracking-widest text-xl gradient-text">
                        {booking.pin}
                      </span>
                      <CopyButton value={booking.pin} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bento-card p-6">
                  <h2 className="font-display text-lg font-bold text-ink mb-1">{booking.property.name}</h2>
                  <p className="text-sm text-muted mb-5 inline-flex items-center gap-1">
                    <MapPin size={12} /> {booking.property.city}
                  </p>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    <Field label="Check-in"   value={formatDate(booking.checkin)}  sub="from 14:00" />
                    <Field label="Check-out"  value={formatDate(booking.checkout)} sub="until 12:00" />
                    <Field label="Guests"     value={guestStr} />
                    <Field label="Room"       value={booking.roomType.name} sub={`${nights} night${nights !== 1 ? 's' : ''}`} />
                    <Field label="Guest name" value={booking.guestName} />
                    <Field
                      label="Booked on"
                      value={new Date(booking.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    />
                  </div>

                  <div className="mt-5 border-t border-line/60 pt-4 flex items-center justify-between">
                    <span className="text-sm text-muted">Total paid (incl. taxes)</span>
                    <span className="font-display text-2xl font-extrabold gradient-text">
                      {formatPrice(Number(booking.totalPrice))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bento-card p-5 space-y-2 no-print">
                  <Link
                    to="/trips"
                    className="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold text-white rounded-md py-2.5 shadow-card hover:-translate-y-0.5 transition-all btn-press [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]"
                  >
                    Manage my booking
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-1 text-sm font-semibold text-ink hover:bg-surface-elev border border-line rounded-md py-2.5 transition-colors btn-press"
                  >
                    <Printer size={14} /> Save as PDF
                  </button>
                  <Link
                    to={`/property/${booking.property.id}`}
                    className="block w-full text-center text-sm font-semibold text-muted hover:text-ink hover:bg-surface-elev border border-line rounded-md py-2.5 transition-colors"
                  >
                    View property
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center text-sm font-semibold text-muted hover:text-ink hover:bg-surface-elev border border-line rounded-md py-2.5 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <SearchIcon size={14} /> Find another place
                  </Link>
                </div>
              </div>
            </div>

            <div className="bento-card p-6 no-print">
              <h2 className="font-display font-bold text-ink mb-3 text-sm uppercase tracking-wider">What&apos;s next?</h2>
              <ul className="space-y-3 text-sm text-muted">
                {[
                  { Icon: IdCard, text: 'Carry a valid photo ID at check-in — your PIN may be required.' },
                  { Icon: Clock,  text: 'Standard check-in is 2:00 PM. Early check-in subject to availability.' },
                  { Icon: Phone,  text: 'Need to change your booking? Visit My Stay Booked or contact the property directly.' },
                  { Icon: Mail,   text: 'A confirmation email with all details has been sent to the guest.' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <Icon size={18} className="text-primary-600 shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">

            <div className="lg:col-span-2 space-y-4">
              <div className={`rounded-3xl border ${tone.container} p-5`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${tone.text}`}>
                  {status.label}
                </p>
                <h1 className={`font-display text-xl font-bold ${tone.text}`}>{status.headline}</h1>
                <div className="mt-3 flex gap-4 text-sm flex-wrap">
                  {booking.status !== 'CANCELLED' ? (
                    <>
                      <Link to={`/property/${booking.property.id}`} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline font-semibold">
                        <Hotel size={14} /> View property
                      </Link>
                      <Link to="/" className="inline-flex items-center gap-1.5 text-primary-600 hover:underline font-semibold">
                        <SearchIcon size={14} /> Find another place
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/property/${booking.property.id}`} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline font-semibold">
                        <RefreshCw size={14} /> Book again
                      </Link>
                      <Link to="/" className="inline-flex items-center gap-1.5 text-primary-600 hover:underline font-semibold">
                        <SearchIcon size={14} /> Find another place
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="bento-card p-6">
                <h2 className="font-display text-lg font-bold text-ink mb-5">{booking.property.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {([
                    [Calendar,       'Check-in',       formatDate(booking.checkin),  'from 14:00'],
                    [Calendar,       'Check-out',      formatDate(booking.checkout), 'until 12:00'],
                    [ClipboardList,  'Booking details', guestStr, `${nights} night${nights !== 1 ? 's' : ''} · ${booking.roomType.name}`],
                    [Users,          'Guest name',     booking.guestName, null],
                  ] as [LucideIcon, string, string, string | null][]).map(
                    ([Icon, label, value, sub]) => (
                      <div key={label} className="flex gap-3">
                        <span className="w-9 h-9 rounded-full bg-surface-elev border border-line flex items-center justify-center text-primary-600 shrink-0">
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-muted mb-0.5 uppercase tracking-wider">{label}</p>
                          <p className="font-semibold text-ink">{value}</p>
                          {sub && <p className="text-xs text-muted">{sub}</p>}
                        </div>
                      </div>
                    ),
                  )}
                  <div className="flex gap-3 sm:col-span-2">
                    <span className="w-9 h-9 rounded-full bg-surface-elev border border-line flex items-center justify-center text-primary-600 shrink-0">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="text-xs text-muted mb-0.5 uppercase tracking-wider">Location</p>
                      <p className="font-semibold text-ink">{booking.property.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bento-card p-6">
                <h3 className="font-display font-bold text-ink mb-4">Price summary</h3>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted">{nights} night{nights !== 1 ? 's' : ''} × room rate</span>
                </div>
                <div className="flex justify-between items-center border-t border-line/60 pt-3 mt-3">
                  <span className="font-semibold text-ink">Total paid</span>
                  <span className="font-display text-xl font-extrabold gradient-text">
                    {formatPrice(Number(booking.totalPrice))}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">Includes all taxes and fees</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bento-card p-5">
                <div className="mb-3">
                  <p className="text-xs text-muted mb-1 uppercase tracking-wider">Confirmation number</p>
                  <div className="flex items-center">
                    <span className="font-bold text-ink font-mono tracking-wide">{booking.confirmationNumber}</span>
                    <CopyButton value={booking.confirmationNumber} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1 uppercase tracking-wider">PIN code</p>
                  <div className="flex items-center">
                    <span className="font-display font-extrabold text-ink font-mono tracking-widest text-lg gradient-text">{booking.pin}</span>
                    <CopyButton value={booking.pin} />
                  </div>
                </div>
              </div>

              <div className="bento-card p-5">
                <p className="text-xs text-muted mb-1 uppercase tracking-wider">Booked on</p>
                <p className="font-semibold text-ink text-sm">
                  {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              <div className="bento-card p-5 space-y-2">
                <button
                  onClick={() => window.print()}
                  className="block w-full text-center text-sm font-semibold text-primary-600 hover:bg-primary-500/10 border border-primary-500/40 rounded-md py-2 transition-colors inline-flex items-center justify-center gap-2 btn-press"
                >
                  <Printer size={14} /> Save as PDF
                </button>
                <Link
                  to={`/property/${booking.property.id}`}
                  className="block w-full text-center text-sm font-semibold text-muted hover:text-ink hover:bg-surface-elev border border-line rounded-md py-2 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <BedDouble size={14} /> View property
                </Link>
                <Link
                  to="/trips"
                  className="block w-full text-center text-sm font-semibold text-muted hover:text-ink hover:bg-surface-elev border border-line rounded-md py-2 transition-colors"
                >
                  Back to my bookings
                </Link>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5 uppercase tracking-wider">{label}</p>
      <p className="font-display font-bold text-ink text-base">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
