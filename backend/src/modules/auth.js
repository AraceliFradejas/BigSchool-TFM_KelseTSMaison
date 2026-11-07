import { Router } from 'express';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { registerSchema, loginSchema } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
const deriveKey = promisify(scrypt);
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
// Web uses an HttpOnly cookie; native uses an opaque Bearer token.
// A malformed Authorization header never falls back to a different cookie identity.
const sessionToken = (req) => {
  const authorization = req.get('Authorization');
  if (authorization !== undefined)
    return /^Bearer ([a-f0-9]{64})$/.exec(authorization)?.[1] || null;
  const value = req.cookies.maison_session;
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : null;
};
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [salt, hex] = (stored || `invalid:${'0'.repeat(128)}`).split(':');
  const key = await deriveKey(password, salt, 64);
  return timingSafeEqual(Buffer.from(hex, 'hex'), key);
}
export function sessionMiddleware(db) {
  return async (req, res, next) => {
    const token = sessionToken(req);
    if (token) {
      const user =
        db.kind === 'mongo'
          ? await db.findSessionUser(hashToken(token), Date.now())
          : db
              .prepare(
                'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?',
              )
              .get(hashToken(token), Date.now());
      if (user) req.user = publicUser(user);
    }
    next();
  };
}
export function requireUser(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'authentication_required'));
  next();
}
export function requireTeam(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'authentication_required'));
  if (req.user.role !== 'team') return next(new HttpError(403, 'permission_denied'));
  next();
}
export function authRouter(db, config, limiter) {
  const router = Router();
  const findUser = (email) =>
    db.kind === 'mongo'
      ? db.findUser(email)
      : db.prepare('SELECT * FROM users WHERE email=?').get(email);
  const options = {
    httpOnly: true,
    secure: config.production,
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_DURATION_MS,
  };
  async function startSession(req, res, user, native = false) {
    const oldToken = sessionToken(req);
    const token = randomBytes(32).toString('hex');
    if (db.kind === 'mongo') {
      await db.startSession(
        oldToken && hashToken(oldToken),
        hashToken(token),
        user.id,
        Date.now() + SESSION_DURATION_MS,
      );
    } else {
      if (oldToken) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(oldToken));
      db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
      db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(
        hashToken(token),
        user.id,
        Date.now() + SESSION_DURATION_MS,
      );
    }
    if (native) {
      // Password-verified native login only: never export an existing HttpOnly cookie.
      const { maxAge, ...clearOptions } = options;
      res.clearCookie('maison_session', clearOptions);
      return { user: publicUser(user), token };
    }
    res.cookie('maison_session', token, options);
    return publicUser(user);
  }
  router.get('/me', (req, res) => send(res, req.user || null));
  const register =
    (native = false) =>
    async (req, res) => {
      const input = parse(registerSchema, req.body);
      if (await findUser(input.email)) throw new HttpError(409, 'email_exists');
      const user = { id: randomUUID(), ...input, role: 'customer' };
      const passwordHash = await hashPassword(input.password);
      // Recheck after password hashing: another request may have registered this email.
      if (await findUser(input.email)) throw new HttpError(409, 'email_exists');
      if (db.kind === 'mongo')
        await db.insertUser({
          id: user.id,
          name: user.name,
          email: user.email,
          password_hash: passwordHash,
          role: user.role,
          created_at: new Date().toISOString(),
        });
      else
        db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
          user.id,
          user.name,
          user.email,
          passwordHash,
          user.role,
          new Date().toISOString(),
        );
      send(res, await startSession(req, res, user, native), 201);
    };
  const login =
    (native = false) =>
    async (req, res) => {
      const input = parse(loginSchema, req.body);
      const user = await findUser(input.email);
      const valid = await verifyPassword(input.password, user?.password_hash);
      if (!user || !valid) throw new HttpError(401, 'invalid_credentials');
      send(res, await startSession(req, res, user, native));
    };
  router.post('/register', limiter, register());
  router.post('/login', limiter, login());
  router.post('/native/register', limiter, register(true));
  router.post('/native/login', limiter, login(true));
  router.post('/logout', async (req, res) => {
    const token = sessionToken(req);
    if (db.kind === 'mongo' && token) await db.deleteSession(hashToken(token));
    if (db.kind !== 'mongo' && token)
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));
    const { maxAge, ...clearOptions } = options;
    res.clearCookie('maison_session', clearOptions);
    send(res, null);
  });
  return router;
}
