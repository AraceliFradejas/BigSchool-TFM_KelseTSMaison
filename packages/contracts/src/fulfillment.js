import { z } from 'zod';
import { demoBoutiques } from './boutiques.js';
export { demoBoutiques };
export const deliveryAreas = ['madrid', 'barcelona', 'marbella'];
export function postalCodeCovered(area, code) {
  return area === 'madrid'
    ? /^28\d{3}$/.test(code) && code !== '28000'
    : area === 'barcelona'
      ? /^080(?:0[1-9]|[1-3]\d|4[0-2])$/.test(code)
      : area === 'marbella'
        ? ['29600', '29601', '29602', '29603', '29604', '29660', '29670'].includes(code)
        : false;
}
const recipientName = z.string().trim().min(2).max(80);
export const fulfillmentSchema = z.discriminatedUnion('method', [
  z
    .object({
      method: z.literal('home'),
      recipientName,
      address: z
        .object({
          street: z.string().trim().min(5).max(160),
          postalCode: z.string().regex(/^\d{5}$/),
          area: z.enum(deliveryAreas),
          city: z.string().trim().min(2).max(80),
          country: z.literal('ES'),
        })
        .strict()
        .refine((a) => postalCodeCovered(a.area, a.postalCode), {
          message: 'Postcode outside delivery area',
        }),
    })
    .strict(),
  z
    .object({
      method: z.literal('pickup'),
      recipientName,
      boutiqueId: z.enum(demoBoutiques.map((b) => b.id)),
    })
    .strict(),
]);
export const fulfillmentCopy = {
  es: {
    title: 'Datos y entrega',
    area: 'Zona de entrega',
    madrid: 'Comunidad de Madrid',
    barcelona: 'Barcelona ciudad',
    marbella: 'Marbella',
    recipient: 'Nombre del destinatario',
    customer: 'Cliente',
    home: 'Envío a domicilio',
    pickup: 'Recogida en boutique',
    street: 'Dirección (calle, número y piso)',
    postalCode: 'Código postal',
    city: 'Localidad',
    country: 'Disponible por el momento en la Comunidad de Madrid, Barcelona y Marbella',
    notice: 'Usa datos ficticios. No se enviará ningún producto ni se reservará una recogida real.',
    network:
      'Red de boutiques ficticias Maison: sin locales físicos ni acuerdos con tiendas reales.',
    boutique: 'Boutique de recogida',
    next: 'Continuar a pago',
    explore: 'Explorar boutiques, mapa y distancias',
    hideExplore: 'Ocultar explorador de boutiques',
    edit: 'Editar datos de entrega',
    summary: 'Resumen de entrega simulada',
    estimate: 'Fecha estimada (simulación)',
    homeEstimate: 'Entre 3 y 5 días laborables desde la confirmación simulada.',
    pickupEstimate: 'Disponible entre 1 y 2 días laborables desde la confirmación simulada.',
    estimateNotice:
      'Estimación orientativa: de lunes a viernes, sin ajustar festivos. No representa un compromiso de entrega.',
    free: 'Envío y recogida simulados: 0,00 €',
    invalid:
      'Completa el destinatario y la entrega. El código postal debe corresponder a la zona elegida: Comunidad de Madrid, Barcelona ciudad o Marbella.',
    steps: '1. Datos y entrega → 2. Pago → 3. Confirmación',
    cancelled: 'Entrega simulada cancelada',
  },
  en: {
    title: 'Details and delivery',
    area: 'Delivery area',
    madrid: 'Community of Madrid',
    barcelona: 'Barcelona city',
    marbella: 'Marbella',
    recipient: 'Recipient name',
    customer: 'Customer',
    home: 'Home delivery',
    pickup: 'Boutique collection',
    street: 'Address (street, number and apartment)',
    postalCode: 'Postcode',
    city: 'Town or city',
    country: 'Currently available in the Community of Madrid, Barcelona and Marbella',
    notice:
      'Use fictional details. No products will be shipped and no real collection will be booked.',
    network: 'Fictional Maison boutique network: no physical stores or agreements with real shops.',
    boutique: 'Collection boutique',
    next: 'Continue to payment',
    explore: 'Explore boutiques, map and distances',
    hideExplore: 'Hide boutique explorer',
    edit: 'Edit delivery details',
    summary: 'Simulated delivery summary',
    estimate: 'Estimated date (simulation)',
    homeEstimate: 'Between 3 and 5 working days after simulated confirmation.',
    pickupEstimate: 'Available between 1 and 2 working days after simulated confirmation.',
    estimateNotice:
      'Indicative estimate: Monday to Friday, without adjusting for public holidays. This is not a delivery commitment.',
    free: 'Simulated delivery and collection: 0,00 €',
    invalid:
      'Complete the recipient and delivery details. The postcode must match the selected area: Community of Madrid, Barcelona city or Marbella.',
    steps: '1. Details and delivery → 2. Payment → 3. Confirmation',
    cancelled: 'Simulated delivery cancelled',
  },
};
export function fulfillmentSnapshot(input, createdAt) {
  const value = fulfillmentSchema.parse(input);
  function workingDate(days) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .formatToParts(new Date(createdAt))
        .map((p) => [p.type, p.value]),
    );
    const date = new Date(
      Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12),
    );
    while (days) {
      date.setUTCDate(date.getUTCDate() + 1);
      if (![0, 6].includes(date.getUTCDay())) days--;
    }
    return date.toISOString().slice(0, 10);
  }
  return {
    ...value,
    ...(value.method === 'pickup'
      ? { boutique: structuredClone(demoBoutiques.find((b) => b.id === value.boutiqueId)) }
      : {}),
    shippingCents: 0,
    estimatedFrom: workingDate(value.method === 'home' ? 3 : 1),
    estimatedTo: workingDate(value.method === 'home' ? 5 : 2),
  };
}
export function fulfillmentLines(value, language) {
  if (!value) return [];
  const t = fulfillmentCopy[language];
  const boutique = value.boutique || demoBoutiques.find((b) => b.id === value.boutiqueId);
  const lines = [t[value.method], value.recipientName];
  if (value.method === 'home')
    lines.push(
      value.address.street,
      `${value.address.postalCode} ${value.address.city}`,
      t[value.address.area],
      t.country,
    );
  else if (boutique) lines.push(boutique.name, boutique.location[language]);
  if (value.estimatedFrom) {
    const format = (date) =>
      new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00Z`));
    lines.push(`${t.estimate}: ${format(value.estimatedFrom)} – ${format(value.estimatedTo)}`);
  } else lines.push(t[value.method === 'home' ? 'homeEstimate' : 'pickupEstimate']);
  return lines;
}
