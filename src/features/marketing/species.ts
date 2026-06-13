import type { Species } from '@/types/database';

/** Indonesian species labels for the public site. */
export const SPECIES_ID: Record<Species, string> = {
  cattle: 'Sapi',
  goat: 'Kambing',
  sheep: 'Domba',
};

export const SPECIES_LIST: Species[] = ['cattle', 'goat', 'sheep'];
