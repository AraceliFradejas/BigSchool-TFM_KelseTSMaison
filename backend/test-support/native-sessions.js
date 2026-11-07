import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import request from 'supertest';

export async function verifyNativeSessions({ app, db, config, recreate }) {
  const credentials = {
    name: 'Native Session Demo',
    email: 'native-session@example.test',
    password: 'Native-Maison-2026',
  };
  const post = (route, body) =>
    request(app)
      .post(`/api/v1/auth${route}`)
      .set('Origin', config.origin)
      .set('X-Maison-Request', '1')
      .send(body);
  const registered = await post('/native/register', credentials).unset('Origin');
  assert.equal(registered.status, 201, JSON.stringify(registered.body));
  assert.equal(registered.headers['cache-control'], 'no-store');
  const { user, token } = registered.body.data;
  assert.equal(user.role, 'customer');
  assert.equal(user.password, undefined);
  assert.equal(user.password_hash, undefined);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.ok(
    !(registered.headers['set-cookie'] || []).some((value) =>
      /^maison_session=[a-f0-9]{64}/.test(value),
    ),
  );
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const stored =
    db.kind === 'mongo'
      ? await db.collection('sessions').findOne({ id: tokenHash })
      : db.prepare('SELECT * FROM sessions WHERE token_hash=?').get(tokenHash);
  assert.ok(stored);
  assert.ok(!JSON.stringify(stored).includes(token));

  // A new app instance and request authenticate without a browser cookie jar.
  const restored = await request(recreate())
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(restored.body.data.id, user.id);
  assert.equal(restored.body.data.token, undefined);
  assert.equal(
    (await request(app).get('/api/v1/team/products').set('Authorization', `Bearer ${token}`))
      .status,
    403,
  );
  assert.equal(
    (await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${token}`)).status,
    200,
  );

  const webCredentials = { ...credentials, email: 'web-session@example.test' };
  const web = await post('/register', webCredentials);
  assert.equal(web.status, 201);
  assert.equal(web.body.data.token, undefined);
  assert.equal(web.body.data.user, undefined);
  assert.match(web.headers['set-cookie'][0], /HttpOnly/);
  const cookie = web.headers['set-cookie'][0].split(';')[0];
  // A cookie alone cannot be exchanged for a raw token.
  assert.equal((await post('/native/login', {}).set('Cookie', cookie)).status, 400);
  assert.equal(
    (await post('/native/login', { email: credentials.email, password: 'Wrong-Maison-2026' }))
      .status,
    401,
  );
  assert.equal(
    (
      await post('/native/register', {
        ...credentials,
        email: 'role-session@example.test',
        role: 'team',
      })
    ).status,
    400,
  );

  const preferred = await request(app)
    .get('/api/v1/auth/me')
    .set('Cookie', cookie)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(preferred.body.data.id, user.id);
  const invalid = await request(app)
    .get('/api/v1/auth/me')
    .set('Cookie', cookie)
    .set('Authorization', 'Bearer invalid');
  assert.equal(invalid.body.data, null);

  const login = await post('/native/login', {
    email: credentials.email,
    password: credentials.password,
  }).set('Authorization', `Bearer ${token}`);
  assert.equal(login.status, 200);
  const nextToken = login.body.data.token;
  assert.notEqual(nextToken, token);
  assert.equal(
    (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)).body.data,
    null,
  );
  const logout = await post('/logout', {}).set('Authorization', `Bearer ${nextToken}`);
  assert.equal(logout.status, 200);
  assert.equal(
    (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${nextToken}`)).body
      .data,
    null,
  );

  const expiring = await post('/native/login', {
    email: credentials.email,
    password: credentials.password,
  });
  const expiredToken = expiring.body.data.token;
  const expiredHash = createHash('sha256').update(expiredToken).digest('hex');
  if (db.kind === 'mongo')
    await db
      .collection('sessions')
      .updateOne({ id: expiredHash }, { $set: { expiresAt: new Date(0) } });
  else db.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash=?').run(expiredHash);
  assert.equal(
    (await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${expiredToken}`)).body
      .data,
    null,
  );
}
