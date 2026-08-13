import { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, ...props },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink/85 mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={clsx(
          'w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder-muted/70 shadow-soft transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500',
          error
            ? 'border-danger/60 focus:border-danger focus:ring-danger/15'
            : 'border-line hover:border-primary-300/60',
          className,
        )}
      />
      {error && <p className="mt-1.5 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
});

export default Input;
