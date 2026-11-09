import { formatMoney } from '@maison/contracts/money';
import { looks } from '../../../data/catalog.js';

// A stored preview only: no mail transport and no real customer address.
export function orderMessage(status, order) {
  const titles = {
    pending: { es: 'Tu selección ya tiene una historia', en: 'Your selection has a story now' },
    confirmed: { es: 'Selección confirmada', en: 'Selection confirmed' },
    dispatched: { es: 'Un paso más en el recorrido', en: 'Another step in the journey' },
    delivered: { es: 'Historia completada', en: 'Story completed' },
    cancelled: { es: 'Pedido de demostración cancelado', en: 'Demonstration order cancelled' },
  };
  const descriptions = {
    pending: {
      es: 'Hemos registrado tu pedido de demostración. No se ha realizado ningún cobro ni se enviarán productos.',
      en: 'Your demonstration order has been recorded. No payment has been taken and no products will be shipped.',
    },
    confirmed: {
      es: 'Team ha confirmado tu pedido de demostración. Puedes consultar sus piezas en tu cuenta.',
      en: 'Team has confirmed your demonstration order. You can view its pieces in your account.',
    },
    dispatched: {
      es: 'Tu pedido figura como enviado dentro de la simulación. Este estado no representa un envío real.',
      en: 'Your order is marked as dispatched within the simulation. This status does not represent a real shipment.',
    },
    delivered: {
      es: 'Tu pedido figura como entregado dentro de la simulación. Gracias por recorrer Maison.',
      en: 'Your order is marked as delivered within the simulation. Thank you for exploring Maison.',
    },
    cancelled: {
      es: 'El pedido se ha cancelado y sus unidades vuelven a estar disponibles en el catálogo de demostración.',
      en: 'The order has been cancelled and its units are available again in the demonstration catalogue.',
    },
  };
  const message = { title: titles[status], body: descriptions[status] };
  if (!order) return message;
  const body = Object.fromEntries(
    ['es', 'en'].map((language) => {
      const es = language === 'es';
      return [
        language,
        [
          'KelseTS Maison',
          es
            ? 'SIMULACIÓN · Este correo no se ha enviado.'
            : 'SIMULATION · This email has not been sent.',
          descriptions[status][language],
          `${es ? 'Pedido DEMO' : 'DEMO order'}: ${order.id}`,
          ...order.lines.map(
            (line) =>
              `${line.quantity} × ${line.name[language]} · ${line.variantLabel[language]} · ${formatMoney(line.subtotalCents)}`,
          ),
          `${es ? 'Total del pedido' : 'Order total'}: ${formatMoney(order.totalCents)}`,
          `${es ? 'Cargo real' : 'Actual charge'}: ${formatMoney(0)}`,
          es
            ? 'No habrá cobro ni envío real. Consulta el pedido en tu cuenta Maison.'
            : 'There is no real charge or shipment. View the order in your Maison account.',
        ].join('\n\n'),
      ];
    }),
  );
  return {
    ...message,
    email: {
      mode: 'simulation',
      deliveryStatus: 'not_sent',
      from: 'KelseTS Maison <boutique@maison.example>',
      to: 'cliente@maison.example',
      subject: Object.fromEntries(
        ['es', 'en'].map((language) => [
          language,
          `[DEMO] ${titles[status][language]} · ${order.id.slice(0, 8)}`,
        ]),
      ),
      body,
      orderStatus: status,
      order: {
        id: order.id,
        totalCents: order.totalCents,
        lines: structuredClone(order.lines),
        lookName:
          looks.find(
            (look) =>
              look.productIds.length === order.lines.length &&
              look.productIds.every((id) => order.lines.some((line) => line.productId === id)),
          )?.name || null,
      },
    },
  };
}
