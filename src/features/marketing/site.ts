import { env } from '@/config/env';
import { paths } from '@/app/routes/paths';
import { whatsappLink } from '@/lib/utils';

/** Static brand + contact configuration for the public site. */
export const SITE = {
  name: 'BELS FARM',
  tagline: 'Peternakan sapi, kambing & domba terpercaya',
  description:
    'Peternakan modern penyedia sapi, kambing, dan domba berkualitas untuk kebutuhan qurban, aqiqah, dan penggemukan — dengan pencatatan kesehatan dan bobot yang transparan.',
  whatsapp: env.whatsappNumber || '6281234567890',
  instagram: 'https://www.instagram.com/belsfarm.official/',
  instagramHandle: '@belsfarm.official',
  address:
    'Jl. Balai Desa Langgongsari No.37, Dusun II, Langgongsari, Kec. Cilongok, Kabupaten Banyumas, Jawa Tengah 53162',
  maps: 'https://maps.app.goo.gl/4pEyqfmteyJBfo7T6',
  mapsEmbed:
    'https://www.google.com/maps?q=' +
    encodeURIComponent('Jl. Balai Desa Langgongsari No.37, Langgongsari, Cilongok, Banyumas, Jawa Tengah 53162') +
    '&output=embed',
  hours: 'Setiap hari • 07.00 – 18.00 WIB',
} as const;

/** Primary navigation for the public header. */
export const SITE_NAV = [
  { label: 'Beranda', to: paths.home },
  { label: 'Tentang', to: paths.about },
  { label: 'Katalog', to: paths.catalog },
  { label: 'Tabungan Qurban', to: paths.qurbanPublic },
  { label: 'Galeri', to: paths.gallery },
  { label: 'Artikel', to: paths.articles },
  { label: 'Kontak', to: paths.contact },
] as const;

/** Build a WhatsApp link with a prefilled, context-aware message. */
export function waMessage(message: string): string {
  return whatsappLink(SITE.whatsapp, message);
}

export const WA_PRESETS = {
  general: 'Halo BELS FARM, saya ingin bertanya tentang ternak yang tersedia.',
  qurban: 'Halo BELS FARM, saya tertarik dengan program Tabungan Qurban. Mohon informasinya.',
  listing: (title: string) =>
    `Halo BELS FARM, saya tertarik dengan ternak "${title}". Apakah masih tersedia?`,
} as const;
