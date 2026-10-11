import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaison } from '../../shared/state';
import { Icon } from '../../shared/components';

export default function MaisonFilm() {
  const { language, t } = useMaison();
  const selectFilmSource = () =>
    window.matchMedia('(max-width: 700px)').matches
      ? '/media/maison-film-mobile.mp4?v=maison-final-responsive-20261011'
      : window.matchMedia('(min-width: 1400px)').matches
        ? '/media/maison-film-1440.mp4?v=maison-final-responsive-20261011'
        : '/media/maison-film.mp4?v=maison-final-responsive-20261011';
  const [filmSource, setFilmSource] = useState(selectFilmSource);
  const portrait = filmSource.includes('mobile');
  const poster = portrait
    ? '/media/maison-film-mobile-poster.webp'
    : '/media/maison-film-poster.webp';
  useEffect(() => {
    const queries = ['(max-width: 700px)', '(min-width: 1400px)'].map((query) =>
      window.matchMedia(query),
    );
    const update = () => setFilmSource(selectFilmSource());
    queries.forEach((query) => query.addEventListener('change', update));
    return () => queries.forEach((query) => query.removeEventListener('change', update));
  }, []);
  const video = useRef(null);
  const root = useRef(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
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
      className={`maison-film${playing ? ' is-playing' : ''}`}
      aria-labelledby="maison-film-title"
    >
      <img
        src={poster}
        alt=""
        width={portrait ? 1080 : 1920}
        height={portrait ? 1440 : 1080}
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
            ? 'Sol, lluvia y nieve. Del traje italiano a la gala. Todas tus versiones.'
            : 'Sun, rain and snow. From Italian tailoring to gala. Every version of you.'}
        </p>
        <Link className="campaign-link" to="/catalog">
          {t.explore} <Icon name="arrow" />
        </Link>
      </div>
      <div className="maison-film-controls">
        <span>
          {es
            ? 'PELÍCULA MAISON · CLIMAS / SASTRERÍA / GALA'
            : 'MAISON FILM · WEATHER / TAILORING / GALA'}
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
