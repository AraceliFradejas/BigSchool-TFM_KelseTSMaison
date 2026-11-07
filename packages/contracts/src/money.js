// The shop contract uses integer cents and the same European notation in ES/EN.
// Format those digits directly: native Intl engines do not all honor grouping strings.
export function formatMoney(cents) {
  const digits = String(Math.abs(cents)).padStart(3, '0');
  const euros = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cents < 0 ? '-' : ''}${euros},${digits.slice(-2)}\u00a0€`;
}
