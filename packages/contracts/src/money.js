// European currency presentation in BOTH interface languages, on web and native.
// es-ES otherwise omits the separator for four-digit amounts by default.
export function formatMoney(cents) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    useGrouping: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
