import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMaison, api } from '../../shared/state';
import { Empty, Money, PageHeading, ResourceState } from '../../shared/components';
export default function Bag() {
  const { language, t, cart, user, updateQuantity, clearCart, notify, errorText } = useMaison();
  const [resource, setResource] = useState({ data: {}, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const productIds = [...new Set(cart.lines.map((line) => line.productId))].sort().join(',');
  useEffect(() => {
    const controller = new AbortController();
    setResource((previous) => ({ ...previous, loading: true, error: null }));
    Promise.all(
      productIds
        ? productIds.split(',').map(async (id) => {
            try {
              return [
                id,
                await api.request(`/products/${encodeURIComponent(id)}`, {
                  signal: controller.signal,
                }),
              ];
            } catch (error) {
              if (error.status === 404) return [id, null];
              throw error;
            }
          })
        : [],
    )
      .then((items) =>
        setResource({ data: Object.fromEntries(items), loading: false, error: null }),
      )
      .catch((error) => {
        if (error.name !== 'AbortError') setResource({ data: {}, loading: false, error });
      });
    return () => controller.abort();
  }, [productIds, version]);
  const resolved = cart.lines.map((line) => ({
    ...line,
    product: resource.data[line.productId],
    variant: resource.data[line.productId]?.variants.find(
      (variant) => variant.id === line.variantId,
    ),
  }));
  const unavailable = resolved.some((line) => !line.variant);
  const insufficient = resolved.some((line) => line.variant && line.variant.stock < line.quantity);
  const total = resolved.reduce(
    (sum, line) => sum + (line.variant?.priceCents || 0) * line.quantity,
    0,
  );
  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const order = await api.request('/orders', {
        method: 'POST',
        body: {
          idempotencyKey: cart.key,
          lines: cart.lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
        },
      });
      clearCart();
      notify(t.orderSuccess);
      navigate(`/orders/${order.id}`);
    } catch (error) {
      setError(errorText(error));
      setVersion((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <PageHeading eyebrow="KelseTS MAISON" title={t.cartTitle} />
      {cart.lines.length === 0 ? (
        <Empty text={t.emptyCart} />
      ) : (
        <ResourceState resource={{ ...resource, reload: () => setVersion((value) => value + 1) }}>
          <div className="bag-layout">
            <div className="bag-lines">
              {resolved.map((line) => (
                <article className="bag-line" key={line.variantId}>
                  {line.product && <img src={line.product.image} alt="" width="120" height="150" />}
                  <div className="bag-line-copy">
                    {line.product ? (
                      <Link to={`/products/${line.productId}`}>
                        <h2>{line.product.name[language]}</h2>
                      </Link>
                    ) : (
                      <h2>{t.soldOut}</h2>
                    )}
                    <p>{line.variant?.label[language] || t.unavailableCart}</p>
                    {line.variant && line.variant.stock < line.quantity && (
                      <div className="bag-stock-warning" role="alert">
                        <p>
                          {line.variant.stock === 0
                            ? t.soldOut
                            : `${t.availableQuantity}: ${line.variant.stock}`}
                        </p>
                        {line.variant.stock > 0 && (
                          <button
                            className="underlined"
                            disabled={busy}
                            onClick={() =>
                              updateQuantity(line.variantId, Math.min(10, line.variant.stock))
                            }
                          >
                            {t.adjustQuantity}
                          </button>
                        )}
                      </div>
                    )}
                    {line.variant && (
                      <p>
                        <Money cents={line.variant.priceCents} />
                      </p>
                    )}
                    <div className="quantity-controls">
                      <label>
                        {t.quantity}
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, Math.min(10, line.variant?.stock || 1))}
                          value={line.quantity}
                          disabled={busy}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isInteger(value) && value > 0 && value <= 10)
                              updateQuantity(line.variantId, value);
                          }}
                        />
                      </label>
                      <button
                        className="link-button"
                        disabled={busy}
                        onClick={() => updateQuantity(line.variantId, 0)}
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                  <strong>
                    <Money cents={(line.variant?.priceCents || 0) * line.quantity} />
                  </strong>
                </article>
              ))}
            </div>
            <aside className="bag-summary">
              <h2>{t.cart}</h2>
              <p className="summary-total">
                {t.total}
                <strong>
                  <Money cents={total} />
                </strong>
              </p>
              <p className="fine-print">{t.checkoutNotice}</p>
              <button
                className="link-button bag-refresh"
                disabled={busy}
                onClick={() => setVersion((value) => value + 1)}
              >
                {t.refreshBag}
              </button>
              {unavailable && (
                <p className="form-error" role="alert">
                  {t.unavailableCart}
                </p>
              )}
              {insufficient && (
                <p className="form-error" role="alert">
                  {t.insufficientCart}
                </p>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {user ? (
                <button
                  className="button full"
                  disabled={busy || unavailable || insufficient}
                  onClick={checkout}
                >
                  {busy ? t.working : t.checkout}
                </button>
              ) : (
                <Link className="button full" to="/access?next=%2Fbag">
                  {t.signInCheckout}
                </Link>
              )}
            </aside>
          </div>
        </ResourceState>
      )}
    </div>
  );
}
