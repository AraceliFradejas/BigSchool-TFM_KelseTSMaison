// The same currency presentation for web, native app, filters and order totals.
// es-ES otherwise omits the separator for four-digit amounts by default.
export function formatMoney(cents, language = 'es') {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    useGrouping: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
