import { Link } from 'react-router-dom';
import { useMaison, useResource } from '../../shared/state';
import { Icon, ProductGrid, ResourceState } from '../../shared/components';
export default function Home() {
  const { language, t } = useMaison();
  const products = useResource('/products');
  const collections = useResource('/collections');
  const newEdit = useResource('/products?luxury=1');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="hero-description">{t.heroBody}</p>
          <Link className="button" to="/catalog">
            {t.explore}
            <Icon name="arrow" />
          </Link>
          <span className="hero-caption">EST. 2026 · ARACELI FRADEJAS MUÑOZ</span>
        </div>
        <div className="hero-art">
          <img
            src="/media/campaign.webp"
            alt={
              language === 'es'
                ? 'Escena editorial fotorrealista de un vestido marfil y un pañuelo rojo en un espacio de boutique'
                : 'Photorealistic editorial scene of an ivory dress and a red scarf in a boutique setting'
            }
            width="900"
            height="1000"
            fetchPriority="high"
          />
          <span className="art-caption">KelseTS Maison / 01</span>
        </div>
      </section>
      <section className="section container">
        <div className="section-intro">
          <div>
            <p className="eyebrow">{t.edit}</p>
            <h2>{t.selectedTitle}</h2>
          </div>
          <div>
            <p>{t.selectedBody}</p>
            <Link className="text-link" to="/catalog">
              {t.all}
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <ResourceState resource={products}>
          {products.data && (
            <ProductGrid
              products={[0, 4, 11, 6].map((index) => products.data.items[index]).filter(Boolean)}
            />
          )}
        </ResourceState>
      </section>
      <section className="section container">
        <div className="section-intro">
          <div>
            <p className="eyebrow">{t.newEdit}</p>
            <h2>{t.newEditTitle}</h2>
            <p>{t.newEditBody}</p>
          </div>
          <Link className="text-link" to="/looks">
            {t.discoverLooks}
            <Icon name="arrow" />
          </Link>
        </div>
        <ResourceState resource={newEdit}>
          {newEdit.data && <ProductGrid products={newEdit.data.items.slice(0, 4)} />}
        </ResourceState>
      </section>
      <section className="collections-section">
        <div className="container">
          <div className="section-intro">
            <div>
              <p className="eyebrow">KelseTS MAISON</p>
              <h2>{t.collections}</h2>
            </div>
            <Link className="text-link" to="/collections">
              {t.all}
              <Icon name="arrow" />
            </Link>
          </div>
          <ResourceState resource={collections}>
            <div className="collection-strip">
              {collections.data?.map((collection, i) => (
                <Link
                  to={`/catalog?collection=${collection.id}`}
                  className="collection-tile"
                  key={collection.id}
                  style={{ '--collection-color': collection.color }}
                >
                  <span className="collection-number">{String(i + 1).padStart(2, '0')}</span>
                  <span className="collection-name">{collection.name}</span>
                  <span className="collection-description">{collection.description[language]}</span>
                  <Icon name="arrow" />
                </Link>
              ))}
            </div>
          </ResourceState>
        </div>
      </section>
      <section className="look-teaser container">
        <div className="look-teaser-art" aria-hidden="true">
          <img src="/media/editorial.webp" alt="" width="800" height="650" loading="lazy" />
        </div>
        <div>
          <p className="eyebrow">{t.lookEyebrow}</p>
          <h2>{t.lookTitle}</h2>
          <p>{t.lookBody}</p>
          <Link className="button secondary" to="/looks">
            {t.discoverLooks}
            <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
