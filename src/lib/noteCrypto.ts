/**
 * noteCrypto.ts
 * Helper that talks to cryptoWorker.js for text encryption/decryption.
 * Reuses a single persistent Web Worker session for fast, responsive typing.
 */

export interface EncryptTextResult {
  ciphertextBase64: string;
  saltBase64: string;
  ivBase64: string;
}

let activeWorker: Worker | null = null;
let reqId = 0;
const pendingRequests = new Map<
  number,
  { resolve: (data: any) => void; reject: (err: any) => void }
>();

function getOrCreateWorker(): Worker {
  if (!activeWorker) {
    activeWorker = new Worker("/cryptoWorker.js");

    activeWorker.onmessage = (e) => {
      const { id, type, error } = e.data;
      if (id && pendingRequests.has(id)) {
        const { resolve, reject } = pendingRequests.get(id)!;
        pendingRequests.delete(id);

        if (type === "ERROR") {
          reject(new Error(error || "Text crypto operation failed"));
        } else {
          resolve(e.data);
        }
      }
    };

    activeWorker.onerror = (err) => {
      // Reject all pending requests
      pendingRequests.forEach(({ reject }) => {
        reject(new Error(err.message || "Crypto Worker general error"));
      });
      pendingRequests.clear();
      activeWorker = null;
    };
  }
  return activeWorker;
}

export function terminateNoteWorker(): void {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
    pendingRequests.clear();
  }
}

export function encryptText(
  text: string,
  password: string,
  saltBase64?: string
): Promise<EncryptTextResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getOrCreateWorker();
      const id = ++reqId;

      pendingRequests.set(id, {
        resolve: (data: any) => {
          resolve({
            ciphertextBase64: data.ciphertextBase64,
            saltBase64: data.saltBase64,
            ivBase64: data.ivBase64,
          });
        },
        reject,
      });

      worker.postMessage({ id, type: "ENCRYPT_TEXT", text, password, saltBase64 });
    } catch (err) {
      reject(err);
    }
  });
}

export function decryptText(
  ciphertextBase64: string,
  password: string,
  saltBase64: string,
  ivBase64: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const worker = getOrCreateWorker();
      const id = ++reqId;

      pendingRequests.set(id, {
        resolve: (data: any) => {
          resolve(data.text as string);
        },
        reject,
      });

      worker.postMessage({
        id,
        type: "DECRYPT_TEXT",
        ciphertextBase64,
        password,
        saltBase64,
        ivBase64,
      });
    } catch (err) {
      reject(err);
    }
  });
}

