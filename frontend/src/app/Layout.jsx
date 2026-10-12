import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useMaison } from '../shared/state';
import { Icon } from '../shared/components';
import { BrandLogo } from '../shared/BrandLogo';
export const socialLinks = [
  ['GitHub', 'https://github.com/AraceliFradejas'],
  ['LinkedIn', 'https://www.linkedin.com/in/araceli-fradejas-munoz-transformaciondigital/'],
  ['X', 'https://x.com/AraceliFradejas'],
  ['Medium', 'https://medium.com/@araceli.fradejas'],
  ['YouTube', 'https://www.youtube.com/@aracelifradejasmunoz2758'],
];
export default function Layout() {
  const { language, setLanguage, t, cart, user } = useMaison();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const count = cart.lines.reduce((total, line) => total + line.quantity, 0);
  return (
    <>
      <a className="skip-link" href="#main">
        {language === 'es' ? 'Ir al contenido' : 'Skip to content'}
      </a>
      <div className="announcement">{t.demo}</div>
      <header className="site-header">
        <div className="header-top">
          <button
            className="icon-button menu-toggle"
            aria-label={menu ? t.closeMenu : t.openMenu}
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? 'close' : 'menu'} />
          </button>
          <Link className="wordmark" to="/" aria-label="KelseTS Maison">
            <BrandLogo />
          </Link>
          <div className="header-actions">
            <button
              className="language-button"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a castellano'}
            >
              {language.toUpperCase()}
              <span className="language-alt"> / {language === 'es' ? 'EN' : 'ES'}</span>
            </button>
            <Link className="icon-button account-link" to="/account" aria-label={t.account}>
              <Icon name="user" />
            </Link>
            <Link className="icon-button" to="/favorites" aria-label={t.favorites}>
              <Icon name="heart" />
            </Link>
            <Link className="icon-button bag-link" to="/bag" aria-label={`${t.cart} (${count})`}>
              <Icon name="bag" />
              {count > 0 && <span className="bag-count">{count}</span>}
            </Link>
          </div>
        </div>
        <nav
          id="main-nav"
          className={`main-nav ${menu ? 'is-open' : ''}`}
          aria-label={language === 'es' ? 'Navegación principal' : 'Main navigation'}
        >
          <NavLink to="/catalog?category=fashion">{t.fashion}</NavLink>
          <NavLink to="/catalog?category=accessories">{t.accessories}</NavLink>
          <NavLink to="/catalog?category=beauty">{t.beauty}</NavLink>
          <NavLink to="/collections">{t.collections}</NavLink>
          <NavLink to="/runway">{language === 'es' ? 'La pasarela' : 'The runway'}</NavLink>
          <NavLink to="/looks">{t.looks}</NavLink>
          <NavLink to="/story">{t.about}</NavLink>
          <NavLink className="mobile-account" to="/account">
            {t.account}
          </NavLink>
          {user?.role === 'team' && <NavLink to="/team">{t.team}</NavLink>}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <Link className="wordmark" to="/" aria-label="KelseTS Maison">
              <BrandLogo />
            </Link>
            <p>{t.footerLine}</p>
          </div>
          <div className="footer-links">
            <Link to="/story">{t.about}</Link>
            <Link to="/credits">{t.credits}</Link>
            <Link to="/account">{t.account}</Link>
          </div>
        </div>
        <div className="social-links">
          {socialLinks.map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </div>
        <div className="footer-bottom">
          <span>{t.author}</span>
          <span>{t.demo}</span>
        </div>
      </footer>
    </>
  );
}
