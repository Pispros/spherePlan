/* ─── ENCRYPTION CONFIG ─────────────────────────────────────────────── */
const ENCRYPTION_SALT = "naanoplanner-v1-salt-CHANGE-ME";
const ENCRYPTION_PASSPHRASE = "naanoplanner-v1-passphrase-CHANGE-ME";
const STORAGE_KEY = "naanoplanner:credentials:v1";

async function _deriveKey() {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(ENCRYPTION_PASSPHRASE),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptString(plaintext) {
  const key = await _deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptString(b64) {
  const key = await _deriveKey();
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

async function loadCredentials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const json = await decryptString(raw);
    return JSON.parse(json);
  } catch (err) {
    console.warn("Échec du déchiffrement des credentials :", err);
    return {};
  }
}

async function saveCredentials(creds) {
  const ct = await encryptString(JSON.stringify(creds));
  localStorage.setItem(STORAGE_KEY, ct);
}
