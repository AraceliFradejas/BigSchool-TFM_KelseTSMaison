import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaison } from '../../shared/state';
import { Icon } from '../../shared/components';

export default function MaisonFilm() {
  const { language, t } = useMaison();
  const video = useRef(null);
  const root = useRef(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = true;
    const update = () => {
      if (paused || reduced || failed || document.hidden || !visible) element.pause();
      else element.play().catch(() => setPaused(true));
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      element.pause();
    };
  }, [paused, reduced, failed]);
  const es = language === 'es';
  return (
    <section
      ref={root}
      className={`maison-film${playing ? ' is-playing' : ''}`}
      aria-labelledby="maison-film-title"
    >
      <img
        src="/media/maison-film-poster.webp"
        alt=""
        width="1280"
        height="720"
        fetchPriority="high"
      />
      {!failed && (
        <video
          ref={video}
          src={reduced ? undefined : '/media/maison-film.mp4'}
          poster="/media/maison-film-poster.webp"
          muted
            autoPlay={!reduced}
          loop
          playsInline
          preload={reduced ? 'none' : 'metadata'}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />
      )}
      <div className="maison-film-copy">
        <p className="eyebrow">KelseTS MAISON · {es ? 'TODAS TUS ERAS' : 'ALL YOUR ERAS'}</p>
        <h1 id="maison-film-title">{t.heroTitle}</h1>
        <p className="maison-film-description">
          {es
            ? 'Un día. Cuatro estaciones. Todas tus versiones.'
            : 'One day. Four seasons. Every version of you.'}
        </p>
        <Link className="campaign-link" to="/catalog">
          {t.explore} <Icon name="arrow" />
        </Link>
      </div>
      <div className="maison-film-controls">
        <span>
          {es
            ? 'PELÍCULA MAISON · PRIMAVERA / VERANO / OTOÑO / INVIERNO'
            : 'MAISON FILM · SPRING / SUMMER / AUTUMN / WINTER'}
        </span>
        {!failed && !reduced && (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={
              es
                ? paused
                  ? 'Reproducir película Maison'
                  : 'Pausar película Maison'
                : paused
                  ? 'Play Maison film'
                  : 'Pause Maison film'
            }
          >
            <span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{' '}
            {es ? (paused ? 'Reproducir' : 'Pausar') : paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
    </section>
  );
}
