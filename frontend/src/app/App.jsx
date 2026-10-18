import Boutiques from '../features/boutiques/Boutiques';
import Runway, { RunwayLook } from '../features/catalog/Runway';
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './Layout';
import Home from '../features/catalog/Home';
import Catalog, { Collections } from '../features/catalog/Catalog';
import Product from '../features/catalog/Product';
import Looks from '../features/catalog/Looks';
import Access from '../features/account/Access';
import Account, { Favorites, OrderDetail } from '../features/account/Account';
import Bag from '../features/cart/Bag';
import Team from '../features/team/Team';
import Story, { Credits } from '../features/brand/Story';
import { useMaison } from '../shared/state';
import { Empty } from '../shared/components';
function Guard({ children, team = false }) {
  const { user, authReady, t } = useMaison();
  const location = useLocation();
  if (!authReady)
    return (
      <div className="resource-state" role="status">
        {t.loading}
      </div>
    );
  if (!user)
    return (
      <Navigate
        to={`/access?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (team && user.role !== 'team') return <Navigate to="/account" replace />;
  return children;
}
export default function App() {
  const { t, language } = useMaison();
  const location = useLocation();
  useEffect(() => {
    const page =
      location.pathname === '/boutiques'
        ? language === 'es'
          ? 'Nuestras boutiques'
          : 'Our boutiques'
        : location.pathname === '/'
          ? t.home
          : location.pathname.startsWith('/runway')
            ? language === 'es'
              ? 'La pasarela'
              : 'The runway'
            : location.pathname.startsWith('/catalog')
              ? t.catalogue
              : location.pathname.startsWith('/products')
                ? t.catalogue
                : location.pathname === '/looks'
                  ? t.looks
                  : location.pathname === '/bag'
                    ? t.cart
                    : location.pathname === '/favorites'
                      ? t.favorites
                      : location.pathname === '/story'
                        ? t.about
                        : location.pathname === '/collections'
                          ? t.collections
                          : location.pathname === '/credits'
                            ? t.credits
                            : location.pathname === '/team'
                              ? t.team
                              : location.pathname.startsWith('/orders/')
                                ? t.orderDetail
                                : t.account;
    document.title = `${page} · KelseTS Maison`;
  }, [location.pathname, language]);
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="runway" element={<Runway />} />
        <Route path="runway/:id" element={<RunwayLook />} />
        <Route path="products/:id" element={<Product />} />
        <Route path="collections" element={<Collections />} />
        <Route path="looks" element={<Looks />} />
        <Route path="boutiques" element={<Boutiques />} />
        <Route path="bag" element={<Bag />} />
        <Route path="access" element={<Access />} />
        <Route
          path="account"
          element={
            <Guard>
              <Account />
            </Guard>
          }
        />
        <Route
          path="favorites"
          element={
            <Guard>
              <Favorites />
            </Guard>
          }
        />
        <Route
          path="orders/:id"
          element={
            <Guard>
              <OrderDetail />
            </Guard>
          }
        />
        <Route
          path="team"
          element={
            <Guard team>
              <Team />
            </Guard>
          }
        />
        <Route path="story" element={<Story />} />
        <Route path="credits" element={<Credits />} />
        <Route
          path="*"
          element={
            <div className="container page">
              <Empty text={t.notFound} to="/" label={t.returnHome} />
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
