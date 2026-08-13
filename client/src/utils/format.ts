export function formatPrice(amount: number | string, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatNights(checkin: string, checkout: string): number {
  const diff = new Date(checkout).getTime() - new Date(checkin).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatOccupancy(adults: number, children = 0): string {
  const parts = [`${adults} adult${adults !== 1 ? 's' : ''}`];
  if (children > 0) parts.push(`${children} child${children !== 1 ? 'ren' : ''}`);
  return parts.join(', ');
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
