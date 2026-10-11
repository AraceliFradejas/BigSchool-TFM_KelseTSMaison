import { Link } from 'react-router-dom';
import { useMaison, useResource } from '../../shared/state';
import {
  Money,
  PageHeading,
  ResourceState,
  Empty,
  ProductGrid,
  OrderLines,
} from '../../shared/components';
import { useParams } from 'react-router-dom';
export default function Account() {
  const { user, t, language, logout } = useMaison();
  const orders = useResource('/orders');
  const messages = useResource('/messages');
  return (
    <div className="container page">
      <div className="account-heading">
        <PageHeading eyebrow={t.welcome} title={`${t.greeting}, ${user.name}.`} />
        <button className="button secondary" onClick={logout}>
          {t.logout}
        </button>
      </div>
      <div className="account-columns">
        <section>
          <h2>{t.orders}</h2>
          <ResourceState resource={orders}>
            {orders.data?.length ? (
              <div className="orders-list">
                {orders.data.map((order) => (
                  <Link className="order-card" to={`/orders/${order.id}`} key={order.id}>
                    <div>
                      <span className="eyebrow">
                        {t.order} {order.id.slice(0, 8)}
                      </span>
                      <p>
                        {new Date(order.createdAt).toLocaleDateString(
                          language === 'es' ? 'es-ES' : 'en-GB',
                        )}
                      </p>
                      <span className={`status ${order.status}`}>{t[order.status]}</span>
                    </div>
                    <strong>
                      <Money cents={order.totalCents} />
                    </strong>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty text={t.noOrders} />
            )}
          </ResourceState>
        </section>
        <section>
          <h2>{t.messages}</h2>
          <ResourceState resource={messages}>
            {messages.data?.length ? (
              <div className="messages-list">
                {messages.data.map((message) => (
                  <article key={message.id} className="message-card">
                    <p className="eyebrow">
                      {new Date(message.createdAt).toLocaleDateString(
                        language === 'es' ? 'es-ES' : 'en-GB',
                      )}
                    </p>
                    <h3>{message.title[language]}</h3>
                    <p>{message.body[language]}</p>
                    <Link className="underlined" to={`/orders/${message.orderId}`}>
                      {t.viewOrder}
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text={t.noMessages} />
            )}
          </ResourceState>
        </section>
      </div>
    </div>
  );
}
export function Favorites() {
  const { t, favorites } = useMaison();
  const resource = useResource('/favorites');
  const selected = resource.data?.filter((product) => favorites.includes(product.id));
  return (
    <div className="container page">
      <PageHeading eyebrow="KelseTS MAISON" title={t.favorites} />
      <ResourceState resource={resource}>
        {selected?.length ? <ProductGrid products={selected} /> : <Empty text={t.noFavorites} />}
      </ResourceState>
    </div>
  );
}
export function OrderDetail() {
  const { id } = useParams();
  const { t, language } = useMaison();
  const resource = useResource(`/orders/${encodeURIComponent(id)}`);
  const order = resource.data;
  return (
    <div className="container page order-detail">
      <Link className="back-link" to="/account">
        ← {t.account}
      </Link>
      <PageHeading eyebrow={t.orderDetail} title={`${t.order} ${id.slice(0, 8)}`} />
      <ResourceState resource={resource}>
        {order && (
          <>
            <div className="order-meta">
              <span className={`status ${order.status}`}>{t[order.status]}</span>
              <span>
                {t.created}:{' '}
                {new Date(order.createdAt).toLocaleString(language === 'es' ? 'es-ES' : 'en-GB')}
              </span>
            </div>
            <OrderLines lines={order.lines} />
            <p className="order-total">
              {t.total}
              <strong>
                <Money cents={order.totalCents} />
              </strong>
            </p>
            <p className="demo-notice">{t.orderNotice}</p>
          </>
        )}
      </ResourceState>
    </div>
  );
}
