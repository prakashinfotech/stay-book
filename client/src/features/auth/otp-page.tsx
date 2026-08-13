import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { getApiError } from '../../utils/error';
import { useModal } from '../../hooks/useModal';
import NotificationModal from '../../components/ui/NotificationModal';
import Button from '../../components/ui/Button';
import AuthLayout from './auth-layout';

const OTP_LENGTH  = 6;
const OTP_EXPIRY  = 10 * 60;  // 10 minutes in seconds

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const reset = () => setRemaining(seconds);
  const mm    = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss    = String(remaining % 60).padStart(2, '0');

  return { remaining, display: `${mm}:${ss}`, reset };
}

export default function OtpPage() {
  const [searchParams]         = useSearchParams();
  const navigate               = useNavigate();
  const { state }              = useLocation();
  const login                  = useAuthStore(s => s.login);
  const { modal, show: showModal, close: closeModal } = useModal();
  const userId                 = searchParams.get('userId') ?? '';
  const devOtp                 = (state as { devOtp?: string } | null)?.devOtp;

  const [digits, setDigits]    = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs              = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const submitCalledRef        = useRef(false);
  const { remaining, display, reset } = useCountdown(OTP_EXPIRY);

  const mutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(userId, code),
    onSuccess: (res) => {
      login(res.data.user, res.data.accessToken, '');
      showModal({ type: 'success', title: 'Success', message: 'Email verified! Welcome.' });
      setTimeout(() => navigate('/'), 1500);
    },
    onError: () => {
      submitCalledRef.current = false;
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(userId),
    onSuccess: () => {
      reset();
      submitCalledRef.current = false;
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      showModal({ type: 'success', title: 'OTP Sent', message: 'New OTP sent — check your email.' });
    },
    onError: (err) => {
      showModal({ type: 'error', title: 'Error', message: getApiError(err) });
    },
  });

  useEffect(() => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH && !submitCalledRef.current && !mutation.isPending) {
      submitCalledRef.current = true;
      mutation.mutate(code);
    }
  }, [digits, mutation]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const digit = value.replace(/\D/, '');
    const next  = digits.slice();
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.slice();
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  if (!userId) {
    navigate('/register');
    return null;
  }

  return (
    <>
      <NotificationModal modal={modal} onClose={closeModal} />
      <AuthLayout
        title="Verify your email"
        subtitle="Enter the 6-digit code we sent to your email."
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-card flex items-center justify-center text-primary-600 shadow-card">
            <Mail size={26} />
          </div>
        </div>

        {import.meta.env.DEV && devOtp && (
          <div className="mb-5 rounded-md bg-accent-500/10 border border-accent-500/30 px-4 py-2 text-sm text-center">
            <span className="text-accent-600 font-medium">DEV — your OTP: </span>
            <span className="font-mono font-bold text-ink tracking-widest">{devOtp}</span>
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={[
                'w-11 h-14 text-center text-xl font-bold rounded-md border-2 outline-none transition-all duration-150',
                digit
                  ? 'border-primary-500 bg-primary-500/10 text-ink shadow-glow'
                  : 'border-line bg-surface text-ink',
                'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
              ].join(' ')}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="w-full"
          loading={mutation.isPending}
          onClick={() => {
            const code = digits.join('');
            if (code.length === OTP_LENGTH) mutation.mutate(code);
          }}
        >
          Verify
        </Button>

        <div className="mt-5 text-center text-sm">
          {remaining > 0 ? (
            <p className="text-muted">
              Code expires in{' '}
              <span className={remaining < 60 ? 'text-danger font-semibold' : 'font-semibold text-ink'}>
                {display}
              </span>
            </p>
          ) : (
            <p className="text-muted">Code expired.</p>
          )}
          <button
            type="button"
            disabled={remaining > 0 || resendMutation.isPending}
            onClick={handleResend}
            className={[
              'mt-2 text-sm font-semibold transition-colors',
              remaining > 0 || resendMutation.isPending
                ? 'text-muted/50 cursor-not-allowed'
                : 'text-primary-600 hover:underline cursor-pointer',
            ].join(' ')}
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>
      </AuthLayout>
    </>
  );
}
