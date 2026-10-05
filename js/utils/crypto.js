/**
 * Nexa ERP - Utilidades criptográficas (WebCrypto nativo, sin dependencias)
 *
 * - Contraseñas: PBKDF2-SHA256 con sal aleatoria de 16 bytes.
 *   Formato almacenado: "pbkdf2$<iteraciones>$<salBase64>$<hashBase64>"
 * - Secretos (bóveda de fórmulas): AES-GCM 256 con llave derivada del PIN.
 *   Formato: { v: 1, alg: 'AES-GCM', iter, salt, iv, data } (base64)
 *
 * Nota: WebCrypto (crypto.subtle) existe en contextos seguros: https:// y file:// en
 * Chrome/Edge/Brave. Si no está disponible, las funciones lanzan un error explícito.
 */

const PBKDF2_ITERATIONS = 150000;
const enc = new TextEncoder();
const dec = new TextDecoder();

function subtle() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('El navegador no ofrece WebCrypto en este contexto. Abra NexaAdmin en Chrome, Edge o Brave actualizado.');
  }
  return crypto.subtle;
}

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

/** Comparación en tiempo constante de dos cadenas */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2Bits(secret, salt, iterations, bits = 256) {
  const key = await subtle().importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  return subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, bits);
}

export const CryptoUtil = {
  isHash(value) {
    return typeof value === 'string' && value.startsWith('pbkdf2$');
  },

  async hashPassword(password) {
    if (!password) throw new Error('La contraseña no puede estar vacía.');
    const salt = randomBytes(16);
    const bits = await pbkdf2Bits(password, salt, PBKDF2_ITERATIONS);
    return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
  },

  async verifyPassword(password, stored) {
    if (!password || !this.isHash(stored)) return false;
    const [, iterStr, saltB64, hashB64] = stored.split('$');
    const iterations = Number(iterStr);
    if (!iterations || !saltB64 || !hashB64) return false;
    const bits = await pbkdf2Bits(password, fromB64(saltB64), iterations);
    return safeEqual(toB64(bits), hashB64);
  },

  /** Código legible para recuperación: XXXX-XXXX-XXXX-XXXX (sin caracteres ambiguos) */
  generateRecoveryCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(16);
    let out = '';
    for (let i = 0; i < 16; i++) {
      out += alphabet[bytes[i] % alphabet.length];
      if (i % 4 === 3 && i < 15) out += '-';
    }
    return out;
  },

  normalizeRecoveryCode(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-');
  },

  async encryptJSON(obj, pin) {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const keyMaterial = await subtle().importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle().deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
    );
    const data = await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { v: 1, alg: 'AES-GCM', iter: PBKDF2_ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
  },

  async decryptJSON(payload, pin) {
    if (!payload || payload.alg !== 'AES-GCM') throw new Error('Formato cifrado desconocido.');
    const keyMaterial = await subtle().importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle().deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(payload.salt), iterations: payload.iter },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    try {
      const plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.data));
      return JSON.parse(dec.decode(plain));
    } catch (e) {
      throw new Error('Clave incorrecta o datos alterados.');
    }
  }
};
