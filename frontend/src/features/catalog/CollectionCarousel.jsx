import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/components';

const covers = {
  'golden-hour': 'collection-golden-hour',
  'midnight-velvet': 'collection-midnight-velvet',
  wildflower: 'collection-wildflower',
  'crimson-letters': 'collection-crimson-letters',
  'sunday-together': 'collection-sunday-together',
  spotlight: 'collection-spotlight',
  'studio-ivory': 'collection-studio-ivory',
  'city-pages': 'collection-city-pages',
  'off-duty': 'collection-off-duty',
  'atelier-days': 'collection-atelier-days',
  'noir-signature': 'collection-noir-signature',
  'rose-occasion': 'collection-rose-occasion',
  'sapphire-stage': 'collection-sapphire-stage',
  'travel-maison': 'collection-travel-maison',
  'velvet-romance': 'collection-velvet-romance',
  'runway-wardrobe': 'collection-runway-wardrobe',
};

export default function CollectionCarousel({ collections, language }) {
  const track = useRef(null);
  const [position, setPosition] = useState({ index: 0, start: true, end: false });
  const es = language === 'es';
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const cards = [...element.children];
      const index = cards.reduce(
        (best, card, i) =>
          Math.abs(card.offsetLeft - element.scrollLeft) <
          Math.abs(cards[best].offsetLeft - element.scrollLeft)
            ? i
            : best,
        0,
      );
      setPosition({
        index,
        start: element.scrollLeft < 2,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [collections.length]);
  function move(direction) {
    const element = track.current;
    const card = element?.firstElementChild;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  return (
    <div
      className="collection-carousel"
      role="region"
      aria-roledescription={es ? 'carrusel' : 'carousel'}
      aria-label={es ? 'Colecciones Maison' : 'Maison collections'}
    >
      <div
        className="collection-carousel-track"
        ref={track}
        tabIndex={0}
        aria-label={
          es ? 'Desliza para explorar las colecciones' : 'Scroll to explore the collections'
        }
      >
        {collections.map((collection, index) => (
          <Link
            className="collection-editorial-card"
            key={collection.id}
            to={`/catalog?collection=${encodeURIComponent(collection.id)}`}
          >
            <img
              src={`/media/${covers[collection.id] || 'editorial'}.webp`}
              alt=""
              srcSet={
                covers[collection.id]?.startsWith('collection-')
                  ? `/media/${covers[collection.id]}-small.webp 600w, /media/${covers[collection.id]}.webp 1080w`
                  : undefined
              }
              sizes="(max-width: 600px) 84vw, (max-width: 1000px) 43vw, 32vw"
              width="900"
              height="1200"
              loading="lazy"
              decoding="async"
            />
            <div className="collection-editorial-copy">
              <span className="collection-editorial-index">
                {String(index + 1).padStart(2, '0')} / MAISON
              </span>
              <h3>{collection.name}</h3>
              <p>{collection.description[language]}</p>
              <span className="collection-editorial-link">
                {es ? 'Explorar colección' : 'Explore collection'} <Icon name="arrow" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="collection-carousel-footer">
        <p>{es ? 'Un universo para cada momento.' : 'A world for every moment.'}</p>
        <div className="collection-carousel-controls">
          <span className="collection-carousel-count">
            {String(position.index + 1).padStart(2, '0')} /{' '}
            {String(collections.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={position.start}
            aria-label={es ? 'Colección anterior' : 'Previous collection'}
          >
            <span className="collection-arrow-back">
              <Icon name="arrow" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={position.end}
            aria-label={es ? 'Colección siguiente' : 'Next collection'}
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
