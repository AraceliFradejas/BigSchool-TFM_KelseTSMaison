import { demoBoutiques, boutiqueCopy } from '@maison/contracts/boutiques';
import { Link } from 'react-router-dom';
import { useMaison } from '../../shared/state';
import { PageHeading } from '../../shared/components';
import { socialLinks } from '../../app/Layout';
export default function Story() {
  const { t } = useMaison();
  return (
    <div className="container page story-page">
      <PageHeading eyebrow="UNIVERSO KelseTS" title={t.aboutTitle} body={t.aboutIntro} />
      <div className="story-layout">
        <div className="story-art">
          <img src="/media/story.webp" alt="" width="650" height="800" />
        </div>
        <div className="story-copy">
          <p>{t.aboutText}</p>
          <p>{t.aboutText2}</p>
          <h2>{t.aboutPersonal}</h2>
          <p>{t.aboutPersonalBody}</p>
          <div className="project-links">
            <a href="https://proyecto-landing-page-1.vercel.app/" target="_blank" rel="noreferrer">
              AFM Moda Oceánica ↗
            </a>
            <a href="https://kelsets-cars.vercel.app" target="_blank" rel="noreferrer">
              KelseTS Cars ↗
            </a>
          </div>
          <h2>{t.portfolio}</h2>
          <div className="social-links">
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ))}
          </div>
          <Link className="text-link" to="/catalog">
            {t.explore} →
          </Link>
        </div>
      </div>
    </div>
  );
}
export function Credits() {
  const { t, language } = useMaison();
  const b = boutiqueCopy[language];
  return (
    <div className="container page prose-page">
      <PageHeading title={t.credits} />
      <p>{t.legal}</p>
      <p>{t.creditsBody}</p>
      <section id="boutique-photos">
        <h2>{b.title}</h2>
        <p>{b.photo}</p>
        <p>{b.fiction}</p>
        {demoBoutiques.map((item) => (
          <article key={item.id}>
            <h3>{item.name}</h3>
            <p>
              <a href={item.photo.sourceUrl} target="_blank" rel="noreferrer">
                {item.photo.author} · Wikimedia Commons
              </a>{' '}
              ·{' '}
              <a href={item.photo.licenseUrl} target="_blank" rel="noreferrer">
                {item.photo.license}
              </a>
            </p>
            <p>{b.changes}</p>
          </article>
        ))}
        <p>
          Mapas web: Leaflet · ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap contributors
          </a>
          . Street View: Google Maps.
        </p>
      </section>

      <p>{t.demo}</p>
      <p>{t.author}</p>
    </div>
  );
}
