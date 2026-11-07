import { Link } from 'react-router-dom';
import { Icon } from '../../shared/components';
import { catalogImageProps } from '../../shared/media';

const previews = [
  { id: 'metro-ciudad-1', name: 'Welcome to New York', number: '01' },
  { id: 'elegancia-1', name: 'Style', number: '02' },
  { id: 'gala-1', name: 'Enchanted', number: '33' },
];

export default function RunwayTeaser({ language }) {
  const es = language === 'es';
  return (
    <section className="runway-teaser" aria-labelledby="runway-teaser-title">
      <div className="container runway-teaser-layout">
        <div className="runway-teaser-copy">
          <p className="eyebrow">THE RUNWAY WARDROBE / 36 LOOKS</p>
          <h2 id="runway-teaser-title">
            {es ? (
              <>
                Del cuaderno
                <br />
                <em>a tu armario.</em>
              </>
            ) : (
              <>
                From the sketchbook
                <br />
                <em>to your wardrobe.</em>
              </>
            )}
          </h2>
          <p className="runway-teaser-description">
            {es
              ? 'Una idea se convierte en una prenda. Una prenda, en tu próxima historia. Descubre los looks de la pasarela y elige cómo llevarlos.'
              : 'An idea becomes a piece. A piece becomes your next story. Discover the runway looks and choose how to wear them.'}
          </p>
          <Link className="runway-teaser-cta" to="/runway">
            {es ? 'Explorar los 36 looks' : 'Explore the 36 looks'} <Icon name="arrow" />
          </Link>
          <Link className="runway-teaser-pieces" to="/catalog?runway=1">
            {es ? 'O encuentra tu próxima pieza' : 'Or find your next piece'}
          </Link>
        </div>
        <div
          className="runway-teaser-gallery"
          aria-label={es ? 'Un adelanto de la pasarela' : 'A preview of the runway'}
        >
          {previews.map((look) => (
            <Link
              className="runway-teaser-look"
              key={look.id}
              to={`/runway/look-runway-${look.id}`}
            >
              <span className="runway-teaser-look-number">LOOK {look.number}</span>
              <img
                {...catalogImageProps(`/media/runway-${look.id}.webp`)}
                sizes="(max-width: 700px) 28vw, (max-width: 1000px) 22vw, 16vw"
                width="384"
                height="1024"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="runway-teaser-look-name">
                {look.name} <Icon name="arrow" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
