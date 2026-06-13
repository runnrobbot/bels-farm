import type { BadgeProps } from '@/components/ui/Badge';
import type { AnimalStatus, Species } from '@/types/database';

export const SPECIES_LABEL: Record<Species, string> = {
  cattle: 'Cattle',
  goat: 'Goat',
  sheep: 'Sheep',
};

export const STATUS_LABEL: Record<AnimalStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  deceased: 'Deceased',
  transferred: 'Transferred',
  reserved: 'Reserved',
  quarantine: 'Quarantine',
};

export const STATUS_TONE: Record<AnimalStatus, NonNullable<BadgeProps['tone']>> = {
  active: 'success',
  sold: 'info',
  deceased: 'neutral',
  transferred: 'neutral',
  reserved: 'warning',
  quarantine: 'danger',
};

export const SPECIES_TONE: Record<Species, NonNullable<BadgeProps['tone']>> = {
  cattle: 'primary',
  goat: 'warning',
  sheep: 'info',
};
