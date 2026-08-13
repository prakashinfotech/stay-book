import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { bookingsApi } from '../../api/bookings.api';
import { paymentsApi } from '../../api/payments.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { getApiError, getApiErrorCode } from '../../utils/error';
import { formatPrice, formatDate, formatNights } from '../../utils/format';
import { useModal } from '../../hooks/useModal';
import { RazorpayOrder } from '../../types';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';
import NotificationModal from '../../components/ui/NotificationModal';
import CheckoutSteps from './checkout-steps';

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => any;
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { roomSelection, guestDetails, clear } = useCheckoutStore();
  const { modal, show: showModal, close: closeModal } = useModal();
  const bookingSucceeded = useRef(false);
  const rzpScriptLoaded = useRef(false);

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  useEffect(() => {
    if (rzpScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      rzpScriptLoaded.current = true;
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!roomSelection || !guestDetails) {
    if (!bookingSucceeded.current) navigate('/');
    return null;
  }

  const { holdId, ratePlanId, adults, children, priceBreakdown } = roomSelection;
  const nights = formatNights(roomSelection.checkin, roomSelection.checkout);
  const roomCharge = priceBreakdown.basePrice;
  const gst = Math.round(roomCharge * 0.18 * 100) / 100;
  const displayTotal = roomCharge + gst;

  const openRazorpayPopup = (orderData: RazorpayOrder) => {
    if (!window.Razorpay) {
      showModal({ type: 'error', title: 'Payment Error', message: 'Payment system not loaded. Please refresh and try again.' });
      return;
    }

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'StayBook',
      description: `Stay: ${formatDate(roomSelection.checkin)} – ${formatDate(roomSelection.checkout)}`,
      order_id: orderData.orderId,
      prefill: {
        name: `${guestDetails.firstName} ${guestDetails.lastName}`,
        email: guestDetails.email,
        contact: guestDetails.phone,
      },
      notes: { holdId: holdId ?? '' },
      theme: { color: '#4F46E5' },
      handler: (response: RazorpayHandlerResponse) => {
        setPaymentError(null);
        setIsConfirmingBooking(true);
        confirmBookingMutation.mutate(response);
      },
      modal: {
        ondismiss: () => {
          setPaymentError('Payment was cancelled. Click "Pay Now" to try again.');
          setIsConfirmingBooking(false);
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new window.Razorpay(options) as any;
    rzp.open();
  };

  const createOrderMutation = useMutation({
    mutationFn: () =>
      paymentsApi.createOrder({
        amount: displayTotal,
        holdId: holdId!,
      }),
    onSuccess: (res) => {
      setPaymentError(null);
      openRazorpayPopup(res.data);
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'HOLD_EXPIRED' || code === 'NOT_FOUND') {
        showModal({ type: 'error', title: 'Booking Hold Expired', message: 'Your booking hold has expired. Please search again.' });
        clear();
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      setPaymentError(getApiError(err));
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (rzpResponse: RazorpayHandlerResponse) =>
      bookingsApi.createBooking({
        holdId: holdId!,
        ratePlanId: ratePlanId || undefined,
        adults,
        children,
        guestDetails: {
          firstName: guestDetails.firstName,
          lastName: guestDetails.lastName,
          email: guestDetails.email,
          phone: guestDetails.phone,
          country: guestDetails.country,
          specialRequests: guestDetails.specialRequests,
          arrivalTime: guestDetails.arrivalTime,
        },
        payment: {
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
        },
      }),
    onSuccess: (res) => {
      bookingSucceeded.current = true;
      setIsConfirmingBooking(false);
      clear();
      navigate(`/trips/${res.data.id}?confirmed=true`);
    },
    onError: (err) => {
      setIsConfirmingBooking(false);
      const code = getApiErrorCode(err);
      if (code === 'HOLD_EXPIRED' || code === 'NOT_FOUND') {
        showModal({ type: 'error', title: 'Booking Hold Expired', message: 'Your booking hold has expired. Please search again.' });
        clear();
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      if (code === 'PAYMENT_DECLINED') {
        setPaymentError(
          'Payment verification failed. Please contact support with your payment reference.',
        );
      } else {
        setPaymentError(getApiError(err));
      }
    },
  });

  const isLoading = createOrderMutation.isPending || isConfirmingBooking;

  const handlePayNow = () => {
    setPaymentError(null);
    createOrderMutation.mutate();
  };

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <div className="min-h-screen bg-bg">
        <Header />
      <PageWrapper>
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Payment</h1>
          <p className="text-sm text-muted mb-6">Almost there — review and pay securely.</p>

          <CheckoutSteps current={2} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <div className="bento-card p-6">
                {paymentError && (
                  <div className="mb-4">
                    <ErrorBanner message={paymentError} />
                  </div>
                )}

                <div className="inline-flex items-center gap-2 mb-6 text-sm text-muted bg-surface-elev border border-line rounded-full px-3 py-1.5">
                  <Lock size={14} className="text-success" />
                  Secure payment powered by Razorpay
                </div>

                <div className="rounded-2xl bg-gradient-card border border-primary-500/20 p-5 mb-6">
                  <p className="text-sm text-ink">
                    You will be charged{' '}
                    <span className="font-display font-extrabold gradient-text text-lg">
                      {formatPrice(displayTotal)}
                    </span>{' '}
                    for your {nights} night{nights !== 1 ? 's' : ''} stay.
                  </p>
                  <p className="text-xs text-muted mt-1.5">
                    A Razorpay popup will open where you can pay via UPI, card, or net banking.
                  </p>
                </div>

                <p className="text-xs text-muted leading-relaxed mb-4">
                  By completing this booking you agree to our Booking Conditions, General Terms,
                  Privacy Policy, and applicable payment terms.
                </p>

                <Button
                  type="button"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                  onClick={handlePayNow}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    isConfirmingBooking ? 'Confirming booking...' : 'Opening payment...'
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Pay Now · {formatPrice(displayTotal)}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <div className="glass-card p-6 sticky top-24 shadow-card-lg">
                <h3 className="font-display font-bold text-ink mb-4 text-lg">Price summary</h3>
                <dl className="space-y-2.5 text-sm mb-4">
                  {([
                    ['Check-in',  formatDate(roomSelection.checkin)],
                    ['Check-out', formatDate(roomSelection.checkout)],
                    ['Guests', `${adults} adult${adults !== 1 ? 's' : ''}${
                      children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''
                    }`],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-muted">{label}</dt>
                      <dd className="font-semibold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border-t border-line/60 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">
                      Room charge ({nights} night{nights !== 1 ? 's' : ''})
                    </dt>
                    <dd className="font-semibold text-ink">{formatPrice(roomCharge)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">GST (18%)</dt>
                    <dd className="font-semibold text-ink">{formatPrice(gst)}</dd>
                  </div>
                  <div className="border-t border-line/60 pt-3 flex justify-between items-baseline">
                    <dt className="text-ink font-semibold">Total</dt>
                    <dd className="font-display font-extrabold text-xl gradient-text">
                      {formatPrice(displayTotal)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
      </div>
    </>
  );
}
