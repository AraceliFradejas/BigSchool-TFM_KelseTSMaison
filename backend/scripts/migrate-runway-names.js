import { pathToFileURL } from 'node:url';
import { openDatabase, transaction } from '../src/db.js';
import { readConfig } from '../src/config.js';
import entries from '../../data/runway-edit.json' with { type: 'json' };
import { runwayProducts } from '../../data/runway-edit.js';

// Rename only the original editorial names; keep Team edits, stock and order snapshots.
export function migrateRunwayNames(db) {
  return transaction(db, () => {
    const result = { products: 0, looks: 0 };
    for (const look of entries) {
      for (const piece of look.pieces) {
        const row = db.prepare('SELECT data FROM products WHERE id=?').get(piece.id);
        if (!row) continue;
        const data = JSON.parse(row.data);
        const original = Object.fromEntries(
          ['es', 'en'].map((language) => [
            language,
            `${piece.name[language].split(' · ')[0]} · ${look.previousName}`,
          ]),
        );
        if (data.name.es !== original.es || data.name.en !== original.en) continue;
        data.name = piece.name;
        const current = runwayProducts.find((product) => product.id === piece.id);
        for (const language of ['es', 'en']) {
          const oldDescription = current.description[language].replaceAll(
            look.name,
            look.previousName,
          );
          const oldWithStyling = oldDescription.replace(
            language === 'es'
              ? 'Se vende esta pieza por separado.'
              : 'This piece is sold separately.',
            language === 'es'
              ? 'Se vende esta pieza por separado; la fotografía muestra el conjunto como propuesta de estilo.'
              : 'This piece is sold separately; the photograph shows the full outfit as a styling suggestion.',
          );
          if ([oldDescription, oldWithStyling].includes(data.description[language]))
            data.description[language] = current.description[language];
        }
        result.products += db
          .prepare('UPDATE products SET data=?,revision=revision+1 WHERE id=?')
          .run(JSON.stringify(data), piece.id).changes;
      }
      const row = db.prepare('SELECT data FROM looks WHERE id=?').get(look.id);
      if (!row) continue;
      const data = JSON.parse(row.data);
      if (![look.previousName, look.name].includes(data.name)) continue;
      if (
        data.name === look.name &&
        data.songTitle === look.songTitle &&
        data.songAlbum === look.songAlbum
      )
        continue;
      data.name = look.name;
      data.songTitle = look.songTitle;
      data.songAlbum = look.songAlbum;
      result.looks += db
        .prepare('UPDATE looks SET data=? WHERE id=?')
        .run(JSON.stringify(data), look.id).changes;
    }
    return result;
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = openDatabase(readConfig().databasePath);
  try {
    console.log(JSON.stringify(migrateRunwayNames(db)));
  } finally {
    db.close();
  }
}
