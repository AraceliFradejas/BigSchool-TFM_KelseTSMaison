import runwayEntries from '../../data/runway-edit.json' with { type: 'json' };
import { openDatabase, transaction } from '../src/db.js';
import { readConfig } from '../src/config.js';
import { products } from '../../data/catalog.js';

const originalRunwayImages = new Map(
  runwayEntries.flatMap((look) => look.pieces.map((piece) => [piece.id, look.image])),
);

// Upgrade only the original demo images; preserve Team uploads and order snapshots.
export function migrateCatalogImages(db) {
  return transaction(db, () => {
    let changed = 0;
    for (const product of products) {
      const row = db.prepare('SELECT data FROM products WHERE id = ?').get(product.id);
      if (!row) continue;
      const data = JSON.parse(row.data);
      if (
        data.image !== `/media/${product.id}.svg` &&
        data.image !== originalRunwayImages.get(product.id)
      )
        continue;
      data.image = product.image;
      changed += db
        .prepare('UPDATE products SET data = ?, revision = revision + 1 WHERE id = ?')
        .run(JSON.stringify(data), product.id).changes;
    }
    return changed;
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const db = openDatabase(readConfig().databasePath);
  try {
    console.log(`${migrateCatalogImages(db)} demo images updated.`);
  } finally {
    db.close();
  }
}
