import { fulfillmentSchema, fulfillmentCopy } from '@maison/contracts/fulfillment';
import { DeliveryForm, DeliverySummary } from './Delivery';
import { useEffect, useRef, useState, useId } from 'react';
import { paymentCopy } from '@maison/contracts/demo-payment';
import { useMaison } from '../../shared/state';
import { Money } from '../../shared/components';
export default function PaymentReview({ lines, totalCents, busy, error, onCancel, onConfirm }) {
  const { language, user } = useMaison();
  const copy = paymentCopy[language];
  const deliveryCopy = fulfillmentCopy[language];
  const [step, setStep] = useState(1);
  const [delivery, setDelivery] = useState({
    method: 'home',
    recipientName: '',
    address: { street: '', postalCode: '', city: '', area: 'madrid', country: 'ES' },
    boutiqueId: 'madrid-milla-oro',
  });
  const fulfillment =
    delivery.method === 'home'
      ? { method: 'home', recipientName: delivery.recipientName, address: delivery.address }
      : {
          method: 'pickup',
          recipientName: delivery.recipientName,
          boutiqueId: delivery.boutiqueId,
        };
  const valid = fulfillmentSchema.safeParse(fulfillment).success;
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
          if (busy || !valid) return;
          if (step === 1) {
            setStep(2);
            dialog.current.scrollTop = 0;
            return;
          }
          if (acknowledged)
            onConfirm({ mode: 'demo', method, outcome, acknowledged: true, fulfillment });
        }}
      >
        <p className="eyebrow">KELSETS MAISON · DEMO</p>
        <h2 id="payment-title">{step === 1 ? deliveryCopy.title : copy.title}</h2>
        <p className="fine-print">{deliveryCopy.steps}</p>
        <p>
          {deliveryCopy.customer}: {user?.name}
        </p>
        <p className="demo-notice">{copy.warning}</p>
        {step === 2 && <p className="fine-print">{copy.details}</p>}
        {step === 2 && (
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
        )}
        <p className="summary-total">
          {copy.amount}
          <strong>
            <Money cents={totalCents} />
          </strong>
        </p>
        {step === 1 ? (
          <DeliveryForm value={delivery} onChange={setDelivery} language={language} busy={busy} />
        ) : (
          <>
            <DeliverySummary value={fulfillment} language={language} />
            <button
              type="button"
              className="underlined"
              disabled={busy}
              onClick={() => {
                setStep(1);
                setAcknowledged(false);
                dialog.current.scrollTop = 0;
              }}
            >
              {deliveryCopy.edit}
            </button>
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
          </>
        )}
        {step === 1 && !valid && (
          <p className="fine-print" role="status">
            {deliveryCopy.invalid}
          </p>
        )}
        <p className="fine-print">{copy.noCharge}</p>
        <button className="button full" disabled={busy || !valid || (step === 2 && !acknowledged)}>
          {busy ? copy.working : step === 1 ? deliveryCopy.next : copy.confirm}
        </button>
        <button type="button" className="button secondary full" onClick={onCancel} disabled={busy}>
          {copy.cancel}
        </button>
      </form>
    </dialog>
  );
}
export function PaymentReceipt({ payment, cancelled }) {
  const { language } = useMaison();
  const receiptId = useId();
  if (!payment || payment.mode !== 'demo') return null;
  const copy = paymentCopy[language];
  return (
    <section className="payment-receipt" aria-labelledby={receiptId}>
      <h2 id={receiptId}>{copy.receipt}</h2>
      <p className="demo-notice">{copy.warning}</p>
      <DeliverySummary value={payment.fulfillment} language={language} cancelled={cancelled} />
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
