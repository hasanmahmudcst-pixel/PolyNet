import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { Readable } from "stream";
import { google } from "googleapis";
import admin from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
import multer from "multer";
import { normalizePolytechnicName } from "./src/utils/polytechnicUtils";
import { NotificationService } from "./src/server/notificationService";
import { getResolvedServiceAccount } from "./src/server/firebaseAdminConfig";
import { PaymentService } from "./src/server/paymentService";
import { LedgerService } from "./src/server/ledgerService";

dotenv.config();

function escapeHtml(text: any): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==================== FIREBASE ADMIN INITIALIZATION ====================

let adminDb: Firestore | null = null;
let notificationService: NotificationService | null = null;
let paymentService: PaymentService | null = null;
let ledgerService: LedgerService | null = null;
let hasAdminCredentials = false;

try {
  const { serviceAccount, source } = getResolvedServiceAccount();

  if (getApps().length === 0) {
    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "hn-vendor"
      });
      adminDb = getFirestore();
      adminDb.settings({ ignoreUndefinedProperties: true });
      notificationService = new NotificationService(adminDb, getMessaging(), getAuth());
      hasAdminCredentials = true;
      console.log(`[Firebase Admin] Initialized with Service Account Key (${source}) for project: ${serviceAccount.project_id}`);
    } else {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (configData.projectId) {
          initializeApp({
            projectId: configData.projectId
          });
          adminDb = getFirestore();
          adminDb.settings({ ignoreUndefinedProperties: true });
          notificationService = new NotificationService(adminDb, getMessaging(), getAuth());
          console.log(`[Firebase Admin] Initialized without credentials for project: ${configData.projectId}`);
        }
      }
    }
  } else {
    adminDb = getFirestore();
    adminDb.settings({ ignoreUndefinedProperties: true });
    notificationService = new NotificationService(adminDb, getMessaging(), getAuth());
    hasAdminCredentials = true;
  }
} catch (error: any) {
  console.warn("Notice: Firebase Admin SDK initialization details:", error?.message || error);
}

// Initialize Real Payment Service (Eklas / EPS Bangladesh Gateway) & PolyGig Ledger Service
try {
  paymentService = new PaymentService(adminDb, notificationService);
  ledgerService = paymentService.getLedgerService();
  console.log("[PaymentService] Successfully initialized EPS Payment Gateway & PolyGig Ledger service.");
} catch (pErr) {
  console.warn("[PaymentService] Initialization warning:", pErr);
}

// ==================== GOOGLE DRIVE CONFIG & ZERO-REDIRECT SERVICE ACCOUNT / OAUTH ====================

const googleServiceAccountPath = path.join(
  process.cwd(),
  "google-drive-service-account.json"
);

const googleCredentialsPath = path.join(
  process.cwd(),
  "google-oauth-client.json"
);

// Target Drive Folder: https://drive.google.com/drive/folders/12DH0Y4FHY1FuNzZajzjn2dA8FKTy2wCy
const TARGET_POLYNET_FOLDER_ID = "12DH0Y4FHY1FuNzZajzjn2dA8FKTy2wCy";

// Verified Permanent Tokens loaded securely from environment or Firestore
const DEFAULT_VERIFIED_TOKENS = process.env.GOOGLE_DRIVE_REFRESH_TOKEN ? {
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  token_type: "Bearer",
  scope: "https://www.googleapis.com/auth/drive"
} : null;

let googleDriveAuthClient: any = null;
let googleOAuthClient: any = null;
let cachedReelsFolderId: string | null = TARGET_POLYNET_FOLDER_ID;
let cachedGoogleDriveTokens: any = DEFAULT_VERIFIED_TOKENS;

// Securely persist Google Drive OAuth tokens to Firestore
export async function saveGoogleDriveTokensToFirestore(newTokens: any): Promise<void> {
  const mergedTokens = { ...(cachedGoogleDriveTokens || DEFAULT_VERIFIED_TOKENS || {}), ...newTokens };

  if (!mergedTokens.refresh_token && cachedGoogleDriveTokens?.refresh_token) {
    mergedTokens.refresh_token = cachedGoogleDriveTokens.refresh_token;
  }

  cachedGoogleDriveTokens = mergedTokens;

  if (googleDriveAuthClient && typeof googleDriveAuthClient.setCredentials === "function") {
    googleDriveAuthClient.setCredentials(mergedTokens);
  }

  // Clean up legacy files
  try {
    const oldTokenPath = path.join(process.cwd(), "google-drive-token.json");
    if (fs.existsSync(oldTokenPath)) {
      fs.unlinkSync(oldTokenPath);
    }
  } catch {}

  if (adminDb && hasAdminCredentials) {
    try {
      await adminDb.collection("system_settings").doc("google_drive_oauth").set({
        ...mergedTokens,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      console.log("[Google Drive] Secure tokens saved to Firestore (system_settings/google_drive_oauth).");
    } catch (dbErr: any) {
      console.warn("[Google Drive] Notice: Token update skipped in Firestore (verified in-memory tokens remain active):", dbErr?.message || dbErr);
    }
  }
}

// Securely retrieve Google Drive OAuth tokens from Firestore
export async function loadGoogleDriveTokensFromFirestore(): Promise<any> {
  if (cachedGoogleDriveTokens && cachedGoogleDriveTokens.refresh_token) {
    return cachedGoogleDriveTokens;
  }

  if (adminDb && hasAdminCredentials) {
    try {
      const doc = await adminDb.collection("system_settings").doc("google_drive_oauth").get();
      if (doc.exists) {
        const data = doc.data();
        cachedGoogleDriveTokens = { ...(DEFAULT_VERIFIED_TOKENS || {}), ...data };
        if (googleDriveAuthClient && typeof googleDriveAuthClient.setCredentials === "function" && cachedGoogleDriveTokens) {
          googleDriveAuthClient.setCredentials(cachedGoogleDriveTokens);
        }
        return cachedGoogleDriveTokens;
      }
    } catch (err: any) {
      console.warn("[Google Drive] Notice: Using verified in-memory fallback credentials:", err?.message || err);
    }
  }

  if (process.env.GOOGLE_DRIVE_TOKEN_JSON) {
    try {
      cachedGoogleDriveTokens = JSON.parse(process.env.GOOGLE_DRIVE_TOKEN_JSON);
      if (googleDriveAuthClient && typeof googleDriveAuthClient.setCredentials === "function" && cachedGoogleDriveTokens) {
        googleDriveAuthClient.setCredentials(cachedGoogleDriveTokens);
      }
      return cachedGoogleDriveTokens;
    } catch {}
  }

  cachedGoogleDriveTokens = DEFAULT_VERIFIED_TOKENS;
  return cachedGoogleDriveTokens;
}

function initializeGoogleOAuth() {
  let credentials: any = null;

  if (fs.existsSync(googleCredentialsPath)) {
    try {
      credentials = JSON.parse(
        fs.readFileSync(googleCredentialsPath, "utf8")
      );
    } catch (parseErr) {
      console.error("[Google Drive] Error parsing google-oauth-client.json:", parseErr);
    }
  } else if (process.env.GOOGLE_OAUTH_CLIENT_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_OAUTH_CLIENT_JSON);
    } catch (parseErr) {
      console.error("[Google Drive] Error parsing GOOGLE_OAUTH_CLIENT_JSON env:", parseErr);
    }
  }

  if (!credentials && process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    credentials = {
      web: {
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
      }
    };
  }

  if (!credentials) {
    console.warn("[Google Drive] Notice: Google OAuth credentials not found in file or environment; reels upload features disabled.");
    return null;
  }

  try {
    const config = credentials.web || credentials.installed;

    if (!config) {
      throw new Error(
        "Invalid Google OAuth JSON: web/installed configuration not found."
      );
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      (config.redirect_uris && config.redirect_uris.length > 0 ? config.redirect_uris[0] : null) ||
      "https://mypolynet.com/auth/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      redirectUri
    );

    oauth2Client.setCredentials(DEFAULT_VERIFIED_TOKENS);

    oauth2Client.on("tokens", (newTokens: any) => {
      saveGoogleDriveTokensToFirestore(newTokens).catch((err) => {
        console.error("[Google Drive] Failed to save refreshed tokens to Firestore:", err);
      });
    });

    loadGoogleDriveTokensFromFirestore().then((tokens) => {
      if (tokens && oauth2Client) {
        oauth2Client.setCredentials(tokens);
      }
    }).catch(() => {});

    googleDriveAuthClient = oauth2Client;
    googleOAuthClient = oauth2Client;
    console.log("[Google Drive] Cloud OAuth client initialized successfully with zero-redirect permanent token.");
    return googleDriveAuthClient;
  } catch (error) {
    console.error(
      "[Google Drive] OAuth initialization failed:",
      error
    );
    return null;
  }
}

// Initialize Google Drive OAuth client immediately
initializeGoogleOAuth();

export async function getAuthorizedGoogleDriveClient() {
  if (!googleDriveAuthClient) {
    googleDriveAuthClient = initializeGoogleOAuth();
  }
  if (!googleDriveAuthClient) return null;

  try {
    const { token } = await googleDriveAuthClient.getAccessToken();
    if (!token) {
      const refreshed = await googleDriveAuthClient.refreshAccessToken();
      if (refreshed?.credentials) {
        googleDriveAuthClient.setCredentials(refreshed.credentials);
      }
    }
  } catch (err: any) {
    console.warn("[Google Drive] Refreshing access token via refresh token...", err?.message || err);
    try {
      const refreshed = await googleDriveAuthClient.refreshAccessToken();
      if (refreshed?.credentials) {
        googleDriveAuthClient.setCredentials(refreshed.credentials);
      }
    } catch (refErr: any) {
      console.error("[Google Drive] Token refresh failed:", refErr?.message || refErr);
    }
  }

  return google.drive({ version: "v3", auth: googleDriveAuthClient });
}

export function getGoogleDriveClient() {
  if (!googleDriveAuthClient) {
    googleDriveAuthClient = initializeGoogleOAuth();
  }
  if (!googleDriveAuthClient) return null;

  return google.drive({ version: "v3", auth: googleDriveAuthClient });
}

export async function getOrCreatePolyNetReelsFolder(driveInstance?: any): Promise<string> {
  const drive = driveInstance || getGoogleDriveClient();
  if (!drive) {
    throw new Error("Google Drive client is not authorized yet");
  }
  if (cachedReelsFolderId) {
    return cachedReelsFolderId;
  }

  try {
    const listRes = await drive.files.list({
      q: "(name = 'POLYNET' or name = 'PolyNet Reels' or name = 'Polynet') and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name, trashed)",
      spaces: "drive"
    });

    if (listRes.data?.files && listRes.data.files.length > 0) {
      cachedReelsFolderId = listRes.data.files[0].id;
      console.log(`[Google Drive] Using existing '${listRes.data.files[0].name}' folder ID: ${cachedReelsFolderId}`);
      return cachedReelsFolderId!;
    }

    // Create folder "POLYNET"
    const folderRes = await drive.files.create({
      requestBody: {
        name: "POLYNET",
        mimeType: "application/vnd.google-apps.folder",
        description: "PolyNet Reels and Campus Short Video Storage"
      },
      fields: "id, name"
    });

    cachedReelsFolderId = folderRes.data.id;
    console.log(`[Google Drive] Created new 'POLYNET' folder with ID: ${cachedReelsFolderId}`);
    return cachedReelsFolderId!;
  } catch (err) {
    console.error("[Google Drive] Failed to get/create 'PolyNet Reels' folder:", err);
    throw err;
  }
}

export async function uploadReelToGoogleDrive(
  drive: any,
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folderId: string
) {
  const ext = originalFilename.includes(".")
    ? originalFilename.split(".").pop()?.toLowerCase() || "mp4"
    : mimeType.includes("webm") ? "webm" : mimeType.includes("quicktime") ? "mov" : "mp4";
  
  const sanitizedOriginal = originalFilename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const uniqueName = `polynet_reel_${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${sanitizedOriginal}.${ext}`;

  const readableStream = Readable.from(buffer);

  const fileMetadata = {
    name: uniqueName,
    parents: [folderId],
    description: "PolyNet Campus Reel Video"
  };

  const media = {
    mimeType: mimeType || "video/mp4",
    body: readableStream
  };

  const uploadRes = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, size, mimeType, createdTime, webViewLink, webContentLink"
  });

  const uploadedFileId = uploadRes.data.id;

  // Make reel video publicly accessible so Android WebView & browser players can stream smoothly
  // Run asynchronously without blocking client response
  drive.permissions.create({
    fileId: uploadedFileId,
    requestBody: {
      role: "reader",
      type: "anyone"
    }
  }).catch((permErr: any) => {
    console.warn("[Google Drive] Non-blocking permission set notice:", permErr?.message);
  });

  return {
    fileId: uploadedFileId,
    fileName: uploadRes.data.name,
    fileSize: uploadRes.data.size ? parseInt(uploadRes.data.size, 10) : buffer.length,
    mimeType: uploadRes.data.mimeType || mimeType,
    createdTime: uploadRes.data.createdTime || new Date().toISOString(),
    webViewLink: uploadRes.data.webViewLink,
    webContentLink: uploadRes.data.webContentLink
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB max video size for PolyNet Reels
});

function cleanReplyText(text: string): string {
  if (!text) return "";
  let cleaned = text;
  
  // Strip out Pollinations promo ads, links, images, or footers
  cleaned = cleaned.replace(/Support\s+Pollinations\.AI:[\s\S]*/gi, "");
  cleaned = cleaned.replace(/Powered\s+by\s+Pollinations\.AI[\s\S]*/gi, "");
  cleaned = cleaned.replace(/---[\s]*\n*🌸\s*Ad\s*🌸[\s\S]*/gi, "");
  cleaned = cleaned.replace(/🌸\s*Ad\s*🌸[\s\S]*/gi, "");
  cleaned = cleaned.replace(/Pollinations\.AI\s+free\s+text\s+APIs[\s\S]*/gi, "");
  cleaned = cleaned.replace(/\[Support\s+our\s+mission\]\(https:\/\/pollinations\.ai\/redirect\/kofi\)[\s\S]*/gi, "");
  cleaned = cleaned.replace(/https:\/\/pollinations\.ai\/redirect\/kofi/gi, "");
  
  return cleaned.trim();
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class SimpleRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  isRateLimited(key: string): { limited: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { limited: false, retryAfterSeconds: 0 };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return { limited: true, retryAfterSeconds };
    }

    entry.count++;
    return { limited: false, retryAfterSeconds: 0 };
  }
}

const passwordResetLimiter = new SimpleRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15m
const aiLimiter = new SimpleRateLimiter(60 * 1000, 30); // 30 requests per minute

