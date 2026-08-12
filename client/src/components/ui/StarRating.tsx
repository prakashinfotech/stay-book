interface StarRatingProps {
  stars:      number;       // 0-5, decimals supported
  size?:      'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export default function StarRating({ stars, size = 'md', showNumber = false }: StarRatingProps) {
  const filled = Math.floor(stars);
  const half   = stars - filled >= 0.5;

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const active = i < filled || (i === filled && half);
        return (
          <span
            key={i}
            className={active ? 'text-star drop-shadow-[0_1px_3px_hsl(var(--color-star)/0.45)]' : 'text-line'}
          >
            ★
          </span>
        );
      })}
      {showNumber && (
        <span className="ml-1.5 text-muted font-semibold">{stars.toFixed(1)}</span>
      )}
    </span>
  );
}
