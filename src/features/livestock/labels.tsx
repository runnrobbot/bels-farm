import type { BadgeProps } from '@/components/ui/Badge';
import type { AnimalStatus, Species } from '@/types/database';

export const SPECIES_LABEL: Record<Species, string> = {
  cattle: 'Cattle',
  goat: 'Goat',
  sheep: 'Sheep',
};

/**
 * Status hewan dalam bahasa Indonesia. `reserved` sengaja dilabeli "Dipesan"
 * supaya hewan yang sedang dikunci oleh pengajuan pembelian terlihat jelas
 * berbeda dari "Aktif" — sebelumnya keduanya sulit dibedakan sekilas.
 */
export const STATUS_LABEL: Record<AnimalStatus, string> = {
  active: 'Aktif',
  sold: 'Terjual',
  deceased: 'Mati',
  transferred: 'Dipindahkan',
  reserved: 'Dipesan',
  quarantine: 'Karantina',
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
