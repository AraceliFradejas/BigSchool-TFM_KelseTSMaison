import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
// Extract independently generated packshots; original sheets and prompts stay private.
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import entries from '../data/runway-edit.json' with { type: 'json' };
const directory = new URL('../frontend/public/media/', import.meta.url);
await mkdir(directory, { recursive: true });
const widths = JSON.parse(
  await readFile(new URL('../frontend/src/shared/catalog-images.json', import.meta.url), 'utf8'),
);
let count = 0;
for (const look of entries) {
  const board = look.sourceId.replace(/-\d+$/, '');
  const panel = Number(look.sourceId.match(/(\d+)$/)[1]) - 1;
  // Keep the reviewed original three gala panels; the edited fourth supplies the shawl.
  const selectedBoard = board === 'gala' && panel < 3 ? 'gala-draft' : board;
  const source = new URL(`../docbase/catalog-runway-v1/${selectedBoard}.png`, import.meta.url);
  const meta = await sharp(fileURLToPath(source)).metadata();
  const width = Math.floor(meta.width / 4);
  await sharp(fileURLToPath(source))
    .extract({ left: panel * width, top: 0, width, height: meta.height })
    .webp({ quality: 90 })
    .toFile(fileURLToPath(new URL(`runway-${look.sourceId}.webp`, directory)));
  widths[look.image] = width;
  const sheet = new URL(
    `../docbase/catalog-runway-v1/pieces-${look.sourceId}.png`,
    import.meta.url,
  );
  if (!existsSync(fileURLToPath(sheet)) && process.argv.includes('--partial')) continue;
  const dimensions = await sharp(fileURLToPath(sheet)).metadata();
  const cellWidth = Math.floor(dimensions.width / 3),
    cellHeight = Math.floor(dimensions.height / 2);
  for (const [index, piece] of look.pieces.entries()) {
    // The reviewed gala-2 sheet places its shoes in the lower-left cell.
    const cell = look.sourceId === 'gala-2' && index === 1 ? 3 : index;
    const filename = fileURLToPath(new URL(`${piece.id}.webp`, directory));
    await sharp(fileURLToPath(sheet))
      .extract({
        left: (cell % 3) * cellWidth,
        top: Math.floor(cell / 3) * cellHeight,
        width: cellWidth,
        height: cellHeight,
      })
      .webp({ quality: 90 })
      .toFile(filename);
    widths[`/media/${piece.id}.webp`] = cellWidth;
    if (cellWidth > 600)
      await sharp(filename)
        .resize(600)
        .webp({ quality: 80 })
        .toFile(filename.replace('.webp', '-small.webp'));
    count++;
  }
}
await writeFile(
  new URL('../frontend/src/shared/catalog-images.json', import.meta.url),
  JSON.stringify(widths, null, 2) + '\n',
);
console.log(`36 runway photographs and ${count} independent product photographs prepared.`);
