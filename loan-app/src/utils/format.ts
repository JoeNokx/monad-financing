export function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatGhs(value: string | number | null | undefined) {
  const n = toNumber(value);
  const formatted = new Intl.NumberFormat('en-GH', { maximumFractionDigits: 0 }).format(n);
  return `GH₵ ${formatted}`;
}

export function initials(fullName?: string | null) {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase() || 'U';
}

export function daysUntil(isoDate: string) {
  const due = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = due - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
