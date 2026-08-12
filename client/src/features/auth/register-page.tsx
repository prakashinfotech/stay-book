import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Luggage, Building2, type LucideIcon } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../utils/error';
import { useModal } from '../../hooks/useModal';
import NotificationModal from '../../components/ui/NotificationModal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';
import AuthLayout from './auth-layout';

const schema = z.object({
  firstName: z.string().min(1, 'First name required').trim(),
  lastName: z.string().min(1, 'Last name required').trim(),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});
type FormData = z.infer<typeof schema>;

type AccountType = 'CUSTOMER' | 'PARTNER';

const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  { value: 'CUSTOMER', label: 'I am a traveller',    desc: 'Book hotels, resorts, and stays', Icon: Luggage },
  { value: 'PARTNER',  label: 'I am a property host', desc: 'List and manage your properties', Icon: Building2 },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AccountType>('CUSTOMER');
  const { modal, show: showModal, close: closeModal } = useModal();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.register({ ...data, role }),
    onSuccess: (res) => {
      showModal({ type: 'success', title: 'Account Created', message: 'Check your email for the verification code.' });
      setTimeout(() => navigate(`/verify-otp?userId=${res.data.userId}`, { state: { devOtp: res.data.devOtp } }), 2000);
    },
    onError: (err) => showModal({ type: 'error', title: 'Registration Failed', message: getApiError(err) }),
  });

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <AuthLayout
        title="Create your account"
        subtitle="Join millions of travellers on StayBook"
        footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      {/* Role selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          I want to…
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ACCOUNT_TYPES.map(({ value, label, desc, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`relative flex flex-col items-start text-left p-4 rounded-xl border transition-all overflow-hidden ${
                role === value
                  ? 'border-primary-500 bg-primary-500/10 text-ink shadow-glow'
                  : 'border-line bg-surface-elev text-muted hover:border-primary-300/60'
              }`}
            >
              <Icon size={20} />
              <span className="mt-2 text-xs font-bold text-ink leading-snug">{label}</span>
              <span className="text-[10px] text-muted mt-0.5 leading-snug">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <ErrorBanner message={getApiError(mutation.error)} />}
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min 8 chars, uppercase + digit"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="gradient" size="lg" loading={mutation.isPending} className="w-full">
          Create{role === 'PARTNER' ? ' partner' : ''} account
        </Button>
      </form>
    </AuthLayout>
    </>
  );
}
