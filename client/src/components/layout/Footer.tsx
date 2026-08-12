import { Link } from 'react-router-dom';
import { Code2, MessageCircle, Camera, Briefcase, Globe } from 'lucide-react';

const DESTINATIONS = [
  'Ahmedabad', 'Manali', 'Goa', 'Mumbai', 'Jaipur',
  'Shimla', 'Udaipur', 'Ooty', 'Rishikesh', 'Nainital',
];

const SECTIONS = [
  {
    title: 'Support',
    links: [
      { label: 'My Trips',         to: '/trips' },
      { label: 'Help Centre',      to: '/' },
      { label: 'Cancellations',    to: '/' },
      { label: 'Safety Resources', to: '/' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'Travel Blog',    to: '/' },
      { label: 'Destinations',   to: '/' },
      { label: 'Seasonal Deals', to: '/' },
      { label: 'Holiday Ideas',  to: '/' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'List your property', to: '/register' },
      { label: 'Partner Dashboard',  to: '/partner/dashboard' },
      { label: 'Partner Help',       to: '/' },
      { label: 'Become an Affiliate',to: '/' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About StayBook',  to: '/' },
      { label: 'Careers',         to: '/' },
      { label: 'Press Centre',    to: '/' },
      { label: 'Sustainability',  to: '/' },
    ],
  },
];

const SOCIALS = [
  { Icon: MessageCircle, href: '#', label: 'Twitter'   },
  { Icon: Camera,        href: '#', label: 'Instagram' },
  { Icon: Briefcase,     href: '#', label: 'LinkedIn'  },
  { Icon: Code2,         href: '#', label: 'GitHub'    },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-line/60 bg-surface">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-14">
        {/* CTA strip */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-card border border-line/60 p-8 md:p-10 mb-12 shadow-card"
          data-aos="fade-up"
        >
          <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-ink">
                Find your next <span className="gradient-text">unforgettable</span> stay
              </h3>
              <p className="mt-2 text-muted max-w-md">
                Hand-picked properties, transparent pricing, real-time availability.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold shadow-lift btn-press [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-primary-700))_100%)]"
            >
              Explore stays →
            </Link>
          </div>
        </div>

        {/* Popular destinations chips */}
        <div className="mb-12" data-aos="fade-up">
          <h2 className="font-display text-sm font-bold text-ink mb-4 tracking-wide uppercase">
            Popular with travellers from India
          </h2>
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map(dest => (
              <button
                key={dest}
                onClick={() => {
                  window.location.href = `/?destination=${encodeURIComponent(dest)}`;
                }}
                className="px-3 py-1.5 rounded-full bg-surface-elev border border-line text-sm text-ink hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {SECTIONS.map((section, i) => (
            <div key={section.title} data-aos="fade-up" data-aos-delay={i * 80}>
              <h4 className="font-display text-sm font-bold text-ink mb-4 tracking-wide uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted hover:text-primary-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-8 border-t border-line/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <span className="font-display font-extrabold text-lg gradient-text">StayBook</span>
              <span className="text-accent-500 text-lg font-extrabold">.</span>
            </div>
            <span className="text-sm text-muted">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-elev border border-line text-sm text-ink hover:border-primary-300 transition-colors">
              <Globe size={14} /> English (INR)
            </button>
            <div className="flex items-center gap-1.5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full text-muted hover:text-primary-600 hover:bg-surface-elev border border-line transition-colors btn-press"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
