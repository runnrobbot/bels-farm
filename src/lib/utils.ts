import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner (clsx + conflict resolution). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Indonesian Rupiah without trailing decimals. */
export function formatCurrency(value: number | null | undefined, currency = 'IDR'): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compact number formatting (1.2k, 3.4M). */
export function formatCompact(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return '—';
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(kg)} kg`;
}

/** Stable initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Build a WhatsApp deep link with a prefilled message. */
export function whatsappLink(phone: string, message: string): string {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Narrow an `unknown` value to a concrete type at a trust boundary (e.g. a
 * Supabase embedded-relation result whose shape we know but the generated types
 * can't express). Keeps the assertion in one obvious place.
 */
export const castAs = <T>(value: unknown): T => value as T;

/** Converts '' values to null — handy before sending form data to the DB. */
export function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])) as T;
}
