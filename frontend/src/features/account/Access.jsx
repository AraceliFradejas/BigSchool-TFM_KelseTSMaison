import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMaison, api } from '../../shared/state';
import { PageHeading } from '../../shared/components';
export default function Access() {
  const { user, authReady, authenticated, t, errorText } = useMaison();
  const [params] = useSearchParams();
  const register = params.get('mode') === 'register';
  const requested = params.get('next') || '/account';
  const next =
    requested.startsWith('/') &&
    !requested.startsWith('//') &&
    !requested.includes('\\') &&
    !requested.startsWith('/access')
      ? requested
      : '/account';
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const body = { email: data.get('email'), password: data.get('password') };
    if (register) body.name = data.get('name');
    try {
      const current = await api.request(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body,
      });
      authenticated(current);
      navigate(next, { replace: true });
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  if (authReady && user) return <Navigate to={next} replace />;
  return (
    <div className="container page access-page">
      <PageHeading
        eyebrow="KelseTS MAISON"
        title={register ? t.register : t.welcome}
        body={t.loginIntro}
      />
      <form className="access-form" onSubmit={submit}>
        {register && (
          <label>
            {t.name}
            <input name="name" autoComplete="name" minLength={2} maxLength={80} required />
          </label>
        )}
        <label>
          {t.email}
          <input type="email" name="email" autoComplete="email" maxLength={254} required />
        </label>
        <label>
          {t.password}
          <input
            type="password"
            name="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            minLength={10}
            maxLength={128}
            required
          />
          {register && <small>{t.passwordHelp}</small>}
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button full" disabled={busy || !authReady}>
          {busy ? t.working : register ? t.register : t.login}
        </button>
        <p>
          {register ? t.existingAccount : t.newAccount}{' '}
          <Link
            className="underlined"
            to={`/access?${new URLSearchParams({ mode: register ? 'login' : 'register', next })}`}
            onClick={() => setError('')}
          >
            {register ? t.login : t.register}
          </Link>
        </p>
        <p className="fine-print">{t.privateDemo}</p>
      </form>
    </div>
  );
}
