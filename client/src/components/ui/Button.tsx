import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient' | 'glass';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white shadow-card hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-glow',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-elev hover:border-primary-300/60',
  danger:
    'bg-danger text-white shadow-card hover:brightness-110 hover:-translate-y-0.5',
  ghost:
    'bg-transparent text-ink hover:bg-surface-elev',
  gradient:
    'text-white shadow-lift hover:-translate-y-0.5 [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]',
  glass:
    'glass-card text-ink hover:shadow-lift hover:-translate-y-0.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-200 btn-press will-change-transform',
        variants[variant],
        {
          'px-3 py-1.5 text-sm':  size === 'sm',
          'px-4 py-2.5 text-sm':  size === 'md',
          'px-6 py-3 text-base':  size === 'lg',
          'opacity-60 cursor-not-allowed pointer-events-none': disabled || loading,
        },
        className,
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
