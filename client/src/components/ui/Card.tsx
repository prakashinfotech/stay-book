import clsx from 'clsx';
import { forwardRef } from 'react';

type Variant = 'flat' | 'elevated' | 'glass' | 'gradient';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  interactive?: boolean;
}

const variants: Record<Variant, string> = {
  flat:     'bg-surface border border-line/70 shadow-soft',
  elevated: 'bg-surface border border-line/60 shadow-card',
  glass:    'glass-card',
  gradient: 'bg-gradient-card border border-line/40 shadow-card',
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'elevated', interactive = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...props}
      className={clsx(
        'rounded-2xl transition-all duration-300',
        variants[variant],
        interactive && 'hover:-translate-y-0.5 hover:shadow-card-lg cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
});

export default Card;
