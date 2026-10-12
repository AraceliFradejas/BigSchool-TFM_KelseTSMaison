import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogueSizes } from '@maison/contracts/rules';
import { useMaison, useResource } from '../../shared/state';
import { PageHeading, ProductGrid, ResourceState, Icon, Money } from '../../shared/components';
export default function Catalog() {
  const { t, language } = useMaison();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const collections = useResource('/collections');
  const products = useResource(`/products?${params}`);
  useEffect(() => setSearch(params.get('q') || ''), [params]);
  function change(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  }
  function submit(event) {
    event.preventDefault();
    change('q', search);
  }
  function setPage(page) {
    const next = new URLSearchParams(params);
    next.set('page', page);
    setParams(next);
  }
  return (
    <div className="container page">
      <PageHeading eyebrow="KelseTS MAISON" title={t.catalogue} />
      <Link className="text-link" to="/runway">
        {language === 'es'
          ? 'Descubre los 36 looks de la pasarela'
          : 'Discover the 36 runway looks'}{' '}
        <Icon name="arrow" />
      </Link>
      <div className="filters">
        <form className="search-field" onSubmit={submit}>
          <label className="sr-only" htmlFor="catalog-search">
            {t.search}
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={120}
          />
          <button className="icon-button" aria-label={t.search}>
            <Icon name="search" />
          </button>
        </form>
        <label>
          <span className="sr-only">{t.category}</span>
          <select
            value={params.get('category') || ''}
            onChange={(event) => change('category', event.target.value)}
          >
            <option value="">{t.allCategories}</option>
            {['fashion', 'accessories', 'beauty'].map((category) => (
              <option key={category} value={category}>
                {t[category]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.collection}</span>
          <select
            value={params.get('collection') || ''}
            onChange={(event) => change('collection', event.target.value)}
          >
            <option value="">{t.allCollections}</option>
            {collections.data?.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{t.sort}</span>
          <select
            value={params.get('sort') || 'editorial'}
            onChange={(event) => change('sort', event.target.value)}
          >
            {['editorial', 'price-asc', 'price-desc'].map((sort, i) => (
              <option key={sort} value={sort}>
                {[t.editorial, t.priceAsc, t.priceDesc][i]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-extra-filters">
        <label>
          {t.sizeFilter}
          <select
            value={params.get('size') || ''}
            onChange={(event) => change('size', event.target.value)}
          >
            <option value="">{t.allSizes}</option>
            {catalogueSizes.map((size) => (
              <option key={size} value={size}>
                {size === 'one' ? t.oneSize : size}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.maximumPrice}
          <select
            value={params.get('maxPriceCents') || ''}
            onChange={(event) => change('maxPriceCents', event.target.value)}
          >
            <option value="">{t.anyPrice}</option>
            {[10000, 25000, 50000, 100000, 250000, 500000, 1000000].map((cents) => (
              <option key={cents} value={cents}>
                <Money cents={cents} />
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-meta">
        <span>
          {products.data?.total ?? '—'} {t.results}
        </span>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={params.get('available') === '1'}
            onChange={(event) => change('available', event.target.checked ? '1' : '')}
          />
          {t.availableOnly}
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={params.get('luxury') === '1'}
            onChange={(event) => change('luxury', event.target.checked ? '1' : '')}
          />
          {t.luxuryOnly}
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={params.get('runway') === '1'}
            onChange={(event) => change('runway', event.target.checked ? '1' : '')}
          />
          {language === 'es' ? 'Piezas de la pasarela' : 'Runway pieces'}
        </label>
        {params.size > 0 && (
          <button className="link-button" onClick={() => setParams({})}>
            {t.reset}
          </button>
        )}
      </div>
      <ResourceState resource={products}>
        {products.data && (
          <>
            {products.data.items.length ? (
              <ProductGrid products={products.data.items} returnTo={`/catalog?${params}`} />
            ) : (
              <div className="empty-state">{t.noResults}</div>
            )}
            {products.data.total > products.data.pageSize && (
              <nav className="pagination" aria-label={t.page}>
                <button
                  className="button secondary"
                  disabled={products.data.page <= 1}
                  onClick={() => setPage(products.data.page - 1)}
                >
                  {t.previous}
                </button>
                <span>
                  {t.page} {products.data.page} /{' '}
                  {Math.ceil(products.data.total / products.data.pageSize)}
                </span>
                <button
                  className="button secondary"
                  disabled={products.data.page * products.data.pageSize >= products.data.total}
                  onClick={() => setPage(products.data.page + 1)}
                >
                  {t.next}
                </button>
              </nav>
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
export function Collections() {
  const { language, t } = useMaison();
  const resource = useResource('/collections');
  return (
    <div className="container page">
      <PageHeading eyebrow="KelseTS MAISON" title={t.collections} body={t.selectedBody} />
      <ResourceState resource={resource}>
        <div className="collection-list">
          {resource.data?.map((collection, index) => (
            <Link
              className="collection-row"
              to={`/catalog?collection=${collection.id}`}
              key={collection.id}
              style={{ '--collection-color': collection.color }}
            >
              <span className="collection-swatch">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2>{collection.name}</h2>
                <p>{collection.description[language]}</p>
              </div>
              <Icon name="arrow" />
            </Link>
          ))}
        </div>
      </ResourceState>
    </div>
  );
}
