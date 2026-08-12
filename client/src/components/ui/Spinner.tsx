import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeCls = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size];

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <svg
        className={clsx('animate-spin', sizeCls)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="spinner-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--color-primary-500))" />
            <stop offset="100%" stopColor="hsl(var(--color-accent-500))" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="hsl(var(--color-border))" strokeWidth="3" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="url(#spinner-grad)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
