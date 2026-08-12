import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { getApiError } from '../../utils/error';
import { useModal } from '../../hooks/useModal';
import NotificationModal from '../../components/ui/NotificationModal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';
import AuthLayout from './auth-layout';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

function roleRedirect(role: string): string {
  if (role === 'PARTNER') return '/partner/dashboard';
  if (role === 'ADMIN')   return '/admin/dashboard';
  return '/';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { modal, show: showModal, close: closeModal } = useModal();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.login(data.email, data.password),
    onSuccess: (res) => {
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      showModal({ type: 'success', title: 'Success', message: 'Welcome back!' });
      setTimeout(() => navigate(roleRedirect(res.data.user.role)), 1500);
    },
    onError: (error) => showModal({ type: 'error', title: 'Login Failed', message: getApiError(error) }),
  });

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to continue your journey"
        footer={
          <>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-semibold">
              Register
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && <ErrorBanner message={getApiError(mutation.error)} />}
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
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="gradient" size="lg" loading={mutation.isPending} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
    </>
  );
}
