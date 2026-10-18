import { useState } from 'react';
import { transitions } from '@maison/contracts/rules';
import { useMaison, useResource, api } from '../../shared/state';
import { PageHeading, Money, ResourceState, OrderLines } from '../../shared/components';

function freshProduct() {
  return {
    id: '',
    name: { es: '', en: '' },
    description: { es: '', en: '' },
    category: 'fashion',
    collectionId: 'golden-hour',
    image: '/media/satin-story.webp',
    active: false,
    tags: [],
    variants: [{ id: '', label: { es: '', en: '' }, priceCents: 1000, stock: 0 }],
  };
}
function Editor({ initial, onClose, onSaved }) {
  const { language, t, errorText, notify } = useMaison();
  const { revision, ...product } = initial;
  const [draft, setDraft] = useState(() => structuredClone(product));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [editLanguage, setEditLanguage] = useState(language);
  const collections = useResource('/collections');
  const update = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
  function bilingual(key, value) {
    setDraft((previous) => ({ ...previous, [key]: { ...previous[key], [editLanguage]: value } }));
  }
  function variant(index, key, value) {
    setDraft((previous) => ({
      ...previous,
      variants: previous.variants.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const missingLanguage = ['es', 'en'].find(
      (locale) =>
        !draft.name[locale].trim() ||
        draft.description[locale].trim().length < 10 ||
        draft.variants.some((item) => !item.label[locale].trim()),
    );
    if (missingLanguage) {
      setEditLanguage(missingLanguage);
      setError(`${t.completeTranslation}: ${missingLanguage === 'es' ? t.spanish : t.english}.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.request(
        revision ? `/team/products/${encodeURIComponent(draft.id)}` : '/team/products',
        {
          method: revision ? 'PUT' : 'POST',
          body: revision ? { product: draft, revision } : draft,
        },
      );
      notify(t.savedProduct);
      onSaved();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError(errorText({ code: 'file_too_large' }));
      event.target.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const result = await api.request('/team/images', { method: 'POST', body, multipart: true });
      update('image', result.image);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setUploading(false);
    }
  }
  return (
    <section className="editor-panel">
      <div className="section-intro">
        <h2>{revision ? t.editProduct : t.newProduct}</h2>
        <button className="button secondary" disabled={busy || uploading} onClick={onClose}>
          {t.cancel}
        </button>
      </div>
      <form onSubmit={save}>
        <div className="editor-grid">
          <div>
            <label>
              {t.id}
              <input
                value={draft.id}
                pattern="[a-z0-9-]{1,80}"
                maxLength={80}
                disabled={Boolean(revision)}
                required
                onChange={(event) => update('id', event.target.value)}
              />
            </label>
            <label>
              {t.category}
              <select
                value={draft.category}
                onChange={(event) => update('category', event.target.value)}
              >
                {['fashion', 'accessories', 'beauty'].map((category) => (
                  <option key={category} value={category}>
                    {t[category]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t.collection}
              <select
                value={draft.collectionId}
                onChange={(event) => update('collectionId', event.target.value)}
              >
                {collections.data?.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => update('active', event.target.checked)}
              />
              {t.active}
            </label>
          </div>
          <div>
            <div className="editor-language">
              <button
                type="button"
                aria-pressed={editLanguage === 'es'}
                onClick={() => setEditLanguage('es')}
              >
                {t.spanish}
              </button>
              <button
                type="button"
                aria-pressed={editLanguage === 'en'}
                onClick={() => setEditLanguage('en')}
              >
                {t.english}
              </button>
            </div>
            <label>
              {t.name} ({editLanguage.toUpperCase()})
              <input
                value={draft.name[editLanguage]}
                maxLength={120}
                required
                onChange={(event) => bilingual('name', event.target.value)}
              />
            </label>
            <label>
              {t.description} ({editLanguage.toUpperCase()})
              <textarea
                value={draft.description[editLanguage]}
                minLength={10}
                maxLength={2000}
                required
                rows={5}
                onChange={(event) => bilingual('description', event.target.value)}
              />
            </label>
            <p className="fine-print">
              {language === 'es'
                ? 'Completa nombre, descripción y variantes en ambos idiomas antes de guardar.'
                : 'Complete the name, description and variants in both languages before saving.'}
            </p>
          </div>
          <div>
            <img
              className="editor-preview"
              src={draft.image}
              alt={t.image}
              width="180"
              height="225"
            />
            <label>
              {t.image}
              <input
                value={draft.image}
                required
                onChange={(event) => update('image', event.target.value)}
              />
            </label>
            <label className="upload-label">
              {uploading ? t.working : t.upload}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading || busy}
                onChange={upload}
              />
            </label>
            <p className="fine-print">{t.imageHelp}</p>
          </div>
        </div>
        <h3>{t.variants}</h3>
        <div className="variant-editor">
          {draft.variants.map((item, index) => (
            <div className="variant-edit-row" key={index}>
              <label>
                {t.id}
                <input
                  value={item.id}
                  pattern="[a-z0-9-]{1,80}"
                  maxLength={80}
                  required
                  onChange={(event) => variant(index, 'id', event.target.value)}
                />
              </label>
              <label>
                {t.variant} ({editLanguage.toUpperCase()})
                <input
                  value={item.label[editLanguage]}
                  maxLength={120}
                  required
                  onChange={(event) =>
                    variant(index, 'label', { ...item.label, [editLanguage]: event.target.value })
                  }
                />
              </label>
              <label>
                {t.price}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  value={item.priceCents / 100}
                  required
                  onChange={(event) =>
                    variant(index, 'priceCents', Math.round(Number(event.target.value) * 100))
                  }
                />
                <small>
                  <Money cents={item.priceCents} />
                </small>
              </label>
              <label>
                {t.stockLabel}
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={item.stock}
                  required
                  onChange={(event) => variant(index, 'stock', Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                className="link-button"
                disabled={draft.variants.length === 1}
                onClick={() =>
                  update(
                    'variants',
                    draft.variants.filter((value, i) => i !== index),
                  )
                }
              >
                {t.remove}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={draft.variants.length >= 30}
          onClick={() =>
            update('variants', [
              ...draft.variants,
              {
                id: `${draft.id}-${crypto.randomUUID().slice(0, 8)}`,
                label: { es: '', en: '' },
                priceCents: 1000,
                stock: 0,
              },
            ])
          }
        >
          {t.addVariant}
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-submit">
          <button className="button" disabled={busy || uploading}>
            {busy ? t.working : t.saveProduct}
          </button>
        </div>
      </form>
    </section>
  );
}
function ManagedOrder({ order, reload }) {
  const { t, language, notify, errorText } = useMaison();
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  async function transition(status) {
    setBusy(true);
    try {
      await api.request(`/team/orders/${order.id}`, { method: 'PATCH', body: { status } });
      reload();
    } catch (error) {
      notify(errorText(error), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="managed-order">
      <div className="managed-order-top">
        <div>
          <h3>
            {t.order} {order.id.slice(0, 8)}
          </h3>
          <p>
            {t.customer}: {order.customerName}
          </p>
          <p>{new Date(order.createdAt).toLocaleString(language === 'es' ? 'es-ES' : 'en-GB')}</p>
        </div>
        <div>
          <span className={`status ${order.status}`}>{t[order.status]}</span>
          <p>
            <strong>
              <Money cents={order.totalCents} />
            </strong>
          </p>
        </div>
      </div>
      <div className="order-actions">
        <button
          className="link-button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {t.orderDetail}
        </button>
        {transitions[order.status].map((status) => (
          <button
            className={`button ${status === 'cancelled' ? 'secondary' : ''}`}
            key={status}
            disabled={busy}
            onClick={() => transition(status)}
          >
            {t[status]}
          </button>
        ))}
        {transitions[order.status].length === 0 && <span className="fine-print">{t.terminal}</span>}
      </div>
      {expanded && <OrderLines lines={order.lines} />}
    </article>
  );
}
export default function Team() {
  const { t, language } = useMaison();
  const [tab, setTab] = useState('products');
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const products = useResource(tab === 'products' ? '/team/products' : null);
  const orders = useResource(tab === 'orders' ? '/team/orders' : null);
  const normalized = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const visibleProducts = products.data?.filter(
    (product) =>
      normalized(`${product.id} ${product.name.es} ${product.name.en}`).includes(
        normalized(search.trim()),
      ) &&
      (visibility === 'all' || (visibility === 'active' ? product.active : !product.active)),
  );
  return (
    <div className="container page">
      <PageHeading eyebrow="KelseTS MAISON" title={t.team} body={t.teamIntro} />
      <div className="team-tabs">
        <button
          className={tab === 'products' ? 'active' : ''}
          onClick={() => {
            setTab('products');
            setEditing(null);
          }}
        >
          {t.products}
        </button>
        <button
          className={tab === 'orders' ? 'active' : ''}
          onClick={() => {
            setTab('orders');
            setEditing(null);
          }}
        >
          {t.manageOrders}
        </button>
      </div>
      {tab === 'products' ? (
        <>
          {editing ? (
            <Editor
              key={editing.id || 'new'}
              initial={editing}
              onClose={() => {
                setEditing(null);
                products.reload();
              }}
              onSaved={() => {
                setEditing(null);
                products.reload();
              }}
            />
          ) : (
            <>
              <div className="team-toolbar">
                <button className="button" onClick={() => setEditing(freshProduct())}>
                  {t.newProduct}
                </button>
                <label>
                  {t.search}
                  <input
                    type="search"
                    maxLength={120}
                    value={search}
                    placeholder={t.teamSearchPlaceholder}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t.visibility}
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    <option value="all">{t.allProducts}</option>
                    <option value="active">{t.visibleProducts}</option>
                    <option value="archived">{t.archivedProducts}</option>
                  </select>
                </label>
              </div>
              <ResourceState resource={products}>
                <p className="fine-print" role="status">
                  {visibleProducts?.length ?? 0} {t.results}
                </p>
                {visibleProducts?.length === 0 && <div className="empty-state">{t.noResults}</div>}
                <div className="team-product-list">
                  {visibleProducts?.map((product) => (
                    <article className="team-product" key={product.id}>
                      <img src={product.image} alt="" width="60" height="75" />
                      <div>
                        <h3>{product.name[language]}</h3>
                        <p>
                          {product.id} · {t[product.category]}{' '}
                          {!product.active && `· ${language === 'es' ? 'Archivado' : 'Archived'}`}
                        </p>
                      </div>
                      <span>
                        {product.variants.reduce((sum, variant) => sum + variant.stock, 0)}{' '}
                        {t.stock}
                      </span>
                      <button className="button secondary" onClick={() => setEditing(product)}>
                        {t.editProduct}
                      </button>
                    </article>
                  ))}
                </div>
              </ResourceState>
            </>
          )}
        </>
      ) : (
        <ResourceState resource={orders}>
          {orders.data?.length ? (
            orders.data.map((order) => (
              <ManagedOrder key={order.id} order={order} reload={orders.reload} />
            ))
          ) : (
            <div className="empty-state">{t.noTeamOrders}</div>
          )}
        </ResourceState>
      )}
    </div>
  );
}
