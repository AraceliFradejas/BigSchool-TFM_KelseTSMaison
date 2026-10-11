import images from './catalog-images.json';

export function catalogImageProps(src) {
  if (!images[src]) return { src };
  return {
    src,
    srcSet: `${src.replace('.webp', '-small.webp')} 600w, ${src} ${images[src]}w`,
    sizes: '(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 30vw',
  };
}
