import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMaison, useResource, api } from '../../shared/state';
import { PageHeading, Money, ProductGrid, ResourceState } from '../../shared/components';
export default function Looks() {
  const { language, t, errorText } = useMaison();
  const resource = useResource('/looks');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mood, setMood] = useState('all');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    const values = new FormData(event.currentTarget);
    try {
      setResult(
        await api.request('/stylist', {
          method: 'POST',
          body: {
            occasion: values.get('occasion'),
            color: values.get('color'),
            budgetCents: Math.round(Number(values.get('budget')) * 100),
            excludeBeauty: values.has('excludeBeauty'),
          },
        }),
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <PageHeading eyebrow={t.lookEyebrow} title={t.lookTitle} body={t.lookBody} />
      <Link className="text-link" to="/runway">
        {language === 'es' ? 'Comprar los 36 looks de la pasarela' : 'Shop the 36 runway looks'}
      </Link>
      <section className="stylist-panel">
        <div>
          <h2>{t.stylist}</h2>
          <p>{t.stylistIntro}</p>
          <span className="mode-badge">{t.editorialMode}</span>
        </div>
        <form className="stylist-form" onSubmit={submit}>
          <label>
            {t.occasion}
            <select name="occasion">
              {[
                'any',
                'dinner',
                'concert',
                'weekend',
                'everyday',
                'event',
                'television',
                'street',
              ].map((value) => (
                <option key={value} value={value}>
                  {t[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.budget}
            <input
              name="budget"
              type="number"
              min="1"
              max="10000"
              step="0.01"
              defaultValue="6500"
              required
            />
          </label>
          <label>
            {t.color}
            <select name="color">
              {['any', 'dark', 'red', 'natural', 'gold', 'green', 'silver'].map((value) => (
                <option key={value} value={value}>
                  {t[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="excludeBeauty" />
            {t.excludeBeauty}
          </label>
          <button className="button" disabled={busy}>
            {busy ? t.working : t.find}
          </button>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>
      {result && (
        <section className="stylist-results" aria-live="polite">
          {result.looks.length === 0 ? (
            <div className="empty-state">{t.noLooks}</div>
          ) : (
            result.looks.map((look) => (
              <div className="look-result" key={look.id}>
                <div className="section-intro">
                  <h2>{look.name}</h2>
                  <p>
                    {t.totalLook}:{' '}
                    <strong>
                      <Money cents={look.totalCents} />
                    </strong>
                  </p>
                </div>
                <ProductGrid
                  products={look.pieces.map((piece) => ({
                    ...piece.product,
                    variants: [piece.variant],
                  }))}
                />
              </div>
            ))
          )}
        </section>
      )}
      <ResourceState resource={resource}>
        <nav className="look-filters" aria-label={t.lookContexts}>
          {['all', 'event', 'television', 'street', 'everyday'].map((value) => (
            <button
              key={value}
              className={`button ${mood === value ? '' : 'secondary'}`}
              aria-pressed={mood === value}
              onClick={() => setMood(value)}
            >
              {value === 'all' ? t.allLooks : t[value]}
            </button>
          ))}
        </nav>
        {resource.data
          ?.filter((look) => !look.sourceId && (mood === 'all' || look.mood === mood))
          .map((look) => (
            <section className="look-section" key={look.id}>
              <div className="section-intro">
                <div>
                  <p className="eyebrow">{look.mood ? t[look.mood] : t.editorial}</p>
                  <h2>{look.name}</h2>
                  <p>{look.description[language]}</p>
                </div>
                {!look.complete && <p>{t.lookIncomplete}</p>}
              </div>
              <ProductGrid products={look.products} />
            </section>
          ))}
      </ResourceState>
    </div>
  );
}
