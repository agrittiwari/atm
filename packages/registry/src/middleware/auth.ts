import type { Context, Next } from 'hono';
import type { Env } from '../types';

export interface JWTPayload {
  sub: string;
  username: string;
  verified: boolean;
  exp: number;
  iat: number;
}

export interface AuthContext {
  user: JWTPayload;
}

const ALGORITHM = 'HS256';

function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const padded = base64 + padding;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = base64UrlDecode(signature);
    return await crypto.subtle.verify('HMAC', key, encoder.encode(message), signatureBytes);
  } catch {
    return false;
  }
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signature] = parts;
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as JWTPayload;

    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (header.alg !== ALGORITHM) {
      return null;
    }

    const expectedSignature = await hmacVerify(`${headerB64}.${payloadB64}`, signature, secret);
    if (!expectedSignature) {
      return null;
    }

    if (payload.exp && Date.now() > payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function generateJWT(payload: Omit<JWTPayload, 'exp' | 'iat'>, secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    exp: now + 86400,
    iat: now,
  };

  const header = { alg: ALGORITHM, typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));

  const signature = hmacSign(`${headerB64}.${payloadB64}`, secret);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next): Promise<Response> {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);
  const secret = c.env.JWT_SECRET || 'default-dev-secret';

  const payload = await verifyJWT(token, secret);
  
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  (c as any).set('user', payload);
  await next();
  return c.text('', 200);
}

export function requireAuth(c: Context<{ Bindings: Env }>): JWTPayload {
  const user = (c as any).get('user') as JWTPayload | undefined;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
