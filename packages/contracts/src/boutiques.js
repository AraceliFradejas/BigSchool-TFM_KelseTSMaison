// Map, Street View and distance approach adapted from Araceli Fradejas Muñoz's KelseTS Cars.
export const demoBoutiques = [
  {
    id: 'madrid-milla-oro',
    name: 'Maison · Milla de Oro',
    city: 'Madrid',
    location: {
      es: 'Calle de Serrano · Barrio de Salamanca, Madrid',
      en: 'Calle de Serrano · Salamanca district, Madrid',
    },
    latitude: 40.4272,
    longitude: -3.6878,
    image: '/media/boutique-madrid.webp',
    photo: {
      author: 'Lourdes Cardenal',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:01b_Madrid_Calle_de_Serrano_by_Lou.jpg',
    },
  },
  {
    id: 'barcelona-passeig',
    name: 'Maison · Passeig de Gràcia',
    city: 'Barcelona',
    location: {
      es: 'Passeig de Gràcia · Eixample, Barcelona',
      en: 'Passeig de Gràcia · Eixample, Barcelona',
    },
    latitude: 41.3953,
    longitude: 2.161,
    image: '/media/boutique-barcelona.webp',
    photo: {
      author: 'Bernard Gagnon',
      license: 'CC BY-SA 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Passeig_de_Gr%C3%A0cia,_Barcelona.jpg',
    },
  },
  {
    id: 'marbella-puerto-banus',
    name: 'Maison · Puerto Banús',
    city: 'Marbella',
    location: { es: 'Entorno de Puerto Banús · Marbella', en: 'Puerto Banús area · Marbella' },
    latitude: 36.4858,
    longitude: -4.9538,
    image: '/media/boutique-marbella.webp',
    photo: {
      author: 'Sean Glossop',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Porto_Banus.jpg',
    },
  },
];
export const boutiqueCopy = {
  es: {
    title: 'Nuestras primeras boutiques',
    intro: 'Tres destinos para una misma historia.',
    fiction:
      'Boutiques ficticias y ubicaciones aproximadas para un proyecto académico. No existen locales de Maison ni acuerdos con comercios de estas calles.',
    photo: 'Fotografía del entorno real · No muestra una tienda Maison',
    changes: 'Imagen reducida y convertida a WebP; encuadre adaptable.',
    street: 'Explorar la calle en Street View ↗',
    map: 'Ver en el mapa',
    externalMap: 'Abrir mapa externo ↗',
    locate: 'Calcular distancia desde mi ubicación',
    locating: 'Buscando ubicación…',
    clear: 'Olvidar ubicación',
    privacy:
      'La ubicación es opcional y solo se usa en esta pantalla para calcular distancias. No se guarda en tu cuenta ni en el pedido. Los mapas y enlaces de calles consultan proveedores externos.',
    distance: 'km en línea recta · distancia aproximada, no ruta por carretera',
    denied:
      'No se ha podido obtener tu ubicación. Puedes explorar las boutiques sin compartirla o elegir un punto en el mapa.',
    point: 'Elegir un punto de partida en el mapa',
    picking: 'Toca el mapa para elegir un punto de partida.',
    mapLabel: 'Mapa de boutiques ficticias Maison',
    tileError:
      'El mapa no se ha podido cargar. Puedes consultar las ubicaciones y abrir el mapa externo.',
    selected: 'Boutique elegida',
    choose: 'Elegir esta boutique',
    source: 'Fuente de la foto',
    region: 'Disponible por el momento en la Comunidad de Madrid, Barcelona y Marbella.',
  },
  en: {
    title: 'Our first boutiques',
    intro: 'Three destinations, one shared story.',
    fiction:
      'Fictional boutiques and approximate locations for an academic project. There are no Maison premises or agreements with shops on these streets.',
    photo: 'Real neighbourhood photograph · Does not show a Maison store',
    changes: 'Image resized and converted to WebP; responsive crop.',
    street: 'Explore the street in Street View ↗',
    map: 'Show on map',
    externalMap: 'Open external map ↗',
    locate: 'Calculate distance from my location',
    locating: 'Finding location…',
    clear: 'Forget location',
    privacy:
      'Location is optional and used only on this screen to calculate distances. It is not stored in your account or order. Maps and street links use external providers.',
    distance: 'km in a straight line · approximate distance, not a driving route',
    denied:
      'Could not obtain your location. You can browse boutiques without sharing it or choose a starting point on the map.',
    point: 'Choose a starting point on the map',
    picking: 'Tap the map to choose a starting point.',
    mapLabel: 'Map of fictional Maison boutiques',
    tileError: 'The map could not load. You can browse locations and open the external map.',
    selected: 'Selected boutique',
    choose: 'Choose this boutique',
    source: 'Photo source',
    region: 'Currently available in the Community of Madrid, Barcelona and Marbella.',
  },
};
export function streetViewUrl(b) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${b.latitude},${b.longitude}`;
}
export function boutiqueMapUrl(b) {
  return `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
}
export function distanceKm(origin, destination) {
  for (const point of [origin, destination])
    if (
      !point ||
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      Math.abs(point.latitude) > 90 ||
      Math.abs(point.longitude) > 180
    )
      throw new RangeError('Invalid coordinates');
  const rad = (value) => (value * Math.PI) / 180;
  const a =
    Math.sin(rad(destination.latitude - origin.latitude) / 2) ** 2 +
    Math.cos(rad(origin.latitude)) *
      Math.cos(rad(destination.latitude)) *
      Math.sin(rad(destination.longitude - origin.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}
export function distanceLabel(origin, b, language) {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-GB', {
    maximumFractionDigits: 1,
  }).format(distanceKm(origin, b));
}
