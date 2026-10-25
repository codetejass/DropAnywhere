import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { generateNumeric6DigitCode } from "./codeGenerator";

export interface LockerData {
  id: string; // 6-digit code
  objectKey: string;
  salt: string; // Public Base64 salt for PBKDF2 key reconstruction
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (24h TTL)
  burnAfterReading: boolean;
  originalFileNames: string[];
  fileCount: number;
  totalSize: number;
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID?.trim();
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const rawKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
const FIREBASE_PRIVATE_KEY = rawKey
  ? rawKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n")
  : undefined;

const isFirebaseConfigured = Boolean(
  FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY
);

if (isFirebaseConfigured && getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = isFirebaseConfigured ? getFirestore() : null;

// Local fallback in-memory database map for dev mode
const localLockersMap = new Map<string, LockerData>();

/**
 * Generates a unique 6-digit locker code by querying Firestore/DB in a collision loop.
 */
export async function getCollisionFreeLockerCode(): Promise<string> {
  let code = generateNumeric6DigitCode();
  let attempts = 0;
  const MAX_ATTEMPTS = 50;

  while (attempts < MAX_ATTEMPTS) {
    const existing = await getLockerDoc(code);
    if (!existing) {
      return code;
    }
    code = generateNumeric6DigitCode();
    attempts++;
  }

  throw new Error("Failed to allocate a unique 6-digit locker code after multiple attempts");
}

/**
 * Creates a new locker document in Firestore (or local map fallback).
 */
export async function createLockerDoc(data: LockerData): Promise<void> {
  if (isFirebaseConfigured && db) {
    const docRef = db.collection("lockers").doc(data.id);
    await docRef.set({
      objectKey: data.objectKey,
      salt: data.salt,
      createdAt: Timestamp.fromMillis(data.createdAt),
      expiresAt: Timestamp.fromMillis(data.expiresAt),
      burnAfterReading: data.burnAfterReading,
      originalFileNames: data.originalFileNames,
      fileCount: data.fileCount,
      totalSize: data.totalSize,
    });
  } else {
    localLockersMap.set(data.id, data);
  }
}

/**
 * Fetches a locker document by 6-digit code. Returns null if not found or expired.
 */
export async function getLockerDoc(code: string): Promise<LockerData | null> {
  const normalizedCode = code.toUpperCase().trim();
  const now = Date.now();

  if (isFirebaseConfigured && db) {
    const docRef = db.collection("lockers").doc(normalizedCode);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const data = snap.data()!;
    const expiresAt = data.expiresAt ? data.expiresAt.toMillis() : 0;

    if (expiresAt < now) {
      // Expired document
      await docRef.delete().catch(() => {});
      return null;
    }

    return {
      id: normalizedCode,
      objectKey: data.objectKey,
      salt: data.salt || "",
      createdAt: data.createdAt ? data.createdAt.toMillis() : now,
      expiresAt,
      burnAfterReading: Boolean(data.burnAfterReading),
      originalFileNames: data.originalFileNames || [],
      fileCount: data.fileCount || 1,
      totalSize: data.totalSize || 0,
    };
  } else {
    const locker = localLockersMap.get(normalizedCode);
    if (!locker) return null;
    if (locker.expiresAt < now) {
      localLockersMap.delete(normalizedCode);
      return null;
    }
    return locker;
  }
}

/**
 * Deletes a locker document by 6-digit code.
 */
export async function deleteLockerDoc(code: string): Promise<void> {
  const normalizedCode = code.toUpperCase().trim();
  if (isFirebaseConfigured && db) {
    await db.collection("lockers").doc(normalizedCode).delete().catch(() => {});
  } else {
    localLockersMap.delete(normalizedCode);
  }
}