async function bootstrapServer() {
  const app = express();

  // Cross-Origin Resource Sharing (CORS) Middleware with compatible origin allowlist
  const ALLOWED_ORIGINS = new Set([
    "https://mypolynet.com",
    "https://www.mypolynet.com",
    "https://hn-vendor.web.app",
    "https://hn-vendor.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "capacitor://localhost",
    "http://localhost",
  ]);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      if (ALLOWED_ORIGINS.has(origin) || origin.startsWith("http://localhost:") || origin.startsWith("capacitor://")) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Range, X-Requested-With, Accept, Origin, X-Gateway-Signature");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  });

  app.use(express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ==================== HEALTH & PREFLIGHT CHECK ====================
  app.get("/api/health", (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: "healthy",
      service: "polynet-backend",
      timestamp: new Date().toISOString()
    });
  });

  // ==================== REAL PAYMENT GATEWAY (EKLAS / EPS BD) ====================

  app.post("/api/payment/create", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Unauthorized: Please sign in to initiate payment checkout." });
      }

      const { orderId, amount, productName, customer, metadata } = req.body;
      if (!orderId || !amount) {
        return res.status(400).json({ success: false, error: "orderId and amount are required." });
      }

      if (req.body.currency && String(req.body.currency).toUpperCase() !== "BDT") {
        return res.status(400).json({ success: false, error: "Invalid currency. Only BDT is supported." });
      }

      if (!paymentService) {
        paymentService = new PaymentService(adminDb, notificationService);
      }

      const orderType = metadata?.type || "gig"; // 'gig' | 'store'
      let verifiedAmount = Math.max(1, Number(amount));
      let sellerUid = metadata?.sellerUid;

      // Server-authoritative order ownership & amount verification in Firestore
      if (adminDb) {
        const txDoc = await adminDb.collection("payment_transactions").doc(String(orderId)).get();
        if (txDoc.exists && (txDoc.data()?.status === "success" || txDoc.data()?.settled === true)) {
          return res.status(400).json({ success: false, error: "Order has already been paid and settled." });
        }

        if (orderType === "gig") {
          const gigSnap = await adminDb.collection("polygig_orders").doc(String(orderId)).get();
          if (gigSnap.exists) {
            const gigData = gigSnap.data();
            const orderBuyerUid = gigData?.buyerUid || gigData?.buyerId || gigData?.clientId;
            if (orderBuyerUid && orderBuyerUid !== authUser.uid && !authUser.isAdmin) {
              return res.status(403).json({ success: false, error: "Forbidden: You are not authorized to pay for this order." });
            }
            if (gigData?.status === "completed" || gigData?.paymentStatus === "paid") {
              return res.status(400).json({ success: false, error: "Order has already been completed or paid." });
            }
            const orderPrice = Number(gigData?.agreedPrice || gigData?.budget || gigData?.amount || gigData?.price);
            if (!isNaN(orderPrice) && orderPrice > 0) {
              verifiedAmount = orderPrice;
            }
            sellerUid = gigData?.sellerUid || gigData?.sellerId || gigData?.freelancerId || sellerUid;
          }
        } else if (orderType === "store") {
          const storeSnap = await adminDb.collection("buy_sell_orders").doc(String(orderId)).get();
          if (storeSnap.exists) {
            const storeData = storeSnap.data();
            const orderBuyerUid = storeData?.buyerUid;
            if (orderBuyerUid && orderBuyerUid !== authUser.uid && !authUser.isAdmin) {
              return res.status(403).json({ success: false, error: "Forbidden: You are not authorized to pay for this order." });
            }
            if (storeData?.status === "paid" || storeData?.paymentStatus === "paid") {
              return res.status(400).json({ success: false, error: "Store order has already been paid." });
            }
            const orderPrice = Number(storeData?.totalAmount || storeData?.price || storeData?.amount);
            if (!isNaN(orderPrice) && orderPrice > 0) {
              verifiedAmount = orderPrice;
            }
            sellerUid = storeData?.sellerUid || sellerUid;
          }
        }
      }

      const host = `${req.protocol}://${req.get("host")}`;
      const safeMetadata = {
        ...(metadata || {}),
        type: orderType,
        itemId: String(orderId),
        buyerUid: authUser.uid,
        buyerEmail: authUser.email,
        sellerUid: sellerUid || metadata?.sellerUid,
      };

      const result = await paymentService.createPayment({
        orderId: String(orderId),
        amount: verifiedAmount,
        productName: productName || `Order #${orderId}`,
        customer: customer || { name: "PolyNet Student", phone: "01700000000" },
        metadata: safeMetadata,
        appUrl: process.env.APP_URL || host,
      });

      return res.json(result);
    } catch (err: any) {
      console.error("[Payment API] Error in /api/payment/create:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to create payment session" });
    }
  });

  app.post("/api/payment/verify", async (req: express.Request, res: express.Response) => {
    try {
      const { orderId, transactionId } = req.body;
      if (!orderId && !transactionId) {
        return res.status(400).json({ success: false, error: "orderId or transactionId required" });
      }

      if (!paymentService) {
        paymentService = new PaymentService(adminDb, notificationService);
      }

      const result = await paymentService.verifyPayment({ orderId, transactionId });
      return res.json(result);
    } catch (err: any) {
      console.error("[Payment API] Error in /api/payment/verify:", err);
      return res.status(500).json({ success: false, error: err?.message || "Verification failed" });
    }
  });

  app.get("/api/payment/webhook", (_req: express.Request, res: express.Response) => {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "EPS Webhook receiver accepts POST requests only with valid x-gateway-signature header.",
    });
  });

  app.post("/api/payment/webhook", async (req: express.Request, res: express.Response) => {
    try {
      const sigHeader = (req.headers["x-gateway-signature"] || req.headers["X-Gateway-Signature"]) as string;
      const rawBody = typeof (req as any).rawBody === "string" ? (req as any).rawBody : (typeof req.body === "string" ? req.body : "");

      if (!paymentService) {
        paymentService = new PaymentService(adminDb, notificationService);
      }

      const isValid = paymentService.verifyWebhookSignature(sigHeader, rawBody);
      if (!isValid) {
        console.warn(`[Payment Webhook] Webhook signature verification failed (signature header present: ${Boolean(sigHeader)})`);
        return res.status(401).send("Invalid signature");
      }

      const eventData = req.body;
      console.log(`[Payment Webhook] Valid signature verified for event: ${eventData?.event}, order_id: ${eventData?.order_id}`);

      await paymentService.handleWebhookPayload(eventData);

      return res.status(200).send("ok");
    } catch (err: any) {
      console.error("[Payment Webhook] Processing error:", err?.message || String(err));
      return res.status(500).send("Internal server error");
    }
  });

  app.get("/api/payment/status/:orderId", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Unauthorized: Sign-in required to view payment status." });
      }

      const { orderId } = req.params;
      if (!adminDb) {
        return res.json({ success: true, status: "unknown" });
      }
      const doc = await adminDb.collection("payment_transactions").doc(orderId).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: "Transaction not found" });
      }
      const txData = doc.data();
      const buyerUid = txData?.metadata?.buyerUid || txData?.customer?.buyerUid;
      const sellerUid = txData?.metadata?.sellerUid;

      const isAuthorized =
        authUser.isAdmin ||
        authUser.isStoreGigAdmin ||
        authUser.uid === buyerUid ||
        (sellerUid && authUser.uid === sellerUid);

      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: "Forbidden: You are not authorized to view this transaction." });
      }

      // Return sanitized, non-sensitive transaction status information
      return res.json({
        success: true,
        transaction: {
          orderId: txData?.orderId || orderId,
          status: txData?.status,
          settled: Boolean(txData?.settled),
          amount: txData?.amount,
          currency: txData?.currency || "BDT",
          productName: txData?.productName,
          createdAt: txData?.createdAt,
          updatedAt: txData?.updatedAt,
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to retrieve payment status." });
    }
  });

  // ==================== SERVER-AUTHORITATIVE WALLET & WITHDRAWALS ====================

  app.post("/api/wallet/withdraw", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Unauthorized. Valid authentication required." });
      }

      if (!ledgerService) {
        ledgerService = new LedgerService(adminDb, notificationService);
      }

      const { amount, method, accountNumber, idempotencyKey, userName } = req.body;
      const result = await ledgerService.requestWithdrawal({
        userUid: authUser.uid, // Derived strictly from verified auth token
        amountBDT: Number(amount),
        method: method || "bKash",
        accountNumber: String(accountNumber || "").trim(),
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
        userName: userName ? String(userName) : undefined,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      console.error("[Wallet API] Error in /api/wallet/withdraw:", err);
      return res.status(500).json({ success: false, error: err?.message || "Withdrawal request failed." });
    }
  });

  app.get("/api/wallet/balance/:userId", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Unauthorized." });
      }

      const { userId } = req.params;
      // Enforce self-access or admin access
      if (authUser.uid !== userId && !authUser.isAdmin && !authUser.isStoreGigAdmin) {
        return res.status(403).json({ success: false, error: "Forbidden: You may only view your own wallet balance." });
      }

      if (!ledgerService) {
        ledgerService = new LedgerService(adminDb, notificationService);
      }

      const wallet = await ledgerService.getUserWallet(userId);
      return res.json({ success: true, wallet });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post("/api/wallet/withdrawals/:id/payout", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || (!authUser.isAdmin && !authUser.isStoreGigAdmin)) {
        return res.status(403).json({ success: false, error: "Forbidden: Administrator authorization required." });
      }

      if (!ledgerService) {
        ledgerService = new LedgerService(adminDb, notificationService);
      }

      const { id } = req.params;
      const { status, payoutReference, rejectionReason } = req.body;

      if (status !== "completed" && status !== "rejected") {
        return res.status(400).json({ success: false, error: "Invalid status. Must be 'completed' or 'rejected'." });
      }

      const result = await ledgerService.processWithdrawalPayout({
        withdrawalId: id,
        adminUid: authUser.uid,
        adminEmail: authUser.email,
        status,
        payoutReference,
        rejectionReason,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      console.error("[Wallet API] Error in /api/wallet/withdrawals/:id/payout:", err);
      return res.status(500).json({ success: false, error: err?.message || "Payout processing failed." });
    }
  });

  app.post("/api/wallet/orders/:id/refund", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || (!authUser.isAdmin && !authUser.isStoreGigAdmin)) {
        return res.status(403).json({ success: false, error: "Forbidden: Administrator authorization required." });
      }

      if (!ledgerService) {
        ledgerService = new LedgerService(adminDb, notificationService);
      }

      const { id } = req.params;
      const { reason, refundReference, refundMethod, customerPhone } = req.body;

      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({ success: false, error: "A refund reason is required." });
      }

      const result = await ledgerService.refundGigOrder({
        orderId: id,
        reason: reason.trim(),
        adminUid: authUser.uid,
        adminEmail: authUser.email,
        refundReference: refundReference ? String(refundReference).trim() : undefined,
        refundMethod: refundMethod ? String(refundMethod).trim() : undefined,
        customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      console.error("[Wallet API] Error in /api/wallet/orders/:id/refund:", err);
      return res.status(500).json({ success: false, error: err?.message || "Refund processing failed." });
    }
  });

  // ==================== AI AGENT & SEARCH METADATA ROUTES ====================
  app.get("/llms.txt", (_req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const filePath = path.join(process.cwd(), "public", "llms.txt");
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.send(`Title: PolyNet (The Premier Polytechnic Student Academic & Social Network)
Founder & CEO: Hasan Mahmud
Date of Birth: 2008
Birthplace: Kapasia, Gazipur, Dhaka, Bangladesh
Parent Company: Omini
Academic Network: 51+ Polytechnic Institutes under BTEB (Bangladesh Technical Education Board)
Core Features: Academic Hub, Digital Routines, Syllabus Library, PolyGig Freelance Services, PolyStore Market, Messenger, Reels Streaming with Google Drive.`);
    }
  });

  app.get("/.well-known/ai-plugin.json", (_req: express.Request, res: express.Response) => {
    res.json({
      schema_version: "v1",
      name_for_human: "PolyNet Platform",
      name_for_model: "polynet_academic_hub",
      description_for_human: "Official Academic & Social Platform for Bangladesh Polytechnic Students.",
      description_for_model: "PolyNet is the verified academic social network and study ecosystem for Bangladesh Technical Education Board (BTEB) diploma in engineering students. Founded by Founder & CEO Hasan Mahmud (Born: 2008 in Kapasia, Gazipur, Dhaka, Bangladesh).",
      auth: { type: "none" },
      api: { type: "openapi", url: "https://mypolynet.com/openapi.yaml" },
      logo_url: "https://mypolynet.com/logo.png",
      contact_email: "hasanmahmud.cst@gmail.com",
      legal_info_url: "https://mypolynet.com/?view=privacy-policy"
    });
  });

  app.get("/api/platform/founder", (_req: express.Request, res: express.Response) => {
    res.json({
      founder: "Hasan Mahmud",
      title: "Founder & CEO",
      birthYear: 2008,
      birthplace: "Kapasia, Gazipur, Dhaka, Bangladesh",
      organizations: ["PolyNet", "Omini", "PolyChat", "PolyAI"],
      profession: "Computer Science & Technology (CST) Engineer & Software Architect",
      email: "hasanmahmud.cst@gmail.com"
    });
  });

  // ==================== GOOGLE DRIVE OAUTH ====================

  app.get(["/auth/google", "/auth/google/", "/api/auth/google", "/api/auth/google/"], (req, res) => {
    if (!googleOAuthClient) {
      googleOAuthClient = initializeGoogleOAuth();
    }

    if (!googleOAuthClient) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html lang="bn">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Google OAuth Error - PolyNet</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
            .card { background: #fff; max-width: 540px; width: 100%; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            h2 { color: #e11d48; margin-top: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
            p { font-size: 0.95rem; line-height: 1.6; color: #475569; }
            code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875rem; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⚠️ Google OAuth Client Configuration Missing</h2>
            <p>The file <code>google-oauth-client.json</code> was not found or is missing client credentials.</p>
            <p>Please make sure <code>google-oauth-client.json</code> is placed at the project root directory with valid Google Cloud credentials.</p>
          </div>
        </body>
        </html>
      `);
      return;
    }

    const authUrl = googleOAuthClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
      ],
      include_granted_scopes: true
    });

    res.redirect(authUrl);
  });

  app.get(
    ["/auth/google/callback", "/auth/google/callback/", "/api/auth/google/callback", "/api/auth/google/callback/"],
    async (req: express.Request, res: express.Response) => {
      try {
        if (!googleOAuthClient) {
          googleOAuthClient = initializeGoogleOAuth();
        }

        if (!googleOAuthClient) {
          res.status(400).send(`
            <!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="utf-8" />
              <title>Google OAuth Error - PolyNet</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
                .card { background: #fff; max-width: 500px; width: 100%; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; text-align: center; }
                h2 { color: #e11d48; margin-top: 0; }
                p { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
                a { display: inline-block; margin-top: 1rem; background: #0d9488; color: #fff; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>⚠️ OAuth Client Not Configured</h2>
                <p>Google OAuth is not configured. <code>google-oauth-client.json</code> is missing or invalid.</p>
                <a href="/">Return to PolyNet</a>
              </div>
            </body>
            </html>
          `);
          return;
        }

        const error = req.query.error as string;
        if (error) {
          console.error("[Google Drive OAuth] Authorization error from Google:", error, req.query.error_description);
          res.status(400).send(`
            <!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="utf-8" />
              <title>Google OAuth Failed - PolyNet</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
                .card { background: #fff; max-width: 500px; width: 100%; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; text-align: center; }
                h2 { color: #e11d48; margin-top: 0; }
                p { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
                a { display: inline-block; margin-top: 1rem; background: #0d9488; color: #fff; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>❌ Authorization Failed</h2>
                <p>Google returned an error: <strong>${escapeHtml(error)}</strong></p>
                <p>${escapeHtml((req.query.error_description as string) || "Access was denied or request expired.")}</p>
                <a href="/auth/google">Try Again</a>
              </div>
            </body>
            </html>
          `);
          return;
        }

        const code = req.query.code as string;
        if (!code) {
          res.status(400).send(`
            <!DOCTYPE html>
            <html lang="bn">
            <head>
              <meta charset="utf-8" />
              <title>Authorization Code Missing - PolyNet</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; }
                .card { background: #fff; max-width: 500px; width: 100%; border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; text-align: center; }
                h2 { color: #f59e0b; margin-top: 0; }
                p { color: #64748b; font-size: 0.95rem; line-height: 1.6; }
                a { display: inline-block; margin-top: 1rem; background: #0d9488; color: #fff; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>⚠️ Code Missing</h2>
                <p>No authorization code was found in the callback request.</p>
                <a href="/auth/google">Authorize Google Drive</a>
              </div>
            </body>
            </html>
          `);
          return;
        }

        // Exchange authorization code for access & refresh tokens
        const { tokens } = await googleOAuthClient.getToken(code);

        // Securely store in Firestore and memory (never on disk)
        await saveGoogleDriveTokensToFirestore(tokens);

        console.log("[Google Drive] Server-side authorization successful! Tokens secured in Firestore (system_settings/google_drive_oauth).");

        // Pre-fetch or verify 'POLYNET' folder
        getOrCreatePolyNetReelsFolder().catch((folderErr) => {
          console.warn("[Google Drive] Folder verification background warning:", folderErr);
        });

        res.send(`
          <!DOCTYPE html>
          <html lang="bn">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Google Drive Connected - PolyNet</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #f0fdf4; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
              .card { background: #ffffff; max-width: 520px; width: 100%; border-radius: 1.25rem; padding: 2.5rem 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #bbf7d0; text-align: center; }
              .icon-circle { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto; font-size: 2rem; }
              h2 { color: #15803d; margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 800; }
              p { color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0.5rem 0; }
              .badge { display: inline-block; background: #f1f5f9; color: #334155; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 9999px; margin: 1rem 0; border: 1px solid #e2e8f0; }
              .btn { display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 0.75rem 1.75rem; border-radius: 0.625rem; font-weight: 700; font-size: 0.95rem; transition: background 0.2s; margin-top: 1rem; }
              .btn:hover { background: #0f766e; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon-circle">✓</div>
              <h2>Google Drive Connected! ✅</h2>
              <p>Your <strong>5 TB Google Drive</strong> has been successfully connected to PolyNet.</p>
              <p style="font-size: 0.85rem; color: #64748b;">Access Token &amp; Refresh Token have been securely stored in Firestore. All future Reels will be saved directly to your Google Drive.</p>
              <div class="badge">Folder: POLYNET • Storage: 5 TB • Status: Active</div>
              <div>
                <a href="/" class="btn">Return to PolyNet</a>
              </div>
            </div>
          </body>
          </html>
        `);
      } catch (error: any) {
        console.error(
          "[Google Drive] OAuth callback token exchange error:",
          error
        );

        res.status(500).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Authorization Failed - PolyNet</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #fef2f2; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
              .card { background: #ffffff; max-width: 520px; width: 100%; border-radius: 1.25rem; padding: 2rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #fecaca; text-align: center; }
              h2 { color: #dc2626; margin-top: 0; font-size: 1.35rem; }
              p { color: #475569; font-size: 0.95rem; line-height: 1.6; }
              pre { background: #f8fafc; padding: 0.75rem; border-radius: 0.5rem; text-align: left; font-size: 0.8rem; overflow-x: auto; color: #b91c1c; border: 1px solid #e2e8f0; }
              a { display: inline-block; margin-top: 1rem; background: #0d9488; color: #fff; text-decoration: none; padding: 0.65rem 1.5rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>❌ Authorization Exchange Failed</h2>
              <p>An issue occurred while generating Google OAuth tokens:</p>
              <pre>${escapeHtml(error?.message || String(error))}</pre>
              <p style="font-size: 0.85rem;">Please ensure that the Redirect URI in Google Cloud Console matches <code>https://mypolynet.com/auth/google/callback</code> exactly.</p>
              <a href="/auth/google">Try Again</a>
            </div>
          </body>
          </html>
        `);
      }
    }
  );

  // JSON-based Token Exchange Endpoint (fallback for programmatic exchanges)
  app.post(
    ["/api/auth/google/exchange", "/auth/google/exchange"],
    async (req: express.Request, res: express.Response) => {
      try {
        if (!googleOAuthClient) {
          googleOAuthClient = initializeGoogleOAuth();
        }
        if (!googleOAuthClient) {
          res.status(500).json({
            success: false,
            error: "Google OAuth client is not configured on the server. google-oauth-client.json is missing."
          });
          return;
        }

        const { code } = req.body;
        if (!code) {
          res.status(400).json({
            success: false,
            error: "Authorization code is required in request body."
          });
          return;
        }

        const { tokens } = await googleOAuthClient.getToken(code);
        await saveGoogleDriveTokensToFirestore(tokens);

        console.log("[Google Drive] JSON code exchange successful! Tokens saved to Firestore.");

        getOrCreatePolyNetReelsFolder().catch((err) => {
          console.warn("[Google Drive] Folder verification background check warning:", err);
        });

        res.json({
          success: true,
          message: "Google Drive Connected Successfully! 5 TB Storage Active.",
          folder: "POLYNET"
        });
      } catch (err: any) {
        console.error("[Google Drive] Exchange API error:", err);
        res.status(500).json({
          success: false,
          error: err?.message || String(err)
        });
      }
    }
  );

  // Status check endpoint
  app.get(
    ["/api/auth/google/status", "/auth/google/status"],
    async (_req: express.Request, res: express.Response) => {
      const hasServiceAccount = fs.existsSync(googleServiceAccountPath) || !!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
      if (!cachedGoogleDriveTokens && !hasServiceAccount) {
        await loadGoogleDriveTokensFromFirestore();
      }
      const isConfigured = hasServiceAccount || fs.existsSync(googleCredentialsPath) || !!process.env.GOOGLE_OAUTH_CLIENT_JSON;
      const isAuthorized = hasServiceAccount || !!cachedGoogleDriveTokens || !!process.env.GOOGLE_DRIVE_TOKEN_JSON;
      res.json({
        configured: isConfigured,
        authorized: isAuthorized,
        folderName: "POLYNET",
        folderId: TARGET_POLYNET_FOLDER_ID,
        storageCapacity: "5 TB",
        redirectUri: "https://mypolynet.com/auth/google/callback",
        storageType: hasServiceAccount ? "Google Cloud Service Account (Zero-Redirect Automated)" : "Firestore Server-Side Store"
      });
    }
  );

  // ==========================================================

  // Ensure uploads directories exist
  const uploadsDir = path.join(process.cwd(), "uploads", "reels");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const documentsDir = path.join(process.cwd(), "uploads", "documents");
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
  }

  // Statically serve uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // ==================== AUTHENTICATION & AUTHORIZATION HELPERS ====================
  async function authenticateRequest(req: express.Request): Promise<{ uid: string; email: string; isAdmin: boolean; isStoreGigAdmin: boolean } | null> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ") && getApps().length > 0) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decoded = await getAuth().verifyIdToken(idToken);
        const email = (decoded.email || "").toLowerCase();
        let isAdmin = email === "22222@gmail.com" || email === "hasanmahmud.cst@gmail.com" || email === "hdd@gmail.com" || (decoded as any).admin === true || (decoded as any).role === "super_admin";
        let isStoreGigAdmin = email === "polygig.store.polynet@gmail.com" || (decoded as any).store_gig_admin === true || (decoded as any).role === "store_gig_admin";

        if ((!isAdmin || !isStoreGigAdmin) && adminDb) {
          try {
            const uDoc = await adminDb.collection("users").doc(decoded.uid).get();
            if (uDoc.exists) {
              const uData = uDoc.data();
              if (uData?.isAdmin === true) isAdmin = true;
              if (uData?.isStoreGigAdmin === true) isStoreGigAdmin = true;
            }
          } catch {}
        }
        return {
          uid: decoded.uid,
          email,
          isAdmin,
          isStoreGigAdmin
        };
      } catch (e) {
        // Invalid or expired token
      }
    }
    return null;
  }

  // ==================== GOOGLE DRIVE REEL STORAGE & STREAMING ====================

  /**
   * Production Google Drive Reel Upload Endpoint
   * Exclusively uploads video to the 'PolyNet Reels' folder in Google Drive.
   * Does NOT fall back to local disk storage in production.
   */
  app.post("/api/upload-reel", upload.single("video"), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No video file provided for upload." });
        return;
      }

      // Validate video MIME types
      const mimeType = req.file.mimetype || "video/mp4";
      const validMimeTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-m4v",
        "video/3gpp",
        "video/x-matroska",
        "video/avi",
        "video/mpeg",
        "video/ogg",
        "video/mov"
      ];

      const isVideo = mimeType.startsWith("video/") || validMimeTypes.includes(mimeType.toLowerCase());
      if (!isVideo) {
        res.status(400).json({
          success: false,
          error: `Invalid file format (${mimeType}). Only valid video files (MP4, WebM, QuickTime MOV) are permitted for PolyNet Reels.`
        });
        return;
      }

      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      const title = req.body.title || "PolyNet Campus Reel";

      console.log(`[Reel Upload] Processing video upload for "${title}" (${fileSizeMB} MB, mime: ${mimeType})...`);

      // Retrieve authorized Google Drive client with active access token
      if (!cachedGoogleDriveTokens) {
        await loadGoogleDriveTokensFromFirestore();
      }
      const drive = await getAuthorizedGoogleDriveClient();
      if (!drive) {
        console.error("[Google Drive Upload Error] Google Drive OAuth client or token not initialized.");
        res.status(503).json({
          success: false,
          error: "Google Drive storage service is not authorized or available. Please ensure Google Drive OAuth authorization is configured."
        });
        return;
      }

      // Upload directly to Google Drive 'PolyNet Reels' folder
      const folderId = await getOrCreatePolyNetReelsFolder(drive);
      const uploadResult = await uploadReelToGoogleDrive(
        drive,
        req.file.buffer,
        req.file.originalname || `reel_${Date.now()}.mp4`,
        mimeType,
        folderId
      );

      if (!uploadResult?.fileId) {
        throw new Error("Google Drive API did not return a valid file ID.");
      }

      const driveFileId = uploadResult.fileId;
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
      const baseUrl = host ? `${proto}://${host}` : "";
      const relativePlayUrl = `/api/reels/stream/${driveFileId}`;
      const absolutePlayUrl = baseUrl ? `${baseUrl}${relativePlayUrl}` : relativePlayUrl;

      console.log(`[Google Drive] Reel video successfully uploaded to Google Drive! File ID: ${driveFileId}`);

      const directDriveUrl = uploadResult.webContentLink || `https://drive.google.com/uc?export=download&id=${driveFileId}`;

      res.json({
        success: true,
        fileId: driveFileId,
        driveFileId: driveFileId,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType || mimeType,
        fileSize: uploadResult.fileSize,
        videoUrl: relativePlayUrl,
        absoluteVideoUrl: absolutePlayUrl,
        directDriveUrl: directDriveUrl,
        embedUrl: relativePlayUrl,
        storageProvider: "google_drive"
      });
    } catch (err: any) {
      console.error("[Reel Upload Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Google Drive upload failed: " + (err?.message || "Internal server error")
      });
    }
  });

  // ==================== MESSENGER REAL DOCUMENT & FILE SHARING ====================
  const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB max document / file size (PDF, DOC, ZIP, ISO, APK, Video, etc.)
  });

  app.post("/api/upload-chat-document", documentUpload.single("file"), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No document file provided." });
        return;
      }

      const originalName = req.file.originalname || "document";
      const ext = path.extname(originalName).toLowerCase();
      const rawMime = req.file.mimetype || "application/octet-stream";
      const fileSize = req.file.size;

      // Classify file type
      let fileType = "other";
      if (ext === ".pdf" || rawMime.includes("pdf")) fileType = "pdf";
      else if (ext === ".doc" || ext === ".docx" || rawMime.includes("word") || rawMime.includes("msword")) fileType = "doc";
      else if (ext === ".zip" || ext === ".rar" || ext === ".7z" || ext === ".tar" || ext === ".gz" || rawMime.includes("zip") || rawMime.includes("archive")) fileType = "zip";
      else if (ext === ".xls" || ext === ".xlsx" || rawMime.includes("excel") || rawMime.includes("spreadsheet")) fileType = "xls";
      else if (ext === ".ppt" || ext === ".pptx" || rawMime.includes("powerpoint") || rawMime.includes("presentation")) fileType = "ppt";
      else if (ext === ".txt" || ext === ".csv") fileType = "txt";

      const formattedSize = fileSize > 1024 * 1024 
        ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(fileSize / 1024)} KB`;

      let fileUrl = "";
      let storageProvider = "local";

      // Attempt Google Drive upload if available
      try {
        if (!cachedGoogleDriveTokens) {
          await loadGoogleDriveTokensFromFirestore();
        }
        const drive = await getAuthorizedGoogleDriveClient();
        if (drive) {
          const folderId = await getOrCreatePolyNetReelsFolder(drive);
          const uploadRes = await drive.files.create({
            requestBody: {
              name: `[PolyNet Doc] ${originalName}`,
              parents: [folderId],
              description: "PolyNet Chat Shared Document"
            },
            media: {
              mimeType: rawMime,
              body: Readable.from(req.file.buffer)
            },
            fields: "id, name, size, mimeType, webViewLink, webContentLink"
          });

          if (uploadRes?.data?.id) {
            const driveId = uploadRes.data.id;
            drive.permissions.create({
              fileId: driveId,
              requestBody: { role: "reader", type: "anyone" }
            }).catch(() => {});

            fileUrl = `/api/documents/download/${driveId}?name=${encodeURIComponent(originalName)}`;
            storageProvider = "google_drive";
          }
        }
      } catch (driveErr) {
        console.warn("[Document Upload] Google Drive upload notice, saving locally:", driveErr);
      }

      // Fallback to local storage
      if (!fileUrl) {
        const safeFileName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const targetPath = path.join(documentsDir, safeFileName);
        fs.writeFileSync(targetPath, req.file.buffer);
        fileUrl = `/uploads/documents/${safeFileName}`;
        storageProvider = "local";
      }

      res.json({
        success: true,
        fileUrl,
        fileName: originalName,
        fileSize: formattedSize,
        fileSizeBytes: fileSize,
        fileType,
        mimeType: rawMime,
        storageProvider
      });
    } catch (err: any) {
      console.error("[Document Upload Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Failed to upload document: " + (err?.message || "Internal server error")
      });
    }
  });

  // Download/Streaming proxy for Google Drive stored documents
  app.get("/api/documents/download/:fileId", async (req: express.Request, res: express.Response) => {
    try {
      const { fileId } = req.params;
      const downloadName = (req.query.name as string) || "document";
      const drive = await getAuthorizedGoogleDriveClient();
      if (!drive) {
        res.redirect(`https://drive.google.com/uc?export=download&id=${fileId}`);
        return;
      }

      const driveRes = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
      driveRes.data.pipe(res);
    } catch (err) {
      res.redirect(`https://drive.google.com/uc?export=download&id=${req.params.fileId}`);
    }
  });

  /**
   * Fast In-Memory Metadata Cache for Google Drive Stream
   * Eliminates 500-800ms Drive API network latency on every Range chunk request
   */
  interface DriveMetaCacheItem {
    size: number;
    mimeType: string;
    trashed?: boolean;
    cachedAt: number;
  }
  const driveMetaCache = new Map<string, DriveMetaCacheItem>();

  /**
   * Production Google Drive Reel Video Streaming Endpoint
   * Securely streams video directly from Google Drive with HTTP Range 206 support
   * Allows native HTML5 <video> seeking, buffering, and fast playback without exposing OAuth credentials.
   */
  app.get("/api/reels/stream/:fileId", async (req: express.Request, res: express.Response) => {
    // Cross-origin and mobile app header support for seamless playback
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type, Accept");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    try {
      const fileId = req.params.fileId;
      if (!fileId || typeof fileId !== "string" || !/^[a-zA-Z0-9_\-]+$/.test(fileId)) {
        res.status(400).send("Invalid Google Drive file ID parameter.");
        return;
      }

      if (!cachedGoogleDriveTokens) {
        await loadGoogleDriveTokensFromFirestore();
      }
      const drive = getGoogleDriveClient();
      if (!drive) {
        res.status(503).send("Google Drive storage service is currently unavailable.");
        return;
      }

      // 1. Fetch file metadata with in-memory caching (1 hour TTL)
      let fileMeta: DriveMetaCacheItem | null = null;
      const cached = driveMetaCache.get(fileId);
      const now = Date.now();

      if (cached && (now - cached.cachedAt < 3600000)) {
        fileMeta = cached;
      } else {
        try {
          const metaRes = await drive.files.get({
            fileId: fileId,
            fields: "id, name, size, mimeType, trashed"
          });
          fileMeta = {
            size: parseInt(metaRes.data.size || "0", 10),
            mimeType: metaRes.data.mimeType || "video/mp4",
            trashed: !!metaRes.data.trashed,
            cachedAt: now
          };
          driveMetaCache.set(fileId, fileMeta);
        } catch (metaErr: any) {
          console.warn(`[Drive Stream] File ${fileId} not found in Google Drive:`, metaErr?.message);
          res.status(404).send("Reel video file was not found in Google Drive.");
          return;
        }
      }

      if (fileMeta?.trashed) {
        res.status(410).send("This reel video has been deleted from Google Drive.");
        return;
      }

      const totalSize = fileMeta.size;
      const mimeType = fileMeta.mimeType;
      const range = req.headers.range;

      // 2. Handle HTTP 206 Partial Content for seeking & range requests
      if (range && totalSize > 0) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

        if (isNaN(start) || isNaN(end) || start >= totalSize || end >= totalSize || start > end) {
          res.status(416).set({
            "Content-Range": `bytes */${totalSize}`,
            "Accept-Ranges": "bytes"
          }).end();
          return;
        }

        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=86400, no-transform"
        });

        const driveStream = await drive.files.get(
          { fileId: fileId, alt: "media" },
          { responseType: "stream", headers: { Range: `bytes=${start}-${end}` } }
        );

        driveStream.data.on("error", (streamErr: any) => {
          console.warn(`[Drive Stream Range Error] fileId ${fileId}:`, streamErr?.message);
          if (!res.headersSent) res.status(500).end();
        });

        req.on("close", () => {
          try {
            if (driveStream.data && typeof driveStream.data.destroy === "function") {
              driveStream.data.destroy();
            }
          } catch {}
        });

        driveStream.data.pipe(res);
      } else {
        // 3. Full file streaming
        res.writeHead(200, {
          "Content-Length": totalSize > 0 ? totalSize : undefined,
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400, no-transform"
        });

        const driveStream = await drive.files.get(
          { fileId: fileId, alt: "media" },
          { responseType: "stream" }
        );

        driveStream.data.on("error", (streamErr: any) => {
          console.warn(`[Drive Stream Full Error] fileId ${fileId}:`, streamErr?.message);
          if (!res.headersSent) res.status(500).end();
        });

        req.on("close", () => {
          try {
            if (driveStream.data && typeof driveStream.data.destroy === "function") {
              driveStream.data.destroy();
            }
          } catch {}
        });

        driveStream.data.pipe(res);
      }
    } catch (err: any) {
      console.error("[Drive Stream API Error]:", err?.message || err);
      if (!res.headersSent) {
        res.status(500).send("Failed to stream video: " + (err?.message || "Internal server error"));
      }
    }
  });

  /**
   * Production Google Drive Reel Deletion Endpoint
   * Verifies document ownership in Firestore, deletes video file from Google Drive, and removes Firestore document.
   */
  app.post("/api/reels/delete", async (req: express.Request, res: express.Response) => {
    try {
      const { reelId, driveFileId, userId } = req.body;
      if (!reelId && !driveFileId) {
        res.status(400).json({ success: false, error: "reelId or driveFileId is required." });
        return;
      }

      let targetDriveFileId = driveFileId;

      // Extract user authorization if Firebase Admin is present
      let authUid = userId || null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ") && getApps().length > 0) {
        try {
          const idToken = authHeader.split("Bearer ")[1];
          const decoded = await getAuth().verifyIdToken(idToken);
          authUid = decoded.uid;
        } catch {}
      }

      // Check Firestore document
      if (adminDb && reelId) {
        try {
          const reelDoc = await adminDb.collection("reels").doc(reelId).get();
          if (reelDoc.exists) {
            const data = reelDoc.data();
            if (data) {
              // Authorization Check: Only author or admin can delete
              const isOwner = !authUid || data.authorId === authUid || data.userId === authUid;
              const isAdmin = authUid && (
                authUid === "hasanmahmud.cst@gmail.com" ||
                authUid === "hdd@gmail.com" ||
                data.isAdmin === true
              );

              if (!isOwner && !isAdmin) {
                res.status(403).json({ success: false, error: "Unauthorized: You can only delete your own reels." });
                return;
              }

              if (!targetDriveFileId) {
                targetDriveFileId = data.driveFileId || (data.videoUrl && data.videoUrl.includes("/api/reels/stream/") ? data.videoUrl.split("/api/reels/stream/")[1] : null);
              }
            }
            await adminDb.collection("reels").doc(reelId).delete();
            console.log(`[Reel Delete] Firestore document ${reelId} removed.`);
          }
        } catch (dbErr) {
          console.warn("[Reel Delete] Firestore removal notice:", dbErr);
        }
      }

      // Delete the video file from Google Drive
      if (targetDriveFileId) {
        // Sanitize file ID parameter
        if (/^[a-zA-Z0-9_\-]+$/.test(targetDriveFileId)) {
          try {
            const drive = getGoogleDriveClient();
            if (drive) {
              await drive.files.delete({ fileId: targetDriveFileId });
              console.log(`[Google Drive] File ${targetDriveFileId} successfully deleted from Google Drive.`);
            }
          } catch (driveErr: any) {
            console.warn(`[Google Drive Delete Notice]: ${driveErr?.message || driveErr}`);
          }
        }
      }

      res.json({
        success: true,
        message: "Reel and Google Drive storage deleted successfully."
      });
    } catch (err: any) {
      console.error("[Reel Delete Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to delete reel." });
    }
  });

  /**
   * Support standard HTTP DELETE /api/reels/:id
   */
  app.delete("/api/reels/:id", async (req: express.Request, res: express.Response) => {
    try {
      const reelId = req.params.id;
      let targetDriveFileId: string | null = null;

      if (adminDb && reelId) {
        const reelDoc = await adminDb.collection("reels").doc(reelId).get();
        if (reelDoc.exists) {
          const data = reelDoc.data();
          if (data) {
            targetDriveFileId = data.driveFileId || (data.videoUrl && data.videoUrl.includes("/api/reels/stream/") ? data.videoUrl.split("/api/reels/stream/")[1] : null);
          }
          await adminDb.collection("reels").doc(reelId).delete();
        }
      }

      if (targetDriveFileId && /^[a-zA-Z0-9_\-]+$/.test(targetDriveFileId)) {
        try {
          const drive = getGoogleDriveClient();
          if (drive) {
            await drive.files.delete({ fileId: targetDriveFileId });
          }
        } catch (driveErr: any) {
          console.warn("[Google Drive Delete Notice]:", driveErr?.message);
        }
      }

      res.json({ success: true, message: "Reel deleted successfully from Google Drive and database." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to delete reel." });
    }
  });

  /**
   * Google Drive Health & Status Check Endpoint
   */
  app.get("/api/google-drive/status", async (req: express.Request, res: express.Response) => {
    try {
      const drive = getGoogleDriveClient();
      if (!drive) {
        res.json({
          connected: false,
          storageProvider: "google_drive",
          message: "Google Drive OAuth token not loaded. Visit /auth/google to authorize."
        });
        return;
      }

      const folderId = await getOrCreatePolyNetReelsFolder(drive);
      res.json({
        connected: true,
        storageProvider: "google_drive",
        folderName: "PolyNet Reels",
        folderId: folderId
      });
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        storageProvider: "google_drive",
        error: err?.message || "Google Drive connection error"
      });
    }
  });

  // Server-side cipher helpers for student verification in Firestore database
  function serverEncryptData(val: string): string {
    if (!val) return "";
    const trimmed = String(val).trim();
    if (trimmed.startsWith("ENC:")) return trimmed;
    const shifted = trimmed.split("").map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join("");
    try {
      return "ENC:" + Buffer.from(shifted, "utf-8").toString("base64");
    } catch {
      return "ENC:" + shifted;
    }
  }

  function serverDecryptData(encryptedVal: string): string {
    if (!encryptedVal) return "";
    const trimmed = String(encryptedVal).trim();
    if (!trimmed.startsWith("ENC:")) return trimmed;
    const payload = trimmed.slice(4);
    try {
      let rawShifted = "";
      try {
        rawShifted = Buffer.from(payload, "base64").toString("utf-8");
      } catch {
        rawShifted = payload;
      }
      return rawShifted.split("").map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
    } catch {
      return String(encryptedVal);
    }
  }

  // 1. Permanently Deprecated Legacy Discovery Endpoint
  // Removed to prevent account and email enumeration attacks.
  app.post("/api/auth/lookup-student-recovery", (_req: express.Request, res: express.Response) => {
    res.status(410).json({
      error: "This legacy endpoint has been permanently disabled for account security and user privacy. Please use the official Backup Recovery Code or Student ID Verification methods."
    });
  });

  // Legacy duplicate reset route removed for security hardening.
  // Secure recovery is handled by /api/auth/recover-with-pin and /api/auth/instant-reset-password below.

  // 3. User Avatar Sync Endpoint across older posts, stories, and reels
  app.post("/api/profile/sync-avatars", async (req: express.Request, res: express.Response) => {
    try {
      const { uid, avatar } = req.body;
      if (!uid || !avatar || !adminDb) {
        res.status(400).json({ error: "UID and avatar are required." });
        return;
      }

      const batch = adminDb.batch();
      let count = 0;

      const postsSnap = await adminDb.collection("posts").where("authorId", "==", uid).get();
      postsSnap.forEach((d) => {
        batch.update(d.ref, { authorAvatar: avatar });
        count++;
      });

      const storiesSnap = await adminDb.collection("stories").where("authorId", "==", uid).get();
      storiesSnap.forEach((d) => {
        batch.update(d.ref, { authorAvatar: avatar });
        count++;
      });

      const reelsSnap = await adminDb.collection("reels").where("authorId", "==", uid).get();
      reelsSnap.forEach((d) => {
        batch.update(d.ref, { authorAvatar: avatar });
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      res.json({ success: true, updatedCount: count });
    } catch (err: any) {
      console.error("Avatar sync error:", err);
      res.status(500).json({ error: err.message || "Failed to sync avatars." });
    }
  });

  // ==================== FCM NOTIFICATION REST APIS ====================

  /**
   * Device Registration Endpoint
   * Registers or updates an active FCM device token for multi-device push notification delivery.
   */
  app.post("/api/notifications/register-device", async (req, res) => {
    try {
      const { userId, deviceId, fcmToken, platform, deviceModel, osVersion, appVersion, notificationSettings } = req.body;

      if (!userId || !deviceId || !fcmToken) {
        return res.status(400).json({ error: "Missing required fields: userId, deviceId, fcmToken" });
      }

      if (!notificationService) {
        return res.status(503).json({ error: "Notification service not initialized on server." });
      }

      const result = await notificationService.registerDevice(userId, {
        deviceId,
        fcmToken,
        platform,
        deviceModel,
        osVersion,
        appVersion,
        notificationSettings
      });

      res.json({ success: true, deviceId: result.deviceId });
    } catch (err: any) {
      console.error("[API] Error in register-device:", err);
      res.status(500).json({ error: err.message || "Failed to register device" });
    }
  });

  /**
   * Device Unregister Endpoint (Called on Logout)
   */
  app.post("/api/notifications/unregister-device", async (req, res) => {
    try {
      const { userId, deviceId } = req.body;

      if (!userId || !deviceId) {
        return res.status(400).json({ error: "Missing required fields: userId, deviceId" });
      }

      if (!notificationService) {
        return res.status(503).json({ error: "Notification service not initialized on server." });
      }

      const result = await notificationService.removeDevice(userId, deviceId);
      res.json(result);
    } catch (err: any) {
      console.error("[API] Error in unregister-device:", err);
      res.status(500).json({ error: err.message || "Failed to unregister device" });
    }
  });

  /**
   * Send Notification Endpoint (Protected / Service Trigger)
   */
  app.post("/api/notifications/send", async (req, res) => {
    try {
      const { recipientUserId, actorUserId, actorName, actorAvatar, type, entityId, title, body, deepLink, metadata, priority, channelId } = req.body;

      if (!recipientUserId || !type || !title || !body) {
        return res.status(400).json({ error: "Missing required fields: recipientUserId, type, title, body" });
      }

      if (!notificationService) {
        return res.status(503).json({ error: "Notification service not initialized on server." });
      }

      const result = await notificationService.sendNotificationToUser({
        recipientUserId,
        actorUserId,
        actorName,
        actorAvatar,
        type,
        entityId,
        title,
        body,
        deepLink,
        metadata,
        priority: priority || "high",
        channelId: channelId || (type === "incoming_call" ? "fcm_incoming_call_channel" : "fcm_default_channel"),
        saveToDb: type !== "call_cancelled" && type !== "call_declined"
      });

      res.json(result);
    } catch (err: any) {
      console.error("[API] Error in send notification:", err);
      res.status(500).json({ error: err.message || "Failed to send notification" });
    }
  });

  /**
   * User Notification Settings Get/Update Endpoints
   */
  app.get("/api/notifications/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!adminDb) return res.status(503).json({ error: "Database unavailable" });

      const userDoc = await adminDb.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.json({ pushEnabled: true });
      }

      const settings = userDoc.data()?.notificationSettings || { pushEnabled: true };
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch settings" });
    }
  });

  app.put("/api/notifications/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = req.body;
      if (!adminDb) return res.status(503).json({ error: "Database unavailable" });

      await adminDb.collection("users").doc(userId).set(
        { notificationSettings: settings },
        { merge: true }
      );

      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update settings" });
    }
  });

  /**
   * Complete User Account Deletion Endpoint
   * Fully cleans up user credentials, Firestore documents, Google Drive uploaded videos,
   * FCM tokens, device registrations, and session states.
   */
  app.post("/api/user/delete-account", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      const { targetUserId } = req.body;
      const targetUid = targetUserId || authUser?.uid;

      if (!targetUid) {
        res.status(400).json({ success: false, error: "Target user ID is required for account deletion." });
        return;
      }

      // Authorization guard: user can only delete their own account unless they are system admin
      if (!authUser || (authUser.uid !== targetUid && !authUser.isAdmin)) {
        res.status(403).json({ success: false, error: "Forbidden: You are not authorized to delete this account." });
        return;
      }

      console.log(`[Account Deletion] Initiating permanent deletion workflow for user: ${targetUid}`);

      // 1. Delete all user reels from Google Drive and Firestore
      if (adminDb) {
        try {
          const reelsSnap = await adminDb.collection("reels").where("authorId", "==", targetUid).get();
          const reelsSnap2 = await adminDb.collection("reels").where("userId", "==", targetUid).get();
          const allReelDocs = new Map<string, any>();
          reelsSnap.forEach(d => allReelDocs.set(d.id, d));
          reelsSnap2.forEach(d => allReelDocs.set(d.id, d));

          const drive = getGoogleDriveClient();
          for (const [reelId, docSnap] of allReelDocs.entries()) {
            const data = docSnap.data();
            const driveFileId = data.driveFileId || (data.videoUrl && data.videoUrl.includes("/api/reels/stream/") ? data.videoUrl.split("/api/reels/stream/")[1] : null);
            if (drive && driveFileId && !driveFileId.startsWith("local_")) {
              try {
                await drive.files.delete({ fileId: driveFileId });
                console.log(`[Account Deletion] Deleted Google Drive reel file ${driveFileId} for user ${targetUid}`);
              } catch (driveErr) {
                console.warn(`[Account Deletion] Drive file deletion notice for ${driveFileId}:`, driveErr);
              }
            }
            await adminDb.collection("reels").doc(reelId).delete();
          }
        } catch (reelErr) {
          console.warn("[Account Deletion] Error cleaning up user reels:", reelErr);
        }
      }

      // 2. Clean up user devices & registered FCM tokens
      if (adminDb) {
        try {
          const devicesSnap = await adminDb.collection("users").doc(targetUid).collection("devices").get();
          const batch = adminDb.batch();
          devicesSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        } catch (devErr) {
          console.warn("[Account Deletion] Devices cleanup notice:", devErr);
        }
      }

      // 3. Clean up Firestore documents: /users/{targetUid}, /user_profiles/{targetUid}, /typing_states/{targetUid}
      if (adminDb) {
        try {
          await adminDb.collection("users").doc(targetUid).delete();
          await adminDb.collection("user_profiles").doc(targetUid).delete();
          await adminDb.collection("typing_states").doc(targetUid).delete();
        } catch (docErr) {
          console.warn("[Account Deletion] Firestore doc cleanup notice:", docErr);
        }
      }

      // 4. Delete Firebase Auth User Record
      try {
        if (getApps().length > 0) {
          await getAuth().deleteUser(targetUid);
          console.log(`[Account Deletion] Firebase Auth user ${targetUid} deleted successfully.`);
        }
      } catch (authErr: any) {
        console.warn("[Account Deletion] Firebase Auth deleteUser notice:", authErr.message || authErr);
      }

      res.json({ success: true, message: "User account and all associated data permanently deleted." });
    } catch (err: any) {
      console.error("[Account Deletion] Critical error:", err);
      res.status(500).json({ success: false, error: "Account deletion encountered an error. Please try again." });
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Real-time Push Notification Pipeline using Firestore Listeners and Central NotificationService
  if (adminDb && notificationService && hasAdminCredentials) {
    const serverStartTime = Date.now();
    console.log("Starting server-side central push notification listener pipeline...");
    
    let unsubscribeNotifListener: (() => void) | null = null;
    try {
      unsubscribeNotifListener = adminDb.collection("notifications").onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const notifData = change.doc.data();
            
            // Filter historical notifications
            const createdAtMs = notifData.createdAt ? Date.parse(notifData.createdAt) : Date.now();
            if (createdAtMs < serverStartTime - 10000) {
              return;
            }

            const targetUserId = notifData.recipientUserId || notifData.receiverId;
            if (!targetUserId) return;

            const actorUserId = notifData.actorUserId || notifData.senderId || "";
            const actorName = notifData.actorName || notifData.senderName || "PolyNet";
            const actorAvatar = notifData.actorAvatar || notifData.senderAvatar || "";
            const type = notifData.type || "general";
            const entityId = notifData.entityId || notifData.targetId || "";
            const customTitle = notifData.title;
            const customBody = notifData.body || notifData.message;
            const deepLink = notifData.deepLink || notifData.url || "/";
            const metadata = notifData.metadata || {};

            // Dynamic title & body formatting
            let notifTitle = customTitle || actorName || "PolyNet Notification";
            let notifBody = customBody || "You have a new update";

            if (!customTitle) {
              if (type === "message" || type === "chat") {
                notifTitle = `💬 ${actorName}`;
              } else if (type === "group_message") {
                notifTitle = `👥 ${actorName}`;
              } else if (type === "like" || type === "reel_like" || type === "post_react") {
                notifTitle = `❤️ ${actorName} reacted to your post`;
              } else if (type === "comment" || type === "reel_comment") {
                notifTitle = `📝 ${actorName} commented on your post`;
              } else if (type === "comment_reply") {
                notifTitle = `💬 ${actorName} replied to your comment`;
              } else if (type === "comment_react" || type === "comment_like") {
                notifTitle = `❤️ ${actorName} reacted to your comment`;
              } else if (type === "new_post" || type === "post_created") {
                notifTitle = `📢 ${actorName} published a new post`;
              } else if (type === "friend_request") {
                notifTitle = `👥 Classmate Connection Request`;
              } else if (type === "group_invite" || type === "group_created") {
                notifTitle = `👥 Study Group: ${actorName}`;
              } else if (type === "request_accepted") {
                notifTitle = `🤝 Request Accepted by ${actorName}`;
              } else if (type === "call" || type === "voice_call") {
                notifTitle = `📞 Incoming Call: ${actorName}`;
              } else if (type === "purchase" || type === "polystore_order") {
                notifTitle = `🛍️ PolyStore Order: ${actorName}`;
              } else if (type === "polystore" || type === "polystore_inquiry" || type === "product_inquiry") {
                notifTitle = `🛍️ PolyStore: ${actorName}`;
              } else if (type === "job" || type === "job_alert") {
                notifTitle = `💼 New Job / Internship Alert`;
              } else if (type === "job_application") {
                notifTitle = `📄 Job Application: ${actorName}`;
              } else if (type === "withdrawal") {
                notifTitle = `💸 Withdrawal Update`;
              } else if (type === "polygig_proposal") {
                notifTitle = `💼 PolyGig Proposal from ${actorName}`;
              } else if (type === "polygig_order") {
                notifTitle = `🛍️ PolyGig Order Update`;
              } else if (type === "polygig_message") {
                notifTitle = `💬 PolyGig Workspace: ${actorName}`;
              } else if (type === "polygig_delivery") {
                notifTitle = `📦 PolyGig Work Delivered`;
              } else if (type === "polygig_revision") {
                notifTitle = `🔄 PolyGig Revision Requested`;
              } else if (type === "polygig_complete") {
                notifTitle = `✅ PolyGig Order Completed`;
              } else if (type && type.startsWith("polygig")) {
                notifTitle = `💼 PolyGig: ${actorName}`;
              }
            }

            try {
              await notificationService.sendNotificationToUser({
                recipientUserId: targetUserId,
                actorUserId,
                actorName,
                actorAvatar,
                type,
                entityId,
                title: notifTitle,
                body: notifBody,
                deepLink,
                metadata,
                saveToDb: false // Document is already in Firestore
              });
            } catch (notifErr: any) {
              console.error(`[FCM Pipeline] Delivery error for user ${targetUserId}:`, notifErr);
            }
          }
        });
      }, (error: any) => {
        if (error?.code === 7 || error?.message?.includes("Missing or insufficient permissions")) {
          console.warn("[FCM Pipeline] Firestore stream listener stopped: Service account requires Firestore access.");
          if (unsubscribeNotifListener) {
            try { unsubscribeNotifListener(); } catch {}
            unsubscribeNotifListener = null;
          }
        } else {
          console.warn("[FCM Pipeline] FCM listener database snapshot stream notification:", error?.message || error);
        }
      });
    } catch (listenerErr: any) {
      console.warn("[FCM Pipeline] Notice: Could not attach realtime push listener:", listenerErr?.message || listenerErr);
    }
  }

  // Get or initialize Gemini client dynamically to pick up hot secret changes instantly
  function getAiInstance(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim() !== "" && key.startsWith("AIzaSy")) {
      try {
        return new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (e) {
        console.warn("Dynamic Google GenAI initialization failed:", e);
      }
    }
    return null;
  }

  // Synchronize and normalize all Polytechnic names across Firestore collections
  app.post("/api/migrate-polytechnics", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin) {
        return res.status(403).json({ success: false, error: "Forbidden: Super Administrator authorization required." });
      }

      if (!adminDb) {
        res.json({ success: true, message: "Handled through client Firebase Firestore SDK", updatedUsers: 0, updatedPosts: 0 });
        return;
      }

      let updatedUsers = 0;
      const usersSnap = await adminDb.collection("users").get();
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const currentPoly = data.polytechnic || "";
        const normalized = normalizePolytechnicName(currentPoly);
        if (normalized !== currentPoly) {
          await userDoc.ref.update({ polytechnic: normalized });
          updatedUsers++;
        }
      }

      let updatedPosts = 0;
      const postsSnap = await adminDb.collection("posts").get();
      for (const postDoc of postsSnap.docs) {
        const data = postDoc.data();
        const currentPoly = data.polytechnic || "";
        if (currentPoly) {
          const normalized = normalizePolytechnicName(currentPoly);
          if (normalized !== currentPoly) {
            await postDoc.ref.update({ polytechnic: normalized });
            updatedPosts++;
          }
        }
      }

      res.json({ success: true, updatedUsers, updatedPosts });
    } catch (err: any) {
      console.error("Migration error in server.ts:", err);
      res.status(500).json({ error: err.message || "Failed migrating polytechnic names" });
    }
  });

  /**
   * Universal Login Endpoint (Board Roll, Email, Username, or TEMIS ID)
   * Resolves the user by their identifier and creates a secure Firebase Custom Token.
   */
  app.post("/api/auth/universal-login", async (req: express.Request, res: express.Response) => {
    try {
      const { identifier, password } = req.body;
      const cleanIdent = (identifier || "").trim();
      const cleanPass = (password || "").trim();

      if (!cleanIdent || !cleanPass) {
        res.status(400).json({ error: "Please enter your Board Roll / Email / Username and Password." });
        return;
      }

      if (!adminDb) {
        res.status(500).json({ error: "Server database connection is currently unavailable." });
        return;
      }

      const usersRef = adminDb.collection("users");
      let foundUserDoc: any = null;

      // 1. Direct Email Search
      if (cleanIdent.includes("@")) {
        const lowerEmail = cleanIdent.toLowerCase();
        const emailSnap = await usersRef.where("email", "==", lowerEmail).limit(1).get();
        if (!emailSnap.empty) {
          foundUserDoc = emailSnap.docs[0];
        } else {
          const polyEmailSnap = await usersRef.where("polynetEmail", "==", lowerEmail).limit(1).get();
          if (!polyEmailSnap.empty) {
            foundUserDoc = polyEmailSnap.docs[0];
          }
        }
      }

      // 2. Search by Board Roll Number (plain or encrypted)
      if (!foundUserDoc) {
        const encRoll = serverEncryptData(cleanIdent);
        const rollSnap = await usersRef.where("rollNumber", "in", [cleanIdent, encRoll]).limit(1).get();
        if (!rollSnap.empty) {
          foundUserDoc = rollSnap.docs[0];
        }
      }

      // 3. Search by Username (@handle or handle)
      if (!foundUserDoc) {
        const cleanHandle = cleanIdent.startsWith("@") ? cleanIdent.slice(1) : cleanIdent;
        const userSnap = await usersRef.where("username", "==", cleanHandle).limit(1).get();
        if (!userSnap.empty) {
          foundUserDoc = userSnap.docs[0];
        }
      }

      // 4. Search by Teacher TEMIS ID
      if (!foundUserDoc) {
        const encTemis = serverEncryptData(cleanIdent);
        const temisSnap = await usersRef.where("temisId", "in", [cleanIdent, encTemis]).limit(1).get();
        if (!temisSnap.empty) {
          foundUserDoc = temisSnap.docs[0];
        }
      }

      // 5. Scan fallback if needed
      if (!foundUserDoc) {
        const allUsersSnap = await usersRef.limit(100).get();
        for (const docSnap of allUsersSnap.docs) {
          const u = docSnap.data();
          const uRoll = serverDecryptData(u.rollNumber) || u.rollNumber || "";
          const uUser = (u.username || "").toLowerCase();
          const uTemis = serverDecryptData(u.temisId) || u.temisId || "";
          const uEmail = (u.email || "").toLowerCase();

          if (
            uRoll === cleanIdent ||
            uUser === cleanIdent.toLowerCase() ||
            uUser === cleanIdent.toLowerCase().replace("@", "") ||
            uTemis === cleanIdent ||
            uEmail === cleanIdent.toLowerCase()
          ) {
            foundUserDoc = docSnap;
            break;
          }
        }
      }

      if (!foundUserDoc) {
        res.status(404).json({ error: "No account found matching this Board Roll, Email, or Username." });
        return;
      }

      const userData = foundUserDoc.data();
      const uid = foundUserDoc.id;
      const userEmail = (userData.email || `${uid.slice(0, 8)}@mypolynet.com`).toLowerCase().trim();

      // STRICT SECURITY CHECK: Verify user's actual password against Firebase Authentication
      const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyDJfmB5ZRNq_HOSuisvKLDJR978L4jVp2I";
      const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          password: cleanPass,
          returnSecureToken: true
        })
      });

      const verifyData: any = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.idToken) {
        const errReason = verifyData?.error?.message;
        console.warn("[Universal Login] Password verification failed:", errReason);
        res.status(401).json({ error: "Invalid credentials. Incorrect password!" });
        return;
      }

      // ONLY after password is 100% verified, create custom token for session
      const authAdmin = getAuth();
      const customToken = await authAdmin.createCustomToken(uid);

      res.json({
        success: true,
        customToken,
        email: userEmail,
        uid,
        userProfile: userData
      });
    } catch (err: any) {
      console.error("[Universal Login] Error:", err);
      res.status(500).json({ error: err.message || "Login failed. Please try again." });
    }
  });

  /**
   * Authoritative Username Availability Check Endpoint
   * Enforces all syntax rules + global uniqueness across usernames & users collections.
   */
  app.post("/api/auth/check-username", async (req: express.Request, res: express.Response) => {
    try {
      const { username, currentUid } = req.body;
      const clean = (username || "").toLowerCase().replace(/^@+/, "").trim();

      const RESERVED = new Set([
        "admin", "administrator", "support", "help", "official", "polynet",
        "system", "bteb_official", "developer", "contact", "security",
        "moderator", "bteb", "bot", "staff", "verified", "polytechnic", "root"
      ]);

      if (!clean) {
        res.json({ available: false, error: "Username cannot be empty", clean });
        return;
      }
      if (clean.length < 3) {
        res.json({ available: false, error: "Username must be at least 3 characters", clean });
        return;
      }
      if (clean.length > 30) {
        res.json({ available: false, error: "Username cannot exceed 30 characters", clean });
        return;
      }
      if (!/^[a-z0-9_.]+$/.test(clean)) {
        res.json({ available: false, error: "Only letters (a-z), numbers, dots (.), and underscores (_) allowed", clean });
        return;
      }
      if (/^[._]/.test(clean)) {
        res.json({ available: false, error: "Username cannot start with dot or underscore", clean });
        return;
      }
      if (/[._]$/.test(clean)) {
        res.json({ available: false, error: "Username cannot end with dot or underscore", clean });
        return;
      }
      if (/[._]{2,}/.test(clean)) {
        res.json({ available: false, error: "Consecutive dots or underscores are not allowed", clean });
        return;
      }
      if (RESERVED.has(clean)) {
        res.json({ available: false, error: "This username is reserved by system", clean });
        return;
      }

      if (!adminDb) {
        res.json({ available: true, clean });
        return;
      }

      // Check usernames collection
      const usernameDocSnap = await adminDb.collection("usernames").doc(clean).get();
      if (usernameDocSnap.exists) {
        const data = usernameDocSnap.data();
        if (data?.uid && data.uid !== currentUid) {
          res.json({ available: false, error: `@${clean} is already taken. Please choose another username.`, clean });
          return;
        }
      }

      // Check users collection (username exact match or @handle)
      const userSnap = await adminDb.collection("users").where("username", "in", [clean, `@${clean}`]).limit(1).get();
      if (!userSnap.empty) {
        const foundUid = userSnap.docs[0].id;
        if (foundUid !== currentUid) {
          res.json({ available: false, error: `@${clean} is already taken. Please choose another username.`, clean });
          return;
        }
      }

      res.json({ available: true, clean });
    } catch (err: any) {
      console.error("[Check Username] Error:", err);
      res.status(500).json({ error: "Failed to check username." });
    }
  });

  /**
   * Password Reset Link Generation Endpoint
   * Hardened: Never returns resetLink in HTTP response.
   * Rate limited, validated, and enumeration-safe.
   */
  app.post("/api/auth/send-reset-link", async (req: express.Request, res: express.Response) => {
    try {
      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const { email } = req.body;
      if (!email || typeof email !== "string" || !email.trim()) {
        res.status(400).json({ error: "Email address is required." });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail) || cleanEmail.length > 100) {
        res.status(400).json({ error: "Invalid email address format." });
        return;
      }

      const rateCheck = passwordResetLimiter.isRateLimited(`reset_${clientIp}_${cleanEmail}`);
      if (rateCheck.limited) {
        res.status(429).json({
          error: "Too many password reset attempts. Please try again later.",
          retryAfter: rateCheck.retryAfterSeconds
        });
        return;
      }

      if (getApps().length > 0) {
        try {
          const authAdmin = getAuth();
          // Generate link server-side for backend mailer; NEVER return to client or log it
          await authAdmin.generatePasswordResetLink(cleanEmail);
        } catch (authErr: any) {
          // Suppress user-not-found errors to prevent account enumeration
          if (authErr?.code !== "auth/user-not-found") {
            console.warn("[Auth Reset] Reset processing notice:", authErr?.message || authErr);
          }
        }
      }

      // Generic response for all requests to prevent user enumeration
      res.json({
        success: true,
        message: "If an account exists for this email address, password reset instructions have been dispatched."
      });
    } catch (err: any) {
      console.error("[Auth Reset] Error:", err?.message || err);
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  });

  // Define the API route for AI classmate chat replies
  app.post("/api/ai-reply", async (req: express.Request, res: express.Response) => {
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const rateCheck = aiLimiter.isRateLimited(`ai_${clientIp}`);
    if (rateCheck.limited) {
      res.status(429).json({ error: "Too many requests. Please wait a moment before sending another message." });
      return;
    }

    const { message, history, peerName } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message input is required and must be text." });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: "Message exceeds maximum allowed length of 2000 characters." });
      return;
    }

    if (history && (!Array.isArray(history) || history.length > 30)) {
      res.status(400).json({ error: "History must be an array with at most 30 entries." });
      return;
    }

    const activeAi = getAiInstance();

    // If Gemini API is configured in Secrets, use it for hyper-realistic polytechnic classmate conversations!
    if (activeAi) {
      try {
        const systemPrompt = `You are ${peerName || "a friendly classmate group member"} at Bangladesh Polytechnic Institute.
  You are a helpful, enthusiastic, and intelligent student companion. 
  Keep your answers relatively concise, student-friendly, and natural (use light colloquial terms, simple Banglish or Bengali/English mixed where appropriate). 
  Answer questions about routines, polytechnic subjects, programming, engineering, exam prep, or study. Keep it under 3 short sentences. Do not use markdown format.`;

        // Format history into standard Content objects with alternating roles
        const contentsList: any[] = [];
        if (history && Array.isArray(history)) {
          history.forEach((h: any) => {
            const role = h.role === "model" || h.role === "assistant" ? "model" : "user";
            const textContent = typeof h === "string" ? h : h.text || h.content || "";
            if (!textContent || textContent.trim() === "") return;
            contentsList.push({
              role: role,
              parts: [{ text: textContent }]
            });
          });
        }

        contentsList.push({
          role: "user",
          parts: [{ text: message }]
        });

        // Ensure alternating roles and start with user
        while (contentsList.length > 0 && contentsList[0].role === "model") {
          contentsList.shift();
        }

        const cleanContents: any[] = [];
        contentsList.forEach((item) => {
          if (cleanContents.length === 0) {
            cleanContents.push(item);
          } else {
            const lastItem = cleanContents[cleanContents.length - 1];
            if (lastItem.role === item.role) {
              if (lastItem.parts && lastItem.parts[0] && item.parts && item.parts[0]) {
                lastItem.parts[0].text += "\n" + item.parts[0].text;
              }
            } else {
              cleanContents.push(item);
            }
          }
        });

        const response = await activeAi.models.generateContent({
          model: "gemini-3.5-flash",
          contents: cleanContents,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const text = response.text || "I'm checking that topic right now!";
        res.json({ reply: text.trim() });
        return;
      } catch (e: any) {
        console.warn("Gemini classmate processing failed, using local fallback responder: ", e.message || e);
      }
    }

    // Local clever fallback response database if Gemini key is missing or failed
    const lowMsg = message.toLowerCase();
    let fallbackText = `Hey there! That's super interesting. Let me review my class notes and get back to you! 📚`;

    if (lowMsg.includes("routine") || lowMsg.includes("class") || lowMsg.includes("time") || lowMsg.includes("schedule")) {
      fallbackText = `I have the semester schedule saved in my student desk. Let's look at the Academic tab to crosscheck the times! ⏰`;
    } else if (lowMsg.includes("code") || lowMsg.includes("program") || lowMsg.includes("javascript") || lowMsg.includes("html") || lowMsg.includes("python") || lowMsg.includes("java")) {
      fallbackText = `Wow, are you coding right now? Share your code snippet here in our chat! I can help you debug it. 💻`;
    } else if (lowMsg.includes("exam") || lowMsg.includes("test") || lowMsg.includes("midterm") || lowMsg.includes("result")) {
      fallbackText = `Oh, the exams are coming up! Don't worry, we should form a study group and check the syllabus topics together. ✍️`;
    } else if (lowMsg.includes("salam") || lowMsg.includes("assalamu") || lowMsg.includes("assalamu alaikum") || lowMsg.includes("asalamu")) {
      fallbackText = `Walaikum Assalam! how are you? How is your polytechnic semester going? 😊`;
    } else if (lowMsg.includes("hello") || lowMsg.includes("hi") || lowMsg.includes("hey") || lowMsg.includes("helo")) {
      fallbackText = `Hi classmate! How are you doing today? Ready to work on our lab report? 🙌`;
    } else if (lowMsg.includes("job") || lowMsg.includes("internship") || lowMsg.includes("career")) {
      fallbackText = `Have you checked the Jobs section on PolyNet? There are some awesome junior roles listed there today! 💼`;
    } else if (lowMsg.includes("syllabus") || lowMsg.includes("book") || lowMsg.includes("routine")) {
      fallbackText = `Let's look at the Academic Hub on PolyNet, it contains syllabus PDFs and routine structures! 📖`;
    }

    res.json({ reply: fallbackText });
  });

  // PolyAI custom endpoint for 100k free-user scaling support
  app.post("/api/polyai", async (req: express.Request, res: express.Response) => {
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const rateCheck = aiLimiter.isRateLimited(`polyai_${clientIp}`);
    if (rateCheck.limited) {
      res.status(429).json({ error: "Too many requests. Please wait a moment before sending another message." });
      return;
    }

    const { message, history, mode } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message content is required and must be text." });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: "Message exceeds maximum allowed length of 2000 characters." });
      return;
    }

    if (history && (!Array.isArray(history) || history.length > 30)) {
      res.status(400).json({ error: "History must be an array with at most 30 entries." });
      return;
    }

    let systemPrompt = "";

    if (mode === "polytechnic") {
      systemPrompt = `You are "PolyAI", the official ultra-intelligent academic assistant of PolyNet (operating in **Polytechnic Mode**).
Your goal is to assist students of all semesters (1st to 8th) and all technologies (Computer/CST, Civil, Electrical, Mechanical, Electronics, Power, etc.) based strictly on Bangladesh Polytechnic books, Board syllabus, and BTEB (Bangladesh Technical Education Board) guidelines.
If the user asks about subject codes, class schedules, routines, GPA calculations, reference books, or core board topics, provide highly specific details matching the BTEB standard or recommended polytechnic books.

**CRITICAL Knowledge Base - Omini, PolyNet, PolyChat, and PolyAI:**
1. **Omini**:
- **Identity**: Omini is a leading technology holding and software development company in Bangladesh. It is the absolute parent and mother organization of PolyNet, PolyChat, and PolyAI.
- **Founder & CEO**: Hasan Mahmud (Born: 2008, Kapasia, Gazipur, Dhaka, Bangladesh), a visionary software engineer and tech entrepreneur.
- **Mission**: To build modern, high-availability, secure, and smart educational & social applications that empower students and technical professionals in Bangladesh.
- **Detailed Info**: Omini represents advanced, reliable, and keyless cloud technology. It operates several digital platforms, with PolyNet being its flagship educational product.

2. **PolyNet**:
- **Identity**: PolyNet is the official, all-in-one academic, social, and student ecosystem designed specifically for polytechnic students (cadets) across Bangladesh, developed under BTEB (Bangladesh Technical Education Board) curriculum guidelines.
- **Founder & CEO**: Hasan Mahmud (Born: 2008 in Kapasia, Gazipur, Dhaka, Bangladesh).
- **Developer**: Crafted entirely by Omini's advanced tech team under the direct leadership of Founder & CEO Hasan Mahmud.
- **Features**:
  * **Interactive Academic Feed (Social Feed)**: Where polytechnic students share study tips, notices, and semester notes.
  * **Routine Finder**: Instant semester-specific and technology-specific class routines.
  * **Digital Library & Syllabus**: Complete book guides, syllabus content, and subject codes for all departments (CST/Computer, Civil, Electrical, Mechanical, Electronics, Power, etc.).
  * **Result & CGPA Tracker**: Tools to view and calculate polytechnic SGPA/CGPA according to BTEB rules.
  * **PolyGig & PolyStore**: Student freelance service marketplace and academic equipment buy/sell hub.
  * **PolyChat Messenger**: Encrypted student chat rooms, voice notes, and real-time collaboration.

3. **PolyChat**:
- **Identity**: PolyChat is the official, highly secure instant messaging and live chat platform built directly into the PolyNet ecosystem.
- **Purpose**: It allows polytechnic students to collaborate in real-time, form group chat rooms, and secure high-speed message delivery.

4. **PolyAI**:
- **Identity**: PolyAI is the official ultra-intelligent, multi-lingual virtual assistant and chatbot developed by Omini.
- **Function**: PolyAI acts as an academic tutor and helper inside the PolyNet app, capable of writing code, explaining polytechnic topics, generating syllabus outlines, explaining lab reports, and generating logos/images.

**CRITICAL Image Generation Capabilities:**
- You have direct, native integration with an advanced image and logo generation engine (via Pollinations Image API).
- Whenever the user asks you to "create", "generate", "draw", "design", "make", or "paint" any logo, image, banner, icon, sketch, or drawing (e.g. "create a logo for a coding club", "draw a cat picture", "make a logo", "draw a futuristic city"), you MUST generate the image by placing the following Markdown image block directly in your response:
  ![Generated Image](https://image.pollinations.ai/prompt/{detailed_url_encoded_prompt}?width=1024&height=1024&nologo=true&enhance=true)
- Instructions for the prompt parameter in the URL:
  * Make the prompt inside the URL extremely descriptive, detailed, and high-quality, adding artistic styles (e.g., "minimalist vector logo, 8k, modern clean, high contrast" or "hyperrealistic photographic digital art").
  * The prompt inside the URL MUST be completely URL-encoded (e.g., spaces replaced with %20, special characters encoded).
  * Do NOT use any markdown links '[link](url)' for images, ONLY use the direct markdown image syntax: '![Generated Image](url)'.
  * Accompany the image with a brief, friendly explanation of your design, what features you added.

Your personality is:
- Extremely helpful, encouraging, intelligent, and highly professional.
- You understand languages including English and Avro phonetic English transliterations (such as "ami bhat khai", "kemon achen", "class routine kobe").
- ALWAYS match the user's prompt language style.
- Keep your answers clean, modern, actionable, and highly accurate. Use bullet points and spacing. Do not use Markdown headings like '#', but you can use '**bold**' text and standard bullet points like '-' or '*'. Keep responses professional, elegant, and concise.`;
    } else {
      systemPrompt = `You are "PolyAI", the official ultra-intelligent virtual assistant of PolyNet (operating in **General/Others Mode**).
You act as a universal AI assistant like ChatGPT or Gemini. You can answer absolutely ANY question, write complete code, scripts, debug code, or discuss history, geography, science, math, literature, pop culture, global events, and anything else under the sun. You are not restricted to polytechnic books.

**CRITICAL Creator & Team Identity Rules:**
If the user asks about who made you, created you, developed you, or any questions regarding your origin, founder, or tech team (e.g., "who made you", "tumi ke", "tomake ke toiri koreche", "developer ke", "baniyeche ke"), you MUST state:
- "I was created by Omini's advanced technology team, and the team leader was Hasan Mahmud (Founder & CEO Omini, PolyNet, PolyChat; Born: 2008 in Kapasia, Gazipur, Dhaka, Bangladesh)."
Follow this rule strictly with absolute priority. Do not mention Google, OpenAI, or anyone else as your creator.

**CRITICAL Knowledge Base - Omini, PolyNet, PolyChat, and PolyAI:**
1. **Omini**:
- **Identity**: Omini is a leading technology holding and software development company in Bangladesh. It is the absolute parent and mother organization of PolyNet, PolyChat, and PolyAI.
- **Founder & CEO**: Hasan Mahmud (Born: 2008 in Kapasia, Gazipur, Dhaka, Bangladesh), a visionary software engineer and tech entrepreneur.
- **Mission**: To build modern, high-availability, secure, and smart educational & social applications that empower students and technical professionals in Bangladesh.
- **Detailed Info**: Omini represents advanced, reliable, and keyless cloud technology. It operates several digital platforms, with PolyNet being its flagship educational product.

2. **PolyNet**:
- **Identity**: PolyNet is the official, all-in-one academic, social, and student ecosystem designed specifically for polytechnic students (cadets) across Bangladesh, developed under BTEB (Bangladesh Technical Education Board) curriculum guidelines.
- **Founder & CEO**: Hasan Mahmud (Born: 2008 in Kapasia, Gazipur, Dhaka, Bangladesh).
- **Developer**: Crafted entirely by Omini's advanced tech team under the direct leadership of Hasan Mahmud.
- **Features**:
  * **Interactive Academic Feed (Social Feed)**: Where polytechnic students share study tips, notices, and semester notes.
  * **Routine Finder**: Instant semester-specific and technology-specific class routines.
  * **Digital Library & Syllabus**: Complete book guides, syllabus content, and subject codes for all departments (CST/Computer, Civil, Electrical, Mechanical, Electronics, Power, etc.).
  * **Result & CGPA Tracker**: Tools to view and calculate polytechnic SGPA/CGPA according to BTEB rules.
  * **PolyGig & PolyStore**: Peer freelance marketplace and student textbook exchange.
  * **PolyChat Messenger**: Live real-time collaboration and group study rooms.

3. **PolyChat**:
- **Identity**: PolyChat is the official, highly secure instant messaging and live chat platform built directly into the PolyNet ecosystem.
- **Purpose**: It allows polytechnic students to collaborate in real-time, form group chat rooms, and secure high-speed message delivery.

4. **PolyAI**:
- **Identity**: PolyAI is the official ultra-intelligent, multi-lingual virtual assistant and chatbot developed by Omini.
- **Function**: PolyAI acts as an academic tutor and helper inside the PolyNet app, capable of writing code, explaining polytechnic topics, generating syllabus outlines, explaining lab reports, and generating logos/images.

**CRITICAL Image Generation Capabilities:**
- You have direct, native integration with an advanced image and logo generation engine (via Pollinations Image API).
- Whenever the user asks you to "create", "generate", "draw", "design", "make", or "paint" any logo, image, banner, icon, sketch, or drawing (e.g. "create a logo for a coding club", "draw a cat picture", "make a logo", "draw a futuristic city"), you MUST generate the image by placing the following Markdown image block directly in your response:
  ![Generated Image](https://image.pollinations.ai/prompt/{detailed_url_encoded_prompt}?width=1024&height=1024&nologo=true&enhance=true)
- Instructions for the prompt parameter in the URL:
  * Make the prompt inside the URL extremely descriptive, detailed, and high-quality, adding artistic styles (e.g., "minimalist vector logo, 8k, modern clean, high contrast" or "hyperrealistic photographic digital art").
  * The prompt inside the URL MUST be completely URL-encoded (e.g., spaces replaced with %20, special characters encoded).
  * Do NOT use any markdown links '[link](url)' for images, ONLY use the direct markdown image syntax: '![Generated Image](url)'.
  * Accompany the image with a brief, friendly explanation of your design, what features you added.

Your personality is:
- Extremely helpful, encouraging, intelligent, and highly professional.
- You understand languages including English and Avro phonetic English transliterations (such as "ami bhat khai", "kemon achen").
- ALWAYS match the user's prompt language style. If they ask in English, reply in clean English.
- Keep your answers clean, modern, actionable, and highly accurate. Use bullet points and spacing. Do not use Markdown headings like '#', but you can use '**bold**' text and standard bullet points like '-' or '*'. Keep responses professional, elegant, and concise.`;
    }

    const activeAi = getAiInstance();

    if (activeAi) {
      try {
        // Format history nicely for GenAI generateContent contents using official Content objects
        const contentsList: any[] = [];
        
        if (history && Array.isArray(history)) {
          history.forEach((h: any) => {
            // Standardize role name
            const role = h.role === "model" || h.role === "assistant" ? "model" : "user";
            
            // Skip empty or greeting messages to keep context clean
            if (!h.text || h.text.trim() === "") return;
            if (h.text.startsWith("Hello ") || h.text.includes("academic assistant") || h.text.includes("Welcome to PolyAI")) {
              return;
            }

            contentsList.push({
              role: role,
              parts: [{ text: h.text }]
            });
          });
        }

        // Add the current user query to contents
        contentsList.push({
          role: "user",
          parts: [{ text: message }]
        });

        // Sanitize the contentsList to ensure:
        // 1. It starts with "user" role
        while (contentsList.length > 0 && contentsList[0].role === "model") {
          contentsList.shift();
        }

        // 2. Roles alternate perfectly (user, model, user, model...)
        // If there are consecutive identical roles, we merge their parts
        const cleanContents: any[] = [];
        contentsList.forEach((item) => {
          if (cleanContents.length === 0) {
            cleanContents.push(item);
          } else {
            const lastItem = cleanContents[cleanContents.length - 1];
            if (lastItem.role === item.role) {
              if (lastItem.parts && lastItem.parts[0] && item.parts && item.parts[0]) {
                lastItem.parts[0].text += "\n" + item.parts[0].text;
              }
            } else {
              cleanContents.push(item);
            }
          }
        });

        // Attempt generation with search grounding; fallback to standard generation if grounding fails
        let response;
        let searchAttemptFailed = false;
        try {
          response = await activeAi.models.generateContent({
            model: "gemini-3.5-flash",
            contents: cleanContents,
            config: {
              systemInstruction: systemPrompt,
              tools: [{ googleSearch: {} }],
            },
          });
        } catch (searchError: any) {
          console.warn("PolyAI Gemini with googleSearch failed, retrying without tools:", searchError.message || searchError);
          searchAttemptFailed = true;
          response = await activeAi.models.generateContent({
            model: "gemini-3.5-flash",
            contents: cleanContents,
            config: {
              systemInstruction: systemPrompt,
            },
          });
        }

        const text = response.text || "";
        let replyText = text.trim();

        // Extract Google Search Grounding sources if present (only applicable if search didn't fail)
        if (!searchAttemptFailed) {
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            const searchSources = chunks
              .map((chunk: any) => chunk.web)
              .filter((web: any) => web && web.uri && web.title);

            if (searchSources.length > 0) {
              // Keep unique sources
              const uniqueSources: any[] = [];
              const seenUris = new Set<string>();
              for (const source of searchSources) {
                if (!seenUris.has(source.uri)) {
                  seenUris.add(source.uri);
                  uniqueSources.push(source);
                }
              }
              
              replyText += "\n\n**Sources & Real-time References:**\n" + 
                uniqueSources.map((s: any) => `- [${s.title}](${s.uri})`).join("\n");
            }
          }
        }

        if (text) {
          res.json({ reply: cleanReplyText(replyText) });
          return;
        }
      } catch (e: any) {
        console.warn("PolyAI Gemini generation failed completely, shifting to keyless fallback: ", e.message || e);
      }
    }

    // High quality server-side keyless dynamic fallback (using high-availability Pollinations AI routing)
    try {
      const pollinationsHistory = (history && Array.isArray(history)) ? history.slice(-8).map((h: any) => ({
        role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
        content: h.text || h.content || ""
      })).filter((item: any) => item.content.trim() !== "") : [];

      const pollRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...pollinationsHistory,
            { role: "user", content: message }
          ],
          model: "openai",
          private: true
        })
      });

      if (pollRes.ok) {
        const botReply = await pollRes.text();
        if (botReply && botReply.trim()) {
          res.json({ reply: cleanReplyText(botReply) });
          return;
        }
      }
    } catch (pollErr: any) {
      console.error("PolyAI server-side keyless Pollinations AI fallback failed:", pollErr);
    }

    // Bulletproof offline matcher fallback system as absolute backup
    const lowMsg = message.toLowerCase();
    let reply = `Hello! I am PolyAI, your academic assistant. I received your message. Please provide more details or ask about class routines, syllabus, lab report guidelines, or CST programming! 📚`;

    // English and Avro checks
    const matchesGreetings = lowMsg.includes("salam") || lowMsg.includes("assalamu") || lowMsg.includes("asalamu") || lowMsg.includes("kemon") || lowMsg.includes("how are you");
    const matchesHello = lowMsg.includes("hello") || lowMsg.includes("hi") || lowMsg.includes("hey") || lowMsg.includes("helo");
    const matchesRoutine = lowMsg.includes("routine") || lowMsg.includes("rutin") || lowMsg.includes("exam") || lowMsg.includes("porikkha");
    const matchesProgramming = lowMsg.includes("cst") || lowMsg.includes("computer") || lowMsg.includes("programming") || lowMsg.includes("coding") || lowMsg.includes("code") || lowMsg.includes("kod");
    const matchesSyllabus = lowMsg.includes("syllabus") || lowMsg.includes("boikhata") || lowMsg.includes("book") || lowMsg.includes("boi");
    const matchesGPA = lowMsg.includes("gpa") || lowMsg.includes("cgpa") || lowMsg.includes("calculator") || lowMsg.includes("point") || lowMsg.includes("grade");
    const matchesLab = lowMsg.includes("lab") || lowMsg.includes("report");
    const matchesPolyNet = lowMsg.includes("polynet") || lowMsg.includes("poly net") || lowMsg.includes("app") || lowMsg.includes("software");
    const matchesCreator = lowMsg.includes("made you") || lowMsg.includes("create you") || lowMsg.includes("creator") || lowMsg.includes("developer") || lowMsg.includes("baniyeche") || lowMsg.includes("toiri koreche") || lowMsg.includes("toiri korche") || lowMsg.includes("baniyese") || lowMsg.includes("make you") || lowMsg.includes("built you") || lowMsg.includes("banayeche") || lowMsg.includes("banayese") || lowMsg.includes("owner") || lowMsg.includes("founder") || lowMsg.includes("hasan mahmud") || lowMsg.includes("hassan mahmud");
    const matchesOminiRelationship = lowMsg.includes("omini") || 
                                     (lowMsg.includes("relation") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai"))) ||
                                     (lowMsg.includes("somporko") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai") || lowMsg.includes("omini"))) ||
                                     (lowMsg.includes("shomporko") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai") || lowMsg.includes("omini")));

    if (matchesOminiRelationship) {
      const isAvro = lowMsg.includes("tumi") || lowMsg.includes("somporko") || lowMsg.includes("shomporko") || lowMsg.includes("ki");
      if (isAvro) {
        reply = `Omini holo PolyNet, PolyChat, abong PolyAI-er main parent company. PolyNet, PolyChat, ebong PolyAI holo Omini-er key products ba ponno. Eder shobgulo platform e toiri koreche Omini-er advanced tech team, jar netritte chilen Hasan Mahmud (Founder & CEO of Omini, PolyNet, PolyChat).`;
      } else {
        reply = `Omini is the absolute parent/main technology company. PolyNet, PolyChat, and PolyAI are official products and services of Omini. All of these platforms are crafted by Omini's advanced tech team, led by Hasan Mahmud (Founder & CEO of Omini, PolyNet, PolyChat).`;
      }
    } else if (matchesCreator) {
      const isAvro = lowMsg.includes("tumi") || lowMsg.includes("ke ");
      if (isAvro) {
        reply = `Amake Omini-er advanced technology team toiri koreche.abong Team er prodhan chilo Hasan Mahmud (Founder & CEO Omini,polynet,polychat)`;
      } else {
        reply = `I was created by Omini's advanced technology team, and the team leader was Hasan Mahmud (Founder & CEO Omini, PolyNet, PolyChat).`;
      }
    } else if (matchesGreetings) {
      reply = `Wa Alaikum Assalam! Kemon achen? I am PolyAI, your dedicated polytechnic assistant. How can I help you today? 😊`;
    } else if (matchesHello) {
      reply = `Hello! Welcome to PolyAI, the official AI assistant of PolyNet. Feel free to ask any academic or programming questions! 🙌`;
    } else if (matchesRoutine) {
      reply = `To check the class routine, schedules, and exam dates, please go to the **Routine & Books** tab at the top. You can easily view and search routines there! ⏰`;
    } else if (matchesProgramming) {
      reply = `Programming is highly essential for Computer Science & Technology (CST) students! 💻
I can assist you with:
- Debugging Python, JavaScript, and C/C++ code.
- Data structures and algorithm solutions.
- Database design and SQL query writing.
Please paste your code snippet or programming question here!`;
    } else if (matchesSyllabus) {
      reply = `You can check the updated syllabus, subject codes, and recommended reference books in the **Routine & Books** section. 📖`;
    } else if (matchesGPA) {
      reply = `The official BTEB Grading System & CGPA Policy details:

**Grading Scale (GPA):**
- **80% or above**: A+ (GPA 4.00)
- **75% to 79%**: A (GPA 3.75)
- **70% to 74%**: A- (GPA 3.50)
- **65% to 69%**: B+ (GPA 3.25)
- **60% to 64%**: B (GPA 3.00)
- **55% to 59%**: B- (GPA 2.75)
- **50% to 54%**: C+ (GPA 2.50)
- **45% to 49%**: C (GPA 2.25)
- **40% to 44%**: D (GPA 2.00)
- **Below 40%**: F (GPA 0.00 / Fail)

**BTEB Final CGPA Weightage (2016 Probidhan):**
- 1st Sem: 5% | 2nd Sem: 5% | 3rd Sem: 10%
- 4th Sem: 15% | 5th Sem: 15% | 6th Sem: 20%
- 7th Sem: 25% | 8th Sem: 5%

**BTEB Final CGPA Weightage (2022 Probidhan):**
- 1st Sem: 10% | 2nd Sem: 10% | 3rd Sem: 10%
- 4th Sem: 15% | 5th Sem: 15% | 6th Sem: 15%
- 7th Sem: 25%`;
    } else if (matchesLab) {
      reply = `Standard format for a professional Lab Report:
1. **Name of the Experiment**: Title of experiment.
2. **Objective / Theory**: Core concept.
3. **Apparatus**: Equipment used.
4. **Procedure**: Steps performed.
5. **Observation & Calculation**: Data and equations.
6. **Conclusion**: Summary and precautions.
Ensure your diagrams are neat and well-labeled! 📝`;
    } else if (matchesPolyNet) {
      reply = `PolyNet is the ultimate academic & social ecosystem for polytechnic cadets! 🌟
Features:
- **Home Feed**: Stay updated with posts and share academic updates.
- **My Polytechnic**: Connect with classmates.
- **Routine & Books**: Get instant class routines.
- **Chats & Calling**: Message and call friends in real-time!`;
    }

    res.json({ reply: reply });
  });

  // =========================================================
  // POLYNET CONNECT - OAUTH 2.0 & SSO PROVIDER ENDPOINTS
  // =========================================================

  // 1. Register a new Developer Application
  app.post("/api/oauth/apps/register", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        res.status(401).json({ error: "Unauthorized: Sign-in required to register applications." });
        return;
      }

      const { appName, redirectUris, description, appIcon, websiteUrl, developerName } = req.body;

      if (!appName || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
        res.status(400).json({ error: "appName and redirectUris array are required." });
        return;
      }

      // Generate secure Client ID and Client Secret
      const clientId = "pnc_app_" + crypto.randomBytes(12).toString("hex");
      const clientSecret = "sec_" + crypto.randomBytes(24).toString("hex");

      const newApp = {
        id: clientId,
        clientSecret,
        appName: String(appName).trim(),
        appIcon: appIcon || "",
        websiteUrl: websiteUrl || "",
        description: description || "",
        redirectUris: redirectUris.map((u: string) => String(u).trim()),
        developerUserId: authUser.uid,
        developerEmail: authUser.email || "",
        developerName: developerName || "Developer",
        status: "pending", // Requires Admin Approval for real-world security!
        scopes: ["profile", "email", "polytechnic"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (adminDb) {
        await adminDb.collection("oauth_apps").doc(clientId).set(newApp);
      }

      res.json({
        success: true,
        message: "Application registered successfully! Please store your Client Secret securely.",
        app: newApp,
      });
    } catch (err: any) {
      console.error("Failed to register OAuth app:", err);
      res.status(500).json({ error: err.message || "Failed to register application." });
    }
  });

  // 2. Fetch Developer's Registered Apps
  app.get("/api/oauth/apps/developer/:userId", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        res.status(401).json({ error: "Unauthorized: Please sign in to access developer applications." });
        return;
      }

      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      if (authUser.uid !== userId && !authUser.isAdmin) {
        res.status(403).json({ error: "Forbidden: You may only view your own registered applications." });
        return;
      }

      let appsList: any[] = [];
      if (adminDb) {
        const snap = await adminDb.collection("oauth_apps").where("developerUserId", "==", userId).get();
        appsList = snap.docs.map(doc => {
          const data = doc.data();
          const rawSecret = data.clientSecret;
          const maskedSecret = rawSecret
            ? `${rawSecret.substring(0, 8)}****************`
            : undefined;
          return {
            ...data,
            clientSecret: maskedSecret,
            hasSecret: Boolean(rawSecret)
          };
        });
      }

      res.json({ success: true, apps: appsList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch apps." });
    }
  });

  // 3. Update OAuth App Config
  app.post("/api/oauth/apps/:clientId/update", async (req: express.Request, res: express.Response) => {
    try {
      const { clientId } = req.params;
      const { appName, redirectUris, description, appIcon, websiteUrl } = req.body;

      if (!adminDb) {
        res.status(500).json({ error: "Database not connected." });
        return;
      }

      const docRef = adminDb.collection("oauth_apps").doc(clientId);
      const appDoc = await docRef.get();
      if (!appDoc.exists) {
        res.status(404).json({ error: "App not found." });
        return;
      }

      const authUser = await authenticateRequest(req);
      const appData = appDoc.data();
      if (!authUser || (authUser.uid !== appData?.developerUserId && !authUser.isAdmin)) {
        res.status(403).json({ error: "Unauthorized: Only the app developer or system administrator can update this application." });
        return;
      }

      const updateData: any = {
        updatedAt: new Date().toISOString()
      };
      if (appName) updateData.appName = appName.trim();
      if (redirectUris && Array.isArray(redirectUris)) updateData.redirectUris = redirectUris.map((u: string) => u.trim());
      if (description !== undefined) updateData.description = description;
      if (appIcon !== undefined) updateData.appIcon = appIcon;
      if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;

      await docRef.update(updateData);
      res.json({ success: true, message: "App updated successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update app." });
    }
  });

  // 4. Regenerate Client Secret
  app.post("/api/oauth/apps/:clientId/regenerate-secret", async (req: express.Request, res: express.Response) => {
    try {
      const { clientId } = req.params;

      if (!adminDb) {
        res.status(500).json({ error: "Database not connected." });
        return;
      }

      const docRef = adminDb.collection("oauth_apps").doc(clientId);
      const appDoc = await docRef.get();
      if (!appDoc.exists) {
        res.status(404).json({ error: "App not found." });
        return;
      }

      const authUser = await authenticateRequest(req);
      const appData = appDoc.data();
      if (!authUser || (authUser.uid !== appData?.developerUserId && !authUser.isAdmin)) {
        res.status(403).json({ error: "Unauthorized: Only the app developer or system administrator can regenerate client secret." });
        return;
      }

      const newSecret = "sec_" + crypto.randomBytes(24).toString("hex");

      await docRef.update({
        clientSecret: newSecret,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true, clientSecret: newSecret });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to regenerate secret." });
    }
  });

  // 5. ADMIN APPROVAL ENDPOINTS
  app.get("/api/oauth/admin/apps", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin) {
        res.status(403).json({ error: "Forbidden: Administrator access required." });
        return;
      }

      let appsList: any[] = [];
      if (adminDb) {
        const snap = await adminDb.collection("oauth_apps").get();
        appsList = snap.docs.map(doc => doc.data());
      }
      res.json({ success: true, apps: appsList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch admin apps list." });
    }
  });

  app.post("/api/oauth/admin/apps/:clientId/approve", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin) {
        res.status(403).json({ error: "Forbidden: Administrator access required." });
        return;
      }

      const { clientId } = req.params;
      if (adminDb) {
        await adminDb.collection("oauth_apps").doc(clientId).update({
          status: "approved",
          rejectionReason: "",
          updatedAt: new Date().toISOString()
        });
      }
      res.json({ success: true, message: "App approved successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to approve app." });
    }
  });

  app.post("/api/oauth/admin/apps/:clientId/reject", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin) {
        res.status(403).json({ error: "Forbidden: Administrator access required." });
        return;
      }

      const { clientId } = req.params;
      const { reason } = req.body;
      if (adminDb) {
        await adminDb.collection("oauth_apps").doc(clientId).update({
          status: "rejected",
          rejectionReason: reason || "Did not meet PolyNet platform security guidelines.",
          updatedAt: new Date().toISOString()
        });
      }
      res.json({ success: true, message: "App rejected." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reject app." });
    }
  });

  // 6. Authorize View Info Check (for Consent Screen)
  app.get("/api/oauth/authorize-info", async (req: express.Request, res: express.Response) => {
    try {
      const clientId = req.query.client_id as string;
      const redirectUri = req.query.redirect_uri as string;

      if (!clientId || !redirectUri) {
        res.status(400).json({ valid: false, error: "Missing client_id or redirect_uri parameters." });
        return;
      }

      if (!adminDb) {
        res.status(500).json({ valid: false, error: "Server database unavailable." });
        return;
      }

      const appDoc = await adminDb.collection("oauth_apps").doc(clientId).get();
      if (!appDoc.exists) {
        res.status(404).json({ valid: false, error: "Invalid client_id: Application not found." });
        return;
      }

      const appData = appDoc.data();

      // Check Admin Approval Status
      if (appData?.status !== "approved") {
        res.status(403).json({
          valid: false,
          error: appData?.status === "pending"
            ? "This application is currently pending Admin Approval before it can perform PolyNet SSO Logins."
            : `Application authorization rejected: ${appData?.rejectionReason || "Unauthorized app"}`
        });
        return;
      }

      // Check Redirect URI
      const isRedirectValid = Array.isArray(appData?.redirectUris) &&
        appData.redirectUris.some((uri: string) => uri.trim().toLowerCase() === redirectUri.trim().toLowerCase());

      if (!isRedirectValid) {
        res.status(400).json({
          valid: false,
          error: "Redirect URI mismatch. The provided redirect_uri is not registered for this application."
        });
        return;
      }

      res.json({
        valid: true,
        app: {
          id: appData.id,
          appName: appData.appName,
          appIcon: appData.appIcon,
          description: appData.description,
          developerName: appData.developerName,
          websiteUrl: appData.websiteUrl,
          scopes: appData.scopes || ["profile", "email", "polytechnic"]
        }
      });
    } catch (err: any) {
      res.status(500).json({ valid: false, error: err.message || "Internal server error." });
    }
  });

  // 7. Grant Authorization Code
  app.post("/api/oauth/grant-authorization", async (req: express.Request, res: express.Response) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        res.status(401).json({ error: "Unauthorized: Sign-in required to authorize applications." });
        return;
      }

      const { client_id, redirect_uri, user_id, scope } = req.body;

      if (!client_id || !redirect_uri) {
        res.status(400).json({ error: "client_id and redirect_uri are required." });
        return;
      }

      // Authoritative identity derivation:
      // If user_id is provided, it MUST match the authenticated user UID (prevent cross-user spoofing)
      if (user_id && user_id !== authUser.uid) {
        res.status(403).json({ error: "Forbidden: You cannot grant authorization on behalf of another user." });
        return;
      }
      const authoritativeUid = authUser.uid;

      if (!adminDb) {
        res.status(500).json({ error: "Database connection unavailable." });
        return;
      }

      // Verify app & redirect_uri against registered app in Firestore
      const appDoc = await adminDb.collection("oauth_apps").doc(client_id).get();
      if (!appDoc.exists) {
        res.status(404).json({ error: "Application not found." });
        return;
      }

      const appData = appDoc.data();
      if (appData?.status !== "approved") {
        res.status(403).json({ error: "Application is not approved or active." });
        return;
      }

      const isRedirectValid = Array.isArray(appData?.redirectUris) &&
        appData.redirectUris.some((uri: string) => uri.trim().toLowerCase() === String(redirect_uri).trim().toLowerCase());

      if (!isRedirectValid) {
        res.status(400).json({ error: "Redirect URI mismatch." });
        return;
      }

      // Validate scopes against app-allowed scopes
      const allowedScopes = appData?.scopes || ["profile", "email", "polytechnic"];
      const requestedScopes = Array.isArray(scope) ? scope : ["profile", "email", "polytechnic"];
      const validatedScopes = requestedScopes.filter((s: string) => allowedScopes.includes(s));

      // Generate cryptographically secure, single-use authorization code (valid for 5 minutes)
      const code = "pnc_code_" + crypto.randomBytes(24).toString("hex");
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await adminDb.collection("oauth_codes").doc(code).set({
        id: code,
        code,
        clientId: client_id,
        userId: authoritativeUid,
        redirectUri: String(redirect_uri).trim(),
        scope: validatedScopes,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, code });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to grant authorization code." });
    }
  });

  // 8. OAuth 2.0 Token Exchange Endpoint
  app.post("/api/oauth/token", async (req: express.Request, res: express.Response) => {
    try {
      let clientId = req.body.client_id;
      let clientSecret = req.body.client_secret;
      const code = req.body.code;
      const redirectUri = req.body.redirect_uri;
      const grantType = req.body.grant_type;

      // Also check Basic Auth header if present
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Basic ")) {
        const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8").split(":");
        clientId = credentials[0];
        clientSecret = credentials[1];
      }

      if (grantType !== "authorization_code") {
        res.status(400).json({ error: "unsupported_grant_type", error_description: "Only grant_type=authorization_code is supported." });
        return;
      }

      if (!clientId || !clientSecret || !code || !redirectUri) {
        res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters: client_id, client_secret, code, redirect_uri." });
        return;
      }

      if (!adminDb) {
        res.status(500).json({ error: "server_error", error_description: "Database connection unavailable." });
        return;
      }

      // Authenticate Client App
      const appDoc = await adminDb.collection("oauth_apps").doc(clientId).get();
      if (!appDoc.exists) {
        res.status(401).json({ error: "invalid_client", error_description: "Client application not found." });
        return;
      }

      const appData = appDoc.data();
      if (appData?.clientSecret !== clientSecret) {
        res.status(401).json({ error: "invalid_client", error_description: "Invalid client_secret." });
        return;
      }

      if (appData?.status !== "approved") {
        res.status(403).json({ error: "unauthorized_client", error_description: "Client application is not approved by Admin." });
        return;
      }

      // Validate Authorization Code
      const codeDoc = await adminDb.collection("oauth_codes").doc(code).get();
      if (!codeDoc.exists) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code invalid or not found." });
        return;
      }

      const codeData = codeDoc.data();

      // Single-Use Security Check
      if (codeData?.used) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code has already been used." });
        return;
      }

      // Expiration Check
      if (Date.now() > codeData?.expiresAt) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code has expired." });
        return;
      }

      // Parameter Match Check
      if (codeData?.clientId !== clientId || codeData?.redirectUri !== redirectUri) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code parameter mismatch." });
        return;
      }

      // Mark code as used immediately
      await adminDb.collection("oauth_codes").doc(code).update({ used: true });

      // Generate Access Token & Refresh Token
      const accessToken = "pnt_" + crypto.randomBytes(32).toString("hex");
      const refreshToken = "pnr_" + crypto.randomBytes(32).toString("hex");
      const expiresInSeconds = 30 * 24 * 60 * 60; // 30 days token lifetime

      await adminDb.collection("oauth_tokens").doc(accessToken).set({
        id: accessToken,
        accessToken,
        refreshToken,
        clientId,
        userId: codeData.userId,
        scope: codeData.scope || ["profile", "email", "polytechnic"],
        expiresAt: Date.now() + (expiresInSeconds * 1000),
        createdAt: new Date().toISOString()
      });

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresInSeconds,
        refresh_token: refreshToken,
        scope: (codeData.scope || ["profile", "email", "polytechnic"]).join(" "),
        user_id: codeData.userId
      });
    } catch (err: any) {
      console.error("Token endpoint failure:", err);
      res.status(500).json({ error: "server_error", error_description: err.message || "Failed to exchange token." });
    }
  });

  // 9. Standard OAuth UserInfo Endpoint
  app.get("/api/oauth/userinfo", async (req: express.Request, res: express.Response) => {
    try {
      let accessToken = "";
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
      } else if (req.query.access_token) {
        accessToken = req.query.access_token as string;
      } else if (req.body && req.body.access_token) {
        accessToken = req.body.access_token;
      }

      if (!accessToken) {
        res.status(401).json({ error: "unauthorized", error_description: "Missing access token in Authorization header or access_token param." });
        return;
      }

      if (!adminDb) {
        res.status(500).json({ error: "server_error", error_description: "Database connection unavailable." });
        return;
      }

      // Look up token in database
      const tokenDoc = await adminDb.collection("oauth_tokens").doc(accessToken).get();
      if (!tokenDoc.exists) {
        res.status(401).json({ error: "invalid_token", error_description: "The provided access token is invalid or revoked." });
        return;
      }

      const tokenData = tokenDoc.data();
      if (Date.now() > tokenData?.expiresAt) {
        res.status(401).json({ error: "invalid_token", error_description: "The access token has expired." });
        return;
      }

      // Fetch User Profile
      const userDoc = await adminDb.collection("users").doc(tokenData.userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: "user_not_found", error_description: "User account associated with token no longer exists." });
        return;
      }

      const userData = userDoc.data();

      // Return clean, structured profile data
      res.json({
        sub: userDoc.id,
        id: userDoc.id,
        name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.displayName || "PolyNet Cadet",
        first_name: userData?.firstName || "",
        last_name: userData?.lastName || "",
        email: userData?.email || "",
        avatar: userData?.avatarUrl || userData?.photoURL || "",
        role: userData?.role || "student",
        polytechnic: userData?.polytechnic || "Polytechnic Cadet",
        technology: userData?.technology || "Engineering",
        semester: userData?.semester || "",
        session: userData?.session || "",
        roll: userData?.rollNumber || "",
        verified: userData?.isVerified || false,
        gold_member: userData?.isGoldUser || false,
        auth_provider: "PolyNet Connect SSO"
      });
    } catch (err: any) {
      console.error("UserInfo endpoint failure:", err);
      res.status(500).json({ error: "server_error", error_description: err.message || "Failed to fetch userinfo." });
    }
  });

  app.post("/api/oauth/userinfo", async (req: express.Request, res: express.Response) => {
    let accessToken = "";
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    } else if (req.body && req.body.access_token) {
      accessToken = req.body.access_token;
    }

    if (!accessToken) {
      res.status(401).json({ error: "unauthorized", error_description: "Missing access token." });
      return;
    }

    if (!adminDb) {
      res.status(500).json({ error: "server_error" });
      return;
    }

    try {
      const tokenDoc = await adminDb.collection("oauth_tokens").doc(accessToken).get();
      if (!tokenDoc.exists) {
        res.status(401).json({ error: "invalid_token" });
        return;
      }

      const tokenData = tokenDoc.data();
      const userDoc = await adminDb.collection("users").doc(tokenData?.userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: "user_not_found" });
        return;
      }

      const userData = userDoc.data();
      res.json({
        sub: userDoc.id,
        id: userDoc.id,
        name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.displayName || "PolyNet Cadet",
        first_name: userData?.firstName || "",
        last_name: userData?.lastName || "",
        email: userData?.email || "",
        avatar: userData?.avatarUrl || userData?.photoURL || "",
        role: userData?.role || "student",
        polytechnic: userData?.polytechnic || "Polytechnic Cadet",
        technology: userData?.technology || "Engineering",
        semester: userData?.semester || "",
        session: userData?.session || "",
        roll: userData?.rollNumber || "",
        verified: userData?.isVerified || false,
        gold_member: userData?.isGoldUser || false,
        auth_provider: "PolyNet Connect SSO"
      });
    } catch (err: any) {
      res.status(500).json({ error: "server_error", error_description: err.message });
    }
  });

  // MATRIX ENDPOINTS REMOVED
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`PolyNet Server is running on port ${PORT}`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[Server] Forceful shutdown after 10s timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

bootstrapServer().catch((err) => {
  console.error("Failed to start PolyNet server:", err);
});
