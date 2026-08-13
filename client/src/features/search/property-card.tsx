import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Wifi, Waves, ParkingSquare, Dumbbell, Utensils,
  Sparkles, Snowflake, Coffee, Wine, PawPrint, CheckCircle2, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { SearchResult } from '../../types';
import { formatPrice } from '../../utils/format';

interface PropertyCardProps {
  property: SearchResult;
  checkin: string;
  checkout: string;
  adults: number;
}

const AMENITY_ICONS: { match: string; Icon: LucideIcon }[] = [
  { match: 'wifi',       Icon: Wifi },
  { match: 'pool',       Icon: Waves },
  { match: 'parking',    Icon: ParkingSquare },
  { match: 'gym',        Icon: Dumbbell },
  { match: 'restaurant', Icon: Utensils },
  { match: 'spa',        Icon: Sparkles },
  { match: 'ac',         Icon: Snowflake },
  { match: 'breakfast',  Icon: Coffee },
  { match: 'bar',        Icon: Wine },
  { match: 'pet',        Icon: PawPrint },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < rating ? 'text-star drop-shadow-[0_1px_3px_hsl(var(--color-star)/0.45)]' : 'text-line'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function PropertyCard({ property, checkin, checkout, adults }: PropertyCardProps) {
  const params = new URLSearchParams({ checkin, checkout, adults: String(adults) });

  const amenities: string[] = Array.isArray(property.amenities)
    ? (property.amenities as string[])
    : [];

  const visibleAmenities = amenities.slice(0, 3);
  const hasFreeCancellation = amenities.some(a => a.toLowerCase().includes('cancel'));

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="h-full">
      <Link
        to={`/property/${property.id}?${params.toString()}`}
        className="group flex flex-col h-full bento-card overflow-hidden"
      >
        {/* Cover image */}
        <div className="relative aspect-[4/3] bg-surface-elev overflow-hidden flex-shrink-0">
          {property.cover_image ? (
            <img
              src={property.cover_image}
              alt={property.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <MapPin size={32} />
            </div>
          )}

          {/* Image gradient overlay for badge contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

          {/* Category badge */}
          <span className="absolute top-3 left-3 backdrop-blur-md bg-white/85 text-ink text-[10px] font-bold px-2.5 py-1 rounded-full capitalize shadow-soft">
            {property.category.toLowerCase()}
          </span>

          {/* Free cancellation badge */}
          {hasFreeCancellation && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 backdrop-blur-md bg-success/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-soft">
              <CheckCircle2 size={11} /> Free cancel
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Star rating */}
          {property.star_rating !== null && (
            <div className="mb-1.5 flex-shrink-0">
              <StarRow rating={Math.round(property.star_rating)} />
            </div>
          )}

          {/* Name */}
          <h3 className="font-display font-bold text-ink text-sm leading-snug line-clamp-2 mb-1 flex-shrink-0">
            {property.name}
          </h3>

          {/* City */}
          <p className="text-xs text-muted mb-2.5 inline-flex items-center gap-1 flex-shrink-0">
            <MapPin size={12} />
            {property.city}
          </p>

          {/* Amenity pills — constrained height */}
          {visibleAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0 h-8 overflow-hidden">
              {visibleAmenities.map(amenity => {
                const key = amenity.toLowerCase();
                const found = AMENITY_ICONS.find(a => key.includes(a.match));
                const Icon = found?.Icon ?? CheckCircle2;
                return (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 text-[10px] text-muted bg-surface-elev border border-line rounded-full px-2 py-0.5"
                  >
                    <Icon size={10} /> {amenity}
                  </span>
                );
              })}
              {amenities.length > 3 && (
                <span className="text-[10px] text-muted/70 px-1 py-0.5">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Spacer to push price to bottom */}
          <div className="flex-1" />

          {/* Price */}
          {property.min_price && (
            <div className="flex items-end justify-between border-t border-line/70 pt-3 flex-shrink-0">
              <div>
                <span className="text-[10px] text-muted block uppercase tracking-wide">from</span>
                <span className="text-lg font-display font-extrabold gradient-text">
                  {formatPrice(property.min_price)}
                </span>
                <span className="text-muted font-normal text-xs"> / night</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-500/10 px-3 py-1.5 rounded-md group-hover:bg-primary-600 group-hover:text-white transition-colors">
                View <ArrowRight size={12} />
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
