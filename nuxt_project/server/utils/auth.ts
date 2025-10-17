import crypto from 'crypto';

const COOKIE_NAME = 'admin_session';

export function getEnvHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  return hash.trim();
}

export function getJwtSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'dev-secret';
  return secret;
}

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function signSession(payload: any): string {
  const secret = getJwtSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token: string | undefined | null): any | null {
  if (!token) return null;
  const secret = getJwtSecret();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(event: any, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: '/' });
}

export function getSessionFromEvent(event: any): any | null {
  const token = getCookie(event, COOKIE_NAME);
  return verifySession(token);
}


