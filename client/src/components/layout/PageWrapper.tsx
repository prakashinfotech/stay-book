import clsx from 'clsx';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Visual treatment of the wrapper:
   *  - 'plain': default centered container.
   *  - 'mesh': subtle mesh gradient backdrop behind the container (for hero pages).
   */
  variant?: 'plain' | 'mesh';
}

export default function PageWrapper({ children, className, variant = 'plain' }: PageWrapperProps) {
  if (variant === 'mesh') {
    return (
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-hero opacity-80"
        />
        <div className={clsx('relative mx-auto max-w-7xl px-4 py-6', className)}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('mx-auto max-w-7xl px-4 py-6', className)}>
      {children}
    </div>
  );
}
