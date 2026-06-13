import { Link } from 'react-router-dom';
import { Phone, Instagram, MapPin, Clock } from 'lucide-react';
import { SITE, SITE_NAV, waMessage, WA_PRESETS } from '@/features/marketing/site';
import { paths } from '@/app/routes/paths';
import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="bg-site-moss-dark text-site-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo height={40} />
              <span className="font-serif text-xl font-semibold">{SITE.name}</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-site-paper/70">
              {SITE.description}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-site-paper/50">
              Navigasi
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SITE_NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-site-paper/80 transition-colors hover:text-site-honey">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-site-paper/50">
              Kontak
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-site-paper/80">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-site-honey" />
                <a href={waMessage(WA_PRESETS.general)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Instagram className="size-4 text-site-honey" />
                <a href={SITE.instagram} target="_blank" rel="noreferrer">
                  {SITE.instagramHandle}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-site-honey" />
                <a href={SITE.maps} target="_blank" rel="noreferrer" className="hover:text-site-honey">
                  {SITE.address}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="size-4 text-site-honey" /> {SITE.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-site-paper/15 pt-6 text-sm text-site-paper/55 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Hak cipta dilindungi.
          </p>
          <div className="flex gap-5">
            <Link to={paths.faq} className="hover:text-site-honey">FAQ</Link>
            <Link to={paths.testimonials} className="hover:text-site-honey">Testimoni</Link>
            <Link to={paths.login} className="hover:text-site-honey">Masuk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
