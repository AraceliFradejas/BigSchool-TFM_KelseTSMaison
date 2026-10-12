import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMaison, useResource } from '../../shared/state';
import { catalogImageProps } from '../../shared/media';
import { PageHeading, ResourceState, Money, Icon } from '../../shared/components';

export default function Runway() {
  const { language, t } = useMaison();
  const resource = useResource('/looks');
  const [mood, setMood] = useState('all');
  const [era, setEra] = useState('all');
  const es = language === 'es';
  const looks = resource.data?.filter((look) => look.sourceId);
  const visible = looks?.filter(
    (look) => (mood === 'all' || look.mood === mood) && (era === 'all' || look.songAlbum === era),
  );
  return (
    <div className="container page">
      <PageHeading
        eyebrow="THE RUNWAY WARDROBE"
        title={es ? 'De la pasarela a tu armario' : 'From the runway to your wardrobe'}
        body={
          es
            ? '36 looks con espíritu swiftie y nombres de canciones. De tus planes cotidianos a tus noches de gala: encuentra tu era, elige una pieza o lleva el conjunto.'
            : '36 looks with a Swiftie spirit and song titles. From everyday plans to gala nights: find your era, choose one piece or take the complete outfit.'
        }
      />
      <Link className="text-link" to="/catalog?runway=1">
        {es ? 'Ver todas las piezas' : 'Browse every piece'} <Icon name="arrow" />
      </Link>
      <nav className="look-filters" aria-label={t.lookContexts}>
        {['all', 'everyday', 'street', 'weekend', 'television', 'dinner', 'concert', 'event'].map(
          (value) => (
            <button
              key={value}
              className={`button ${mood === value ? '' : 'secondary'}`}
              aria-pressed={mood === value}
              onClick={() => setMood(value)}
            >
              {value === 'all' ? t.allLooks : t[value]}
            </button>
          ),
        )}
      </nav>
      <label className="runway-era-filter">
        {es ? 'Tu era' : 'Your era'}
        <select value={era} onChange={(event) => setEra(event.target.value)}>
          <option value="all">{es ? 'Todas las eras' : 'All eras'}</option>
          {[
            'Taylor Swift',
            'Fearless',
            'Speak Now',
            'Red',
            '1989',
            'reputation',
            'Lover',
            'folklore',
            'evermore',
            'Midnights',
            'The Tortured Poets Department',
            'The Life of a Showgirl',
          ].map((album) => (
            <option value={album} key={album}>
              {album}
            </option>
          ))}
        </select>
      </label>
      <ResourceState resource={resource}>
        {visible?.length === 0 && (
          <div className="empty-state">
            <p>{t.noResults}</p>
            <button
              className="button secondary"
              onClick={() => {
                setMood('all');
                setEra('all');
              }}
            >
              {t.reset}
            </button>
          </div>
        )}
        <div className="runway-grid">
          {visible?.map((look) => (
            <article className="runway-card" key={look.id}>
              <Link to={`/runway/${look.id}`}>
                <img
                  {...catalogImageProps(look.image)}
                  alt={look.name}
                  width="384"
                  height="1024"
                  loading="lazy"
                />
              </Link>
              <p className="eyebrow">
                {String(look.position).padStart(2, '0')} / 36 · {t[look.mood]}
              </p>
              <h2>
                <Link to={`/runway/${look.id}`}>{look.name}</Link>
              </h2>
              <p className="runway-album">{look.songAlbum}</p>
              <p>
                {look.products.length} {es ? 'piezas' : 'pieces'}
              </p>
              <Link className="text-link" to={`/runway/${look.id}`}>
                {es ? 'Elegir mi look' : 'Choose my look'} <Icon name="arrow" />
              </Link>
            </article>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}

export function RunwayLook() {
  const { id } = useParams();
  const { t } = useMaison();
  const resource = useResource('/looks');
  return (
    <ResourceState resource={resource}>
      {resource.data &&
        (resource.data.some((look) => look.id === id && look.sourceId) ? (
          <LookSelection
            key={id}
            look={resource.data.find((look) => look.id === id)}
            looks={resource.data.filter((look) => look.sourceId)}
          />
        ) : (
          <div className="container page">
            <Link to="/runway">← The Runway Wardrobe</Link>
            <p>{t.noResults}</p>
          </div>
        ))}
    </ResourceState>
  );
}
function LookSelection({ look, looks }) {
  const { language, t, add, addSelection, authReady } = useMaison();
  const es = language === 'es';
  const previous = looks.find((item) => item.position === look.position - 1);
  const next = looks.find((item) => item.position === look.position + 1);
  // Selection is explicit: do not silently choose a size for the customer.
  const [selected, setSelected] = useState({});
  const pieces = look.products.map((product) => ({
    product,
    variant: product.variants.find((variant) => variant.id === selected[product.id]),
  }));
  const ready = look.complete && pieces.every((piece) => piece.variant?.stock > 0);
  const total = pieces.reduce(
    (sum, piece) =>
      sum +
      (piece.variant?.priceCents ??
        Math.min(...piece.product.variants.map((variant) => variant.priceCents))),
    0,
  );
  return (
    <div className="container page">
      <Link className="back-link" to="/runway">
        ← {es ? 'Todos los looks' : 'All looks'}
      </Link>
      <div className="runway-detail">
        <img
          className="runway-look-photo"
          {...catalogImageProps(look.image)}
          alt={look.name}
          width="384"
          height="1024"
        />
        <div>
          <p className="eyebrow">
            THE RUNWAY WARDROBE · {String(look.position).padStart(2, '0')} / 36
          </p>
          <h1>{look.name}</h1>
          <p className="runway-album">
            {look.songAlbum} · {es ? 'Espíritu swiftie' : 'Swiftie spirit'}
          </p>
          <p>{look.description[language]}</p>
          <a
            className="text-link"
            href={`/media/maison-film-lateral-mobile.mp4#t=${(look.position - 1) * 2.5}`}
            target="_blank"
            rel="noreferrer"
          >
            {es ? 'Ver este look en la pasarela' : 'Watch this look on the runway'}{' '}
            <Icon name="arrow" />
          </a>
          <div className="runway-pieces">
            {pieces.map(({ product, variant }) => (
              <div className="runway-piece" key={product.id}>
                <Link className="runway-piece-product" to={`/products/${product.id}`}>
                  <img
                    {...catalogImageProps(product.image)}
                    alt=""
                    width="80"
                    height="80"
                    loading="lazy"
                  />
                  <span>{product.name[language]}</span>
                </Link>
                <Money cents={variant?.priceCents ?? product.variants[0].priceCents} />
                <label>
                  {t.variant}
                  <select
                    value={selected[product.id] || ''}
                    onChange={(event) =>
                      setSelected({ ...selected, [product.id]: event.target.value })
                    }
                  >
                    <option value="">
                      {es ? 'Elige talla o variante' : 'Choose size or variant'}
                    </option>
                    {product.variants.map((item) => (
                      <option value={item.id} key={item.id} disabled={item.stock === 0}>
                        {item.label[language]}
                        {item.stock === 0 ? ` · ${t.soldOut}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button secondary"
                  disabled={!authReady || !variant?.stock}
                  onClick={() => add(product, variant)}
                >
                  {es ? 'Añadir esta pieza' : 'Add this piece'}
                </button>
              </div>
            ))}
          </div>
          <div className="runway-total">
            <span>{es ? 'Look completo' : 'Complete outfit'}</span>
            <Money cents={total} />
          </div>
          {!ready && (
            <p className="fine-print">
              {es
                ? 'Elige la variante de cada pieza para añadir el conjunto.'
                : 'Choose each piece’s variant to add the complete outfit.'}
            </p>
          )}
          <button
            className="button full"
            disabled={!authReady || !ready}
            onClick={() => addSelection(pieces)}
          >
            {es ? 'Añadir look completo a la bolsa' : 'Add complete outfit to bag'}{' '}
            <Icon name="bag" />
          </button>
          <p className="fine-print">{t.productDemo}</p>
        </div>
      </div>
      <nav
        className="runway-pagination"
        aria-label={es ? 'Recorrer la pasarela' : 'Browse the runway'}
      >
        {previous && (
          <Link to={`/runway/${previous.id}`}>
            ← {es ? 'Look anterior' : 'Previous look'} · {previous.name}
          </Link>
        )}
        {next && (
          <Link className="runway-next" to={`/runway/${next.id}`}>
            {es ? 'Siguiente look' : 'Next look'} · {next.name} →
          </Link>
        )}
      </nav>
    </div>
  );
}
