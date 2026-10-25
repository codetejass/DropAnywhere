import JSZip from "jszip";

export interface EncryptZipResult {
  encryptedBlob: Blob;
  saltBase64: string;
}

/**
 * Zip all client files into a single ArrayBuffer before encryption
 */
export async function zipFilesClientSide(
  files: File[],
  onProgress?: (percent: number, status: string) => void
): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / total) * 40),
        `Packaging [${i + 1}/${total}]: ${file.name} into zip archive...`
      );
    }
    const buffer = await file.arrayBuffer();
    zip.file(file.name, buffer);
  }

  if (onProgress) onProgress(45, "Compressing client-side zip container...");

  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(45 + Math.round(metadata.percent * 0.45), "Finalizing client zip archive...");
      }
    }
  );

  return await zipBlob.arrayBuffer();
}

/**
 * Encrypt a single zip ArrayBuffer using custom password and PBKDF2 + AES-GCM in Web Worker
 */
export async function encryptZipWithWorker(
  zipBuffer: ArrayBuffer,
  password: string,
  saltBase64?: string,
  onProgress?: (percent: number, status: string) => void
): Promise<EncryptZipResult> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker("/cryptoWorker.js");

      worker.onmessage = (e) => {
        const { type, encryptedBuffer, saltBase64: resSalt, percent, status, error } = e.data;

        if (type === "PROGRESS" && onProgress) {
          onProgress(percent, status);
        } else if (type === "ENCRYPT_COMPLETE") {
          worker.terminate();
          const encryptedBlob = new Blob([encryptedBuffer], { type: "application/octet-stream" });
          resolve({
            encryptedBlob,
            saltBase64: resSalt,
          });
        } else if (type === "ERROR") {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(`Crypto Worker Error: ${err.message}`));
      };

      if (onProgress) onProgress(5, "Sending zip container to Web Worker...");

      worker.postMessage(
        {
          type: "ENCRYPT",
          password,
          saltBase64,
          fileBuffer: zipBuffer,
        },
        [zipBuffer]
      );
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Decrypt an encrypted ArrayBuffer (from S3/R2) using password and public salt in Web Worker
 */
export async function decryptZipWithWorker(
  encryptedBuffer: ArrayBuffer,
  password: string,
  saltBase64: string,
  onProgress?: (percent: number, status: string) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const worker = new Worker("/cryptoWorker.js");

      worker.onmessage = (e) => {
        const { type, decryptedBuffer, percent, status, error } = e.data;

        if (type === "PROGRESS" && onProgress) {
          onProgress(percent, status);
        } else if (type === "DECRYPT_COMPLETE") {
          worker.terminate();
          resolve(decryptedBuffer);
        } else if (type === "ERROR") {
          worker.terminate();
          reject(new Error(error));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(`Crypto Worker Error: ${err.message}`));
      };

      worker.postMessage(
        {
          type: "DECRYPT",
          password,
          saltBase64,
          fileBuffer: encryptedBuffer,
        },
        [encryptedBuffer]
      );
    } catch (err: any) {
      reject(err);
    }
  });
}

