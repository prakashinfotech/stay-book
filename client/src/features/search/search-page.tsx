import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Calendar, Users, MapPin, History, BedDouble, Hotel as HotelIcon,
  Home as HomeIcon, Castle, Mountain, Palmtree, ChevronDown, Wallet, CheckCircle2,
  ShieldCheck, Star, Headphones, Quote, ArrowRight, Sparkles, TrendingUp, Globe,
  type LucideIcon,
} from 'lucide-react';
import { propertiesApi } from '../../api/properties.api';
import { SearchResult } from '../../types';
import { getApiError } from '../../utils/error';
import { todayStr, tomorrowStr, formatDate } from '../../utils/format';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PropertyCard from './property-card';
import ChatBot from './ChatBot';

const EXPLORE_CITIES = [
  { city: 'New Delhi',  image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&auto=format&fit=crop' },
  { city: 'Mumbai',     image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80&auto=format&fit=crop' },
  { city: 'Bengaluru',  image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80&auto=format&fit=crop' },
  { city: 'Jaipur',     image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&auto=format&fit=crop' },
  { city: 'Goa',        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80&auto=format&fit=crop' },
  { city: 'Ahmedabad',  image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop' },
  { city: 'Manali',     image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80&auto=format&fit=crop' },
  { city: 'Rishikesh',  image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop' },
  { city: 'Varanasi',   image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&q=80&auto=format&fit=crop' },
];

const TRENDING = [
  { city: 'New Delhi',  image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=900&q=80&auto=format&fit=crop', wide: true  },
  { city: 'Bengaluru',  image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Mumbai',     image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Varanasi',   image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Rishikesh',  image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80&auto=format&fit=crop', wide: false },
];

const TRENDING_CITIES = ['New Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Bengaluru'];

const CITY_THUMB: Record<string, string> = {
  'New Delhi':  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=120&q=70&auto=format&fit=crop',
  'Mumbai':     'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=120&q=70&auto=format&fit=crop',
  'Bengaluru':  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=120&q=70&auto=format&fit=crop',
  'Jaipur':     'https://images.unsplash.com/photo-1548013146-72479768bada?w=120&q=70&auto=format&fit=crop',
  'Goa':        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=120&q=70&auto=format&fit=crop',
  'Ahmedabad':  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=120&q=70&auto=format&fit=crop',
  'Manali':     'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=120&q=70&auto=format&fit=crop',
  'Rishikesh':  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&q=70&auto=format&fit=crop',
  'Varanasi':   'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=120&q=70&auto=format&fit=crop',
};

const AMENITY_OPTIONS = ['WiFi', 'Pool', 'Parking', 'Gym', 'Restaurant', 'Spa', 'Breakfast', 'AC'];

const PROPERTY_TYPES: { label: string; Icon: typeof HotelIcon; value: string }[] = [
  { label: 'Hotels',   Icon: HotelIcon,  value: 'HOTEL'   },
  { label: 'Resorts',  Icon: Palmtree,   value: 'RESORT'  },
  { label: 'Villas',   Icon: HomeIcon,   value: 'VILLA'   },
  { label: 'Hostels',  Icon: BedDouble,  value: 'HOSTEL'  },
  { label: 'Heritage', Icon: Castle,     value: 'HERITAGE' },
];

const STAY_TYPES: { value: string; label: string; tagline: string; Icon: LucideIcon; image: string }[] = [
  {
    value: 'HOTEL',
    label: 'Hotels',
    tagline: 'Comfort & service',
    Icon: HotelIcon,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80&auto=format&fit=crop',
  },
  {
    value: 'RESORT',
    label: 'Resorts',
    tagline: 'All-in-one escapes',
    Icon: Palmtree,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&q=80&auto=format&fit=crop',
  },
  {
    value: 'VILLA',
    label: 'Villas',
    tagline: 'Private & spacious',
    Icon: HomeIcon,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&q=80&auto=format&fit=crop',
  },
  {
    value: 'HERITAGE',
    label: 'Heritage',
    tagline: 'Stays with story',
    Icon: Castle,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=500&q=80&auto=format&fit=crop',
  },
  {
    value: 'HOSTEL',
    label: 'Hostels',
    tagline: 'Budget-friendly',
    Icon: BedDouble,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80&auto=format&fit=crop',
  },
];

const TESTIMONIALS: { name: string; location: string; rating: number; quote: string }[] = [
  {
    name: 'Aarav Sharma',
    location: 'Bengaluru',
    rating: 5,
    quote:
      'Booked a last-minute Goa villa and got an instant confirmation with the best price I had seen anywhere. The check-in was seamless.',
  },
  {
    name: 'Priya Iyer',
    location: 'Mumbai',
    rating: 5,
    quote:
      'I love that cancellations are actually free. Plans changed twice and I got both refunds within a day. Customer support was lovely too.',
  },
  {
    name: 'Rahul Verma',
    location: 'Delhi',
    rating: 4,
    quote:
      'Heritage stay in Jaipur was exactly as described — beautiful property, transparent pricing, no surprises at the front desk.',
  },
];

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:gap-1.5 transition-all whitespace-nowrap"
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc';

interface Filters {
  minPrice: number; maxPrice: number; stars: number[]; types: string[]; amenities: string[];
}

const DEFAULT_FILTERS: Filters = { minPrice: 0, maxPrice: 50000, stars: [], types: [], amenities: [] };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Top picks'          },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Star Rating'        },
];

function getWeekendLabel() {
  const today = new Date();
  const daysUntilFri = ((5 - today.getDay()) + 7) % 7 || 7;
  const fri = new Date(today); fri.setDate(today.getDate() + daysUntilFri);
  const sun = new Date(fri);   sun.setDate(fri.getDate() + 2);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(fri)} – ${fmt(sun)}`;
}

function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Filter Sidebar ────────────────────────────────────────────────────────────

function FilterSidebar({ filters, onChange, onReset, resultCount }: {
  filters: Filters; onChange: (f: Filters) => void; onReset: () => void; resultCount: number;
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const hasActive = filters.stars.length > 0 || filters.types.length > 0 ||
    filters.amenities.length > 0 || filters.minPrice > 0 || filters.maxPrice < 50000;

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-ink text-sm">Filter results</h3>
        {hasActive && (
          <button onClick={onReset} className="text-xs text-primary-600 hover:underline font-semibold">
            Reset all
          </button>
        )}
      </div>
      <p className="text-xs text-muted">{resultCount} propert{resultCount !== 1 ? 'ies' : 'y'} found</p>

      <div className="bento-card p-4 space-y-3">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Price per night</h4>
        <input
          type="range" min={0} max={50000} step={500} value={filters.maxPrice}
          onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>₹0</span>
          <span className="font-semibold text-ink">up to ₹{filters.maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="bento-card p-4 space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Star rating</h4>
        {[5, 4, 3, 2, 1].map(star => (
          <label key={star} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox" checked={filters.stars.includes(star)}
              onChange={() => onChange({ ...filters, stars: toggle(filters.stars, star) })}
              className="w-4 h-4 rounded accent-primary-600"
            />
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className={`w-3 h-3 ${i < star ? 'text-star' : 'text-line'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </span>
            <span className="text-xs text-muted">{star} star{star !== 1 ? 's' : ''}</span>
          </label>
        ))}
      </div>

      <div className="bento-card p-4 space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Property type</h4>
        {PROPERTY_TYPES.map(({ value, label, Icon }) => (
          <label key={value} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox" checked={filters.types.includes(value)}
              onChange={() => onChange({ ...filters, types: toggle(filters.types, value) })}
              className="w-4 h-4 rounded accent-primary-600"
            />
            <Icon size={14} className="text-muted" />
            <span className="text-xs text-muted">{label}</span>
          </label>
        ))}
      </div>

      <div className="bento-card p-4 space-y-2">
        <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Amenities</h4>
        {AMENITY_OPTIONS.map(amenity => (
          <label key={amenity} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox" checked={filters.amenities.includes(amenity)}
              onChange={() => onChange({ ...filters, amenities: toggle(filters.amenities, amenity) })}
              className="w-4 h-4 rounded accent-primary-600"
            />
            <span className="text-xs text-muted">{amenity}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

// ── Featured property card (landing page) ─────────────────────────────────────

function FeaturedCard({ property, onView, deal }: {
  property: SearchResult; onView: () => void; deal?: boolean;
}) {
  const price = Number(property.min_price ?? 0);
  const original = deal ? Math.round(price * 1.18) : 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
      <button
        onClick={onView}
        className="group bento-card overflow-hidden shrink-0 w-56 text-left"
      >
        <div className="relative h-40 overflow-hidden bg-surface-elev">
          {property.cover_image ? (
            <img
              src={property.cover_image}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <HotelIcon size={28} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
          {deal && (
            <span className="absolute top-2 left-2 bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-soft">
              Deal
            </span>
          )}
          {property.star_rating && (
            <span className="absolute bottom-2 right-2 bg-ink/80 backdrop-blur-md text-white text-xs font-bold px-1.5 py-0.5 rounded">
              ★ {property.star_rating}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="font-display font-semibold text-ink text-sm leading-tight line-clamp-1">{property.name}</p>
          <p className="text-xs text-muted mt-0.5">{property.city}</p>
          <div className="mt-2">
            {deal && original > 0 && (
              <p className="text-xs text-muted/70 line-through">{formatINR(original)}</p>
            )}
            <p className="text-sm font-bold text-ink">
              {formatINR(price)}
              <span className="text-xs font-normal text-muted"> /night</span>
            </p>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

// ── Main Search Page ──────────────────────────────────────────────────────────

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searches, addSearch } = useRecentSearches();

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [checkin,  setCheckin]  = useState(searchParams.get('checkin')  ?? todayStr());
  const [checkout, setCheckout] = useState(searchParams.get('checkout') ?? tomorrowStr());
  const [adults,   setAdults]   = useState(Number(searchParams.get('adults') ?? 2));
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS);
  const [sort,     setSort]     = useState<SortKey>('recommended');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [debouncedDestination, setDebouncedDestination] = useState('');

  const destInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const destContainerRef = useRef<HTMLDivElement>(null);

  const activeDestination = searchParams.get('destination');
  const activeCheckin     = searchParams.get('checkin')  ?? checkin;
  const activeCheckout    = searchParams.get('checkout') ?? checkout;
  const activeAdults      = Number(searchParams.get('adults') ?? adults);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDestination(destination.trim()), 300);
    return () => clearTimeout(t);
  }, [destination]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        destContainerRef.current &&
        !destContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn:  () => propertiesApi.search({ destination: activeDestination!, checkin: activeCheckin, checkout: activeCheckout, adults: activeAdults }),
    enabled:  !!activeDestination,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-properties'],
    queryFn:  () => propertiesApi.getFeatured(),
    enabled:  !activeDestination,
    staleTime: 1000 * 60 * 10,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', debouncedDestination],
    queryFn:  () => propertiesApi.suggestions(debouncedDestination),
    enabled:  debouncedDestination.length >= 2,
    staleTime: 1000 * 30,
  });

  const { data: destCountsData } = useQuery({
    queryKey: ['destination-counts'],
    queryFn:  () => propertiesApi.destinationCounts(),
    staleTime: 1000 * 60 * 5,
  });

  const liveSuggestions: string[] = suggestionsData?.data ?? [];
  const destCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (destCountsData?.data ?? []).forEach((d: { city: string; count: number }) => { map[d.city] = d.count; });
    return map;
  }, [destCountsData]);

  const featured: SearchResult[] = featuredData?.data ?? [];
  const homesLove = featured.slice(0, 4);
  const deals     = featured.slice(4, 8).length > 0 ? featured.slice(4, 8) : featured.slice(0, 4);

  const allResults: SearchResult[] = data?.data ?? [];

  const filteredAndSorted = useMemo(() => {
    let results = [...allResults];
    if (filters.types.length > 0)     results = results.filter(p => filters.types.includes(p.category));
    if (filters.stars.length > 0)     results = results.filter(p => p.star_rating !== null && filters.stars.includes(Math.round(p.star_rating)));
    if (filters.amenities.length > 0) results = results.filter(p => {
      const amenities = Array.isArray(p.amenities) ? (p.amenities as string[]) : [];
      return filters.amenities.every(fa => amenities.some(a => a.toLowerCase().includes(fa.toLowerCase())));
    });
    if (filters.maxPrice < 50000) results = results.filter(p => Number(p.min_price ?? 0) <= filters.maxPrice);
    switch (sort) {
      case 'price_asc':   results.sort((a, b) => Number(a.min_price ?? 0) - Number(b.min_price ?? 0)); break;
      case 'price_desc':  results.sort((a, b) => Number(b.min_price ?? 0) - Number(a.min_price ?? 0)); break;
      case 'rating_desc': results.sort((a, b) => (b.star_rating ?? 0) - (a.star_rating ?? 0)); break;
    }
    return results;
  }, [allResults, filters, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    addSearch({ destination, checkin, checkout, adults });
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    setDropdownOpen(false);
    setSearchParams({ destination, checkin, checkout, adults: String(adults) });
  };

  const triggerSearch = (dest: string, opts?: { checkin?: string; checkout?: string; adults?: number }) => {
    const c  = opts?.checkin  ?? checkin;
    const co = opts?.checkout ?? checkout;
    const a  = opts?.adults   ?? adults;
    setDestination(dest);
    addSearch({ destination: dest, checkin: c, checkout: co, adults: a });
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    setDropdownOpen(false);
    setSearchParams({ destination: dest, checkin: c, checkout: co, adults: String(a) });
  };

  const recentThree = searches.slice(0, 3);
  const weekendLabel = getWeekendLabel();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[600px] flex items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&auto=format&fit=crop')`,
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60 pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white shadow-soft mb-5">
              <Sparkles size={12} /> India&apos;s favourite hotel booking platform
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
              Find your <span className="text-accent-400">next stay</span>
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto drop-shadow-md">
              Hand-picked hotels, resorts and homes — at transparent prices, with zero hidden fees.
            </p>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} className="text-yellow-300 fill-yellow-300" />
                <span><strong className="text-white font-bold">4.8</strong> from 12,400+ reviews</span>
              </span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/40" />
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-300" />
                <span><strong className="text-white font-bold">100% secure</strong> bookings</span>
              </span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/40" />
              <span className="inline-flex items-center gap-1.5">
                <Headphones size={14} className="text-blue-300" />
                <span><strong className="text-white font-bold">24/7</strong> customer support</span>
              </span>
            </div>
          </motion.div>

          {/* Search form */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-2xl shadow-2xl backdrop-blur-md bg-white/95 border border-white/20 p-4 md:p-5 relative z-20"
          >
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[180px] relative" ref={destContainerRef}>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                  <BedDouble size={11} className="inline mr-1" /> Destination
                </label>
                <input
                  ref={destInputRef}
                  value={destination}
                  onChange={e => { setDestination(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Where are you going?"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted/70 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
                />

                {dropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 top-full mt-2 w-[420px] max-w-[calc(100vw-2rem)] max-h-[520px] overflow-y-auto bg-surface border border-line rounded-2xl shadow-lift py-2 z-50 animate-fade-up"
                  >
                    {recentThree.length > 0 && (
                      <>
                        <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                          Your recent searches
                        </p>
                        {recentThree.map(s => (
                          <button
                            key={s.savedAt}
                            type="button"
                            onClick={() => triggerSearch(s.destination, { checkin: s.checkin, checkout: s.checkout, adults: s.adults })}
                            className="group w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elev transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-surface-elev border border-line/70 flex items-center justify-center text-muted shrink-0">
                              <History size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink">{s.destination}</p>
                              <p className="text-xs text-muted truncate">
                                {formatDate(s.checkin)} – {formatDate(s.checkout)} · {s.adults} adult{s.adults !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-muted/60 group-hover:text-primary-600 transition-colors shrink-0" />
                          </button>
                        ))}
                        <div className="border-t border-line/60 my-1.5 mx-2" />
                      </>
                    )}
                    {debouncedDestination.length >= 2 && liveSuggestions.length > 0 ? (
                      <>
                        <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                          Suggestions
                        </p>
                        {liveSuggestions.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => triggerSearch(city)}
                            className="group w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elev transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-surface-elev border border-line/70 flex items-center justify-center text-primary-600 shrink-0">
                              <MapPin size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink">{city}</p>
                              <p className="text-xs text-muted">India</p>
                            </div>
                            <ArrowRight size={14} className="text-muted/60 group-hover:text-primary-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                          Trending destinations
                        </p>
                        {TRENDING_CITIES.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => triggerSearch(city)}
                            className="group w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-elev transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-surface-elev border border-line/70 shrink-0">
                              {CITY_THUMB[city] ? (
                                <img src={CITY_THUMB[city]} alt={city} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary-600">
                                  <MapPin size={15} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink">{city}</p>
                              <p className="text-xs text-muted">
                                {destCountMap[city] !== undefined ? `${destCountMap[city]} stays in India` : 'India'}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-muted/60 group-hover:text-primary-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-[140px]">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                  <Calendar size={11} className="inline mr-1" /> Check-in
                </label>
                <input
                  type="date" value={checkin} min={todayStr()}
                  onChange={e => { setCheckin(e.target.value); if (checkout <= e.target.value) setCheckout(e.target.value); }}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
                />
              </div>

              <div className="min-w-[140px]">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                  <Calendar size={11} className="inline mr-1" /> Check-out
                </label>
                <input
                  type="date" value={checkout} min={checkin}
                  onChange={e => setCheckout(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
                />
              </div>

              <div className="min-w-[130px]">
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1 ml-1">
                  <Users size={11} className="inline mr-1" /> Adults
                </label>
                <div className="relative">
                  <select
                    value={adults}
                    onChange={e => setAdults(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-line bg-surface pl-3 pr-8 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} adult{n !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
                </div>
              </div>

              <button
                type="submit"
                className="h-[44px] px-7 rounded-xl font-bold text-sm text-white shadow-lift hover:-translate-y-0.5 transition-all btn-press inline-flex items-center gap-2 [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]"
              >
                <Search size={16} /> Search
              </button>
            </div>
          </motion.form>

          {/* Quick category chips */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2 relative z-10"
          >
            <span className="text-xs text-white/80 font-semibold mr-1 hidden sm:block">
              Quick search:
            </span>
            {PROPERTY_TYPES.map(({ label, Icon, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFilters({ ...DEFAULT_FILTERS, types: [value] });
                  setDestination('');
                  destInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs font-semibold text-white hover:bg-white/30 hover:border-white/60 hover:-translate-y-0.5 shadow-soft transition-all btn-press"
              >
                <Icon size={13} className="text-accent-300" />
                {label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Landing dashboard ─────────────────────────────────────────────── */}
      {!activeDestination && (
        <div className="max-w-7xl mx-auto w-full px-4 py-10 space-y-16 flex-1">

          {/* Stats band — social proof */}
          <section
            aria-label="Platform stats"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 -mt-8"
          >
            {[
              { label: 'Properties',     value: '12,400+', Icon: HotelIcon },
              { label: 'Cities covered', value: '320+',    Icon: MapPin },
              { label: 'Happy guests',   value: '180K+',   Icon: Users },
              { label: 'Avg. rating',    value: '4.8 / 5', Icon: Star },
            ].map(({ label, value, Icon }, i) => (
              <div
                key={label}
                className="bento-card p-4 flex items-center gap-3"
                data-aos="fade-up"
                data-aos-delay={i * 80}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-card border border-line/60 flex items-center justify-center text-primary-600 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold text-ink leading-none">{value}</p>
                  <p className="text-xs text-muted mt-1">{label}</p>
                </div>
              </div>
            ))}
          </section>

          {recentThree.length > 0 && (
            <section data-aos="fade-up">
              <SectionHeader
                title="Your recent searches"
                subtitle="Pick up where you left off"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentThree.map((s, i) => (
                  <button
                    key={s.savedAt}
                    onClick={() => triggerSearch(s.destination, { checkin: s.checkin, checkout: s.checkout, adults: s.adults })}
                    className="group flex items-center gap-3 bento-card p-3 text-left"
                    data-aos="fade-up"
                    data-aos-delay={i * 80}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-elev">
                      {CITY_THUMB[s.destination] ? (
                        <img src={CITY_THUMB[s.destination]} alt={s.destination} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <BedDouble size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-ink text-sm">{s.destination}</p>
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(s.checkin)} – {formatDate(s.checkout)}
                      </p>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Users size={11} /> {s.adults} people
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted/60 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Browse by stay type — bento grid */}
          <section data-aos="fade-up">
            <SectionHeader
              title="Browse by stay type"
              subtitle="From boutique villas to budget hostels — find the right fit"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {STAY_TYPES.map(({ value, label, tagline, Icon, image }, i) => (
                <button
                  key={value}
                  onClick={() => {
                    setFilters({ ...DEFAULT_FILTERS, types: [value] });
                    destInputRef.current?.focus();
                  }}
                  className="group relative h-40 rounded-2xl overflow-hidden shadow-card hover:-translate-y-0.5 transition-all text-left btn-press"
                  data-aos="zoom-in"
                  data-aos-delay={i * 70}
                >
                  <img
                    src={image}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative h-full flex flex-col justify-between p-3">
                    <div className="self-end w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary-600 shadow-soft">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-white font-display font-bold text-base leading-tight">{label}</p>
                      <p className="text-white/80 text-[11px] mt-0.5">{tagline}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section data-aos="fade-up">
            <SectionHeader
              title="Explore India"
              subtitle="These popular destinations have a lot to offer"
              actionLabel="See all cities"
              onAction={() => triggerSearch(EXPLORE_CITIES[0].city)}
            />
            <div className="overflow-hidden">
              <div className="flex w-max marquee-track">
                {[...EXPLORE_CITIES, ...EXPLORE_CITIES].map((dest, idx) => (
                  <button
                    key={`${dest.city}-${idx}`}
                    onClick={() => triggerSearch(dest.city)}
                    className="group shrink-0 text-left pr-4"
                  >
                    <div className="relative w-44 h-32 rounded-2xl overflow-hidden bg-surface-elev mb-2 shadow-card">
                      <img
                        src={dest.image}
                        alt={dest.city}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-display font-bold text-sm drop-shadow">{dest.city}</p>
                        <p className="text-white/85 text-[10px]">
                          {destCountMap[dest.city] !== undefined ? `${destCountMap[dest.city]} stays` : 'View stays'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {homesLove.length > 0 && (
            <section data-aos="fade-up">
              <SectionHeader
                title="Homes guests love"
                subtitle="Top-rated properties across India"
                actionLabel="View all"
                onAction={() => navigate(`/property/${homesLove[0].id}`)}
              />
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {homesLove.map(p => (
                  <FeaturedCard
                    key={p.id}
                    property={p}
                    onView={() => navigate(`/property/${p.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {deals.length > 0 && (
            <section data-aos="fade-up">
              <SectionHeader
                title="Deals for the weekend"
                subtitle={`Save on stays for ${weekendLabel}`}
                actionLabel="See all deals"
                onAction={() => navigate(`/property/${deals[0].id}`)}
              />
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {deals.map(p => (
                  <FeaturedCard
                    key={p.id}
                    property={p}
                    deal
                    onView={() => navigate(`/property/${p.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section data-aos="fade-up">
            <SectionHeader
              title="Trending destinations"
              subtitle="Travellers searching for India also booked these"
            />
            <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[400px]">
              <button
                onClick={() => triggerSearch(TRENDING[0].city)}
                className="group row-span-2 relative rounded-3xl overflow-hidden shadow-card"
              >
                <img src={TRENDING[0].image} alt={TRENDING[0].city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                    <TrendingUp size={11} /> #1 Trending
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-left">
                  <p className="text-white font-display font-extrabold text-2xl drop-shadow">{TRENDING[0].city}</p>
                  <p className="text-white/85 text-xs mt-0.5 inline-flex items-center gap-1">
                    <MapPin size={11} /> India
                  </p>
                </div>
              </button>
              {TRENDING.slice(1).map((t, i) => (
                <button
                  key={t.city}
                  onClick={() => triggerSearch(t.city)}
                  className="group relative rounded-2xl overflow-hidden shadow-card"
                >
                  <img src={t.image} alt={t.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-[9px] font-bold text-ink uppercase tracking-widest">
                      #{i + 2}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-left">
                    <p className="text-white font-display font-bold text-base drop-shadow">{t.city}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section data-aos="fade-up">
            <SectionHeader
              title="Offers, deals & promotions"
              subtitle="Save more on your next stay with these exclusive deals"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="relative rounded-3xl overflow-hidden p-6 flex flex-col justify-between min-h-[200px] shadow-card-lg [background-image:linear-gradient(135deg,hsl(var(--color-primary-700))_0%,hsl(var(--color-primary-500))_100%)]"
                data-aos="fade-right"
              >
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-widest bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Limited time
                  </span>
                  <h3 className="text-white font-display text-2xl font-extrabold mt-3 leading-tight">Save 20%<br />on Manali stays</h3>
                  <p className="text-white/85 text-sm mt-1.5">Book before 31st May 2026</p>
                </div>
                <button onClick={() => triggerSearch('Manali')}
                  className="mt-4 self-start inline-flex items-center gap-1.5 bg-accent-500 text-ink text-sm font-bold px-5 py-2.5 rounded-md hover:bg-accent-600 transition-colors btn-press shadow-soft">
                  Explore deals <ArrowRight size={14} />
                </button>
                <Mountain size={72} className="absolute right-3 top-3 text-white/15" strokeWidth={1.5} />
              </div>

              <div
                className="relative rounded-3xl overflow-hidden p-6 flex flex-col justify-between min-h-[200px] shadow-card-lg [background-image:linear-gradient(135deg,hsl(160_84%_30%)_0%,hsl(170_70%_45%)_100%)]"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-widest bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    Free cancellation
                  </span>
                  <h3 className="text-white font-display text-2xl font-extrabold mt-3 leading-tight">Flexible<br />Goa getaway</h3>
                  <p className="text-white/85 text-sm mt-1.5">Cancel anytime, no fees</p>
                </div>
                <button onClick={() => triggerSearch('Goa')}
                  className="mt-4 self-start inline-flex items-center gap-1.5 bg-white text-emerald-800 text-sm font-bold px-5 py-2.5 rounded-md hover:bg-emerald-50 transition-colors btn-press shadow-soft">
                  Explore Goa <ArrowRight size={14} />
                </button>
                <Palmtree size={72} className="absolute right-3 top-3 text-white/15" strokeWidth={1.5} />
              </div>

              <div
                className="relative rounded-3xl overflow-hidden p-6 flex flex-col justify-between min-h-[200px] shadow-card-lg [background-image:linear-gradient(135deg,hsl(var(--color-accent-600))_0%,hsl(35_92%_60%)_100%)]"
                data-aos="fade-left"
                data-aos-delay="200"
              >
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white uppercase tracking-widest bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    New member offer
                  </span>
                  <h3 className="text-white font-display text-2xl font-extrabold mt-3 leading-tight">Up to ₹2,000<br />off your first stay</h3>
                  <p className="text-white/85 text-sm mt-1.5">Sign up and unlock the perk</p>
                </div>
                <button onClick={() => navigate('/register')}
                  className="mt-4 self-start inline-flex items-center gap-1.5 bg-white text-accent-600 text-sm font-bold px-5 py-2.5 rounded-md hover:bg-white/90 transition-colors btn-press shadow-soft">
                  Get the offer <ArrowRight size={14} />
                </button>
                <Sparkles size={64} className="absolute right-3 top-3 text-white/15" strokeWidth={1.5} />
              </div>
            </div>
          </section>

          {/* Why choose — upgraded with 4 columns */}
          <section
            className="relative overflow-hidden rounded-3xl bg-gradient-card border border-line/60 p-8 lg:p-10"
            data-aos="fade-up"
          >
            <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
            <div className="relative">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
                  Why StayBook
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-extrabold text-ink mb-2">
                  Travel smart, stay <span className="gradient-text">worry-free</span>
                </h2>
                <p className="text-sm text-muted">
                  Every feature is built around one promise: a stay you&apos;ll be glad you booked.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { Icon: Wallet,       title: 'Best price guarantee', desc: 'Find a lower price elsewhere? We&rsquo;ll match it and credit the difference.' },
                  { Icon: CheckCircle2, title: 'Free cancellation',    desc: 'Flexible plans on most rooms — cancel up to 24 hours before check-in.' },
                  { Icon: ShieldCheck,  title: 'Secure payments',      desc: '100% PCI-compliant checkout. Your card details are never stored.' },
                  { Icon: Headphones,   title: '24/7 support',         desc: 'Real humans available via chat, email and phone, day or night.' },
                ].map(({ Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="bento-card p-5 text-left"
                    data-aos="fade-up"
                    data-aos-delay={i * 80}
                  >
                    <div className="w-11 h-11 rounded-xl bg-surface border border-line/70 flex items-center justify-center text-primary-600 shadow-soft mb-3">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display font-bold text-ink text-sm mb-1">{title}</h3>
                    <p
                      className="text-xs text-muted leading-relaxed"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: desc }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section data-aos="fade-up">
            <SectionHeader
              title="What travellers are saying"
              subtitle="Real reviews from real StayBook guests"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className="bento-card p-6 relative"
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                >
                  <Quote size={28} className="text-primary-500/25 absolute top-4 right-4" />
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < t.rating ? 'text-star fill-star' : 'text-line'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-ink leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-line/60">
                    <div className="w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-glow [background-image:linear-gradient(135deg,hsl(var(--color-primary-500))_0%,hsl(var(--color-accent-500))_100%)]">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-display font-semibold text-ink text-sm">{t.name}</p>
                      <p className="text-xs text-muted inline-flex items-center gap-1">
                        <MapPin size={10} /> {t.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Become a host CTA */}
          <section
            className="relative overflow-hidden rounded-3xl shadow-card-lg [background-image:linear-gradient(135deg,hsl(var(--color-primary-700))_0%,hsl(var(--color-primary-500))_50%,hsl(var(--color-accent-500))_120%)]"
            data-aos="zoom-in-up"
          >
            <div className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="text-white max-w-xl">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full mb-3">
                  <Globe size={11} /> Partner with StayBook
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-extrabold leading-tight">
                  Turn your property into income
                </h3>
                <p className="mt-2 text-white/85 text-sm md:text-base">
                  List your hotel, villa or homestay in minutes. Reach 180K+ travellers and grow your business with zero listing fees.
                </p>
              </div>
              <button
                onClick={() => navigate('/register')}
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white text-primary-700 font-bold text-sm shadow-lift hover:-translate-y-0.5 transition-all btn-press"
              >
                Become a partner <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── Search results ────────────────────────────────────────────────── */}
      {activeDestination && (
        <div className="flex-1">
          <PageWrapper>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Properties in <span className="gradient-text">{activeDestination}</span>
                </h2>
                {!isLoading && (
                  <p className="text-sm text-muted mt-0.5">
                    {filteredAndSorted.length} of {allResults.length} propert{allResults.length !== 1 ? 'ies' : 'y'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted hidden sm:block">Sort by:</span>
                <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                  className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15 transition-all">
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {isLoading && <div className="py-24 flex justify-center"><Spinner size="lg" /></div>}
            {isError   && <ErrorBanner message={getApiError(error)} />}

            {!isLoading && !isError && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <FilterSidebar filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} resultCount={filteredAndSorted.length} />
                <div className="flex-1 min-w-0">
                  {filteredAndSorted.length === 0 ? (
                    <div className="text-center py-20">
                      <Search size={36} className="mx-auto text-muted mb-3" />
                      <p className="text-ink font-display font-semibold">No properties match your filters</p>
                      <p className="text-sm text-muted mt-1">Try adjusting or resetting your filters</p>
                      <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-4 text-sm text-primary-600 hover:underline font-semibold">
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredAndSorted.map(p => (
                        <PropertyCard key={p.id} property={p} checkin={activeCheckin} checkout={activeCheckout} adults={activeAdults} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </PageWrapper>
        </div>
      )}

      <Footer />
      <ChatBot />
    </div>
  );
}
