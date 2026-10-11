import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaison } from '../../shared/state';
import { Icon } from '../../shared/components';
import MaisonFilm from './MaisonFilm';

const scenes = [
  {
    id: 'emerald',
    name: 'Midnight Atelier',
    collection: 'spotlight',
    image: '/media/hero-era-emerald.webp',
    video: '/media/hero-era-emerald.mp4',
    es: 'La noche se viste de brillo',
    en: 'Dress the night in shimmer',
  },
  {
    id: 'ivory',
    name: 'Rosé Daydream',
    collection: 'studio-ivory',
    image: '/media/hero-era-ivory.webp',
    video: '/media/hero-era-ivory.mp4',
    es: 'Romance bajo un cielo rosa',
    en: 'Romance beneath a pink sky',
  },
  {
    id: 'city',
    name: 'Woodland Stories',
    collection: 'city-pages',
    image: '/media/hero-era-city.webp',
    video: '/media/hero-era-city.mp4',
    es: 'Historias entre hojas y luz',
    en: 'Stories between leaves and light',
  },
  {
    id: 'travel',
    name: 'Scarlet Avenue',
    collection: 'travel-maison',
    image: '/media/hero-era-travel.webp',
    video: '/media/hero-era-travel.mp4',
    es: 'Otoño, rojo y nuevos caminos',
    en: 'Autumn, red and new paths',
  },
];

function CampaignScene({ scene, index, active, setActive, language }) {
  const root = useRef(null);
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setActive((current) => (current === scene.id ? null : current));
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [scene.id, setActive]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (active && !reduced && !failed) {
      if (!loaded) {
        setLoaded(true);
        return;
      }
      element.play().catch(() => setPlaying(false));
    } else {
      element.pause();
      if (element.readyState > 0) element.currentTime = 0;
      setPlaying(false);
    }
    return () => element.pause();
  }, [active, reduced, failed, loaded]);
  useEffect(() => {
    const pauseHidden = () => {
      if (document.hidden) setActive(null);
    };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => document.removeEventListener('visibilitychange', pauseHidden);
  }, [setActive]);
  const canPlay = Boolean(scene.video) && !failed && !reduced;
  const label = language === 'es' ? scene.es : scene.en;
  return (
    <article
      ref={root}
      className={`campaign-scene${playing ? ' is-playing' : ''}`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && canPlay && !event.target.closest('button')) {
          setActive(scene.id);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setActive(null);
      }}
      onFocus={(event) => {
        if (event.target.closest('a') && canPlay) setActive(scene.id);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
      }}
    >
      <img
        src={scene.image}
        alt={label}
        width="720"
        height="1280"
        fetchPriority={index === 0 ? 'high' : 'auto'}
      />
      {scene.video && (
        <video
          ref={video}
          src={loaded ? scene.video : undefined}
          poster={scene.image}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        />
      )}
      <div className="campaign-scene-copy">
        <span className="campaign-number">0{index + 1} / KelseTS MAISON</span>
        <h2>{scene.name}</h2>
        <p>{label}</p>
        <Link className="campaign-link" to={`/catalog?collection=${scene.collection}`}>
          {language === 'es' ? 'Explorar el look' : 'Explore the look'} <Icon name="arrow" />
        </Link>
      </div>
      {canPlay && (
        <button
          type="button"
          className="campaign-play"
          aria-pressed={active}
          aria-label={
            language === 'es'
              ? `${active ? 'Pausar' : 'Reproducir'} vídeo de ${scene.name}`
              : `${active ? 'Pause' : 'Play'} ${scene.name} video`
          }
          onClick={() => setActive(active ? null : scene.id)}
        >
          {active ? 'Ⅱ' : '▷'}
        </button>
      )}
    </article>
  );
}

export default function CampaignHero() {
  const { language, t } = useMaison();
  const [active, setActive] = useState(null);
  return (
    <>
      <MaisonFilm />
      <section className="campaign-hero" aria-labelledby="campaign-title">
        <div className="campaign-heading container">
          <div>
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h2 id="campaign-title">
              {language === 'es' ? 'Encuentra tu era.' : 'Find your era.'}
            </h2>
          </div>
          <div>
            <p>{t.heroBody}</p>
            <Link className="text-link" to="/catalog">
              {t.explore}
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div className="campaign-grid">
          {scenes.map((scene, index) => (
            <CampaignScene
              key={scene.id}
              scene={scene}
              index={index}
              language={language}
              active={active === scene.id}
              setActive={setActive}
            />
          ))}
        </div>
        <div className="campaign-signature">EST. 2026 · ARACELI FRADEJAS MUÑOZ</div>
      </section>
    </>
  );
}
