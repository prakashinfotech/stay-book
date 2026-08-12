import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Users, Utensils, CheckCircle2, XCircle, Calendar, Moon,
  type LucideIcon,
} from 'lucide-react';
import { propertiesApi } from '../../api/properties.api';
import { bookingsApi } from '../../api/bookings.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { useAuthStore } from '../../store/auth.store';
import { useModal } from '../../hooks/useModal';
import { Property, RoomType } from '../../types';
import { formatPrice, formatNights } from '../../utils/format';
import { getApiError } from '../../utils/error';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import NotificationModal from '../../components/ui/NotificationModal';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { setRoomSelection, setHoldId } = useCheckoutStore();
  const { modal, show: showModal, close: closeModal } = useModal();

  const checkin = searchParams.get('checkin') ?? '';
  const checkout = searchParams.get('checkout') ?? '';
  const adults = Number(searchParams.get('adults') ?? 1);
  const nights = checkin && checkout ? formatNights(checkin, checkout) : 1;

  const { data: property, isLoading, isError, error } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const holdMutation = useMutation({
    mutationFn: (roomTypeId: string) =>
      bookingsApi.createHold({ roomTypeId, propertyId: id!, checkin, checkout, adults, children: 0 }),
    onSuccess: (res, roomTypeId) => {
      const room = property!.roomTypes.find((rt) => rt.id === roomTypeId)!;
      const ratePlan =
        room.ratePlans.find((rp) => rp.planType === 'STANDARD') ?? room.ratePlans[0];
      setRoomSelection({
        propertyId: id!,
        roomTypeId,
        ratePlanId: ratePlan?.id ?? '',
        checkin,
        checkout,
        adults,
        children: 0,
        priceBreakdown: {
          basePrice: Number(room.basePrice),
          nights,
          taxes: 0,
          total: Number(room.basePrice) * nights,
        },
        holdId: res.data.id,
      });
      setHoldId(res.data.id);
      navigate('/checkout/details');
    },
    onError: (err) => showModal({ type: 'error', title: 'Error', message: getApiError(err) }),
  });

  const handleReserve = (roomTypeId: string) => {
    if (!accessToken) {
      showModal({ type: 'error', title: 'Sign In Required', message: 'Please sign in to make a reservation' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!checkin || !checkout) {
      showModal({ type: 'error', title: 'No Dates Selected', message: 'Go back to search and pick your dates' });
      return;
    }
    holdMutation.mutate(roomTypeId);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </div>
    );

  if (isError || !property)
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <PageWrapper>
          <ErrorBanner message={getApiError(error)} />
        </PageWrapper>
      </div>
    );

  const amenities = property.amenities as string[];

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <div className="min-h-screen bg-bg">
        <Header />
      <PageWrapper>
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-64 sm:h-96 rounded-3xl overflow-hidden mb-6 shadow-card-lg"
        >
          {property.images[0] ? (
            <img
              src={property.images[0].url}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-elev text-muted">
              No image available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="inline-flex items-center gap-1 text-xs uppercase font-bold tracking-widest bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
              {property.category.toLowerCase()}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-2 drop-shadow">
              {property.name}
            </h1>
            <p className="mt-1 text-white/90 inline-flex items-center gap-1.5">
              <MapPin size={14} /> {property.address}, {property.city}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bento-card p-6" data-aos="fade-up">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">About this property</h2>
                </div>
                {property.starRating && (
                  <span className="inline-flex items-center gap-1.5 bg-star/15 text-star px-3 py-1 rounded-full text-sm font-bold shrink-0">
                    <Star size={14} fill="currentColor" /> {property.starRating}
                  </span>
                )}
              </div>
              {property.description && (
                <p className="mt-4 text-muted text-sm leading-relaxed">
                  {property.description}
                </p>
              )}
              {amenities.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 bg-surface-elev border border-line text-ink text-xs rounded-full px-3 py-1.5 font-medium"
                      >
                        <CheckCircle2 size={12} className="text-success" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h2 className="font-display text-xl font-bold text-ink">Available rooms</h2>
            {property.roomTypes.length === 0 ? (
              <p className="text-muted text-sm">No rooms available for this property yet.</p>
            ) : (
              <div className="space-y-3">
                {property.roomTypes.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <RoomCard
                      room={room}
                      nights={nights}
                      loading={holdMutation.isPending && holdMutation.variables === room.id}
                      onReserve={() => handleReserve(room.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: stay summary */}
          <div data-aos="fade-left" data-aos-delay="100">
            <div className="glass-card p-6 sticky top-24 shadow-card-lg">
              <h3 className="font-display font-bold text-ink mb-4 text-lg">Your stay</h3>
              {checkin && checkout ? (
                <dl className="space-y-3 text-sm">
                  <Row Icon={Calendar} label="Check-in"  value={checkin} />
                  <Row Icon={Calendar} label="Check-out" value={checkout} />
                  <Row Icon={Moon}     label="Nights"    value={nights} />
                  <Row Icon={Users}    label="Guests"    value={`${adults} adult${adults !== 1 ? 's' : ''}`} />
                </dl>
              ) : (
                <p className="text-sm text-muted">
                  No dates selected. Go back to search and pick check-in / check-out dates.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
      <Footer />
      </div>
    </>
  );
}

function Row({
  Icon, label, value,
}: {
  Icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="inline-flex items-center gap-2 text-muted">
        <Icon size={14} /> {label}
      </dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function RoomCard({
  room, nights, loading, onReserve,
}: {
  room: RoomType;
  nights: number;
  loading: boolean;
  onReserve: () => void;
}) {
  const pricePerNight = Number(room.basePrice);
  const total = pricePerNight * nights;

  return (
    <div className="bento-card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-ink">{room.name}</h3>
        {room.description && (
          <p className="text-sm text-muted mt-1">{room.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip Icon={Users}    label={`Up to ${room.maxOccupancy} guests`} />
          <Chip Icon={Utensils} label={room.mealPlan === 'BREAKFAST' ? 'Breakfast included' : 'Room only'} />
          {room.cancellationPolicy === 'FLEXIBLE'
            ? <Chip Icon={CheckCircle2} label="Free cancellation" tone="success" />
            : <Chip Icon={XCircle}      label="Non-refundable"    tone="danger"  />}
        </div>
      </div>
      <div className="text-right shrink-0 self-end sm:self-start">
        <p className="text-2xl font-display font-extrabold gradient-text">
          {formatPrice(pricePerNight)}
        </p>
        <p className="text-xs text-muted">per night</p>
        {nights > 1 && (
          <p className="text-sm text-ink font-semibold mt-1">{formatPrice(total)} total</p>
        )}
        <Button size="sm" variant="gradient" className="mt-3" onClick={onReserve} loading={loading}>
          Reserve
        </Button>
      </div>
    </div>
  );
}

function Chip({
  Icon, label, tone = 'neutral',
}: {
  Icon: LucideIcon;
  label: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const skin =
    tone === 'success' ? 'bg-success/12 text-success border-success/30' :
    tone === 'danger'  ? 'bg-danger/12  text-danger  border-danger/30' :
                         'bg-surface-elev text-muted border-line';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 border ${skin}`}>
      <Icon size={11} /> {label}
    </span>
  );
}
