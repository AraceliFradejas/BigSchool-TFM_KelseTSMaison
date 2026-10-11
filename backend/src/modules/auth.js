import { Router } from 'express';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { registerSchema, loginSchema } from '@maison/contracts';
import { HttpError, parse, send } from '../http.js';
const deriveKey = promisify(scrypt);
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
async function hashPassword(password) {
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
  return (req, res, next) => {
    const token = req.cookies.maison_session;
    if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) {
      const user = db
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
  const options = {
    httpOnly: true,
    secure: config.production,
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_DURATION_MS,
  };
  function startSession(req, res, user) {
    if (req.cookies.maison_session)
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        hashToken(req.cookies.maison_session),
      );
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(
      hashToken(token),
      user.id,
      Date.now() + SESSION_DURATION_MS,
    );
    res.cookie('maison_session', token, options);
    return publicUser(user);
  }
  router.get('/me', (req, res) => send(res, req.user || null));
  router.post('/register', limiter, async (req, res) => {
    const input = parse(registerSchema, req.body);
    if (db.prepare('SELECT id FROM users WHERE email=?').get(input.email))
      throw new HttpError(409, 'email_exists');
    const user = { id: randomUUID(), ...input, role: 'customer' };
    const passwordHash = await hashPassword(input.password);
    // Recheck after password hashing: another request may have registered this email.
    if (db.prepare('SELECT id FROM users WHERE email=?').get(input.email))
      throw new HttpError(409, 'email_exists');
    db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(
      user.id,
      user.name,
      user.email,
      passwordHash,
      user.role,
      new Date().toISOString(),
    );
    send(res, startSession(req, res, user), 201);
  });
  router.post('/login', limiter, async (req, res) => {
    const input = parse(loginSchema, req.body);
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(input.email);
    const valid = await verifyPassword(input.password, user?.password_hash);
    if (!user || !valid) throw new HttpError(401, 'invalid_credentials');
    send(res, startSession(req, res, user));
  });
  router.post('/logout', (req, res) => {
    if (req.cookies.maison_session)
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(
        hashToken(req.cookies.maison_session),
      );
    const { maxAge, ...clearOptions } = options;
    res.clearCookie('maison_session', clearOptions);
    send(res, null);
  });
  return router;
}
