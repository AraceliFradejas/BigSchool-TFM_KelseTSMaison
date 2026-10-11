import { catalogImageProps } from '../../shared/media';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMaison, useResource } from '../../shared/state';
import { Money, ProductGrid, ResourceState, Icon } from '../../shared/components';
export default function Product() {
  const { id } = useParams();
  const resource = useResource(`/products/${encodeURIComponent(id)}`);
  const { language, t, add, user, favorites, toggleFavorite, authReady } = useMaison();
  const navigate = useNavigate();
  const [variantId, setVariantId] = useState('');
  const product = resource.data;
  const related = useResource(product ? `/products?collection=${product.collectionId}` : null);
  useEffect(
    () =>
      setVariantId(
        product?.variants.find((variant) => variant.stock > 0)?.id ||
          product?.variants[0]?.id ||
          '',
      ),
    [product],
  );
  const variant = product?.variants.find((item) => item.id === variantId);
  const saved = favorites.includes(id);
  return (
    <div className="container page product-page">
      <Link className="back-link" to="/catalog">
        ← {t.catalogue}
      </Link>
      <ResourceState resource={resource}>
        {product && (
          <>
            <div className="product-detail">
              <div className="detail-picture">
                <img
                  {...catalogImageProps(product.image)}
                  sizes="(max-width: 800px) 90vw, 50vw"
                  alt={product.name[language]}
                  width="600"
                  height="750"
                />
              </div>
              <div className="detail-copy">
                <Link className="eyebrow" to={`/catalog?collection=${product.collectionId}`}>
                  {product.collectionId.replaceAll('-', ' ')}
                </Link>
                <h1>{product.name[language]}</h1>
                <p className="detail-price">
                  <Money cents={variant?.priceCents || product.variants[0].priceCents} />
                </p>
                <p className="detail-description">{product.description[language]}</p>
                <fieldset className="variant-options">
                  <legend>{t.variant}</legend>
                  {product.variants.map((item) => (
                    <label
                      className={`variant-option ${variantId === item.id ? 'selected' : ''} ${item.stock === 0 ? 'unavailable' : ''}`}
                      key={item.id}
                    >
                      <input
                        type="radio"
                        name="variant"
                        value={item.id}
                        checked={variantId === item.id}
                        onChange={() => setVariantId(item.id)}
                      />
                      <span>
                        {item.label[language]}
                        {item.stock === 0 ? ` · ${t.soldOut}` : ''}
                      </span>
                    </label>
                  ))}
                </fieldset>
                <p className={`stock-note ${variant?.stock > 0 ? '' : 'out'}`}>
                  {variant?.stock > 0 ? `${variant.stock} ${t.stock}` : t.soldOut}
                </p>
                <button
                  className="button full"
                  disabled={!variant?.stock || !authReady}
                  onClick={() => add(product, variant)}
                >
                  {t.add}
                  <Icon name="bag" />
                </button>
                <button
                  className="button secondary full"
                  aria-pressed={saved}
                  onClick={() =>
                    user
                      ? toggleFavorite(id)
                      : navigate(`/access?next=${encodeURIComponent(`/products/${id}`)}`)
                  }
                >
                  <Icon name="heart" />
                  {saved ? t.unsave : t.save}
                </button>
                <p className="fine-print">{t.productDemo}</p>
              </div>
            </div>
            <section className="section">
              <div className="section-intro">
                <div>
                  <h2>{t.related}</h2>
                  <p>{t.relatedBody}</p>
                </div>
              </div>
              <ResourceState resource={related}>
                {related.data && (
                  <ProductGrid products={related.data.items.filter((item) => item.id !== id)} />
                )}
              </ResourceState>
            </section>
          </>
        )}
      </ResourceState>
    </div>
  );
}
