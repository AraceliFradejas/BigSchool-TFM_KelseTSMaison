import test from 'node:test';
import assert from 'node:assert/strict';
import { accountInput } from '../src/account-input.js';

const valid = {
  email: '  DEMO@example.test ',
  password: 'Maison-Demo-2026',
  name: ' Alex Maison ',
  register: true,
};

test('account form normalizes autofill whitespace without altering passwords', () => {
  assert.deepEqual(accountInput({ ...valid, password: ' Maison-Demo-2026 ' }), {
    email: 'demo@example.test',
    password: ' Maison-Demo-2026 ',
    name: 'Alex Maison',
  });
  assert.deepEqual(accountInput({ ...valid, register: false }), {
    email: 'demo@example.test',
    password: valid.password,
  });
});

test('account form identifies the field rejected by the shared server contract', () => {
  for (const [field, value] of [
    ['email', 'invalid'],
    ['name', 'A'],
    ['password', 'short'],
  ])
    assert.throws(
      () => accountInput({ ...valid, [field]: value }),
      (error) => error.code === `invalid_${field}`,
    );
  assert.throws(
    () => accountInput({ ...valid, password: 'a'.repeat(129) }),
    (error) => error.code === 'invalid_password',
  );
});
