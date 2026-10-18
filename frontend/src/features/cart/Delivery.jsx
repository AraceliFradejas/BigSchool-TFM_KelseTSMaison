import { BoutiqueExplorer } from '../boutiques/Boutiques';
import {
  demoBoutiques,
  deliveryAreas,
  fulfillmentCopy,
  fulfillmentLines,
} from '@maison/contracts/fulfillment';
export function DeliveryForm({ value, onChange, language, busy }) {
  const t = fulfillmentCopy[language];
  const change = (key, next) => onChange({ ...value, [key]: next });
  return (
    <fieldset disabled={busy}>
      <legend>{t.title}</legend>
      <p className="fine-print">{t.notice}</p>
      <label>
        {t.recipient}
        <input
          value={value.recipientName}
          onChange={(e) => change('recipientName', e.target.value)}
          required
          minLength={2}
          maxLength={80}
          autoComplete="off"
          placeholder={language === 'es' ? 'Alex Maison (ejemplo)' : 'Alex Maison (example)'}
        />
      </label>
      {['home', 'pickup'].map((method) => (
        <label className="payment-option" key={method}>
          <input
            type="radio"
            name="delivery-method"
            checked={value.method === method}
            onChange={() => change('method', method)}
          />
          {t[method]}
        </label>
      ))}
      {value.method === 'home' ? (
        <>
          <label>
            {t.area}
            <select
              value={value.address.area}
              onChange={(e) => change('address', { ...value.address, area: e.target.value })}
            >
              {deliveryAreas.map((area) => (
                <option value={area} key={area}>
                  {t[area]}
                </option>
              ))}
            </select>
          </label>
          {['street', 'postalCode', 'city'].map((key) => (
            <label key={key}>
              {t[key]}
              <input
                value={value.address[key]}
                onChange={(e) => change('address', { ...value.address, [key]: e.target.value })}
                required
                minLength={key === 'street' ? 5 : 2}
                maxLength={key === 'street' ? 160 : key === 'postalCode' ? 5 : 80}
                pattern={key === 'postalCode' ? '[0-9]{5}' : undefined}
                inputMode={key === 'postalCode' ? 'numeric' : undefined}
                autoComplete="off"
              />
            </label>
          ))}
          <p>{t.country}</p>
        </>
      ) : (
        <>
          <p className="fine-print">{t.network}</p>
          <label>
            {t.boutique}
            <select value={value.boutiqueId} onChange={(e) => change('boutiqueId', e.target.value)}>
              {demoBoutiques.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.location[language]}
                </option>
              ))}
            </select>
          </label>
          <BoutiqueExplorer
            language={language}
            selectedId={value.boutiqueId}
            onChoose={(id) => change('boutiqueId', id)}
            disabled={busy}
          />
        </>
      )}
      <p className="fine-print">{t[value.method === 'home' ? 'homeEstimate' : 'pickupEstimate']}</p>
      <p className="fine-print">{t.estimateNotice}</p>
      <p>{t.free}</p>
    </fieldset>
  );
}
export function DeliverySummary({ value, language, cancelled }) {
  if (!value) return null;
  const t = fulfillmentCopy[language];
  return (
    <section className="delivery-summary">
      <h3>{t.summary}</h3>
      {cancelled && <p>{t.cancelled}</p>}
      {fulfillmentLines(value, language).map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      <p className="fine-print">{t.estimateNotice}</p>
      <p>{t.free}</p>
      <p className="fine-print">{t.notice}</p>
    </section>
  );
}
