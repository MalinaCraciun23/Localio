export const buffToBase64 = (buff) => btoa(String.fromCharCode.apply(null, buff));

export const base64ToBuff = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));

const enc = new TextEncoder();
const dec = new TextDecoder();

export let secretKey;

export async function createSecretKey() {
  const cryptoKey = await window.crypto.subtle.generateKey(
    { name: 'AES-CBC', length: 128 },
    true,
    ['encrypt', 'decrypt'],
  );

  const key = await window.crypto.subtle.exportKey(
    "raw",
    cryptoKey
  );

  secretKey = buffToBase64(new Uint8Array(key));

  return secretKey;
}

export function setSecretKey(key) {
  secretKey = key;
}

export async function encrypt(data) {
  if (secretKey) {
    const key = await window.crypto.subtle.importKey(
      'raw',
      base64ToBuff(secretKey),
      { name: 'AES-CBC' },
      true,
      ['encrypt', 'decrypt'],
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      enc.encode(data)
    );

    const encryptedDataArr = new Uint8Array(encryptedData);

    let buff = new Uint8Array(iv.byteLength + encryptedDataArr.byteLength);
    buff.set(iv, 0);
    buff.set(encryptedDataArr, iv.byteLength);

    return buffToBase64(buff);
  }
}

export async function decrypt(encryptedData) {
  if (secretKey) {
    const encryptedDataBuff = base64ToBuff(encryptedData);
    const iv = encryptedDataBuff.slice(0, 16);
    const data = encryptedDataBuff.slice(16);
    const key = await window.crypto.subtle.importKey(
      'raw',
      base64ToBuff(secretKey),
      { name: 'AES-CBC' },
      true,
      ['encrypt', 'decrypt'],
    );

    return dec.decode(
      await window.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: iv },
        key,
        data
      )
    );
  }
}

function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0")
}

export function generateId(len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}