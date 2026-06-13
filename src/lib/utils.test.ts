import { describe, expect, it } from 'vitest';
import { cn, formatCurrency, formatWeight, initials, whatsappLink } from './utils';

describe('cn', () => {
  it('merges and dedupes conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', false, undefined, 'font-medium')).toBe('text-sm font-medium');
  });
});

describe('formatCurrency', () => {
  it('formats IDR without decimals', () => {
    expect(formatCurrency(1500000)).toContain('1.500.000');
  });
  it('renders an em dash for nullish values', () => {
    expect(formatCurrency(null)).toBe('—');
  });
});

describe('formatWeight', () => {
  it('appends the kg unit', () => {
    expect(formatWeight(312.5)).toBe('312,5 kg');
  });
});

describe('initials', () => {
  it('takes the first letters of up to two words', () => {
    expect(initials('Budi Santoso')).toBe('BS');
    expect(initials('siti')).toBe('S');
  });
});

describe('whatsappLink', () => {
  it('normalizes a leading zero to the Indonesian country code', () => {
    expect(whatsappLink('081234567890', 'Halo')).toBe('https://wa.me/6281234567890?text=Halo');
  });
});
