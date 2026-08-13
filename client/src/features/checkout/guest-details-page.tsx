import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Plane, Car, Bus, ArrowRight, type LucideIcon } from 'lucide-react';
import { useCheckoutStore } from '../../store/checkout.store';
import { useAuthStore } from '../../store/auth.store';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import CheckoutSteps from './checkout-steps';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Enter 10-digit Indian mobile number'),
  country: z.literal('India'),
  isMainGuest: z.boolean(),
  guestFirstName: z.string().optional(),
  guestLastName: z.string().optional(),
  travelPurpose: z.enum(['leisure', 'work']).optional(),
  addOns: z
    .object({ flight: z.boolean(), carRental: z.boolean(), airportTaxi: z.boolean() })
    .optional(),
  arrivalTime: z.string().optional(),
  specialRequests: z.string().max(500, 'Max 500 characters').optional(),
  paperlessConfirmation: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const ARRIVAL_TIMES = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00',
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00',
];

const ADD_ONS: {
  key: keyof NonNullable<FormData['addOns']>;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: 'flight',      label: "I'll need a flight for my trip",            Icon: Plane },
  { key: 'carRental',   label: "I'm interested in renting a car",           Icon: Car },
  { key: 'airportTaxi', label: 'Want to book a taxi or shuttle ride in advance?', Icon: Bus },
];

export default function GuestDetailsPage() {
  const navigate = useNavigate();
  const { roomSelection, guestDetails: savedGuest, setGuestDetails } = useCheckoutStore();
  const authUser = useAuthStore((s) => s.user);

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: savedGuest
      ? {
          firstName: savedGuest.firstName,
          lastName: savedGuest.lastName,
          email: savedGuest.email,
          phone: savedGuest.phone.replace(/^\+91/, ''),
          country: 'India',
          isMainGuest: savedGuest.isMainGuest,
          travelPurpose: savedGuest.travelPurpose,
          addOns: savedGuest.addOns ?? { flight: false, carRental: false, airportTaxi: false },
          arrivalTime: savedGuest.arrivalTime,
          specialRequests: savedGuest.specialRequests,
          paperlessConfirmation: savedGuest.paperlessConfirmation ?? false,
        }
      : {
          email: authUser?.email ?? '',
          country: 'India',
          isMainGuest: true,
          addOns: { flight: false, carRental: false, airportTaxi: false },
          paperlessConfirmation: false,
        },
  });

  const isMainGuest = watch('isMainGuest');

  if (!roomSelection) {
    navigate('/');
    return null;
  }

  const onSubmit = (data: FormData) => {
    setGuestDetails({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: `+91${data.phone}`,
      country: 'India',
      isMainGuest: data.isMainGuest,
      travelPurpose: data.travelPurpose,
      addOns: data.addOns,
      arrivalTime: data.arrivalTime,
      specialRequests: data.specialRequests,
      paperlessConfirmation: data.paperlessConfirmation,
    });
    navigate('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <PageWrapper>
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-extrabold text-ink mb-2">Your details</h1>
          <p className="text-sm text-muted mb-6">Just a few more steps to confirm your stay.</p>

          <CheckoutSteps current={1} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <input type="hidden" value="India" {...register('country')} />

            <div className="bento-card p-6 space-y-4">
              <h2 className="font-display text-base font-bold text-ink">Contact details</h2>

              <div className="grid grid-cols-2 gap-4">
                <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
                <Input label="Last name"  error={errors.lastName?.message}  {...register('lastName')} />
              </div>

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <label className="block text-sm font-medium text-ink/85 mb-1.5">Phone number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-line bg-surface-elev text-ink text-sm font-medium select-none whitespace-nowrap">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    className={`flex-1 rounded-r-md border bg-surface px-3.5 py-2.5 text-sm text-ink shadow-soft focus:outline-none focus:ring-4 transition-all ${
                      errors.phone
                        ? 'border-danger/60 focus:border-danger focus:ring-danger/15'
                        : 'border-line focus:border-primary-500 focus:ring-primary-500/15'
                    }`}
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-xs text-danger font-medium">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink/85 mb-1.5">Country / Region</label>
                <div className="flex items-center gap-2 rounded-md border border-line bg-surface-elev px-3.5 py-2.5">
                  <span className="text-base">🇮🇳</span>
                  <span className="text-sm text-ink font-medium">India</span>
                  <span className="ml-auto text-xs text-muted">Auto-selected</span>
                </div>
              </div>
            </div>

            <div className="bento-card p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Who is the main guest?</h2>
              <Controller
                name="isMainGuest"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-primary-600"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                      />
                      <span className="text-sm text-ink">I am the main guest</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-primary-600"
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                      />
                      <span className="text-sm text-ink">Booking is for someone else</span>
                    </label>
                  </div>
                )}
              />

              {isMainGuest === false && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-line/60">
                  <Input
                    label="Guest first name"
                    error={errors.guestFirstName?.message}
                    {...register('guestFirstName')}
                  />
                  <Input
                    label="Guest last name"
                    error={errors.guestLastName?.message}
                    {...register('guestLastName')}
                  />
                </div>
              )}
            </div>

            <div className="bento-card p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Purpose of trip</h2>
              <p className="text-sm text-muted">Are you travelling for work?</p>
              <Controller
                name="travelPurpose"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-primary-600"
                        checked={field.value === 'work'}
                        onChange={() => field.onChange('work')}
                      />
                      <span className="text-sm text-ink">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-primary-600"
                        checked={field.value === 'leisure'}
                        onChange={() => field.onChange('leisure')}
                      />
                      <span className="text-sm text-ink">No</span>
                    </label>
                  </div>
                )}
              />
            </div>

            <div className="rounded-2xl border border-primary-500/30 bg-gradient-card p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Add to your trip</h2>
              <p className="text-xs text-primary-600 font-medium">
                Let the property know what you need
              </p>
              <div className="space-y-3">
                {ADD_ONS.map(({ key, label, Icon }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-primary-600 rounded"
                      {...register(`addOns.${key}` as const)}
                    />
                    <span className="text-sm text-ink inline-flex items-center gap-2">
                      <Icon size={14} className="text-primary-600" /> {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bento-card p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Check-in details</h2>
              <div>
                <label className="block text-sm font-medium text-ink/85 mb-1.5">
                  Estimated arrival time{' '}
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <select
                  className="w-full appearance-none rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
                  {...register('arrivalTime')}
                >
                  <option value="">I don't know yet</option>
                  {ARRIVAL_TIMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted">Our front desk is staffed 24 hours a day</p>
            </div>

            <div className="bento-card p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-ink">Special requests</h2>
              <p className="text-xs text-muted">
                Requests are not guaranteed — the property will do its best to accommodate.
              </p>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="E.g. late check-in, high floor, non-smoking room..."
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all resize-none"
                {...register('specialRequests')}
              />
              {errors.specialRequests && (
                <p className="text-xs text-danger font-medium">{errors.specialRequests.message}</p>
              )}
            </div>

            <div className="rounded-2xl border border-line bg-surface-elev p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-primary-600 rounded"
                  {...register('paperlessConfirmation')}
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Paperless confirmation</p>
                  <p className="text-xs text-muted mt-0.5">
                    Send me a link via SMS to manage my booking on the app
                  </p>
                </div>
              </label>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full">
              Continue to payment <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </PageWrapper>
    </div>
  );
}
