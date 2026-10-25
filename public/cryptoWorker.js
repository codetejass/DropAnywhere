/**
 * Web Worker for Zero-Knowledge Cryptography & Key Derivation
 * Runs PBKDF2 (600,000 iterations, SHA-256) and AES-GCM encryption/decryption
 * in a background worker thread.
 *
 * Supported message types:
 *   ENCRYPT         — file ArrayBuffer encryption
 *   DECRYPT         — file ArrayBuffer decryption
 *   ENCRYPT_TEXT    — encrypt a string to base64 ciphertext
 *   DECRYPT_TEXT    — decrypt base64 ciphertext back to string
 */

const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const SALT_LENGTH = 16; // 128-bit salt
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_TEXT_ITERATIONS = 300000; // Faster for real-time text collaboration

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derive AES-GCM 256-bit CryptoKey using PBKDF2
 */
async function deriveKeyFromPassword(password, saltUint8Array, iterations) {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  const baseKey = await self.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await self.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltUint8Array,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

const textKeyCache = new Map();

async function getOrDeriveTextKey(password, saltBytes, saltBase64) {
  const cacheKey = password + "::" + saltBase64;
  if (textKeyCache.has(cacheKey)) {
    return textKeyCache.get(cacheKey);
  }
  const key = await deriveKeyFromPassword(password, saltBytes, PBKDF2_TEXT_ITERATIONS);
  textKeyCache.set(cacheKey, key);
  return key;
}

self.onmessage = async (e) => {
  const { id, type, password, saltBase64, fileBuffer } = e.data;

  try {
    if (type === "ENCRYPT") {
      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 20,
        status: `Deriving key via PBKDF2 (${PBKDF2_ITERATIONS.toLocaleString()} iterations)...`,
      });

      // Generate random 16-byte salt if not provided
      let saltBytes;
      if (saltBase64) {
        saltBytes = new Uint8Array(base64ToBuffer(saltBase64));
      } else {
        saltBytes = self.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      }
      const currentSaltBase64 = bufferToBase64(saltBytes.buffer);

      // Derive AES-GCM Key
      const key = await deriveKeyFromPassword(password, saltBytes, PBKDF2_ITERATIONS);

      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 60,
        status: `Encrypting zipped payload with AES-GCM...`,
      });

      // Generate random 12-byte IV for AES-GCM
      const iv = self.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encrypt zip archive buffer
      const ciphertext = await self.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        fileBuffer
      );

      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 90,
        status: `Finalizing encrypted payload stream...`,
      });

      // Combine IV (12 bytes) + Ciphertext
      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ciphertext), iv.length);

      self.postMessage({
        id,
        type: "ENCRYPT_COMPLETE",
        encryptedBuffer: combined.buffer,
        saltBase64: currentSaltBase64,
      }, [combined.buffer]);

    } else if (type === "DECRYPT") {
      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 25,
        status: `Deriving AES-GCM key via PBKDF2 (${PBKDF2_ITERATIONS.toLocaleString()} iterations)...`,
      });

      if (!saltBase64) {
        throw new Error("Missing public salt for key derivation");
      }

      const saltBytes = new Uint8Array(base64ToBuffer(saltBase64));
      const key = await deriveKeyFromPassword(password, saltBytes, PBKDF2_ITERATIONS);

      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 60,
        status: `Decrypting payload with AES-GCM...`,
      });

      if (!fileBuffer || fileBuffer.byteLength <= IV_LENGTH) {
        throw new Error(`Invalid encrypted buffer size: ${fileBuffer ? fileBuffer.byteLength : 0} bytes`);
      }

      // Extract first 12 bytes as IV
      const iv = new Uint8Array(fileBuffer.slice(0, IV_LENGTH));
      // Extract remaining bytes as ciphertext
      const ciphertext = fileBuffer.slice(IV_LENGTH);

      const decryptedBuffer = await self.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );

      self.postMessage({
        id,
        type: "PROGRESS",
        percent: 100,
        status: `Payload decrypted successfully!`,
      });

      self.postMessage({
        id,
        type: "DECRYPT_COMPLETE",
        decryptedBuffer,
      }, [decryptedBuffer]);

    } else if (type === "ENCRYPT_TEXT") {
      // { id, type, text, password, saltBase64? }
      const { text } = e.data;

      // Generate or reuse salt
      let saltBytes;
      if (saltBase64) {
        saltBytes = new Uint8Array(base64ToBuffer(saltBase64));
      } else {
        saltBytes = self.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      }
      const currentSaltBase64 = bufferToBase64(saltBytes.buffer);

      // Derive or retrieve cached key
      const key = await getOrDeriveTextKey(password, saltBytes, currentSaltBase64);

      // Generate random IV
      const iv = self.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

      // Encode text to bytes
      const enc = new TextEncoder();
      const textBuffer = enc.encode(text);

      // Encrypt
      const ciphertextBuffer = await self.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        textBuffer
      );

      self.postMessage({
        id,
        type: "ENCRYPT_TEXT_COMPLETE",
        ciphertextBase64: bufferToBase64(ciphertextBuffer),
        saltBase64: currentSaltBase64,
        ivBase64: bufferToBase64(iv.buffer),
      });

    } else if (type === "DECRYPT_TEXT") {
      // { id, type, ciphertextBase64, password, saltBase64, ivBase64 }
      const { ciphertextBase64, ivBase64 } = e.data;

      if (!saltBase64) {
        throw new Error("Missing salt for text decryption");
      }
      if (!ivBase64) {
        throw new Error("Missing IV for text decryption");
      }

      const saltBytes = new Uint8Array(base64ToBuffer(saltBase64));
      const key = await getOrDeriveTextKey(password, saltBytes, saltBase64);

      const iv = new Uint8Array(base64ToBuffer(ivBase64));
      const ciphertextBuffer = base64ToBuffer(ciphertextBase64);

      const decryptedBuffer = await self.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertextBuffer
      );

      const dec = new TextDecoder();
      const text = dec.decode(decryptedBuffer);

      self.postMessage({
        id,
        type: "DECRYPT_TEXT_COMPLETE",
        text,
      });
    }
  } catch (err) {
    self.postMessage({
      id,
      type: "ERROR",
      error: err.message || "Worker cryptographic operation failed",
    });
  }
};
