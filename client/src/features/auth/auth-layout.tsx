import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Globe2 } from 'lucide-react';
import ThemeToggle from '../../components/theme/theme-toggle';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const HIGHLIGHTS = [
  { Icon: Sparkles,    title: 'Hand-picked stays',     desc: 'Verified properties only.' },
  { Icon: ShieldCheck, title: 'Secure payments',       desc: 'Bank-grade encryption.' },
  { Icon: Globe2,      title: '12,000+ destinations',  desc: 'India and beyond.' },
];

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left — gradient illustration panel (desktop) */}
      <div className="hidden lg:flex relative w-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 [background-image:linear-gradient(135deg,hsl(var(--color-primary-700))_0%,transparent_70%)] opacity-60" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="inline-flex items-center gap-0.5 w-fit">
            <span className="font-display font-extrabold text-2xl text-white">StayBook</span>
            <span className="text-accent-400 text-2xl font-extrabold">.</span>
          </Link>

          <div className="space-y-7">
            <h2 className="font-display text-4xl xl:text-5xl font-extrabold text-white leading-[1.05]">
              Where every<br />stay becomes a<br />
              <span className="bg-gradient-to-r from-accent-400 to-white bg-clip-text text-transparent">
                memory.
              </span>
            </h2>
            <p className="text-white/80 max-w-md text-lg">
              Discover hand-curated hotels, resorts, and homestays across India — at transparent prices,
              with zero hidden fees.
            </p>

            <div className="grid grid-cols-1 gap-3 max-w-md">
              {HIGHLIGHTS.map(({ Icon, title: t, desc }, i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-card p-4 flex items-start gap-3 border-white/20"
                >
                  <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center text-white shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t}</p>
                    <p className="text-white/70 text-xs">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-white/60 text-xs">© {new Date().getFullYear()} StayBook</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 relative flex items-center justify-center px-4 py-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="lg:hidden pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-hero opacity-70"
        />

        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-0.5">
              <span className="font-display font-extrabold text-2xl gradient-text">StayBook</span>
              <span className="text-accent-500 text-2xl font-extrabold">.</span>
            </Link>
          </div>

          <div className="glass-card shadow-card-lg p-8">
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
              {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
