const esNumbers = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiun: 21,
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
};
const enNumbers = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
const words = { ...esNumbers, ...enNumbers };
const token = `(?:${Object.keys(words).join('|')}|mil|thousand|hundred)`;
const amount = `\\b${token}(?:(?:[ -]+(?:y|and))?[ -]+${token})*`;
function valueOf(text) {
  let total = 0,
    group = 0;
  for (const word of text.split(/[ -]+/)) {
    if (word === 'y' || word === 'and') continue;
    if (word === 'mil' || word === 'thousand') {
      total += (group || 1) * 1000;
      group = 0;
    } else if (word === 'hundred') group = (group || 1) * 100;
    else group += words[word];
  }
  return total + group;
}
// Only monetary phrases are converted: shoe sizes, ages and dates are left alone.
export function normalizeSpokenBudget(text, allowBare = false) {
  const normalized = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (allowBare) {
    const answer = normalized
      .replace(/[¡!¿?.,;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const bare = answer.match(
      new RegExp(
        `^(?:(?:mmm|mm|eh|pues|unos|about|around)\\s+)*(${amount})(?:\\s+(?:aproximadamente|estaria perfecto|estaria bien))?$`,
      ),
    );
    if (bare) return String(valueOf(bare[1]));
  }
  return normalized
    .replace(
      new RegExp(`(${amount})\\s*(euros?\\b|eur\\b|€)`, 'g'),
      (_, number, currency) => `${valueOf(number)} ${currency}`,
    )
    .replace(
      new RegExp(
        `((?:presupuesto|budget)\\s*(?:(?:de|es|son|of|is)\\s+)*)(` + amount + `)(?!\\w)`,
        'g',
      ),
      (_, prefix, number) => `${prefix}${valueOf(number)}`,
    );
}
