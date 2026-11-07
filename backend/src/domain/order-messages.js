// Shared order-status communication policy, independent of HTTP and persistence.
export function orderMessage(status) {
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
  return { title: titles[status], body: descriptions[status] };
}
