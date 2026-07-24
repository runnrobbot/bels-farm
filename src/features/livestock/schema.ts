import { z } from 'zod';

export const SPECIES = ['cattle', 'goat', 'sheep'] as const;
export const SEXES = ['male', 'female', 'unknown'] as const;
export const STATUSES = [
  'active',
  'sold',
  'deceased',
  'transferred',
  'reserved',
  'quarantine',
] as const;
export const ACQUISITIONS = ['born_on_farm', 'purchased', 'donated', 'transferred_in'] as const;

/** Form schema for creating/editing an animal. */
export const animalSchema = z.object({
  ear_tag: z.string().min(1, 'Ear tag is required').max(40),
  name: z.string().max(80).optional().or(z.literal('')),
  species: z.enum(SPECIES),
  sex: z.enum(SEXES).default('unknown'),
  breed_id: z.string().uuid().optional().nullable(),
  pen_id: z.string().uuid().optional().nullable(),
  color: z.string().max(40).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  acquisition: z.enum(ACQUISITIONS).default('born_on_farm'),
  acquired_at: z.string().optional().or(z.literal('')),
  status: z.enum(STATUSES).default('active'),
  current_weight_kg: z.coerce.number().min(0).max(5000).optional().nullable(),
  purchase_price: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().or(z.literal('')),
  // Public catalog listing
  is_listed: z.boolean().default(false),
  listing_title: z.string().max(120).optional().or(z.literal('')),
  listing_price: z.coerce.number().min(0).optional().nullable(),
  listing_description: z.string().max(800).optional().or(z.literal('')),
  gallery_urls: z.array(z.string().url()).max(5).default([]),
});

export type AnimalFormValues = z.infer<typeof animalSchema>;

export interface AnimalFilters {
  search?: string;
  species?: (typeof SPECIES)[number] | 'all';
  // 'in_stock' is a virtual filter that expands to all IN_STOCK_STATUSES
  // (active + reserved + quarantine) in livestockService.list, so that live
  // animals never silently disappear from the default view. 'all' shows every
  // status including sold/deceased/transferred.
  status?: (typeof STATUSES)[number] | 'all' | 'in_stock';
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: AnimalFilters = {
  search: '',
  species: 'all',
  status: 'in_stock',
  page: 0,
  pageSize: 25,
};
