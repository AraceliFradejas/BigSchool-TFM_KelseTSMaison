import { catalogImageProps } from './media';
import { Link, useNavigate } from 'react-router-dom';
import { useMaison } from './state';
export function Icon({ name, ...props }) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    heart: (
      <path d="M20 4.8c-2.2-2.1-5.6-1.6-8 1-2.4-2.6-5.8-3.1-8-1-3 2.8-2 6.9.3 9L12 21l7.7-7.2c2.3-2.1 3.3-6.2.3-9Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="m15 15 6 6" />
      </>
    ),
    menu: (
      <>
        <path d="M3 6h18M3 12h18M3 18h18" />
      </>
    ),
    close: (
      <>
        <path d="m5 5 14 14M19 5 5 19" />
      </>
    ),
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
export function Money({ cents }) {
  const { language } = useMaison();
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    useGrouping: 'always',
  }).format(cents / 100);
}
export function ResourceState({ resource, children }) {
  const { t, errorText } = useMaison();
  if (resource.loading)
    return (
      <div className="resource-state" role="status">
        {t.loading}
      </div>
    );
  if (resource.error)
    return (
      <div className="resource-state" role="alert">
        <p>{errorText(resource.error)}</p>
        <button className="button secondary" onClick={resource.reload}>
          {t.retry}
        </button>
      </div>
    );
  return children;
}
export function ProductCard({ product, returnTo }) {
  const { language, t, favorites, user, toggleFavorite } = useMaison();
  const navigate = useNavigate();
  const available = product.variants.some((variant) => variant.stock > 0);
  const saved = favorites.includes(product.id);
  return (
    <article className={`product-card${product.tags.includes('runway') ? ' is-runway' : ''}`}>
      <div className="product-picture">
        <Link
          to={`/products/${product.id}`}
          state={returnTo ? { returnTo } : undefined}
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            {...catalogImageProps(product.image)}
            alt=""
            width="600"
            height="750"
            loading="lazy"
          />
        </Link>
        <button
          className={`favorite-button ${saved ? 'is-saved' : ''}`}
          aria-label={`${saved ? t.unsave : t.save}: ${product.name[language]}`}
          aria-pressed={saved}
          onClick={() =>
            user
              ? toggleFavorite(product.id)
              : navigate(`/access?next=${encodeURIComponent(`/products/${product.id}`)}`)
          }
        >
          <Icon name="heart" />
        </button>
        {!available && <span className="sold-out">{t.soldOut}</span>}
      </div>
      <div className="product-info">
        <div>
          <span className="eyebrow small">{t[product.category]}</span>
          <h3>
            <Link to={`/products/${product.id}`} state={returnTo ? { returnTo } : undefined}>
              {product.name[language]}
            </Link>
          </h3>
        </div>
        <span className="product-price">
          <Money
            cents={
              product.matchedPriceCents ??
              Math.min(...product.variants.map((variant) => variant.priceCents))
            }
          />
        </span>
      </div>
    </article>
  );
}
export function ProductGrid({ products, returnTo }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} returnTo={returnTo} />
      ))}
    </div>
  );
}
export function PageHeading({ eyebrow, title, body }) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {body && <p>{body}</p>}
    </header>
  );
}
export function Empty({ text, to = '/catalog', label }) {
  const { t } = useMaison();
  return (
    <div className="empty-state">
      <p>{text}</p>
      <Link className="text-link" to={to}>
        {label || t.explore}
        <Icon name="arrow" />
      </Link>
    </div>
  );
}
export function OrderLines({ lines }) {
  const { language, t } = useMaison();
  return (
    <div className="order-lines">
      {lines.map((line) => (
        <div className="order-line" key={line.variantId}>
          <img src={line.image} alt="" width="80" height="100" />
          <div>
            <h3>{line.name[language]}</h3>
            <p>{line.variantLabel[language]}</p>
            <p>
              {t.quantity}: {line.quantity} · <Money cents={line.unitPriceCents} />
            </p>
          </div>
          <strong>
            <Money cents={line.subtotalCents} />
          </strong>
        </div>
      ))}
    </div>
  );
}
