"use client";

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateGroupKey() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return bufferToBase64(exported);
}

async function importKeys(base64Key: string) {
  const keyBuffer = base64ToBuffer(base64Key);

  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );

  const hmacKey = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  return { aesKey, hmacKey };
}

export async function encryptAndSignPayload(keyStr: string, dataObj: any) {
  if (!keyStr) return null;
  const { aesKey, hmacKey } = await importKeys(keyStr);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(dataObj));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded,
  );

  const signature = await window.crypto.subtle.sign("HMAC", hmacKey, encrypted);

  return {
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted),
    signature: bufferToBase64(signature),
  };
}

export async function decryptAndVerifyPayload(
  keyStr: string,
  payload: { iv: string; data: string; signature: string },
) {
  if (!keyStr) return null;
  try {
    const { aesKey, hmacKey } = await importKeys(keyStr);
    const iv = base64ToBuffer(payload.iv);
    const data = base64ToBuffer(payload.data);
    const signature = base64ToBuffer(payload.signature);

    const isValid = await window.crypto.subtle.verify(
      "HMAC",
      hmacKey,
      signature,
      data,
    );

    if (!isValid)
      throw new Error("Packet Tampering Detected: Invalid HMAC Signature");

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      data,
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Decryption/Verification failed", err);
    return null;
  }
}
