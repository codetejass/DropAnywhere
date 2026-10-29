import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import os from "os";

const cleanEnv = (val?: string) => val?.trim().replace(/^["']|["']$/g, "") || undefined;

const S3_ENDPOINT = cleanEnv(process.env.S3_ENDPOINT);
const S3_BUCKET = cleanEnv(process.env.S3_BUCKET) || "dropanywhere-lockers";
const S3_ACCESS_KEY_ID = cleanEnv(process.env.S3_ACCESS_KEY_ID);
const S3_SECRET_ACCESS_KEY = cleanEnv(process.env.S3_SECRET_ACCESS_KEY);
const S3_REGION = cleanEnv(process.env.S3_REGION) || "us-east-005";

const isConfigured = Boolean(S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);

let s3Client: S3Client | null = null;

if (isConfigured) {
  s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
  console.log(`[Storage] Configured Backblaze B2/S3 (bucket: ${S3_BUCKET}, endpoint: ${S3_ENDPOINT})`);
} else {
  console.log("[Storage] S3 credentials missing; running in local fallback storage mode");
}

// Local directory fallback for development/testing when S3 credentials are omitted
const LOCAL_STORAGE_DIR = path.join(os.tmpdir(), "dropanywhere_storage");
if (!isConfigured) {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Streams incoming zipped readable stream directly to S3 / Cloudflare R2 object storage.
 * If S3 is not configured, streams to local temp storage.
 */
export async function uploadStreamToStorage(
  key: string,
  stream: Readable
): Promise<string> {
  if (isConfigured && s3Client) {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: stream,
        ContentType: "application/zip",
      },
    });

    await upload.done();
    return key;
  } else {
    // Local fallback stream pipe
    const filePath = path.join(LOCAL_STORAGE_DIR, key.replace(/\//g, "_"));
    const writeStream = fs.createWriteStream(filePath);
    await new Promise<void>((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => reject(err));
    });
    return filePath;
  }
}

/**
 * Returns a readable stream for downloading a zipped locker file from S3 / R2 or local storage.
 */
export async function getStorageStream(key: string): Promise<Readable> {
  if (isConfigured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error("Empty storage stream response");
    }
    return response.Body as Readable;
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, key.replace(/\//g, "_"));
    if (!fs.existsSync(filePath)) {
      throw new Error("Storage object not found in local fallback storage");
    }
    return fs.createReadStream(filePath);
  }
}

/**
 * Permanently deletes an object from S3/R2 or local storage.
 */
export async function deleteStorageObject(key: string): Promise<void> {
  if (isConfigured && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, key.replace(/\//g, "_"));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }
}
