// Map approach adapted from Araceli Fradejas Muñoz's KelseTS Cars.
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { demoBoutiques, boutiqueCopy } from '@maison/contracts/boutiques';
export default function BoutiqueMap({ language, selected, picking, onPoint, onSelect }) {
  const element = useRef(null);
  const map = useRef(null);
  const [failed, setFailed] = useState(false);
  const t = boutiqueCopy[language];
  useEffect(() => {
    const instance = L.map(element.current, { scrollWheelZoom: false });
    map.current = instance;
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance);
    tiles.on('tileerror', () => setFailed(true));
    tiles.on('load', () => instance.invalidateSize());
    for (const b of demoBoutiques) {
      const text = document.createElement('span');
      text.textContent = b.name;
      L.circleMarker([b.latitude, b.longitude], {
        radius: 10,
        color: '#fff',
        fillColor: '#b3152b',
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(text)
        .on('click', () => onSelect(b.id))
        .addTo(instance);
    }
    instance.fitBounds(
      demoBoutiques.map((b) => [b.latitude, b.longitude]),
      { padding: [30, 30] },
    );
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(element.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (selected) {
      const b = demoBoutiques.find((b) => b.id === selected);
      instance.setView([b.latitude, b.longitude], 14);
    } else
      instance.fitBounds(
        demoBoutiques.map((b) => [b.latitude, b.longitude]),
        { padding: [30, 30] },
      );
  }, [selected]);
  useEffect(() => {
    if (!picking) return;
    const click = (e) => onPoint({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    const instance = map.current;
    instance.on('click', click);
    instance.getContainer().style.cursor = 'crosshair';
    return () => {
      instance.off('click', click);
      instance.getContainer().style.cursor = '';
    };
  }, [picking, onPoint]);
  return (
    <>
      <div ref={element} className="boutique-map" role="region" aria-label={t.mapLabel} />
      {failed && (
        <p role="status" className="fine-print">
          {t.tileError}
        </p>
      )}
    </>
  );
}
