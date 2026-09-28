import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const cookieName = 'inventory_session';
const maxAgeSeconds = 60 * 60 * 12;

function secret() {
  return process.env.INVENTORY_SESSION_SECRET || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function inventoryCookieName() {
  return cookieName;
}

export function inventorySessionMaxAge() {
  return maxAgeSeconds;
}

export function hasInventoryPassword(password: string) {
  const expected = process.env.INVENTORY_ACCESS_PASSWORD;
  return Boolean(expected && safeEqual(password, expected));
}

export function createInventorySessionValue() {
  const payload = `${Date.now()}.${randomBytes(16).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyInventorySessionValue(value: string | undefined) {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const signature = parts[2];
  const createdAt = Number(parts[0]);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > maxAgeSeconds * 1000) return false;
  return safeEqual(signature, sign(payload));
}

export function isInventorySessionConfigured() {
  return Boolean(process.env.INVENTORY_ACCESS_PASSWORD && secret());
}
