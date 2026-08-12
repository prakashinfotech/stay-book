import clsx from 'clsx';
import { BookingStatus } from '../../types';

interface BadgeProps {
  status: BookingStatus;
}

const styles: Record<BookingStatus, string> = {
  CONFIRMED:
    'bg-success/15 text-success ring-1 ring-success/30 shadow-[0_0_0_3px_hsl(var(--color-success)/0.08)]',
  CANCELLED:
    'bg-danger/15 text-danger ring-1 ring-danger/30 shadow-[0_0_0_3px_hsl(var(--color-danger)/0.08)]',
  COMPLETED:
    'bg-primary-500/15 text-primary-600 ring-1 ring-primary-500/30 shadow-[0_0_0_3px_hsl(var(--color-primary-500)/0.08)]',
  NO_SHOW:
    'bg-muted/15 text-muted ring-1 ring-muted/30',
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        styles[status],
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
