// Shared Web Crypto format. No password or key is stored in these files.
export const ITERATIONS = 600000;
export const toBase64 = bytes => {
  let text = '';
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
};
export const fromBase64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
export function validateEnvelope(e) {
  if (!e || Object.keys(e).sort().join() !== 'ciphertext,iterations,iv,salt,version' || e.version !== 1 ||
      !Number.isInteger(e.iterations) || e.iterations < ITERATIONS || e.iterations > 2000000 ||
      !['salt', 'iv', 'ciphertext'].every(k => typeof e[k] === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(e[k]))) throw new Error('Invalid encrypted file');
  if (fromBase64(e.salt).length !== 16 || fromBase64(e.iv).length !== 12 || fromBase64(e.ciphertext).length < 16) throw new Error('Invalid encrypted file');
}
async function derive(password, salt, iterations, usages) {
  const bytes = new TextEncoder().encode(password);
  let material;
  try { material = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']); }
  finally { bytes.fill(0); }
  return crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt, iterations}, material,
    {name:'AES-GCM', length:256}, false, usages);
}
export async function encryptBundle(password, plaintext) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt, ITERATIONS, ['encrypt']);
  const bytes = new TextEncoder().encode(plaintext);
  try {
    const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, bytes);
    return {version:1, iterations:ITERATIONS, salt:toBase64(salt), iv:toBase64(iv), ciphertext:toBase64(new Uint8Array(ciphertext))};
  } finally { bytes.fill(0); }
}
export async function decryptEnvelope(password, envelope) {
  validateEnvelope(envelope);
  const key = await derive(password, fromBase64(envelope.salt), envelope.iterations, ['decrypt']);
  const plaintext = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM', iv:fromBase64(envelope.iv)}, key, fromBase64(envelope.ciphertext)));
  try { return {key, bundle:JSON.parse(new TextDecoder().decode(plaintext))}; }
  finally { plaintext.fill(0); }
}
