import { loginSchema, registerSchema } from '@maison/contracts';

export function accountInput({ email, password, name, register }) {
  const schema = register ? registerSchema : loginSchema;
  const result = schema.safeParse({
    email: email.trim(),
    password,
    ...(register ? { name } : {}),
  });
  if (!result.success) {
    const field = result.error.issues[0]?.path[0];
    const code = ['email', 'password', 'name'].includes(field)
      ? `invalid_${field}`
      : 'invalid_input';
    throw Object.assign(new Error(code), { code });
  }
  return result.data;
}
