import { pathToFileURL } from 'node:url';
import { openDatabase, transaction } from '../src/db.js';
import { readConfig } from '../src/config.js';
import entries from '../../data/song-product-names.json' with { type: 'json' };

// Update each original translation independently; preserve Team edits and order snapshots.
export function migrateSongProductNames(db) {
  return transaction(db, () => {
    let products = 0;
    for (const entry of entries) {
      const row = db.prepare('SELECT data FROM products WHERE id=?').get(entry.id);
      if (!row) continue;
      const data = JSON.parse(row.data);
      let changed = false;
      for (const language of ['es', 'en']) {
        if (data.name[language] !== entry.previousName[language]) continue;
        data.name[language] = entry.name[language];
        changed = true;
      }
      if (changed)
        products += db
          .prepare('UPDATE products SET data=?,revision=revision+1 WHERE id=?')
          .run(JSON.stringify(data), entry.id).changes;
    }
    return { products };
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase(readConfig().databasePath);
  try {
    console.log(JSON.stringify(migrateSongProductNames(db)));
  } finally {
    db.close();
  }
}
