import { useEffect, useRef, useState } from 'react';
import { paymentCopy } from '@maison/contracts/demo-payment';
import { useMaison } from '../../shared/state';
import { Money } from '../../shared/components';
export default function PaymentReview({ lines, totalCents, busy, error, onCancel, onConfirm }) {
  const { language } = useMaison();
  const copy = paymentCopy[language];
  const dialog = useRef(null);
  const [method, setMethod] = useState('card');
  const [outcome, setOutcome] = useState('approved');
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="payment-review"
      aria-labelledby="payment-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (acknowledged && !busy)
            onConfirm({ mode: 'demo', method, outcome, acknowledged: true });
        }}
      >
        <p className="eyebrow">KELSETS MAISON · DEMO</p>
        <h2 id="payment-title">{copy.title}</h2>
        <p className="demo-notice">{copy.warning}</p>
        <p className="fine-print">{copy.details}</p>
        <div className="payment-lines">
          {lines.map((line) => (
            <div key={line.variantId} className="payment-line">
              <img src={line.product.image} width="52" height="65" alt="" />
              <span>
                {line.product.name[language]}
                <small>
                  {line.variant.label[language]} · × {line.quantity}
                </small>
              </span>
              <Money cents={line.variant.priceCents * line.quantity} />
            </div>
          ))}
        </div>
        <p className="summary-total">
          {copy.amount}
          <strong>
            <Money cents={totalCents} />
          </strong>
        </p>
        <fieldset disabled={busy}>
          <legend>{copy.method}</legend>
          {['bank', 'card', 'paypal'].map((value) => (
            <label className="payment-option" key={value}>
              <input
                type="radio"
                name="demo-method"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
              />
              {copy[value]}
            </label>
          ))}
        </fieldset>
        <label>
          {copy.test}
          <select
            value={outcome}
            disabled={busy}
            onChange={(event) => setOutcome(event.target.value)}
          >
            <option value="approved">{copy.approved}</option>
            <option value="declined">{copy.declined}</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={busy}
            required
          />
          {copy.consent}
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="fine-print">{copy.noCharge}</p>
        <button className="button full" disabled={!acknowledged || busy}>
          {busy ? copy.working : copy.confirm}
        </button>
        <button type="button" className="button secondary full" onClick={onCancel} disabled={busy}>
          {copy.cancel}
        </button>
      </form>
    </dialog>
  );
}
export function PaymentReceipt({ payment }) {
  const { language } = useMaison();
  if (!payment || payment.mode !== 'demo') return null;
  const copy = paymentCopy[language];
  return (
    <section className="payment-receipt" aria-labelledby="receipt-title">
      <h2 id="receipt-title">{copy.receipt}</h2>
      <p className="demo-notice">{copy.warning}</p>
      <dl>
        <div>
          <dt>{copy.method}</dt>
          <dd>{copy[payment.method]}</dd>
        </div>
        <div>
          <dt>{copy.reference}</dt>
          <dd>{payment.reference}</dd>
        </div>
        <div>
          <dt>{copy.amount}</dt>
          <dd>
            <Money cents={payment.amountCents} />
          </dd>
        </div>
      </dl>
      <p>
        <strong>{copy.noCharge}</strong>
      </p>
    </section>
  );
}
