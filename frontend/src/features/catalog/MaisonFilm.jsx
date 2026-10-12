import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaison } from '../../shared/state';
import { Icon } from '../../shared/components';

export default function MaisonFilm() {
  const { language, t } = useMaison();
  const selectFilmSource = () => window.matchMedia('(max-width: 700px)').matches
    ? '/media/maison-film-lateral-mobile.mp4?v=lateral-20261012'
    : '/media/maison-film-lateral.mp4?v=lateral-20261012';
  const [filmSource, setFilmSource] = useState(selectFilmSource);
  const portrait = filmSource.includes('mobile');
  const poster = portrait
    ? '/media/maison-film-lateral-mobile-poster.webp'
    : '/media/maison-film-lateral-poster.webp';
  useEffect(() => {
    const queries = ['(max-width: 700px)'].map((query) => window.matchMedia(query));
    const update = () => setFilmSource(selectFilmSource());
    queries.forEach((query) => query.addEventListener('change', update));
    return () => queries.forEach((query) => query.removeEventListener('change', update));
  }, []);
  const video = useRef(null);
  const root = useRef(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [filmSource]);
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
  }, [paused, reduced, failed, filmSource]);
  const es = language === 'es';
  return (
    <section
      ref={root}
      className={`maison-film is-illustrated${ready ? ' is-playing' : ''}`}
      aria-labelledby="maison-film-title"
    >
      <img
        src={poster}
        alt=""
        width={portrait ? 1080 : 1920}
        height={portrait ? 1920 : 1080}
        fetchPriority="high"
      />
      {!failed && (
        <video
          key={filmSource}
          ref={video}
          src={reduced ? undefined : filmSource}
          poster={poster}
          muted={muted}
          autoPlay={!reduced}
          loop
          playsInline
          preload={reduced ? 'none' : 'metadata'}
          aria-hidden="true"
          onPlaying={() => setReady(true)}
          onError={() => {
            setFailed(true);
            setReady(false);
          }}
        />
      )}
      <div className="maison-film-copy">
        <p className="eyebrow">KelseTS MAISON · {es ? 'EL CUADERNO' : 'THE SKETCHBOOK'}</p>
        <h1 id="maison-film-title">{t.heroTitle}</h1>
        <p className="maison-film-description">
          {es
            ? 'Tinta, acuarela y prendas que cobran vida. Del día a día a la gala.'
            : 'Ink, watercolor and clothes coming to life. From everyday moments to gala.'}
        </p>
        <Link className="campaign-link" to="/catalog">
          {t.explore} <Icon name="arrow" />
        </Link>
      </div>
      <div className="maison-film-controls">
        <span>
          {es
            ? 'EL CUADERNO MAISON · DÍA A DÍA / ELEGANCIA / GALA'
            : 'THE MAISON SKETCHBOOK · EVERYDAY / ELEGANCE / GALA'}
        </span>
        {!failed && !reduced && (
          <button
            type="button"
            onClick={() => {
              const nextMuted = !muted;
              if (video.current) {
                video.current.muted = nextMuted;
                if (!paused) video.current.play().catch(() => setPaused(true));
              }
              setMuted(nextMuted);
            }}
            aria-pressed={!muted}
            aria-label={
              es
                ? muted
                  ? 'Activar música'
                  : 'Silenciar música'
                : muted
                  ? 'Enable music'
                  : 'Mute music'
            }
          >
            {es ? (muted ? 'Activar música' : 'Silenciar') : muted ? 'Enable music' : 'Mute'}
          </button>
        )}
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
