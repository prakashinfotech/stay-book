import { Check } from 'lucide-react';

interface CheckoutStepsProps {
  current: 0 | 1 | 2 | 3;
}

const STEPS = ['Room', 'Details', 'Payment', 'Confirm'];

export default function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <div className="bento-card p-3 inline-flex w-full items-stretch gap-2 overflow-x-auto">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            className={`flex-1 min-w-[110px] flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
              active
                ? '[background-image:linear-gradient(135deg,hsl(var(--color-primary-500)/0.15)_0%,hsl(var(--color-accent-500)/0.10)_100%)] border border-primary-500/30'
                : done
                ? 'bg-success/10 border border-success/20'
                : 'bg-surface-elev border border-line/60'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-bold shrink-0 ${
                done
                  ? 'bg-success text-white'
                  : active
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'bg-line text-muted'
              }`}
            >
              {done ? <Check size={12} /> : i + 1}
            </span>
            <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-ink' : done ? 'text-success' : 'text-muted'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
