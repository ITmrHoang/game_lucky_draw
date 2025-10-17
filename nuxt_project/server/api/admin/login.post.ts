import { getEnvHash, sha256, signSession, setSessionCookie } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const password = body?.password as string;
  if (!password) throw createError({ statusCode: 400, statusMessage: 'password required' });
  const expectedHash = getEnvHash();
  if (!expectedHash) throw createError({ statusCode: 500, statusMessage: 'ADMIN_PASSWORD_HASH not set' });
  const given = sha256(password);
  if (given !== expectedHash) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  const token = signSession({ role: 'admin', exp: Date.now() + 1000 * 60 * 60 * 8 });
  setSessionCookie(event, token);
  return { ok: true };
});


