import { pathToFileURL } from 'node:url';
import { openDatabase, transaction } from '../src/db.js';
import { readConfig } from '../src/config.js';
import { products } from '../../data/catalog.js';
import { legacyPrices } from '../../data/legacy-prices.js';

// Compare-and-set original demo prices. Team edits, stock and orders stay intact.
export function migrateCatalogPrices(db) {
  return transaction(db, () => {
    const result = { products: 0, variants: 0 };
    for (const product of products) {
      if (!Object.hasOwn(legacyPrices, product.id)) continue;
      let changed = 0;
      for (const variant of product.variants) {
        changed += db
          .prepare(
            `UPDATE variants SET price_cents = ?
          WHERE id = ? AND product_id = ? AND price_cents = ? AND price_cents != ?`,
          )
          .run(
            variant.priceCents,
            variant.id,
            product.id,
            legacyPrices[product.id],
            variant.priceCents,
          ).changes;
      }
      if (changed) {
        db.prepare('UPDATE products SET revision = revision + 1 WHERE id = ?').run(product.id);
        result.products++;
        result.variants += changed;
      }
    }
    return result;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase(readConfig().databasePath);
  try {
    console.log(JSON.stringify(migrateCatalogPrices(db)));
  } finally {
    db.close();
  }
}
