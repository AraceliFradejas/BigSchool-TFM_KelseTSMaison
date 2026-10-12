/** Extract transparent walk-cycle drawings and align their collars for animation. */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const source = process.argv[2];
const output = process.argv[3];
if (!source || !output) throw new Error('Usage: node prepare-maison-lateral-frames.mjs sheet.png output-directory');
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const seen = new Uint8Array(width * height);
const queue = new Int32Array(width * height);
const components = [];
const labels = new Int32Array(width * height).fill(-1);
for (let start = 0; start < seen.length; start++) {
  if (seen[start] || data[start * 4 + 3] < 100) continue;
  let head = 0, tail = 1;
  queue[0] = start; seen[start] = 1;
  let left = width, right = 0, top = height, bottom = 0;
  while (head < tail) {
    const p = queue[head++], x = p % width, y = Math.floor(p / width);
    left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
    for (const next of [x > 0 ? p-1 : -1, x+1 < width ? p+1 : -1, y > 0 ? p-width : -1, y+1 < height ? p+width : -1]) {
      if (next < 0 || seen[next] || data[next * 4 + 3] < 100) continue;
      seen[next] = 1; queue[tail++] = next;
    }
  }
  if (tail > 20) {
    const label=components.length;
    for(let i=0;i<tail;i++) labels[queue[i]]=label;
    components.push({ label, left, top, width: right-left+1, height: bottom-top+1, pixels: tail });
  }
}
const primary=components.filter(c=>c.pixels>8000);
const rows = [primary.filter(c => c.top+c.height/2 < height/2).sort((a,b)=>a.left-b.left), primary.filter(c=>c.top+c.height/2>=height/2).sort((a,b)=>a.left-b.left)];
if (rows.some(row=>row.length!==4)) throw new Error(`Expected four drawings per row: ${JSON.stringify(rows)}`);
for(const main of primary) main.labels=[main.label];
for(const small of components.filter(c=>c.pixels<=8000)) {
  const cx=small.left+small.width/2, cy=small.top+small.height/2;
  const nearest=primary.map(c=>({c,d:Math.hypot(Math.max(c.left-cx,0,cx-(c.left+c.width)),Math.max(c.top-cy,0,cy-(c.top+c.height)))})).sort((a,b)=>a.d-b.d)[0];
  if(nearest.d<100) nearest.c.labels.push(small.label);
}
for(const main of primary) {
  const group=components.filter(c=>main.labels.includes(c.label));
  const right=Math.max(...group.map(c=>c.left+c.width)), bottom=Math.max(...group.map(c=>c.top+c.height));
  main.left=Math.min(...group.map(c=>c.left)); main.top=Math.min(...group.map(c=>c.top));
  main.width=right-main.left; main.height=bottom-main.top;
}
await mkdir(output, { recursive: true });
for (let row=0; row<2; row++) {
  const scale = Math.min(560 / Math.max(...rows[row].map(c=>c.height)), 405 / Math.max(...rows[row].map(c=>c.width)));
  for (let phase=0; phase<4; phase++) {
    const c=rows[row][phase];
    let sum=0, weighted=0;
    for(let y=c.top+8;y<Math.min(c.top+45,c.top+c.height);y++) for(let x=c.left;x<c.left+c.width;x++) {
      const a=data[(y*width+x)*4+3]; if(a>=100){sum+=a;weighted+=x*a;}
    }
    const collar=weighted/sum-c.left;
    const isolated=Buffer.from(data);
    for(let pixel=0;pixel<labels.length;pixel++) if(!c.labels.includes(labels[pixel])) isolated[pixel*4+3]=0;
    const drawing=await sharp(isolated,{raw:info}).extract({left:c.left,top:c.top,width:c.width,height:c.height}).resize(Math.round(c.width*scale),Math.round(c.height*scale)).png().toBuffer();
    await sharp({create:{width:640,height:640,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:drawing,left:Math.round(320-collar*scale),top:40}]).png().toFile(`${output}/${row===0?'trench':'tuxedo'}-${phase}.png`);
  }
}
await writeFile(`${output}/extraction.json`, JSON.stringify({source,width,height,rows},null,2));
console.log('Eight phases extracted and aligned');
