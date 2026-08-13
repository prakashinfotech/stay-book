import { useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Copy, Printer, ArrowRight, IdCard, Clock, Phone,
} from 'lucide-react';
import { CreatedBooking } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';

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
    el.style.left     = `${Math.random() * 100}vw`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.animationDuration  = `${2 + Math.random() * 2}s`;
    el.style.animationDelay     = `${Math.random() * 1.5}s`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

export default function ConfirmationPage() {
  const { bookingId }     = useParams<{ bookingId: string }>();
  const { state }         = useLocation() as { state: { booking: CreatedBooking } | null };
  const confettiFired     = useRef(false);

  const booking = state?.booking;

  useEffect(() => {
    if (booking && !confettiFired.current) {
      confettiFired.current = true;
      spawnConfetti();
    }
  }, [booking]);

  const handleCopy = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.confirmationNumber);
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <PageWrapper>
          <div className="max-w-lg mx-auto text-center py-16 bento-card p-10">
            <p className="text-muted mb-4">
              Booking <strong className="text-ink">{bookingId}</strong> confirmed.
            </p>
            <Link to="/trips" className="text-primary-600 hover:underline text-sm font-semibold">
              View my trips
            </Link>
          </div>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <PageWrapper>
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative glass-card shadow-card-lg overflow-hidden"
          >
            {/* Gradient hero strip */}
            <div className="relative bg-gradient-hero p-8 text-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-20 h-20 mx-auto rounded-full bg-success text-white flex items-center justify-center shadow-glow"
              >
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </motion.div>
              <h1 className="font-display text-3xl font-extrabold text-ink mt-4">
                Booking Confirmed!
              </h1>
              <p className="text-muted text-sm mt-1">
                Confirmation sent to <strong className="text-ink">{booking.guestEmail}</strong>
              </p>
            </div>

            <div className="p-6">
              <div className="bg-surface-elev rounded-2xl p-5 text-left space-y-3 border border-line/60">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Confirmation #</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tracking-wider font-bold text-ink">
                      {booking.confirmationNumber}
                    </span>
                    <button
                      onClick={handleCopy}
                      title="Copy confirmation number"
                      className="text-muted hover:text-primary-600 transition-colors btn-press"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <InfoRow label="PIN"        value={booking.pin} mono />
                <InfoRow label="Guest"      value={booking.guestName} />
                <InfoRow label="Check-in"   value={formatDate(booking.checkin)} />
                <InfoRow label="Check-out"  value={formatDate(booking.checkout)} />
                <InfoRow
                  label="Guests"
                  value={`${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${
                    booking.children ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''
                  }`}
                />
                <div className="border-t border-line/60 pt-3">
                  <InfoRow label="Total paid" value={formatPrice(Number(booking.totalPrice))} bold />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 no-print mt-6">
                <Link
                  to="/trips"
                  className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-md text-white text-sm font-semibold shadow-card hover:-translate-y-0.5 transition-all btn-press [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]"
                >
                  View my trips <ArrowRight size={14} />
                </Link>
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-surface-elev border border-line text-ink rounded-md py-2.5 text-sm font-semibold hover:border-primary-300 transition-colors btn-press"
                >
                  <Printer size={14} /> Save as PDF
                </button>
                <Link
                  to="/"
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-surface-elev border border-line text-ink rounded-md py-2.5 text-sm font-semibold hover:border-primary-300 transition-colors btn-press"
                >
                  Back to search
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="mt-6 bento-card p-6 no-print">
            <h2 className="font-display font-bold text-ink mb-3 text-sm uppercase tracking-wider">
              What&apos;s next?
            </h2>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <IdCard size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Carry a valid photo ID at check-in — your PIN may be required.</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Standard check-in is 2:00 PM. Early check-in subject to availability.</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Need to change your booking? Visit <strong className="text-ink">My Trips</strong> or contact the property directly.</span>
              </li>
            </ul>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted">{label}</span>
      <span
        className={[
          'text-ink',
          mono ? 'font-mono tracking-wider' : '',
          bold ? 'font-display font-extrabold text-base gradient-text' : 'font-semibold',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
