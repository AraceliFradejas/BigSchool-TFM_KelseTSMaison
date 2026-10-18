import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  demoBoutiques,
  boutiqueCopy,
  streetViewUrl,
  boutiqueMapUrl,
  distanceLabel,
} from '@maison/contracts/boutiques';
import { useMaison } from '../../shared/state';
// Adapted from the map and neighbourhood previews in Araceli Fradejas Muñoz's KelseTS Cars.
const BoutiqueMap = lazy(() => import('./BoutiqueMap'));
export function BoutiqueExplorer({ language, selectedId, onChoose, disabled = false }) {
  const t = boutiqueCopy[language];
  const [selected, setSelected] = useState(selectedId || null);
  const [origin, setOrigin] = useState(null);
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  useEffect(() => {
    if (selectedId) setSelected(selectedId);
  }, [selectedId]);
  function locate() {
    if (!navigator.geolocation) {
      setError(t.denied);
      return;
    }
    const id = ++request.current;
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        if (id !== request.current) return;
        setOrigin({ latitude: result.coords.latitude, longitude: result.coords.longitude });
        setLocating(false);
      },
      () => {
        if (id !== request.current) return;
        setLocating(false);
        setError(t.denied);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }
  function choosePoint(value) {
    request.current++;
    setOrigin(value);
    setPicking(false);
    setLocating(false);
    setError('');
  }
  return (
    <section className="boutique-explorer">
      <p className="demo-notice">{t.fiction}</p>
      <p className="fine-print">{t.region}</p>
      <div className="boutique-controls">
        <button
          type="button"
          className="button secondary"
          disabled={locating || disabled}
          onClick={locate}
        >
          {locating ? t.locating : t.locate}
        </button>
        <button
          type="button"
          className="underlined"
          disabled={disabled}
          onClick={() => setPicking(!picking)}
        >
          {t.point}
        </button>
        {origin && (
          <button
            type="button"
            className="underlined"
            onClick={() => {
              request.current++;
              setOrigin(null);
              setLocating(false);
              setPicking(false);
              setError('');
            }}
          >
            {t.clear}
          </button>
        )}
      </div>
      <p className="fine-print">{t.privacy}</p>
      {error && <p role="alert">{error}</p>}
      {picking && <p role="status">{t.picking}</p>}
      <Suspense fallback={<p role="status">{t.mapLabel}…</p>}>
        <BoutiqueMap
          origin={origin}
          language={language}
          selected={selected}
          picking={picking}
          onPoint={choosePoint}
          onSelect={setSelected}
        />
      </Suspense>
      <div className="boutique-cards">
        {demoBoutiques.map((b) => (
          <article className={`boutique-card ${selectedId === b.id ? 'chosen' : ''}`} key={b.id}>
            <img src={b.image} alt={b.location[language]} width="600" height="400" loading="lazy" />
            <div className="boutique-card-body">
              <h3>{b.name}</h3>
              <p>{b.location[language]}</p>
              <p className="fine-print">{t.photo}</p>
              <p className="fine-print">
                <a href={b.photo.sourceUrl} target="_blank" rel="noreferrer">
                  {b.photo.author}
                </a>{' '}
                ·{' '}
                <a href={b.photo.licenseUrl} target="_blank" rel="noreferrer">
                  {b.photo.license}
                </a>{' '}
                · {t.changes}
              </p>
              {origin && (
                <p aria-live="polite">
                  <strong>
                    {distanceLabel(origin, b, language)} {t.distance}
                  </strong>
                </p>
              )}
              <button
                type="button"
                className="underlined"
                disabled={disabled}
                onClick={() => setSelected(b.id)}
              >
                {t.map}
              </button>
              {onChoose && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={disabled}
                  aria-pressed={selectedId === b.id}
                  onClick={() => {
                    onChoose(b.id);
                    setSelected(b.id);
                  }}
                >
                  {selectedId === b.id ? t.selected : t.choose}
                </button>
              )}
              <a href={streetViewUrl(b)} target="_blank" rel="noreferrer">
                {t.street}
              </a>
              <a href={boutiqueMapUrl(b)} target="_blank" rel="noreferrer">
                {t.externalMap}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export default function Boutiques() {
  const { language } = useMaison();
  const t = boutiqueCopy[language];
  return (
    <div className="container page">
      <p className="eyebrow">KELSETS MAISON · DEMO</p>
      <h1>{t.title}</h1>
      <p>{t.intro}</p>
      <BoutiqueExplorer language={language} />
    </div>
  );
}
