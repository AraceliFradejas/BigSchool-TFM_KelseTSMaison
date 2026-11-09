import { readFileSync } from 'node:fs';
import { formatMoney } from '@maison/contracts/money';
import manifest from '../../assets/email/manifest.json' with { type: 'json' };
const assetRoot = new URL('../../assets/email/', import.meta.url);
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const words = {
  es: {
    pending: 'Tu nueva historia empieza aquí',
    confirmed: 'Tu selección, confirmada',
    dispatched: 'Tu selección sigue su recorrido',
    delivered: 'Una historia completada',
    cancelled: 'Tu pedido ha sido cancelado',
    intro:
      'Gracias por elegir KelseTS Maison. Hemos registrado tu selección; aquí tienes cada una de las piezas que forman parte de ella.',
    cancel:
      'Hemos cancelado tu pedido. Este es el detalle de la selección cancelada; sus unidades vuelven a estar disponibles.',
    selection: 'TU SELECCIÓN MAISON',
    order: 'Pedido',
    quantity: 'Cantidad',
    unit: 'Precio por pieza',
    subtotal: 'Subtotal',
    total: 'Total del pedido',
    cancelledTotal: 'Importe cancelado',
    button: 'Ver mi pedido',
    footer:
      'Boutique de demostración de un proyecto académico. No se realizará ningún cargo ni envío real. La cancelación no genera un reembolso bancario.',
    motto: 'Tu estilo cuenta una historia.',
    pieces: 'Las piezas de tu historia',
    note: 'Los precios corresponden a la selección registrada en tu pedido.',
  },
  en: {
    pending: 'Your next story starts here',
    confirmed: 'Your selection, confirmed',
    dispatched: 'Your selection continues its journey',
    delivered: 'A story completed',
    cancelled: 'Your order has been cancelled',
    intro:
      'Thank you for choosing KelseTS Maison. Your selection has been recorded; discover every piece that brings it together below.',
    cancel:
      'Your order has been cancelled. Here are the pieces from your cancelled selection; their units are available again.',
    selection: 'YOUR MAISON SELECTION',
    order: 'Order',
    quantity: 'Quantity',
    unit: 'Price per piece',
    subtotal: 'Subtotal',
    total: 'Order total',
    cancelledTotal: 'Cancelled amount',
    button: 'View my order',
    footer:
      'Academic demonstration boutique. No real charge or shipment will take place. Cancellation does not issue a bank refund.',
    motto: 'Your style tells a story.',
    pieces: 'The pieces of your story',
    note: 'Prices reflect the selection recorded in your order.',
  },
};
export function renderOrderEmail(
  email,
  language = 'es',
  appUrl = 'https://kelsets-maison.vercel.app',
) {
  const w = words[language];
  const order = email.order || { id: '', lines: [], totalCents: 0 };
  const cancelled = email.orderStatus === 'cancelled';
  const orderUrl = new URL('/orders/' + encodeURIComponent(order.id), appUrl).href;
  const attachments = [
    {
      filename: 'maison-logo.png',
      content: readFileSync(new URL('logo.png', assetRoot)),
      cid: 'maison-logo',
      contentType: 'image/png',
    },
  ];
  const rows = order.lines
    .map((line, index) => {
      const asset = manifest[line.productId];
      const photo = asset && asset.source === line.image;
      const cid = 'maison-piece-' + index;
      if (photo)
        attachments.push({
          filename: line.productId + '.jpg',
          content: readFileSync(new URL(asset.file, assetRoot)),
          cid,
          contentType: 'image/jpeg',
        });
      const productUrl = new URL('/products/' + encodeURIComponent(line.productId || ''), appUrl)
        .href;
      return `<tr><td width="96" valign="top" style="padding:20px 12px 20px 0;border-bottom:1px solid #e4ddd3">${photo ? `<a href="${escape(productUrl)}"><img src="cid:${cid}" alt="${escape(line.name[language])}" width="96" height="120" style="display:block;border:0;object-fit:cover"></a>` : ''}</td><td valign="middle" style="padding:20px 0;border-bottom:1px solid #e4ddd3;word-break:break-word;overflow-wrap:anywhere"><p style="font-family:Georgia,serif;font-size:20px;margin:0 0 10px"><a href="${escape(productUrl)}" style="color:#242320;text-decoration:none">${escape(line.name[language])}</a></p><p style="font-size:13px;color:#6e665e;margin:0 0 8px">${escape(line.variantLabel[language])} · ${w.quantity}: ${line.quantity}</p><p style="font-size:13px;color:#6e665e;margin:0 0 8px">${w.unit}: ${formatMoney(line.unitPriceCents ?? line.subtotalCents / line.quantity)}</p><p style="font-size:16px;margin:0"><strong>${formatMoney(line.subtotalCents)}</strong></p></td></tr>`;
    })
    .join('');
  const title = w[email.orderStatus] || w.pending;
  const text = [
    title,
    cancelled ? w.cancel : w.intro,
    `${w.order}: ${order.id}`,
    order.lookName || w.pieces,
    ...order.lines.map(
      (line) =>
        `${line.quantity} × ${line.name[language]} · ${line.variantLabel[language]} · ${formatMoney(line.subtotalCents)}`,
    ),
    `${cancelled ? w.cancelledTotal : w.total}: ${formatMoney(order.totalCents)}`,
    `${w.button}: ${orderUrl}`,
    w.footer,
  ].join('\n\n');
  const html = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;background:#eee9df;font-family:Arial,sans-serif;color:#242320"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fffaf3"><tr><td align="center" style="padding:32px 24px;border-top:4px solid #801d36;border-bottom:1px solid #e4ddd3"><a href="${escape(appUrl)}"><img src="cid:maison-logo" alt="KelseTS Maison" width="180" height="104" style="display:block;border:0"></a><p style="font-family:Georgia,serif;color:#756b60;font-size:14px;margin:12px 0 0">${w.motto}</p></td></tr><tr><td style="padding:36px 28px 24px"><p style="font-size:10px;letter-spacing:2px;color:#801d36;margin:0 0 16px">${w.selection}</p><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.2;margin:0 0 20px">${escape(title)}</h1><p style="font-size:14px;line-height:1.8;color:#625b52;margin:0 0 24px">${cancelled ? w.cancel : w.intro}</p><p style="font-size:11px;color:#756b60;margin:0 0 28px;word-break:break-all">${w.order} · ${escape(order.id)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px;background:#eee9df"><p style="font-size:10px;letter-spacing:2px;color:#756b60;margin:0 0 8px">${w.selection}</p><h2 style="font-family:Georgia,serif;font-weight:400;font-size:25px;margin:0">${escape(order.lookName || w.pieces)}</h2></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 0;font-size:15px">${cancelled ? w.cancelledTotal : w.total}</td><td align="right" style="padding:28px 0;font-family:Georgia,serif;font-size:27px">${formatMoney(order.totalCents)}</td></tr></table><p style="font-size:12px;color:#756b60;margin:0 0 28px">${w.note}</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#801d36" style="padding:15px 24px"><a href="${escape(orderUrl)}" style="color:#ffffff;font-size:13px;text-decoration:none">${w.button} &rarr;</a></td></tr></table></td></tr><tr><td style="padding:24px 28px;background:#242320;color:#e8e0d4"><p style="font-family:Georgia,serif;font-size:20px;margin:0 0 10px">KelseTS Maison</p><p style="font-size:11px;line-height:1.8;margin:0">${w.footer}</p></td></tr></table></td></tr></table></body></html>`;
  return {
    from: { address: 'boutique@maison.example', name: 'KelseTS Maison' },
    to: [{ address: 'cliente@maison.example', name: 'Cliente ficticio Maison' }],
    subject: email.subject[language],
    text,
    html,
    attachments,
  };
}
