const validToken = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const failure = (code) => Object.assign(new Error(code), { code });

export async function loginNative(
  { request, verifyToken, revokeToken, session, prepareCart, clearGuest },
  input,
  register = false,
) {
  let token;
  try {
    const issued = await request(register ? '/auth/native/register' : '/auth/native/login', {
      method: 'POST',
      body: input,
    });
    if (validToken(issued?.token)) token = issued.token;
    if (!token || typeof issued?.user?.id !== 'string' || !issued.user.id)
      throw failure('invalid_response');
    const verified = await verifyToken(token);
    if (verified?.id !== issued.user.id) throw failure('session_unavailable');
    await session.save(token);
    const cart = await prepareCart(verified);
    await clearGuest();
    return { user: verified, cart };
  } catch (error) {
    if (token) {
      for (const cleanup of [() => revokeToken(token), () => session.clear()]) {
        try {
          await cleanup();
        } catch {
          // Preserve the original failure even when cleanup is unavailable.
        }
      }
    }
    throw error;
  }
}
