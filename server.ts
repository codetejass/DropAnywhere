import http from "http";
import express, { Request, Response } from "express";
import next from "next";
import cors from "cors";
import dotenv from "dotenv";
import busboy from "busboy";
import { Server } from "socket.io";
import { uploadStreamToStorage, getStorageStream, deleteStorageObject } from "./src/lib/storage";
import { createLockerDoc, getLockerDoc, deleteLockerDoc, getCollisionFreeLockerCode } from "./src/lib/db";

dotenv.config();
dotenv.config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const serveNext = process.env.SERVE_NEXT !== "false";

// Allowed origins for CORS (production domain, subdomains, Vercel preview URLs, and local dev)
const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : [];

const defaultOrigins = [
  "https://dropanywhere.cc.cd",
  "https://www.dropanywhere.cc.cd",
  "https://dropshare.cc.cd",
  "https://www.dropshare.cc.cd",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Server-to-server, health checks, curl
  if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return true;
  // Dynamic matching for dropanywhere/dropshare subdomains and Vercel preview builds
  if (/^https:\/\/([a-z0-9-]+\.)*dropanywhere\.cc\.cd$/i.test(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)*dropshare\.cc\.cd$/i.test(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) return true;
  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked]: Origin ${origin} not permitted`);
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Range"],
};

function startServer(handle: any | null) {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  // Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "DropAnywhere Backend API",
      timestamp: new Date().toISOString(),
      mode: handle ? "monolith" : "api-only",
      allowedOrigins,
    });
  });

  // GET Locker Metadata (Includes public salt, expiresAt, burnAfterReading, filenames)
  app.get("/api/locker/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const locker = await getLockerDoc(code);
      if (!locker) {
        return res.status(404).json({ error: "Locker not found or expired" });
      }

      return res.json({
        success: true,
        code: locker.id,
        salt: locker.salt,
        burnAfterReading: locker.burnAfterReading,
        originalFileNames: locker.originalFileNames,
        fileCount: locker.fileCount,
        totalSize: locker.totalSize,
        expiresAt: locker.expiresAt,
        createdAt: locker.createdAt,
      });
    } catch (err: any) {
      console.error("Error fetching locker:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST Upload Encrypted Blob & Stream Directly to Storage (No Archiver)
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("multipart/form-data")) {
        return res.status(400).json({ error: "Invalid Content-Type; multipart/form-data required" });
      }

      // 1. Generate collision-free 6-digit code via Firestore collision loop
      const code = await getCollisionFreeLockerCode();
      const objectKey = `lockers/${code}.enc`;

      const bb = busboy({ headers: req.headers });

      let burnAfterReading = false;
      let salt = "";
      let originalFileNames: string[] = [];
      let totalSize = 0;
      let fileCount = 1;
      let uploadPromise: Promise<string> | null = null;

      // Safe error listener to prevent process crashes on client disconnect
      bb.on("error", (err: any) => {
        console.error("Busboy streaming error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Streaming upload error occurred" });
        }
      });

      // Handle form fields (burnAfterReading, salt, fileNames, fileCount)
      bb.on("field", (name, val) => {
        if (name === "burnAfterReading") {
          burnAfterReading = val === "true" || val === "1";
        } else if (name === "salt") {
          salt = val;
        } else if (name === "fileNames") {
          try {
            originalFileNames = JSON.parse(val);
          } catch {
            originalFileNames = [val];
          }
        } else if (name === "fileCount") {
          fileCount = parseInt(val, 10) || 1;
        } else if (name === "totalSize") {
          totalSize = parseInt(val, 10) || 0;
        }
      });

      // Handle single encrypted file stream
      bb.on("file", (name, fileStream) => {
        let streamByteCount = 0;
        fileStream.on("data", (chunk) => {
          streamByteCount += chunk.length;
        });

        fileStream.on("error", (err) => {
          console.error("File stream pipe error:", err);
        });

        // Direct pipe into S3 / Cloudflare R2 object storage without server zipping
        uploadPromise = uploadStreamToStorage(objectKey, fileStream).then((result) => {
          if (totalSize === 0) {
            totalSize = streamByteCount;
          }
          return result;
        });
      });

      bb.on("finish", async () => {
        try {
          if (!uploadPromise) {
            return res.status(400).json({ error: "No file stream received" });
          }

          // Wait for direct stream upload to complete
          await uploadPromise;

          const now = Date.now();
          const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours TTL

          // Save document in Firestore
          await createLockerDoc({
            id: code,
            objectKey,
            salt,
            createdAt: now,
            expiresAt,
            burnAfterReading,
            originalFileNames,
            fileCount,
            totalSize,
          });

          return res.status(200).json({
            success: true,
            code,
            salt,
            expiresAt,
            burnAfterReading,
            originalFileNames,
            fileCount,
            totalSize,
          });
        } catch (err: any) {
          console.error("Upload completion error:", err);
          if (!res.headersSent) {
            return res.status(500).json({ error: "Upload failed during storage write" });
          }
        }
      });

      req.pipe(bb);
    } catch (err: any) {
      console.error("Upload route error:", err);
      return res.status(500).json({ error: "Upload endpoint failure" });
    }
  });

  // GET Download Encrypted Stream Directly
  app.get("/api/download/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const locker = await getLockerDoc(code);

      if (!locker) {
        return res.status(404).json({ error: "Locker not found or expired" });
      }

      const stream = await getStorageStream(locker.objectKey);

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="dropanywhere-${code}.enc"`);

      stream.on("error", (err) => {
        console.error("Storage download stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Storage read failure" });
        }
      });

      stream.pipe(res);
    } catch (err: any) {
      console.error("Download route error:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to download stream" });
      }
    }
  });

  // DELETE Destroy Locker (Burn after reading or manual delete)
  app.delete("/api/destroy/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      const locker = await getLockerDoc(code);

      if (!locker) {
        return res.status(404).json({ error: "Locker not found or already deleted" });
      }

      // Delete storage file
      await deleteStorageObject(locker.objectKey);

      // Delete db document
      await deleteLockerDoc(code);

      return res.json({
        success: true,
        message: "Locker permanently destroyed",
      });
    } catch (err: any) {
      console.error("Destroy error:", err);
      return res.status(500).json({ error: "Failed to destroy locker" });
    }
  });

  // Next.js Handler for UI routes (if running in monolith mode) or API 404 message
  if (handle) {
    app.all("*", (req: Request, res: Response) => {
      return handle(req, res);
    });
  } else {
    app.all("*", (req: Request, res: Response) => {
      return res.status(404).json({
        error: "Route not found",
        service: "DropAnywhere Backend API",
        frontend: "https://dropanywhere.cc.cd",
      });
    });
  }

  // Create HTTP server and attach Socket.io
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for Socket.io: ${origin}`));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // In-memory cache for latest encrypted ciphertext per active room (blind relay - server never decrypts)
  const roomEncryptedNotes = new Map<
    string,
    { ciphertext: string; saltBase64: string; ivBase64: string }
  >();

  const roomEncryptedCanvases = new Map<
    string,
    { ciphertext: string; saltBase64: string; ivBase64: string }
  >();

  // Socket.io: Zero-Knowledge Collaborative Notepad
  io.on("connection", (socket) => {
    socket.on("join_room", ({ roomCode }: { roomCode: string }) => {
      const roomName = `note-${roomCode}`;
      socket.join(roomName);

      // Broadcast updated peer count to room
      const count = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
      io.to(roomName).emit("room_peers", count);

      // If an encrypted note already exists in memory for this room, send it to the joining peer
      const existingNote = roomEncryptedNotes.get(roomName);
      if (existingNote) {
        socket.emit("note_update", existingNote);
      }

      // If an encrypted canvas already exists in memory for this room, send it to the joining peer
      const existingCanvas = roomEncryptedCanvases.get(roomName);
      if (existingCanvas) {
        socket.emit("canvas_update", existingCanvas);
      }
    });

    socket.on(
      "note_update",
      ({
        roomCode,
        ciphertext,
        saltBase64,
        ivBase64,
      }: {
        roomCode: string;
        ciphertext: string;
        saltBase64: string;
        ivBase64: string;
      }) => {
        const roomName = `note-${roomCode}`;
        // Store latest ciphertext blindly
        roomEncryptedNotes.set(roomName, { ciphertext, saltBase64, ivBase64 });

        // Blind broadcast to all other peers in the room
        socket.to(roomName).emit("note_update", {
          ciphertext,
          saltBase64,
          ivBase64,
        });
      }
    );

    socket.on(
      "canvas_update",
      ({
        roomCode,
        ciphertext,
        saltBase64,
        ivBase64,
      }: {
        roomCode: string;
        ciphertext: string;
        saltBase64: string;
        ivBase64: string;
      }) => {
        const roomName = `note-${roomCode}`;
        // Store latest canvas ciphertext blindly
        roomEncryptedCanvases.set(roomName, { ciphertext, saltBase64, ivBase64 });

        // Blind broadcast to all other peers in the room
        socket.to(roomName).emit("canvas_update", {
          ciphertext,
          saltBase64,
          ivBase64,
        });
      }
    );

    socket.on("leave_room", ({ roomCode }: { roomCode: string }) => {
      const roomName = `note-${roomCode}`;
      socket.leave(roomName);
      const remaining = io.sockets.adapter.rooms.get(roomName)?.size ?? 0;
      io.to(roomName).emit("room_peers", remaining);

      // If no peers left in the room, wipe the encrypted states from memory
      if (remaining === 0) {
        roomEncryptedNotes.delete(roomName);
        roomEncryptedCanvases.delete(roomName);
      }
    });

    // Use "disconnecting" so socket.rooms is still populated
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith("note-")) {
          const currentCount = io.sockets.adapter.rooms.get(room)?.size ?? 1;
          const newCount = Math.max(0, currentCount - 1);
          socket.to(room).emit("room_peers", newCount);

          if (newCount === 0) {
            roomEncryptedNotes.delete(room);
            roomEncryptedCanvases.delete(room);
          }
        }
      });
    });
  });

  // Listen on httpServer (0.0.0.0 binding for container & cloud compatibility)
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> DropAnywhere server ready on http://0.0.0.0:${port} [SERVE_NEXT: ${Boolean(handle)}]`);
  });
}

// Bootstrap server
if (serveNext) {
  const nextApp = next({ dev });
  nextApp.prepare().then(() => {
    startServer(nextApp.getRequestHandler());
  });
} else {
  console.log("> SERVE_NEXT=false detected: Starting lightweight dedicated API & WebSocket server");
  startServer(null);
}
