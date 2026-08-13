import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'glass';
}

export default function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';

  const base =
    'relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors btn-press';
  const skin =
    variant === 'glass'
      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/30'
      : 'bg-surface-elev hover:bg-line text-ink border border-line';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`${base} ${skin} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex"
        >
          {isDark ? <Moon size={16} strokeWidth={2.2} /> : <Sun size={16} strokeWidth={2.2} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
