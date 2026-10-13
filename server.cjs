var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  getAuthorizedGoogleDriveClient: () => getAuthorizedGoogleDriveClient,
  getGoogleDriveClient: () => getGoogleDriveClient,
  getOrCreatePolyNetReelsFolder: () => getOrCreatePolyNetReelsFolder,
  loadGoogleDriveTokensFromFirestore: () => loadGoogleDriveTokensFromFirestore,
  saveGoogleDriveTokensToFirestore: () => saveGoogleDriveTokensToFirestore,
  uploadReelToGoogleDrive: () => uploadReelToGoogleDrive
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_stream = require("stream");
var import_googleapis = require("googleapis");
var import_app = require("firebase-admin/app");
var import_firestore4 = require("firebase-admin/firestore");
var import_messaging = require("firebase-admin/messaging");
var import_auth = require("firebase-admin/auth");
var import_crypto3 = __toESM(require("crypto"), 1);
var import_multer = __toESM(require("multer"), 1);

// src/types.ts
var POLYTECHNIC_INSTITUTES = [
  "Bangladesh Govt. Institute of Glass and Ceramics",
  "Bangladesh Sweden Govt. Polytechnic Institute",
  "Barisal Govt. Polytechnic Institute",
  "Barguna Govt. Polytechnic Institute",
  "Bhola Govt. Polytechnic Institute",
  "Bogura Govt. Polytechnic Institute",
  "Brahmanbaria Govt. Polytechnic Institute",
  "Chandpur Govt. Polytechnic Institute",
  "Chapainawabganj Govt. Polytechnic Institute",
  "Chattogram Govt. Mohila Polytechnic Institute",
  "Chattogram Govt. Polytechnic Institute",
  "Coxsbazar Govt. Polytechnic Institute",
  "Cumilla Govt. Polytechnic Institute",
  "Cumilla Govt. Survey Institute",
  "Dhaka Govt. Mohila Polytechnic Institute",
  "Dhaka Govt. Polytechnic Institute",
  "Dinajpur Govt. Polytechnic Institute",
  "Faridpur Govt. Polytechnic Institute",
  "Feni Govt. Computer Institute",
  "Feni Govt. Polytechnic Institute",
  "Govt. Graphic Arts Institute",
  "Gopalganj Govt. Polytechnic Institute",
  "Habiganj Govt. Polytechnic Institute",
  "Jessore Govt. Polytechnic Institute",
  "Jessore Govt. Survey Institute",
  "Jhenaidah Govt. Polytechnic Institute",
  "Khulna Govt. Mohila Polytechnic Institute",
  "Khulna Govt. Polytechnic Institute",
  "Kishoreganj Govt. Polytechnic Institute",
  "Kurigram Govt. Polytechnic Institute",
  "Kushtia Govt. Polytechnic Institute",
  "Lakshmipur Govt. Polytechnic Institute",
  "Magura Govt. Polytechnic Institute",
  "Moulvibazar Govt. Polytechnic Institute",
  "Munshiganj Govt. Polytechnic Institute",
  "Mymensingh Govt. Polytechnic Institute",
  "Naogaon Govt. Polytechnic Institute",
  "Narsingdi Govt. Polytechnic Institute",
  "Pabna Govt. Polytechnic Institute",
  "Patuakhali Govt. Polytechnic Institute",
  "Rajshahi Govt. Mohila Polytechnic Institute",
  "Rajshahi Govt. Polytechnic Institute",
  "Rajshahi Govt. Survey Institute",
  "Rangpur Govt. Polytechnic Institute",
  "Satkhira Govt. Polytechnic Institute",
  "Shariatpur Govt. Polytechnic Institute",
  "Sherpur Govt. Polytechnic Institute",
  "Sirajganj Govt. Polytechnic Institute",
  "Sylhet Govt. Polytechnic Institute",
  "Tangail Govt. Polytechnic Institute",
  "Thakurgaon Govt. Polytechnic Institute",
  "All Polytechnic Institutes"
];
var SUPER_ADMIN_EMAILS = [
  "22222@gmail.com",
  "hasanmahmud.cst@gmail.com",
  "hdd@gmail.com"
];
var STORE_GIG_ADMIN_EMAILS = [
  "polygig.store.polynet@gmail.com"
];
var ADMIN_EMAILS = [
  ...SUPER_ADMIN_EMAILS,
  ...STORE_GIG_ADMIN_EMAILS
];

// src/utils/polytechnicUtils.ts
var LEGACY_POLYTECHNIC_MAP = {
  // Direct previous names mapping
  "Dhaka Polytechnic Institute": "Dhaka Govt. Polytechnic Institute",
  "Chittagong Polytechnic Institute": "Chattogram Govt. Polytechnic Institute",
  "Rajshahi Polytechnic Institute": "Rajshahi Govt. Polytechnic Institute",
  "Khulna Polytechnic Institute": "Khulna Govt. Polytechnic Institute",
  "Barisal Polytechnic Institute": "Barisal Govt. Polytechnic Institute",
  "Sylhet Polytechnic Institute": "Sylhet Govt. Polytechnic Institute",
  "Rangpur Polytechnic Institute": "Rangpur Govt. Polytechnic Institute",
  "Mymensingh Polytechnic Institute": "Mymensingh Govt. Polytechnic Institute",
  "Comilla Polytechnic Institute": "Cumilla Govt. Polytechnic Institute",
  "Bogra Polytechnic Institute": "Bogura Govt. Polytechnic Institute",
  "Feni Polytechnic Institute": "Feni Govt. Polytechnic Institute",
  "Feni Computer Institute": "Feni Govt. Computer Institute",
  "Graphic Arts Institute": "Govt. Graphic Arts Institute",
  "Institute of Glass and Ceramic": "Bangladesh Govt. Institute of Glass and Ceramics",
  "Bangladesh Institute of Marine Technology": "Bangladesh Govt. Institute of Glass and Ceramics",
  "Bangladesh Sweden Polytechnic Institute": "Bangladesh Sweden Govt. Polytechnic Institute",
  "Bhola Polytechnic Institute": "Bhola Govt. Polytechnic Institute",
  "Brahmanbaria Polytechnic Institute": "Brahmanbaria Govt. Polytechnic Institute",
  "Chandpur Polytechnic Institute": "Chandpur Govt. Polytechnic Institute",
  "Cox's Bazar Polytechnic Institute": "Coxsbazar Govt. Polytechnic Institute",
  "Cox\u2019s Bazar Polytechnic Institute": "Coxsbazar Govt. Polytechnic Institute",
  "Dhaka Mahila Polytechnic Institute": "Dhaka Govt. Mohila Polytechnic Institute",
  "Dinajpur Polytechnic Institute": "Dinajpur Govt. Polytechnic Institute",
  "Faridpur Polytechnic Institute": "Faridpur Govt. Polytechnic Institute",
  "Gopalganj Polytechnic Institute": "Gopalganj Govt. Polytechnic Institute",
  "Habiganj Polytechnic Institute": "Habiganj Govt. Polytechnic Institute",
  "Jessore Polytechnic Institute": "Jessore Govt. Polytechnic Institute",
  "Jhenaidah Polytechnic Institute": "Jhenaidah Govt. Polytechnic Institute",
  "Khulna Mahila Polytechnic Institute": "Khulna Govt. Mohila Polytechnic Institute",
  "Kishoreganj Polytechnic Institute": "Kishoreganj Govt. Polytechnic Institute",
  "Kurigram Polytechnic Institute": "Kurigram Govt. Polytechnic Institute",
  "Kushtia Polytechnic Institute": "Kushtia Govt. Polytechnic Institute",
  "Lakshmipur Polytechnic Institute": "Lakshmipur Govt. Polytechnic Institute",
  "Naogaon Polytechnic Institute": "Naogaon Govt. Polytechnic Institute",
  "Narshingdi Polytechnic Institute": "Narsingdi Govt. Polytechnic Institute",
  "Natore Polytechnic Institute": "Rajshahi Govt. Polytechnic Institute",
  "Pabna Polytechnic Institute": "Pabna Govt. Polytechnic Institute",
  "Patuakhali Polytechnic Institute": "Patuakhali Govt. Polytechnic Institute",
  "Rajshahi Mahila Polytechnic Institute": "Rajshahi Govt. Mohila Polytechnic Institute",
  "Rangamati Polytechnic Institute": "Chattogram Govt. Polytechnic Institute",
  "Satkhira Polytechnic Institute": "Satkhira Govt. Polytechnic Institute",
  "Shariatpur Polytechnic Institute": "Shariatpur Govt. Polytechnic Institute",
  "Sherpur Polytechnic Institute": "Sherpur Govt. Polytechnic Institute",
  "Sirajganj Polytechnic Institute": "Sirajganj Govt. Polytechnic Institute",
  "Tangail Polytechnic Institute": "Tangail Govt. Polytechnic Institute",
  "Thakurgaon Polytechnic Institute": "Thakurgaon Govt. Polytechnic Institute"
};
function normalizePolytechnicName(rawName) {
  if (!rawName) return "Dhaka Govt. Polytechnic Institute";
  const trimmed = rawName.trim();
  if (!trimmed || trimmed === "All" || trimmed === "All Polytechnic Institutes") {
    return "All Polytechnic Institutes";
  }
  const exactMatch = POLYTECHNIC_INSTITUTES.find(
    (p) => p.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  if (LEGACY_POLYTECHNIC_MAP[trimmed]) {
    return LEGACY_POLYTECHNIC_MAP[trimmed];
  }
  const lower = trimmed.toLowerCase().replace(/['’]/g, "").replace(/\./g, " ").replace(/\s+/g, " ").trim();
  if (lower.includes("glass") || lower.includes("ceramic")) {
    return "Bangladesh Govt. Institute of Glass and Ceramics";
  }
  if (lower.includes("sweden")) {
    return "Bangladesh Sweden Govt. Polytechnic Institute";
  }
  if (lower.includes("graphic")) {
    return "Govt. Graphic Arts Institute";
  }
  if (lower.includes("feni") && (lower.includes("computer") || lower.includes("fci"))) {
    return "Feni Govt. Computer Institute";
  }
  if (lower.includes("feni")) {
    return "Feni Govt. Polytechnic Institute";
  }
  if (lower.includes("dhaka") && (lower.includes("mohila") || lower.includes("mahila") || lower.includes("female") || lower.includes("women"))) {
    return "Dhaka Govt. Mohila Polytechnic Institute";
  }
  if (lower.includes("dhaka")) {
    return "Dhaka Govt. Polytechnic Institute";
  }
  if ((lower.includes("chattogram") || lower.includes("chittagong") || lower.includes("ctg")) && (lower.includes("mohila") || lower.includes("mahila") || lower.includes("female") || lower.includes("women"))) {
    return "Chattogram Govt. Mohila Polytechnic Institute";
  }
  if (lower.includes("chattogram") || lower.includes("chittagong") || lower.includes("ctg")) {
    return "Chattogram Govt. Polytechnic Institute";
  }
  if (lower.includes("rajshahi") && (lower.includes("mohila") || lower.includes("mahila") || lower.includes("female") || lower.includes("women"))) {
    return "Rajshahi Govt. Mohila Polytechnic Institute";
  }
  if (lower.includes("rajshahi") && lower.includes("survey")) {
    return "Rajshahi Govt. Survey Institute";
  }
  if (lower.includes("rajshahi")) {
    return "Rajshahi Govt. Polytechnic Institute";
  }
  if (lower.includes("khulna") && (lower.includes("mohila") || lower.includes("mahila") || lower.includes("female") || lower.includes("women"))) {
    return "Khulna Govt. Mohila Polytechnic Institute";
  }
  if (lower.includes("khulna")) {
    return "Khulna Govt. Polytechnic Institute";
  }
  if (lower.includes("cumilla") && lower.includes("survey") || lower.includes("comilla") && lower.includes("survey")) {
    return "Cumilla Govt. Survey Institute";
  }
  if (lower.includes("cumilla") || lower.includes("comilla")) {
    return "Cumilla Govt. Polytechnic Institute";
  }
  if (lower.includes("jessore") && lower.includes("survey") || lower.includes("jashore") && lower.includes("survey")) {
    return "Jessore Govt. Survey Institute";
  }
  if (lower.includes("jessore") || lower.includes("jashore")) {
    return "Jessore Govt. Polytechnic Institute";
  }
  if (lower.includes("bogra") || lower.includes("bogura")) {
    return "Bogura Govt. Polytechnic Institute";
  }
  if (lower.includes("barisal") || lower.includes("barishal")) {
    return "Barisal Govt. Polytechnic Institute";
  }
  if (lower.includes("barguna")) {
    return "Barguna Govt. Polytechnic Institute";
  }
  if (lower.includes("bhola")) {
    return "Bhola Govt. Polytechnic Institute";
  }
  if (lower.includes("brahmanbaria")) {
    return "Brahmanbaria Govt. Polytechnic Institute";
  }
  if (lower.includes("chandpur")) {
    return "Chandpur Govt. Polytechnic Institute";
  }
  if (lower.includes("chapainawabganj") || lower.includes("nawabganj")) {
    return "Chapainawabganj Govt. Polytechnic Institute";
  }
  if (lower.includes("coxsbazar") || lower.includes("coxs bazar") || lower.includes("cox bazar")) {
    return "Coxsbazar Govt. Polytechnic Institute";
  }
  if (lower.includes("dinajpur")) {
    return "Dinajpur Govt. Polytechnic Institute";
  }
  if (lower.includes("faridpur")) {
    return "Faridpur Govt. Polytechnic Institute";
  }
  if (lower.includes("gopalganj")) {
    return "Gopalganj Govt. Polytechnic Institute";
  }
  if (lower.includes("habiganj")) {
    return "Habiganj Govt. Polytechnic Institute";
  }
  if (lower.includes("jhenaidah")) {
    return "Jhenaidah Govt. Polytechnic Institute";
  }
  if (lower.includes("kishoreganj")) {
    return "Kishoreganj Govt. Polytechnic Institute";
  }
  if (lower.includes("kurigram")) {
    return "Kurigram Govt. Polytechnic Institute";
  }
  if (lower.includes("kushtia")) {
    return "Kushtia Govt. Polytechnic Institute";
  }
  if (lower.includes("lakshmipur") || lower.includes("laxmipur")) {
    return "Lakshmipur Govt. Polytechnic Institute";
  }
  if (lower.includes("magura")) {
    return "Magura Govt. Polytechnic Institute";
  }
  if (lower.includes("moulvibazar") || lower.includes("maulvibazar")) {
    return "Moulvibazar Govt. Polytechnic Institute";
  }
  if (lower.includes("munshiganj")) {
    return "Munshiganj Govt. Polytechnic Institute";
  }
  if (lower.includes("mymensingh")) {
    return "Mymensingh Govt. Polytechnic Institute";
  }
  if (lower.includes("naogaon")) {
    return "Naogaon Govt. Polytechnic Institute";
  }
  if (lower.includes("narsingdi") || lower.includes("narshingdi")) {
    return "Narsingdi Govt. Polytechnic Institute";
  }
  if (lower.includes("pabna")) {
    return "Pabna Govt. Polytechnic Institute";
  }
  if (lower.includes("patuakhali")) {
    return "Patuakhali Govt. Polytechnic Institute";
  }
  if (lower.includes("rangpur")) {
    return "Rangpur Govt. Polytechnic Institute";
  }
  if (lower.includes("satkhira")) {
    return "Satkhira Govt. Polytechnic Institute";
  }
  if (lower.includes("shariatpur")) {
    return "Shariatpur Govt. Polytechnic Institute";
  }
  if (lower.includes("sherpur")) {
    return "Sherpur Govt. Polytechnic Institute";
  }
  if (lower.includes("sirajganj")) {
    return "Sirajganj Govt. Polytechnic Institute";
  }
  if (lower.includes("sylhet")) {
    return "Sylhet Govt. Polytechnic Institute";
  }
  if (lower.includes("tangail")) {
    return "Tangail Govt. Polytechnic Institute";
  }
  if (lower.includes("thakurgaon")) {
    return "Thakurgaon Govt. Polytechnic Institute";
  }
  for (const official of POLYTECHNIC_INSTITUTES) {
    if (official === "All Polytechnic Institutes") continue;
    const cleanOfficial = official.toLowerCase().replace(/govt\.?|polytechnic|institute/g, "").trim();
    if (cleanOfficial && lower.includes(cleanOfficial)) {
      return official;
    }
  }
  return trimmed;
}

// src/server/notificationService.ts
var import_firestore = require("firebase-admin/firestore");
var NotificationService = class {
  constructor(db, messaging, auth) {
    this.deduplicationCache = /* @__PURE__ */ new Map();
    this.db = db;
    this.messaging = messaging;
    this.auth = auth;
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of this.deduplicationCache.entries()) {
        if (now - timestamp > 6e4) {
          this.deduplicationCache.delete(key);
        }
      }
    }, 6e5);
  }
  /**
   * Deduplication check to avoid spamming the exact same notification in a short window
   */
  async deduplicateNotification(userId, type, entityId = "", windowMs = 5e3) {
    const key = `${userId}:${type}:${entityId}`;
    const now = Date.now();
    const lastSent = this.deduplicationCache.get(key);
    if (lastSent && now - lastSent < windowMs) {
      console.log(`[NotificationService] Notification deduplicated (suppressed): ${key}`);
      return true;
    }
    this.deduplicationCache.set(key, now);
    return false;
  }
  /**
   * Check if the user has enabled notifications for this specific type/category
   */
  async checkNotificationSettings(userId, notificationType) {
    try {
      const userDoc = await this.db.collection("users").doc(userId).get();
      if (!userDoc.exists) return true;
      const userData = userDoc.data();
      const settings = userData?.notificationSettings;
      if (!settings) return true;
      if (settings.pushEnabled === false) return false;
      if (settings[notificationType] === false) return false;
      return true;
    } catch (err) {
      console.warn(`[NotificationService] Error checking settings for user ${userId}:`, err);
      return true;
    }
  }
  /**
   * Fetch all active device tokens for a given user across multiple devices
   */
  async getUserActiveDeviceTokens(userId) {
    const tokens = /* @__PURE__ */ new Set();
    try {
      const devicesSnap = await this.db.collection("users").doc(userId).collection("devices").where("isActive", "==", true).get();
      devicesSnap.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 0) {
          tokens.add(data.fcmToken.trim());
        }
      });
      const userDoc = await this.db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        const legacyTokens = [
          uData?.fcmToken,
          uData?.fcmTokenAndroid,
          uData?.fcmTokenWeb,
          uData?.fcmTokenPolyChat
        ];
        for (const lt of legacyTokens) {
          if (lt && typeof lt === "string" && lt.trim().length > 0) {
            tokens.add(lt.trim());
          }
        }
      }
    } catch (err) {
      console.error(`[NotificationService] Error fetching devices for user ${userId}:`, err);
    }
    return Array.from(tokens);
  }
  /**
   * Register or update an Android/Web device for a user
   */
  async registerDevice(userId, deviceData) {
    const {
      deviceId,
      fcmToken,
      platform = "android",
      deviceModel = "Android Device",
      osVersion = "",
      appVersion = "1.0",
      notificationSettings = {}
    } = deviceData;
    if (!userId || !deviceId || !fcmToken) {
      throw new Error("Missing required parameters for device registration (userId, deviceId, fcmToken).");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const deviceRef = this.db.collection("users").doc(userId).collection("devices").doc(deviceId);
    const existingDevice = await deviceRef.get();
    const payload = {
      deviceId,
      userId,
      fcmToken: fcmToken.trim(),
      platform,
      deviceModel,
      osVersion,
      appVersion,
      isActive: true,
      notificationSettings,
      lastActiveAt: now
    };
    if (!existingDevice.exists) {
      payload.createdAt = now;
      await deviceRef.set(payload);
      console.log(`[NotificationService] New device registered for user ${userId} [Device: ${deviceId}, Platform: ${platform}]`);
    } else {
      await deviceRef.update(payload);
      console.log(`[NotificationService] Existing device updated for user ${userId} [Device: ${deviceId}]`);
    }
    try {
      await this.db.collection("users").doc(userId).set(
        {
          fcmToken: fcmToken.trim(),
          fcmPlatform: platform,
          fcmUpdatedAt: now
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(`[NotificationService] Warning updating user doc fcmToken:`, err);
    }
    return { success: true, deviceId };
  }
  /**
   * Mark a device as inactive or remove it on logout
   */
  async removeDevice(userId, deviceId) {
    if (!userId || !deviceId) {
      throw new Error("Missing userId or deviceId to remove device.");
    }
    try {
      const deviceRef = this.db.collection("users").doc(userId).collection("devices").doc(deviceId);
      const docSnap = await deviceRef.get();
      if (docSnap.exists) {
        await deviceRef.update({
          isActive: false,
          loggedOutAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        console.log(`[NotificationService] Device ${deviceId} marked inactive for user ${userId} upon logout.`);
      }
      return { success: true };
    } catch (err) {
      console.error(`[NotificationService] Failed to remove device ${deviceId} for user ${userId}:`, err);
      return { success: false };
    }
  }
  /**
   * Automatically remove or deactivate invalid/unregistered FCM tokens
   */
  async removeInvalidDevice(userId, invalidToken) {
    try {
      console.log(`[NotificationService] Purging invalid FCM token for user ${userId}: ${invalidToken}`);
      const devicesSnap = await this.db.collection("users").doc(userId).collection("devices").where("fcmToken", "==", invalidToken).get();
      const batch = this.db.batch();
      devicesSnap.forEach((doc) => {
        batch.update(doc.ref, {
          isActive: false,
          invalidatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          invalidationReason: "FCM_TOKEN_UNREGISTERED"
        });
      });
      await batch.commit();
      const userDoc = await this.db.collection("users").doc(userId).get();
      if (userDoc.exists && userDoc.data()?.fcmToken === invalidToken) {
        await this.db.collection("users").doc(userId).update({
          fcmToken: import_firestore.FieldValue.delete()
        });
      }
    } catch (err) {
      console.error(`[NotificationService] Error purging invalid device token:`, err);
    }
  }
  /**
   * Save a notification record into Firestore with rich schema & backward compatibility
   */
  async createNotification(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const notifRef = this.db.collection("notifications").doc();
    const notifDoc = {
      notificationId: notifRef.id,
      recipientUserId: data.recipientUserId || data.receiverId || "",
      receiverId: data.recipientUserId || data.receiverId || "",
      actorUserId: data.actorUserId || data.senderId || "",
      senderId: data.actorUserId || data.senderId || "",
      actorName: data.actorName || data.senderName || "PolyNet",
      senderName: data.actorName || data.senderName || "PolyNet",
      actorAvatar: data.actorAvatar || data.senderAvatar || "",
      senderAvatar: data.actorAvatar || data.senderAvatar || "",
      type: data.type || "general",
      entityId: data.entityId || data.targetId || "",
      targetId: data.entityId || data.targetId || "",
      title: data.title || "PolyNet Notification",
      body: data.body || data.message || "",
      message: data.body || data.message || "",
      deepLink: data.deepLink || data.url || "/",
      url: data.deepLink || data.url || "/",
      metadata: data.metadata || {},
      read: false,
      isRead: false,
      createdAt: data.createdAt || now,
      expiresAt: data.expiresAt || null
    };
    await notifRef.set(notifDoc);
    if (notifDoc.recipientUserId) {
      try {
        await this.db.collection("notifications").doc(notifDoc.recipientUserId).collection("userNotifications").doc(notifRef.id).set(notifDoc);
      } catch (subErr) {
        console.warn("[NotificationService] Subcollection save error:", subErr);
      }
    }
    return notifRef.id;
  }
  /**
   * Send notification directly to a list of device tokens via Firebase Cloud Messaging
   */
  async sendNotificationToDevices(tokens, payload) {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }
    const {
      title,
      body,
      imageUrl = "https://ais-dev-jmcbzsgflgr6dohyyssak3-834763543349.asia-southeast1.run.app/logo.png",
      data,
      priority = "high",
      channelId = "fcm_default_channel"
    } = payload;
    const invalidTokens = [];
    let successCount = 0;
    let failureCount = 0;
    const chunkSize = 500;
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const multicastPayload = {
        tokens: chunk,
        notification: {
          title,
          body,
          imageUrl: imageUrl || void 0
        },
        android: {
          priority: priority === "high" ? "high" : "normal",
          notification: {
            channelId,
            sound: "default",
            clickAction: "FCM_PLUGIN_ACTIVITY",
            priority: priority === "high" ? "high" : "default",
            visibility: "public",
            icon: "ic_notification",
            tag: `polynet_${data.type || "general"}_${Date.now()}`
          }
        },
        webpush: {
          headers: {
            Urgency: priority === "high" ? "high" : "normal",
            TTL: "86400"
          },
          notification: {
            title,
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            vibrate: [200, 100, 200],
            requireInteraction: priority === "high",
            data
          }
        },
        data: {
          ...data,
          title,
          body,
          click_action: "FCM_PLUGIN_ACTIVITY"
        }
      };
      try {
        const response = await this.messaging.sendEachForMulticast(multicastPayload);
        successCount += response.successCount;
        failureCount += response.failureCount;
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            const token = chunk[idx];
            console.warn(`[NotificationService] FCM error for token: ${errorCode} - ${resp.error?.message}`);
            if (errorCode === "messaging/invalid-registration-token" || errorCode === "messaging/registration-token-not-registered" || errorCode === "messaging/invalid-argument") {
              invalidTokens.push(token);
            }
          }
        });
      } catch (multicastErr) {
        console.error(`[NotificationService] Error executing multicast send:`, multicastErr);
        failureCount += chunk.length;
      }
    }
    return { successCount, failureCount, invalidTokens };
  }
  /**
   * Main unified entry point: Send a production-ready notification to a PolyNet user
   */
  async sendNotificationToUser(params) {
    const {
      recipientUserId,
      actorUserId = "",
      actorName = "PolyNet",
      actorAvatar = "",
      type,
      entityId = "",
      title,
      body,
      deepLink = "/",
      metadata = {},
      expiresAt,
      priority = "high",
      channelId = "fcm_default_channel",
      saveToDb = true
    } = params;
    if (!recipientUserId) {
      return { success: false, sentDevicesCount: 0, failedDevicesCount: 0, errors: ["Missing recipientUserId"] };
    }
    if (actorUserId && actorUserId === recipientUserId) {
      return { success: true, sentDevicesCount: 0, failedDevicesCount: 0 };
    }
    const isDup = await this.deduplicateNotification(recipientUserId, type, entityId);
    if (isDup) {
      return { success: true, sentDevicesCount: 0, failedDevicesCount: 0 };
    }
    const isAllowed = await this.checkNotificationSettings(recipientUserId, type);
    if (!isAllowed) {
      console.log(`[NotificationService] User ${recipientUserId} has disabled notifications for type: ${type}`);
      return { success: true, sentDevicesCount: 0, failedDevicesCount: 0 };
    }
    let notificationId = "";
    if (saveToDb) {
      notificationId = await this.createNotification({
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
        expiresAt
      });
    }
    const tokens = await this.getUserActiveDeviceTokens(recipientUserId);
    if (tokens.length === 0) {
      console.log(`[NotificationService] No active registered FCM devices found for user: ${recipientUserId}`);
      return { success: true, notificationId, sentDevicesCount: 0, failedDevicesCount: 0 };
    }
    console.log(
      `[NotificationService] Delivering '${type}' notification to user '${recipientUserId}' across ${tokens.length} active device(s)`
    );
    const dataPayload = {
      notificationId: notificationId || `notif_${Date.now()}`,
      type,
      entityId,
      targetId: entityId,
      actorUserId,
      senderId: actorUserId,
      actorName,
      senderName: actorName,
      deepLink,
      url: deepLink,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...metadata ? Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])
      ) : {}
    };
    const sendResult = await this.sendNotificationToDevices(tokens, {
      title,
      body,
      imageUrl: actorAvatar,
      data: dataPayload,
      priority,
      channelId
    });
    if (sendResult.invalidTokens.length > 0) {
      for (const invalidToken of sendResult.invalidTokens) {
        await this.removeInvalidDevice(recipientUserId, invalidToken);
      }
    }
    return {
      success: sendResult.successCount > 0 || tokens.length === 0,
      notificationId,
      sentDevicesCount: sendResult.successCount,
      failedDevicesCount: sendResult.failureCount
    };
  }
};

// src/server/firebaseAdminConfig.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var FALLBACK_SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "hn-vendor",
  private_key_id: "154effe4a10fe075e7b7b8d86753619bc6c62e65",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQDCJ39YiZF4RVC4\nF7Dk38Tb5OIp1/KJzkobI7pg2dJPBnBtHgE/Vpg0HgY+Gj07s5xwyQTETVLdURA1\nlgZn7FvXu7q1BpYRkvQOVy161UwcDMn8VpH5TNMdZrKoeY8tLqz0LX/f3g05M8C/\njZ54c0QJ25PYOPQmaEhRNcQxxnx22W78rPhHr2GsTS7TH0+M2+iImK64LdA7QYKA\nd8r3OdWZTDaO3EJvpnanKCvZKiztcfWv9IR4/8bqRnV7TvH19WvtjdUsBYDK7rJU\nlszhV/Rif2pU9QNovDRyyJICNB/pLb+H6X3q57rFDXcPeDtZWsSS7yZBK4JXGfzi\nElb3zq+vAgMBAAECggEAWN74gR/zWPCtip65h4JQG3Fw/sNMzzyAmlynzvZVuHuT\nkbb2zjXGlLCbnein18CW3t980ZgtUoXtHAIwq3g68AyL4ZoCrkesdDX+aOfin0JR\nYLKFve4nAqHELK771Sw02c5L5r6/IcxpMaVTAQKOBc8fJQ2o4D3CwH2ScVBQH5wJ\n7eGJZxGq1623gmr9l8EdQ0isROmxcyLVyUd205lqCpZ3mMnN8NZg53XBm6Zw6jNy\nVtbaDOSd1YpA6w7BsDABaru4DxVgtNC0DVMQV4S+4VNIYniaBYJIzJ+RA5bMVizk\niHjqGYPnk5BtJ7edtcAU95BryVoq4WIEbb7JXC9/bQKBgQDwZ1toEp2kU8DYOrJ7\n75ueOD7/vVJORcy5lLzX+i8rrErE77/s8WLRdVUNZ1k7gJ8pJQ9468hIX08YRroF\nCwmG/s15DTnUiGGklTz0GxCgY5Hfbg6Dq1RdSU/3jCUF3maZ/aGLoV/8AjYZFDOY\nqZL/uCplWH7uvIv1Yjt4+pmPLQKBgQDOwAaucQbirILoJ5Q0n7uRn3Iu+QgTjgQc\nKZOZXuEQlBEUk2UJDhxgCL3mLqwRcUrDEVEeGy/vi6k4hk7djq/aptPlOJorm4zj\nb9UYHIQK20s2LB9B0E4nzouHsshWDlWkPw5v0t5H7cMFUISfS61GKCdWOdxGJ7ic\nL2Kt2bMjywKBgA8KKEnGgF47byEX6vqd7tpjIm3VZkTHURt7FqVcXX8Z9EOFzDgC\nkfAQqxV/lbGHRm3Ih8NE3O7KJ6SZKCIQorPzVN9x2GBXd+RYAcwztUKTeBjGRdou\n6cQ8RehyuA4576lKmMSnf93ANaoz/VZbpXqiBuT4OFivKwJa9uWGp/yxAoGALOHM\n0YOh3gVbKbCl4MKoQlWdwQq4sR4MUFzKOOo665FpH9Fbhpq0mDhtmRGasvKoKy6Q\nMHvwbQ0hgC7P4hL+o/XBXCpsdXkAHcOCPAi8tWqjqi/r3SquPL/+1EeAbAYSm2RA\n6w+Yx36a7oVrNPWFuQwwdex7oBMxZV54CouO8v8CfwLtfEtMQg8Q+KHeFyQgOFy+\ntPsFY3K2zcDHTmVXgf/Ff7TBWWtBFiSpIRcSy1e4NPlkDfGXKErmStcb7k0BVz4g\nevGuARSIGynR5zN5MDQfJfCl48wSKSl9RTizl5FRDNQBosnuEcsYwPoNUcYmKwsM\nXWX66dsMEbhzPna4Vuc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@hn-vendor.iam.gserviceaccount.com",
  "client_id": "110488055907263387170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hn-vendor.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
function getResolvedServiceAccount() {
  const serviceAccountPath = import_path.default.join(process.cwd(), "firebase-service-account.json");
  if (import_fs.default.existsSync(serviceAccountPath)) {
    try {
      const parsed = JSON.parse(import_fs.default.readFileSync(serviceAccountPath, "utf8"));
      if (parsed.private_key && parsed.client_email) {
        return { serviceAccount: parsed, source: "file" };
      }
    } catch (e) {
      console.warn("[FirebaseAdminConfig] Error parsing firebase-service-account.json:", e);
    }
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed.private_key && parsed.client_email) {
        return { serviceAccount: parsed, source: "env" };
      }
    } catch (e) {
      console.warn("[FirebaseAdminConfig] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON env:", e);
    }
  }
  return { serviceAccount: FALLBACK_SERVICE_ACCOUNT, source: "embedded_fallback" };
}

// src/server/paymentService.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var import_firestore3 = require("firebase-admin/firestore");

// src/server/ledgerService.ts
var import_firestore2 = require("firebase-admin/firestore");
var import_crypto = __toESM(require("crypto"), 1);
function calculatePolyGigCommission(amountBDT, sellerTuple, candidates = []) {
  const cleanAmount = Math.max(0, Number(amountBDT) || 0);
  const grossPaisa = Math.round(cleanAmount * 100);
  const sellerPaisa = Math.floor(grossPaisa * 0.9);
  const epsFeePaisa = Math.floor(grossPaisa * 0.02);
  const crCommissionPaisa = Math.floor(grossPaisa * 0.02);
  const moderatorCommissionPaisa = Math.floor(grossPaisa * 0.01);
  const authorityBasePaisa = Math.floor(grossPaisa * 0.05);
  const roundingRemainderPaisa = grossPaisa - (sellerPaisa + epsFeePaisa + crCommissionPaisa + moderatorCommissionPaisa + authorityBasePaisa);
  const authorityCommissionPaisa = authorityBasePaisa + roundingRemainderPaisa;
  const normPoly = normalizePolytechnicName(sellerTuple.polytechnic || "").toLowerCase().trim();
  const normTech = (sellerTuple.technology || "").toLowerCase().trim();
  const normSem = (sellerTuple.semester || "").toLowerCase().trim();
  const normShift = (sellerTuple.shift || "").toLowerCase().trim();
  const normGroup = (sellerTuple.group || "").toLowerCase().trim();
  let matchedCrUid = null;
  let crReserveReason = void 0;
  if (!normPoly || !normTech || !normSem || !normShift) {
    crReserveReason = "missing_academic_attribute";
  } else {
    const matchingCrs = [];
    for (const user of candidates) {
      if (!user.isCr) continue;
      const userPoly = normalizePolytechnicName(user.polytechnic || "").toLowerCase().trim();
      if (!userPoly || userPoly !== normPoly) continue;
      const uTech = (user.technology || user.department || "").toLowerCase().trim();
      if (!uTech) continue;
      const techMatch = uTech.includes(normTech) || normTech.includes(uTech);
      if (!techMatch) continue;
      const uSem = (user.semester || "").toLowerCase().trim();
      if (!uSem) continue;
      const semMatch = uSem.includes(normSem) || normSem.includes(uSem);
      if (!semMatch) continue;
      const uShift = (user.shift || "").toLowerCase().trim();
      if (!uShift || uShift !== normShift) continue;
      const uGroup = (user.group || "").toLowerCase().trim();
      if (normGroup) {
        if (!uGroup || uGroup !== normGroup) continue;
      } else {
        if (uGroup) continue;
      }
      matchingCrs.push(user);
    }
    if (matchingCrs.length === 1) {
      matchedCrUid = matchingCrs[0].uid;
    } else if (matchingCrs.length > 1) {
      matchedCrUid = null;
      crReserveReason = "ambiguous_cr_match";
    } else {
      matchedCrUid = null;
      crReserveReason = "unmatched_cr";
    }
  }
  let matchedModUid = null;
  let moderatorReserveReason = void 0;
  if (!normPoly) {
    moderatorReserveReason = "missing_academic_attribute";
  } else {
    const matchingMods = [];
    for (const user of candidates) {
      if (!user.isModerator) continue;
      const modPoly = normalizePolytechnicName(user.moderatorPolytechnic || user.polytechnic || "").toLowerCase().trim();
      if (modPoly && modPoly === normPoly) {
        matchingMods.push(user);
      }
    }
    if (matchingMods.length > 0) {
      matchedModUid = matchingMods[0].uid;
    } else {
      moderatorReserveReason = "unmatched_moderator";
    }
  }
  const crIsReserve = !matchedCrUid;
  const moderatorIsReserve = !matchedModUid;
  return {
    grossPaisa,
    grossBDT: grossPaisa / 100,
    sellerPaisa,
    sellerBDT: sellerPaisa / 100,
    epsFeePaisa,
    epsFeeBDT: epsFeePaisa / 100,
    crCommissionPaisa,
    crCommissionBDT: crCommissionPaisa / 100,
    moderatorCommissionPaisa,
    moderatorCommissionBDT: moderatorCommissionPaisa / 100,
    authorityBasePaisa,
    authorityBaseBDT: authorityBasePaisa / 100,
    roundingRemainderPaisa,
    roundingRemainderBDT: roundingRemainderPaisa / 100,
    authorityCommissionPaisa,
    authorityCommissionBDT: authorityCommissionPaisa / 100,
    crUid: matchedCrUid || "authority_reserve",
    crIsReserve,
    crReserveReason,
    moderatorUid: matchedModUid || "authority_reserve",
    moderatorIsReserve,
    moderatorReserveReason
  };
}
var LedgerService = class {
  constructor(db, notificationService2 = null) {
    this.db = db;
    this.notificationService = notificationService2;
  }
  /**
   * Settles a verified PolyGig payment atomically into the immutable ledger.
   * Enforces strict idempotency: if order is already settled, it aborts cleanly.
   */
  async settleGigOrder(orderId, txData) {
    if (!this.db) {
      return { success: false, error: "Firestore Admin SDK is not initialized." };
    }
    const txRef = this.db.collection("payment_transactions").doc(orderId);
    const gigOrderRef = this.db.collection("polygig_orders").doc(orderId);
    try {
      let distribution = null;
      let alreadySettled = false;
      let sellerUid = "";
      await this.db.runTransaction(async (t) => {
        const txSnap = await t.get(txRef);
        if (txSnap.exists && txSnap.data()?.settled) {
          alreadySettled = true;
          return;
        }
        const txRecord = txSnap.exists ? txSnap.data() : null;
        if (txData.currency && txData.currency.toUpperCase() !== "BDT") {
          throw new Error(`Currency mismatch. Expected BDT, got ${txData.currency}`);
        }
        if (txRecord?.amount != null && txData.amount != null) {
          const expected = Number(txRecord.amount);
          const incoming = Number(txData.amount);
          if (!isNaN(expected) && !isNaN(incoming) && Math.abs(incoming - expected) > 0.01) {
            throw new Error(`Amount mismatch for order #${orderId}. Expected ${expected}, got ${incoming}`);
          }
        }
        const gigSnap = await t.get(gigOrderRef);
        const gigData = gigSnap.exists ? gigSnap.data() : null;
        sellerUid = gigData?.sellerUid || gigData?.sellerId || txRecord?.metadata?.sellerUid || "";
        if (!sellerUid) {
          throw new Error(`Cannot settle order #${orderId}: sellerUid is not identified.`);
        }
        const rawAmount = parseFloat(txData.amount || txRecord?.amount || gigData?.paidAmount || gigData?.amount || 0);
        if (rawAmount <= 0) {
          throw new Error(`Invalid payment amount: ${rawAmount}`);
        }
        const sellerUserRef = this.db.collection("users").doc(sellerUid);
        const sellerUserSnap = await t.get(sellerUserRef);
        const sellerData = sellerUserSnap.exists ? sellerUserSnap.data() : {};
        const sellerTuple = {
          polytechnic: sellerData?.polytechnic || txRecord?.metadata?.polytechnic || "",
          technology: sellerData?.technology || sellerData?.department || txRecord?.metadata?.technology || "",
          semester: sellerData?.semester || txRecord?.metadata?.semester || "",
          shift: sellerData?.shift || txRecord?.metadata?.shift || "",
          group: sellerData?.group || txRecord?.metadata?.group || ""
        };
        const candidates = [];
        if (sellerTuple.polytechnic) {
          const usersRef = this.db.collection("users");
          const crQuery = await usersRef.where("isCr", "==", true).where("polytechnic", "==", sellerTuple.polytechnic).get();
          crQuery.forEach((doc) => {
            candidates.push({ uid: doc.id, ...doc.data() });
          });
          const modQuery = await usersRef.where("isModerator", "==", true).where("moderatorPolytechnic", "==", sellerTuple.polytechnic).get();
          modQuery.forEach((doc) => {
            candidates.push({ uid: doc.id, ...doc.data() });
          });
        }
        distribution = calculatePolyGigCommission(rawAmount, sellerTuple, candidates);
        const postEntry = (suffix, accountType, accountUid, entryType, amountPaisa, direction, metadata) => {
          const entryId = `ledg_ord_${orderId}_${suffix}`;
          const entryRef = this.db.collection("ledger_entries").doc(entryId);
          t.set(entryRef, {
            entryId,
            orderId,
            accountType,
            accountUid,
            entryType,
            amountPaisa,
            amountBDT: amountPaisa / 100,
            currency: "BDT",
            direction,
            idempotencyKey: entryId,
            sourceReference: txData.transaction_id || `order_${orderId}`,
            metadata: metadata || {},
            createdAt: import_firestore2.FieldValue.serverTimestamp()
          });
        };
        postEntry("pay_in", "eps_gateway", "eps_system", "verified_incoming_payment", distribution.grossPaisa, "credit");
        postEntry("seller", "seller", sellerUid, "seller_proceeds", distribution.sellerPaisa, "credit");
        postEntry("eps_fee", "eps_gateway", "eps_system", "eps_fee", distribution.epsFeePaisa, "debit");
        if (distribution.crIsReserve) {
          postEntry("cr_res", "authority_reserve", "authority_reserve", "authority_reserve_allocation", distribution.crCommissionPaisa, "credit", { reason: distribution.crReserveReason || "unmatched_cr" });
        } else {
          postEntry("cr_comm", "cr", distribution.crUid, "cr_commission", distribution.crCommissionPaisa, "credit");
        }
        if (distribution.moderatorIsReserve) {
          postEntry("mod_res", "authority_reserve", "authority_reserve", "authority_reserve_allocation", distribution.moderatorCommissionPaisa, "credit", { reason: distribution.moderatorReserveReason || "unmatched_moderator" });
        } else {
          postEntry("mod_comm", "moderator", distribution.moderatorUid, "moderator_commission", distribution.moderatorCommissionPaisa, "credit");
        }
        postEntry("auth_base", "authority", "polynet_authority", "polynet_authority_commission", distribution.authorityCommissionPaisa, "credit");
        const updateWalletCredit = async (uid, creditPaisa) => {
          if (!uid || creditPaisa <= 0) return;
          const wRef = this.db.collection("wallets").doc(uid);
          const wSnap = await t.get(wRef);
          const currentW = wSnap.exists ? wSnap.data() : null;
          const curWithdrawable = currentW?.withdrawableBalancePaisa || 0;
          const curTotal = currentW?.totalEarnedPaisa || 0;
          const newWithdrawable = curWithdrawable + creditPaisa;
          const newTotal = curTotal + creditPaisa;
          t.set(wRef, {
            userId: uid,
            withdrawableBalancePaisa: newWithdrawable,
            withdrawableBalanceBDT: newWithdrawable / 100,
            totalEarnedPaisa: newTotal,
            totalEarnedBDT: newTotal / 100,
            updatedAt: import_firestore2.FieldValue.serverTimestamp()
          }, { merge: true });
        };
        await updateWalletCredit(sellerUid, distribution.sellerPaisa);
        if (!distribution.crIsReserve) {
          await updateWalletCredit(distribution.crUid, distribution.crCommissionPaisa);
        } else {
          await updateWalletCredit("authority_reserve", distribution.crCommissionPaisa);
        }
        if (!distribution.moderatorIsReserve) {
          await updateWalletCredit(distribution.moderatorUid, distribution.moderatorCommissionPaisa);
        } else {
          await updateWalletCredit("authority_reserve", distribution.moderatorCommissionPaisa);
        }
        await updateWalletCredit("polynet_authority", distribution.authorityCommissionPaisa);
        t.set(txRef, {
          status: "success",
          settled: true,
          settledAt: import_firestore2.FieldValue.serverTimestamp(),
          epsData: txData,
          commissionAllocations: distribution
        }, { merge: true });
        t.set(gigOrderRef, {
          status: "in_progress",
          paymentStatus: "paid",
          isPaid: true,
          settled: true,
          paidAmount: rawAmount,
          transactionId: txData.transaction_id || null,
          settledAt: import_firestore2.FieldValue.serverTimestamp(),
          commissionAllocations: distribution
        }, { merge: true });
      });
      if (alreadySettled) {
        return { success: true, alreadySettled: true };
      }
      if (this.notificationService && sellerUid && distribution) {
        try {
          await this.notificationService.sendNotificationToUser({
            recipientUserId: sellerUid,
            type: "gig_order_paid",
            title: "\u{1F389} PolyGig Order Paid & Started!",
            body: `You received an order of BDT ${distribution.grossBDT}. Net BDT ${distribution.sellerBDT} will be ready upon completion!`,
            deepLink: "/polygig?tab=orders",
            metadata: { orderId }
          });
        } catch {
        }
      }
      return { success: true, distribution: distribution || void 0 };
    } catch (err) {
      console.error(`[LedgerService] Failed to settle order #${orderId}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  /**
   * Atomically validates balance and reserves funds for withdrawal via server transaction.
   * Completely prevents double-spend under concurrency.
   */
  async requestWithdrawal(params) {
    if (!this.db) {
      return { success: false, error: "Firestore is not initialized." };
    }
    const { userUid, amountBDT, method, accountNumber, idempotencyKey, userName } = params;
    if (!amountBDT || isNaN(amountBDT) || amountBDT < 100) {
      return { success: false, error: "Minimum cashout limit is BDT 100." };
    }
    if (amountBDT > 25e3) {
      return { success: false, error: "Maximum single cashout limit is BDT 25,000." };
    }
    if (!accountNumber || accountNumber.trim().length < 11) {
      return { success: false, error: "Valid 11-digit mobile wallet number is required." };
    }
    const amountPaisa = Math.round(amountBDT * 100);
    const key = idempotencyKey || import_crypto.default.randomUUID();
    const withdrawalId = `wdr_${userUid.substring(0, 8)}_${Date.now()}`;
    const walletRef = this.db.collection("wallets").doc(userUid);
    const wdrRef = this.db.collection("withdrawals").doc(withdrawalId);
    const ledgerRef = this.db.collection("ledger_entries").doc(`ledg_${withdrawalId}_res`);
    try {
      let finalBalancePaisa = 0;
      await this.db.runTransaction(async (t) => {
        const dupQuery = await this.db.collection("withdrawals").where("idempotencyKey", "==", key).limit(1).get();
        if (!dupQuery.empty) {
          const existing = dupQuery.docs[0];
          throw new Error(`Duplicate request detected (ID: ${existing.id}).`);
        }
        const walletSnap = await t.get(walletRef);
        const walletData = walletSnap.exists ? walletSnap.data() : null;
        const availablePaisa = walletData?.withdrawableBalancePaisa || 0;
        if (availablePaisa < amountPaisa) {
          throw new Error(
            `Insufficient balance. Available: BDT ${(availablePaisa / 100).toFixed(2)}, Requested: BDT ${amountBDT.toFixed(2)}`
          );
        }
        const newWithdrawablePaisa = availablePaisa - amountPaisa;
        const newReservedPaisa = (walletData?.reservedBalancePaisa || 0) + amountPaisa;
        finalBalancePaisa = newWithdrawablePaisa;
        t.set(walletRef, {
          userId: userUid,
          withdrawableBalancePaisa: newWithdrawablePaisa,
          withdrawableBalanceBDT: newWithdrawablePaisa / 100,
          reservedBalancePaisa: newReservedPaisa,
          reservedBalanceBDT: newReservedPaisa / 100,
          updatedAt: import_firestore2.FieldValue.serverTimestamp()
        }, { merge: true });
        t.set(wdrRef, {
          id: withdrawalId,
          userId: userUid,
          userUid,
          userName: userName || "PolyNet Student",
          amount: amountBDT,
          amountPaisa,
          method,
          accountNumber: accountNumber.trim(),
          status: "pending",
          idempotencyKey: key,
          createdAt: import_firestore2.FieldValue.serverTimestamp(),
          updatedAt: import_firestore2.FieldValue.serverTimestamp()
        });
        t.set(ledgerRef, {
          entryId: `ledg_${withdrawalId}_res`,
          withdrawalId,
          accountType: "seller",
          accountUid: userUid,
          entryType: "withdrawal_reservation",
          amountPaisa,
          amountBDT,
          currency: "BDT",
          direction: "debit",
          idempotencyKey: key,
          sourceReference: withdrawalId,
          createdAt: import_firestore2.FieldValue.serverTimestamp()
        });
      });
      return {
        success: true,
        withdrawalId,
        newBalanceBDT: finalBalancePaisa / 100
      };
    } catch (err) {
      console.warn(`[LedgerService] Withdrawal request failed for ${userUid}:`, err.message || err);
      return { success: false, error: err?.message || "Withdrawal reservation failed" };
    }
  }
  /**
   * Processes manual payout review (approval or rejection) with atomic ledger settlement.
   * Completely restores funds on rejection; marks paid and settles on approval.
   */
  async processWithdrawalPayout(params) {
    if (!this.db) {
      return { success: false, error: "Firestore is not initialized." };
    }
    const { withdrawalId, adminUid, adminEmail, status, payoutReference, rejectionReason } = params;
    if (status === "completed" && !payoutReference?.trim()) {
      return { success: false, error: "A valid payout transaction reference is required." };
    }
    if (status === "rejected" && !rejectionReason?.trim()) {
      return { success: false, error: "A rejection reason is required." };
    }
    const wdrRef = this.db.collection("withdrawals").doc(withdrawalId);
    try {
      await this.db.runTransaction(async (t) => {
        const wdrSnap = await t.get(wdrRef);
        if (!wdrSnap.exists) {
          throw new Error(`Withdrawal #${withdrawalId} not found.`);
        }
        const wdr = wdrSnap.data();
        if (wdr?.status !== "pending") {
          throw new Error(`Withdrawal #${withdrawalId} is already marked '${wdr?.status}'.`);
        }
        const userUid = wdr.userUid || wdr.userId;
        if (userUid && userUid === adminUid) {
          throw new Error("Self-approval forbidden: An administrator cannot review or payout their own withdrawal request.");
        }
        const amountPaisa = wdr.amountPaisa || Math.round(Number(wdr.amount || 0) * 100);
        const walletRef = this.db.collection("wallets").doc(userUid);
        const walletSnap = await t.get(walletRef);
        const walletData = walletSnap.exists ? walletSnap.data() : null;
        const curReservedPaisa = walletData?.reservedBalancePaisa || 0;
        const newReservedPaisa = Math.max(0, curReservedPaisa - amountPaisa);
        if (status === "completed") {
          const curWithdrawn = walletData?.totalWithdrawnPaisa || 0;
          const newWithdrawn = curWithdrawn + amountPaisa;
          t.set(walletRef, {
            reservedBalancePaisa: newReservedPaisa,
            reservedBalanceBDT: newReservedPaisa / 100,
            totalWithdrawnPaisa: newWithdrawn,
            totalWithdrawnBDT: newWithdrawn / 100,
            updatedAt: import_firestore2.FieldValue.serverTimestamp()
          }, { merge: true });
          t.update(wdrRef, {
            status: "completed",
            payoutReference: payoutReference?.trim(),
            reviewedByUid: adminUid,
            reviewedByEmail: adminEmail,
            reviewedAt: import_firestore2.FieldValue.serverTimestamp(),
            updatedAt: import_firestore2.FieldValue.serverTimestamp()
          });
          const ledgerRef = this.db.collection("ledger_entries").doc(`ledg_${withdrawalId}_payout`);
          t.set(ledgerRef, {
            entryId: `ledg_${withdrawalId}_payout`,
            withdrawalId,
            accountType: "seller",
            accountUid: userUid,
            entryType: "manual_payout",
            amountPaisa,
            amountBDT: amountPaisa / 100,
            currency: "BDT",
            direction: "debit",
            idempotencyKey: `payout_${withdrawalId}`,
            sourceReference: payoutReference?.trim(),
            metadata: { reviewedByUid: adminUid, reviewedByEmail: adminEmail },
            createdAt: import_firestore2.FieldValue.serverTimestamp()
          });
        } else if (status === "rejected") {
          const curWithdrawable = walletData?.withdrawableBalancePaisa || 0;
          const newWithdrawable = curWithdrawable + amountPaisa;
          t.set(walletRef, {
            withdrawableBalancePaisa: newWithdrawable,
            withdrawableBalanceBDT: newWithdrawable / 100,
            reservedBalancePaisa: newReservedPaisa,
            reservedBalanceBDT: newReservedPaisa / 100,
            updatedAt: import_firestore2.FieldValue.serverTimestamp()
          }, { merge: true });
          t.update(wdrRef, {
            status: "rejected",
            rejectionReason: rejectionReason?.trim(),
            reviewedByUid: adminUid,
            reviewedByEmail: adminEmail,
            reviewedAt: import_firestore2.FieldValue.serverTimestamp(),
            updatedAt: import_firestore2.FieldValue.serverTimestamp()
          });
          const ledgerRef = this.db.collection("ledger_entries").doc(`ledg_${withdrawalId}_release`);
          t.set(ledgerRef, {
            entryId: `ledg_${withdrawalId}_release`,
            withdrawalId,
            accountType: "seller",
            accountUid: userUid,
            entryType: "withdrawal_release_or_failure",
            amountPaisa,
            amountBDT: amountPaisa / 100,
            currency: "BDT",
            direction: "credit",
            idempotencyKey: `release_${withdrawalId}`,
            sourceReference: rejectionReason?.trim(),
            metadata: { reviewedByUid: adminUid, reviewedByEmail: adminEmail },
            createdAt: import_firestore2.FieldValue.serverTimestamp()
          });
        }
        const auditLogRef = this.db.collection("admin_audit_logs").doc(`audit_payout_${withdrawalId}_${Date.now()}`);
        t.set(auditLogRef, {
          action: status === "completed" ? "payout_completed" : "payout_rejected",
          actorUid: adminUid,
          actorEmail: adminEmail,
          targetCollection: "withdrawals",
          targetDocId: withdrawalId,
          targetUserUid: userUid,
          details: {
            amountPaisa,
            status,
            payoutReference: payoutReference?.trim() || null,
            rejectionReason: rejectionReason?.trim() || null
          },
          createdAt: import_firestore2.FieldValue.serverTimestamp()
        });
      });
      return { success: true, status };
    } catch (err) {
      console.error(`[LedgerService] Failed processing payout for #${withdrawalId}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  /**
   * Processes order refund/reversal with strict seller balance verification
   * and append-only compensating ledger entries.
   * Prevents negative seller balances.
   */
  async refundGigOrder(params) {
    if (!this.db) {
      return { success: false, error: "Firestore is not initialized." };
    }
    const { orderId, reason, adminUid, adminEmail, refundReference, refundMethod, customerPhone } = params;
    if (!orderId?.trim()) {
      return { success: false, error: "Order ID is required." };
    }
    if (!reason?.trim()) {
      return { success: false, error: "Refund reason is required." };
    }
    const orderRef = this.db.collection("polygig_orders").doc(orderId);
    try {
      let alreadyRefunded = false;
      let summaryResult = null;
      await this.db.runTransaction(async (t) => {
        const orderSnap = await t.get(orderRef);
        if (!orderSnap.exists) {
          throw new Error(`Order #${orderId} not found.`);
        }
        const order = orderSnap.data();
        if (order?.status === "refunded" || order?.paymentStatus === "refunded") {
          alreadyRefunded = true;
          return;
        }
        if (!order?.settled && !order?.isPaid && order?.paymentStatus !== "paid") {
          throw new Error(`Order #${orderId} cannot be refunded because it has not been paid or settled.`);
        }
        const sellerUid = order.sellerUid;
        if (!sellerUid) {
          throw new Error(`Order #${orderId} has no associated sellerUid.`);
        }
        const rawAmount = Number(order.paidAmount || order.amount || 0);
        const grossPaisa = Math.round(rawAmount * 100);
        if (grossPaisa <= 0) {
          throw new Error(`Invalid order amount for #${orderId}.`);
        }
        let allocations = order.commissionAllocations;
        if (!allocations) {
          const sellerTuple = {
            polytechnic: order.polytechnic || "",
            technology: order.technology || "",
            semester: order.semester || "",
            shift: order.shift || "",
            group: order.group || ""
          };
          allocations = calculatePolyGigCommission(rawAmount, sellerTuple, []);
        }
        const unrecoveredLiabilities = [];
        let totalRecoveredPaisa = 0;
        let totalUnrecoveredPaisa = 0;
        const processAccountReversal = async (accountUid, accountType, targetPaisa, label) => {
          if (targetPaisa <= 0 || !accountUid) return;
          const wRef = this.db.collection("wallets").doc(accountUid);
          const wSnap = await t.get(wRef);
          const wData = wSnap.exists ? wSnap.data() : null;
          const curWithdrawable = Math.max(0, wData?.withdrawableBalancePaisa || 0);
          const recoveredPaisa = Math.min(curWithdrawable, targetPaisa);
          const unrecoveredPaisa = targetPaisa - recoveredPaisa;
          totalRecoveredPaisa += recoveredPaisa;
          totalUnrecoveredPaisa += unrecoveredPaisa;
          if (recoveredPaisa > 0) {
            const newWithdrawable = curWithdrawable - recoveredPaisa;
            const curTotal = wData?.totalEarnedPaisa || 0;
            const newTotal = Math.max(0, curTotal - recoveredPaisa);
            t.set(wRef, {
              userId: accountUid,
              withdrawableBalancePaisa: newWithdrawable,
              withdrawableBalanceBDT: newWithdrawable / 100,
              totalEarnedPaisa: newTotal,
              totalEarnedBDT: newTotal / 100,
              updatedAt: import_firestore2.FieldValue.serverTimestamp()
            }, { merge: true });
            const compEntryId = `ledg_ref_${orderId}_${label}_rec`;
            t.set(this.db.collection("ledger_entries").doc(compEntryId), {
              entryId: compEntryId,
              orderId,
              accountType,
              accountUid,
              entryType: "refund_or_reversal",
              amountPaisa: recoveredPaisa,
              amountBDT: recoveredPaisa / 100,
              currency: "BDT",
              direction: "debit",
              idempotencyKey: compEntryId,
              sourceReference: `refund_${orderId}`,
              metadata: {
                status: "recovered",
                label,
                targetPaisa,
                recoveredPaisa,
                unrecoveredPaisa,
                reason: reason?.trim(),
                adminUid,
                adminEmail
              },
              createdAt: import_firestore2.FieldValue.serverTimestamp()
            });
          }
          if (unrecoveredPaisa > 0) {
            const liabEntryId = `ledg_ref_${orderId}_${label}_liab`;
            t.set(this.db.collection("ledger_entries").doc(liabEntryId), {
              entryId: liabEntryId,
              orderId,
              accountType,
              accountUid,
              entryType: "refund_or_reversal",
              amountPaisa: unrecoveredPaisa,
              amountBDT: unrecoveredPaisa / 100,
              currency: "BDT",
              direction: "debit",
              idempotencyKey: liabEntryId,
              sourceReference: `refund_${orderId}`,
              metadata: {
                status: "unrecovered_liability",
                liabilityType: "outstanding_reversal",
                label,
                targetPaisa,
                recoveredPaisa,
                unrecoveredPaisa,
                reason: "insufficient_withdrawable_balance",
                adminUid,
                adminEmail
              },
              createdAt: import_firestore2.FieldValue.serverTimestamp()
            });
            unrecoveredLiabilities.push({
              accountType,
              accountUid,
              targetPaisa,
              recoveredPaisa,
              unrecoveredPaisa,
              reason: "insufficient_withdrawable_balance"
            });
          }
        };
        await processAccountReversal(sellerUid, "seller", allocations.sellerPaisa, "seller");
        if (!allocations.crIsReserve && allocations.crUid && allocations.crUid !== "authority_reserve") {
          await processAccountReversal(allocations.crUid, "cr", allocations.crCommissionPaisa, "cr");
        } else {
          await processAccountReversal("authority_reserve", "authority_reserve", allocations.crCommissionPaisa, "cr_res");
        }
        if (!allocations.moderatorIsReserve && allocations.moderatorUid && allocations.moderatorUid !== "authority_reserve") {
          await processAccountReversal(allocations.moderatorUid, "moderator", allocations.moderatorCommissionPaisa, "mod");
        } else {
          await processAccountReversal("authority_reserve", "authority_reserve", allocations.moderatorCommissionPaisa, "mod_res");
        }
        await processAccountReversal("polynet_authority", "authority", allocations.authorityCommissionPaisa, "auth_comm");
        const custRefundEntryId = `ledg_ref_${orderId}_customer_refund`;
        t.set(this.db.collection("ledger_entries").doc(custRefundEntryId), {
          entryId: custRefundEntryId,
          orderId,
          accountType: "eps_gateway",
          accountUid: "eps_system",
          entryType: "refund_or_reversal",
          amountPaisa: allocations.grossPaisa,
          amountBDT: allocations.grossPaisa / 100,
          currency: "BDT",
          direction: "debit",
          idempotencyKey: custRefundEntryId,
          sourceReference: `refund_${orderId}`,
          metadata: {
            externalGatewayRefundConfirmed: false,
            epsFeeRetainedByGatewayPaisa: allocations.epsFeePaisa,
            note: "Internal accounting reversal; external EPS refund is not programmatically confirmed by gateway provider.",
            refundReference: refundReference?.trim() || null,
            refundMethod: refundMethod?.trim() || "MFS_Manual",
            customerPhone: customerPhone?.trim() || null,
            adminUid,
            adminEmail
          },
          createdAt: import_firestore2.FieldValue.serverTimestamp()
        });
        t.set(orderRef, {
          status: "cancelled",
          paymentStatus: "refunded",
          refundReason: reason?.trim(),
          refundReference: refundReference?.trim() || null,
          refundMethod: refundMethod?.trim() || "MFS_Manual",
          customerPhone: customerPhone?.trim() || null,
          refundedByUid: adminUid,
          refundedByEmail: adminEmail,
          refundSummary: {
            grossPaisa: allocations.grossPaisa,
            totalRecoveredPaisa,
            totalUnrecoveredPaisa,
            unrecoveredLiabilities,
            refundReference: refundReference?.trim() || null,
            refundMethod: refundMethod?.trim() || "MFS_Manual",
            customerPhone: customerPhone?.trim() || null,
            externalGatewayRefundConfirmed: false,
            refundedAt: import_firestore2.FieldValue.serverTimestamp()
          },
          refundedAt: import_firestore2.FieldValue.serverTimestamp(),
          updatedAt: import_firestore2.FieldValue.serverTimestamp()
        }, { merge: true });
        const txRef = this.db.collection("payment_transactions").doc(`tx_order_${orderId}`);
        t.set(txRef, {
          status: "refunded",
          refundReason: reason?.trim(),
          refundReference: refundReference?.trim() || null,
          refundMethod: refundMethod?.trim() || "MFS_Manual",
          refundedAt: import_firestore2.FieldValue.serverTimestamp(),
          updatedAt: import_firestore2.FieldValue.serverTimestamp()
        }, { merge: true });
        const auditRef = this.db.collection("admin_audit_logs").doc(`audit_refund_${orderId}_${Date.now()}`);
        t.set(auditRef, {
          action: "order_refunded",
          actorUid: adminUid,
          actorEmail: adminEmail,
          targetCollection: "polygig_orders",
          targetDocId: orderId,
          targetUserUid: sellerUid,
          details: {
            orderId,
            grossPaisa: allocations.grossPaisa,
            totalRecoveredPaisa,
            totalUnrecoveredPaisa,
            unrecoveredLiabilities,
            refundReference: refundReference?.trim() || null,
            refundMethod: refundMethod?.trim() || "MFS_Manual",
            customerPhone: customerPhone?.trim() || null,
            reason: reason?.trim()
          },
          createdAt: import_firestore2.FieldValue.serverTimestamp()
        });
        summaryResult = {
          grossPaisa: allocations.grossPaisa,
          totalRecoveredPaisa,
          totalUnrecoveredPaisa,
          unrecoveredLiabilities,
          refundReference: refundReference?.trim() || null,
          refundMethod: refundMethod?.trim() || "MFS_Manual"
        };
      });
      if (alreadyRefunded) {
        return { success: true, alreadyRefunded: true };
      }
      return { success: true, ...summaryResult };
    } catch (err) {
      console.error(`[LedgerService] Failed refunding order #${orderId}:`, err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  /**
   * Retrieves server-authoritative wallet balance for a user.
   */
  async getUserWallet(userUid) {
    if (!this.db) {
      return {
        userId: userUid,
        withdrawableBalancePaisa: 0,
        withdrawableBalanceBDT: 0,
        reservedBalancePaisa: 0,
        reservedBalanceBDT: 0,
        totalEarnedPaisa: 0,
        totalEarnedBDT: 0,
        totalWithdrawnPaisa: 0,
        totalWithdrawnBDT: 0,
        updatedAt: null
      };
    }
    const walletSnap = await this.db.collection("wallets").doc(userUid).get();
    if (!walletSnap.exists) {
      return {
        userId: userUid,
        withdrawableBalancePaisa: 0,
        withdrawableBalanceBDT: 0,
        reservedBalancePaisa: 0,
        reservedBalanceBDT: 0,
        totalEarnedPaisa: 0,
        totalEarnedBDT: 0,
        totalWithdrawnPaisa: 0,
        totalWithdrawnBDT: 0,
        updatedAt: null
      };
    }
    const data = walletSnap.data();
    return {
      userId: userUid,
      withdrawableBalancePaisa: data?.withdrawableBalancePaisa || 0,
      withdrawableBalanceBDT: (data?.withdrawableBalancePaisa || 0) / 100,
      reservedBalancePaisa: data?.reservedBalancePaisa || 0,
      reservedBalanceBDT: (data?.reservedBalancePaisa || 0) / 100,
      totalEarnedPaisa: data?.totalEarnedPaisa || 0,
      totalEarnedBDT: (data?.totalEarnedPaisa || 0) / 100,
      totalWithdrawnPaisa: data?.totalWithdrawnPaisa || 0,
      totalWithdrawnBDT: (data?.totalWithdrawnPaisa || 0) / 100,
      updatedAt: data?.updatedAt || null
    };
  }
};

// src/server/paymentService.ts
var PaymentService = class {
  constructor(db, notificationService2) {
    this.baseUrl = "https://system.eklas.dev";
    this.db = db;
    this.notificationService = notificationService2;
    this.ledgerService = new LedgerService(db, notificationService2);
    this.apiKey = process.env.EKLAS_PAYMENT_API_KEY || process.env.EKLAS_API_KEY || process.env.EPS_API_KEY || "";
    this.clientId = process.env.EKLAS_PAYMENT_CLIENT_ID || process.env.EKLAS_CLIENT_ID || process.env.EPS_CLIENT_ID || "";
    this.webhookSecret = process.env.EKLAS_PAYMENT_WEBHOOK_SECRET || process.env.EKLAS_WEBHOOK_SECRET || process.env.EPS_WEBHOOK_SECRET || "";
    this.baseUrl = (process.env.EKLAS_PAYMENT_BASE_URL || process.env.EPS_BASE_URL || "https://system.eklas.dev").replace(/\/+$/, "");
    if (!this.apiKey || !this.clientId || !this.webhookSecret) {
      console.warn("[PaymentService] Notice: Payment gateway credentials not fully configured in environment.");
    }
  }
  getLedgerService() {
    return this.ledgerService;
  }
  /**
   * Reports configuration status safely without printing or leaking any credential values.
   */
  getConfigurationStatus() {
    const isSandbox = (process.env.EKLAS_PAYMENT_MODE || "").toLowerCase() === "sandbox" || this.baseUrl.includes("sandbox") || this.apiKey.startsWith("sk_test_") || this.apiKey.startsWith("pk_test_");
    return {
      isConfigured: Boolean(this.apiKey && this.clientId && this.webhookSecret),
      hasApiKey: Boolean(this.apiKey),
      hasClientId: Boolean(this.clientId),
      hasWebhookSecret: Boolean(this.webhookSecret),
      mode: isSandbox ? "sandbox" : "live",
      baseUrl: this.baseUrl
    };
  }
  /**
   * Initiates an EPS checkout payment session via Eklas Payment API
   */
  async createPayment(params) {
    if (!this.apiKey || !this.clientId) {
      throw new Error("Payment gateway credentials are not configured on the server.");
    }
    const hostUrl = params.appUrl || process.env.APP_URL || "https://mypolynet.com";
    const cleanHost = hostUrl.replace(/\/$/, "");
    const successUrl = `${cleanHost}/?payment=success&order_id=${encodeURIComponent(params.orderId)}&type=${params.metadata.type}`;
    const failUrl = `${cleanHost}/?payment=failed&order_id=${encodeURIComponent(params.orderId)}&type=${params.metadata.type}`;
    const cancelUrl = `${cleanHost}/?payment=cancelled&order_id=${encodeURIComponent(params.orderId)}&type=${params.metadata.type}`;
    const backendHost = process.env.BACKEND_URL || process.env.WEBHOOK_BASE_URL || cleanHost;
    const cleanBackendHost = backendHost.replace(/\/$/, "");
    const webhookUrl = `${cleanBackendHost}/api/payment/webhook`;
    const payload = {
      order_id: params.orderId,
      amount: Math.max(1, Number(params.amount)),
      currency: "BDT",
      product_name: params.productName.substring(0, 80),
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl,
      customer: {
        name: params.customer.name || "PolyNet Student",
        email: params.customer.email || "student@polynet.com",
        phone: params.customer.phone || "01700000000"
      }
    };
    console.log(`[PaymentService] Creating payment for Order #${params.orderId} (${params.amount} BDT)...`);
    const res = await fetch(`${this.baseUrl}/api/v1/payment/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Client-Id": this.clientId,
        "Idempotency-Key": params.orderId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const errMsg = data?.error?.message || `Payment creation failed with status ${res.status}`;
      console.error("[PaymentService] Failed to create payment session:", data);
      throw new Error(errMsg);
    }
    if (this.db) {
      try {
        await this.db.collection("payment_transactions").doc(params.orderId).set({
          orderId: params.orderId,
          transactionId: data.data?.transaction_id || null,
          epsTransactionId: data.data?.eps_transaction_id || null,
          checkoutUrl: data.data?.checkout_url || null,
          amount: params.amount,
          currency: "BDT",
          productName: params.productName,
          customer: params.customer,
          metadata: params.metadata,
          status: "pending",
          createdAt: import_firestore3.FieldValue.serverTimestamp(),
          updatedAt: import_firestore3.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (dbErr) {
        console.warn("[PaymentService] Could not persist initial transaction log:", dbErr);
      }
    }
    return {
      success: true,
      transactionId: data.data?.transaction_id,
      checkoutUrl: data.data?.checkout_url,
      orderId: params.orderId
    };
  }
  /**
   * Verifies an EPS transaction status via Eklas Payment API
   */
  async verifyPayment(orderIdOrTransactionId) {
    const body = {};
    if (orderIdOrTransactionId.transactionId) {
      body.transaction_id = orderIdOrTransactionId.transactionId;
    } else if (orderIdOrTransactionId.orderId) {
      body.order_id = orderIdOrTransactionId.orderId;
    } else {
      throw new Error("orderId or transactionId is required for verification");
    }
    console.log("[PaymentService] Verifying payment status:", body);
    const res = await fetch(`${this.baseUrl}/api/v1/payment/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Client-Id": this.clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.warn("[PaymentService] Verification response not successful:", data);
      return { success: false, status: "failed", error: data?.error?.message || "Verification failed" };
    }
    const txData = data.data;
    const isPaid = txData?.status === "success";
    if (isPaid && this.db) {
      await this.settleOrderAndCommissions(txData);
    }
    return {
      success: true,
      status: txData.status,
      isPaid,
      data: txData
    };
  }
  /**
   * Retrieves payment transaction status by transaction_id via official EPS GET endpoint
   */
  async getTransactionStatus(transactionId) {
    if (!transactionId) {
      throw new Error("transactionId is required");
    }
    const res = await fetch(`${this.baseUrl}/api/v1/payment/${encodeURIComponent(transactionId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-Client-Id": this.clientId
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        success: false,
        status: res.status,
        error: data?.error?.message || `Failed with status ${res.status}`
      };
    }
    return {
      success: true,
      status: data.data?.status,
      data: data.data
    };
  }
  /**
   * Verifies Webhook HMAC-SHA256 signature from system.eklas.dev
   */
  verifyWebhookSignature(signatureHeader, rawBody) {
    if (!signatureHeader || !this.webhookSecret || !rawBody || typeof rawBody !== "string") {
      return false;
    }
    const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/i);
    if (!match) return false;
    const timestamp = match[1];
    const signature = match[2];
    const tsNum = Number(timestamp);
    if (isNaN(tsNum)) return false;
    const eventTimeMs = tsNum > 1e11 ? tsNum : tsNum * 1e3;
    const nowMs = Date.now();
    const toleranceMs = 5 * 60 * 1e3;
    if (Math.abs(nowMs - eventTimeMs) > toleranceMs) {
      console.warn(`[Payment Webhook] Signature rejected due to timestamp expiration/drift: ${timestamp}`);
      return false;
    }
    const expectedSignature = import_crypto2.default.createHmac("sha256", this.webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex");
    try {
      const sigBuf = Buffer.from(signature, "hex");
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      if (sigBuf.length !== expectedBuf.length) {
        return false;
      }
      return import_crypto2.default.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  }
  /**
   * Settles the order in Firestore, updates balances, and awards CR (3%) & Moderator (1%) commissions
   */
  async settleOrderAndCommissions(txData) {
    if (!this.db) return;
    const orderId = txData.order_id;
    if (!orderId) return;
    try {
      const txRef = this.db.collection("payment_transactions").doc(orderId);
      const initTxSnap = await txRef.get();
      const txRecord = initTxSnap.exists ? initTxSnap.data() : null;
      const metadata = txRecord?.metadata || {};
      const orderType = metadata.type || "gig";
      const {
        sellerUid,
        polytechnic,
        technology,
        semester,
        shift,
        group
      } = metadata;
      if (orderType === "gig") {
        return await this.ledgerService.settleGigOrder(orderId, txData);
      }
      let alreadySettled = false;
      let amount = 0;
      await this.db.runTransaction(async (t) => {
        const txSnap = await t.get(txRef);
        if (txSnap.exists && txSnap.data()?.settled) {
          alreadySettled = true;
          return;
        }
        const record = txSnap.exists ? txSnap.data() : null;
        if (txData.currency && txData.currency.toUpperCase() !== "BDT") {
          throw new Error(`[PaymentService] Security Alert: Currency mismatch. Expected BDT, got ${txData.currency}`);
        }
        if (record?.amount != null && txData.amount != null) {
          const expected = Number(record.amount);
          const incoming = Number(txData.amount);
          if (!isNaN(expected) && !isNaN(incoming) && Math.abs(incoming - expected) > 0.01) {
            throw new Error(`[PaymentService] Security Alert: Amount mismatch for order #${orderId}. Expected ${expected}, got ${incoming}`);
          }
        }
        amount = parseFloat(txData.amount || record?.amount || 0);
        t.set(txRef, {
          status: "success",
          settled: true,
          settledAt: import_firestore3.FieldValue.serverTimestamp(),
          epsData: txData
        }, { merge: true });
      });
      if (alreadySettled) {
        console.log(`[PaymentService] Order #${orderId} has already been settled.`);
        return { success: true, alreadySettled: true };
      }
      if (orderType === "store") {
        const storeOrderRef = this.db.collection("buy_sell_orders").doc(orderId);
        await storeOrderRef.set({
          status: "paid",
          paymentStatus: "paid",
          paidAmount: amount,
          transactionId: txData.transaction_id,
          paidAt: import_firestore3.FieldValue.serverTimestamp()
        }, { merge: true });
        if (sellerUid && this.notificationService) {
          await this.notificationService.sendNotificationToUser({
            recipientUserId: sellerUid,
            type: "store_order_paid",
            title: "\u{1F6CD}\uFE0F PolyStore Item Purchased!",
            body: `A buyer paid BDT ${amount} for your product. Check your orders to deliver!`,
            deepLink: "/market",
            metadata: { orderId }
          });
        }
      }
      const crCommissionAmount = Math.round(amount * 0.03 * 100) / 100;
      const modCommissionAmount = Math.round(amount * 0.01 * 100) / 100;
      if (polytechnic && technology && semester) {
        try {
          const usersRef = this.db.collection("users");
          const crQuery = await usersRef.where("isCr", "==", true).where("polytechnic", "==", polytechnic).get();
          crQuery.forEach(async (doc) => {
            const u = doc.data();
            const uTech = (u.technology || u.department || "").toLowerCase();
            const uSem = (u.semester || "").toLowerCase();
            const uShift = (u.shift || "").toLowerCase();
            const uGrp = (u.group || "").toLowerCase();
            const isClassMatch = uTech.includes(technology.toLowerCase()) && uSem.includes(semester.toLowerCase()) && (!shift || !uShift || uShift === shift.toLowerCase()) && (!group || !uGrp || uGrp === group.toLowerCase());
            if (isClassMatch) {
              const crUid = doc.id;
              await this.db.collection("cr_commissions").add({
                crUid,
                crName: u.displayName || "Class CR",
                orderId,
                orderType,
                amount,
                commissionRate: "3%",
                commissionAmount: crCommissionAmount,
                createdAt: import_firestore3.FieldValue.serverTimestamp()
              });
              const crWalletRef = this.db.collection("wallets").doc(crUid);
              await crWalletRef.set({
                balance: import_firestore3.FieldValue.increment(crCommissionAmount),
                totalCrEarnings: import_firestore3.FieldValue.increment(crCommissionAmount),
                updatedAt: import_firestore3.FieldValue.serverTimestamp()
              }, { merge: true });
              console.log(`[PaymentService] Credited 3% CR Commission (BDT ${crCommissionAmount}) to CR ${crUid}`);
            }
          });
        } catch (crErr) {
          console.warn("[PaymentService] Error distributing CR commission:", crErr);
        }
      }
      if (polytechnic) {
        try {
          const usersRef = this.db.collection("users");
          const modQuery = await usersRef.where("isModerator", "==", true).where("moderatorPolytechnic", "==", polytechnic).get();
          modQuery.forEach(async (doc) => {
            const modUid = doc.id;
            const u = doc.data();
            await this.db.collection("moderator_commissions").add({
              moderatorUid: modUid,
              moderatorName: u.displayName || "Campus Moderator",
              orderId,
              orderType,
              amount,
              commissionRate: "1%",
              commissionAmount: modCommissionAmount,
              createdAt: import_firestore3.FieldValue.serverTimestamp()
            });
            const modWalletRef = this.db.collection("wallets").doc(modUid);
            await modWalletRef.set({
              balance: import_firestore3.FieldValue.increment(modCommissionAmount),
              totalModeratorEarnings: import_firestore3.FieldValue.increment(modCommissionAmount),
              updatedAt: import_firestore3.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`[PaymentService] Credited 1% Moderator Commission (BDT ${modCommissionAmount}) to Mod ${modUid}`);
          });
        } catch (modErr) {
          console.warn("[PaymentService] Error distributing Moderator commission:", modErr);
        }
      }
      console.log(`[PaymentService] Successfully settled Order #${orderId} for BDT ${amount}`);
      return { success: true };
    } catch (err) {
      console.error("[PaymentService] Error in settleOrderAndCommissions:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }
  /**
   * Dispatches and processes all incoming webhook event lifecycles.
   * Enforces zero balance mutations on non-success events and idempotency on duplicate events.
   */
  async handleWebhookPayload(eventData) {
    const orderId = eventData?.order_id || eventData?.orderId;
    if (!orderId) {
      return { handled: false, status: "ignored" };
    }
    const rawEvent = (eventData?.event || eventData?.status || "").toLowerCase();
    if (rawEvent === "payment.success" || rawEvent === "success") {
      const res = await this.settleOrderAndCommissions(eventData);
      if (res && res.success === false) {
        return {
          handled: false,
          status: "ignored",
          orderId,
          error: res?.error || "Settlement failed"
        };
      }
      return {
        handled: true,
        status: res?.alreadySettled ? "already_settled" : "settled",
        orderId
      };
    }
    if (rawEvent === "payment.failed" || rawEvent === "failed") {
      if (this.db) {
        try {
          const txRef = this.db.collection("payment_transactions").doc(orderId);
          const snap = await txRef.get();
          if (!snap.exists || !snap.data()?.settled) {
            await txRef.set({
              status: "failed",
              epsData: eventData,
              updatedAt: import_firestore3.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        } catch {
        }
      }
      return { handled: true, status: "failed", orderId };
    }
    if (rawEvent === "payment.cancelled" || rawEvent === "cancelled") {
      if (this.db) {
        try {
          const txRef = this.db.collection("payment_transactions").doc(orderId);
          const snap = await txRef.get();
          if (!snap.exists || !snap.data()?.settled) {
            await txRef.set({
              status: "cancelled",
              epsData: eventData,
              updatedAt: import_firestore3.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        } catch {
        }
      }
      return { handled: true, status: "cancelled", orderId };
    }
    if (rawEvent === "payment.timeout" || rawEvent === "timeout" || rawEvent === "payment.expired" || rawEvent === "expired") {
      if (this.db) {
        try {
          const txRef = this.db.collection("payment_transactions").doc(orderId);
          const snap = await txRef.get();
          if (!snap.exists || !snap.data()?.settled) {
            await txRef.set({
              status: "timeout",
              epsData: eventData,
              updatedAt: import_firestore3.FieldValue.serverTimestamp()
            }, { merge: true });
          }
        } catch {
        }
      }
      return { handled: true, status: "timeout", orderId };
    }
    if (rawEvent === "payment.pending" || rawEvent === "pending") {
      return { handled: true, status: "pending", orderId };
    }
    return { handled: true, status: "ignored", orderId };
  }
};

// server.ts
import_dotenv.default.config();
function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
var adminDb = null;
var notificationService = null;
var paymentService = null;
var ledgerService = null;
var hasAdminCredentials = false;
try {
  const { serviceAccount, source } = getResolvedServiceAccount();
  if ((0, import_app.getApps)().length === 0) {
    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
      (0, import_app.initializeApp)({
        credential: (0, import_app.cert)(serviceAccount),
        projectId: serviceAccount.project_id || "hn-vendor"
      });
      adminDb = (0, import_firestore4.getFirestore)();
      adminDb.settings({ ignoreUndefinedProperties: true });
      notificationService = new NotificationService(adminDb, (0, import_messaging.getMessaging)(), (0, import_auth.getAuth)());
      hasAdminCredentials = true;
      console.log(`[Firebase Admin] Initialized with Service Account Key (${source}) for project: ${serviceAccount.project_id}`);
    } else {
      const configPath = import_path2.default.join(process.cwd(), "firebase-applet-config.json");
      if (import_fs2.default.existsSync(configPath)) {
        const configData = JSON.parse(import_fs2.default.readFileSync(configPath, "utf8"));
        if (configData.projectId) {
          (0, import_app.initializeApp)({
            projectId: configData.projectId
          });
          adminDb = (0, import_firestore4.getFirestore)();
          adminDb.settings({ ignoreUndefinedProperties: true });
          notificationService = new NotificationService(adminDb, (0, import_messaging.getMessaging)(), (0, import_auth.getAuth)());
          console.log(`[Firebase Admin] Initialized without credentials for project: ${configData.projectId}`);
        }
      }
    }
  } else {
    adminDb = (0, import_firestore4.getFirestore)();
    adminDb.settings({ ignoreUndefinedProperties: true });
    notificationService = new NotificationService(adminDb, (0, import_messaging.getMessaging)(), (0, import_auth.getAuth)());
    hasAdminCredentials = true;
  }
} catch (error) {
  console.warn("Notice: Firebase Admin SDK initialization details:", error?.message || error);
}
try {
  paymentService = new PaymentService(adminDb, notificationService);
  ledgerService = paymentService.getLedgerService();
  console.log("[PaymentService] Successfully initialized EPS Payment Gateway & PolyGig Ledger service.");
} catch (pErr) {
  console.warn("[PaymentService] Initialization warning:", pErr);
}
var googleServiceAccountPath = import_path2.default.join(
  process.cwd(),
  "google-drive-service-account.json"
);
var googleCredentialsPath = import_path2.default.join(
  process.cwd(),
  "google-oauth-client.json"
);
var TARGET_POLYNET_FOLDER_ID = "12DH0Y4FHY1FuNzZajzjn2dA8FKTy2wCy";
var DEFAULT_VERIFIED_TOKENS = process.env.GOOGLE_DRIVE_REFRESH_TOKEN ? {
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  token_type: "Bearer",
  scope: "https://www.googleapis.com/auth/drive"
} : null;
var googleDriveAuthClient = null;
var googleOAuthClient = null;
var cachedReelsFolderId = TARGET_POLYNET_FOLDER_ID;
var cachedGoogleDriveTokens = DEFAULT_VERIFIED_TOKENS;
async function saveGoogleDriveTokensToFirestore(newTokens) {
  const mergedTokens = { ...cachedGoogleDriveTokens || DEFAULT_VERIFIED_TOKENS || {}, ...newTokens };
  if (!mergedTokens.refresh_token && cachedGoogleDriveTokens?.refresh_token) {
    mergedTokens.refresh_token = cachedGoogleDriveTokens.refresh_token;
  }
  cachedGoogleDriveTokens = mergedTokens;
  if (googleDriveAuthClient && typeof googleDriveAuthClient.setCredentials === "function") {
    googleDriveAuthClient.setCredentials(mergedTokens);
  }
  try {
    const oldTokenPath = import_path2.default.join(process.cwd(), "google-drive-token.json");
    if (import_fs2.default.existsSync(oldTokenPath)) {
      import_fs2.default.unlinkSync(oldTokenPath);
    }
  } catch {
  }
  if (adminDb && hasAdminCredentials) {
    try {
      await adminDb.collection("system_settings").doc("google_drive_oauth").set({
        ...mergedTokens,
        updatedAt: import_firestore4.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log("[Google Drive] Secure tokens saved to Firestore (system_settings/google_drive_oauth).");
    } catch (dbErr) {
      console.warn("[Google Drive] Notice: Token update skipped in Firestore (verified in-memory tokens remain active):", dbErr?.message || dbErr);
    }
  }
}
async function loadGoogleDriveTokensFromFirestore() {
  if (cachedGoogleDriveTokens && cachedGoogleDriveTokens.refresh_token) {
    return cachedGoogleDriveTokens;
  }
  if (adminDb && hasAdminCredentials) {
    try {
      const doc = await adminDb.collection("system_settings").doc("google_drive_oauth").get();
      if (doc.exists) {
        const data = doc.data();
        cachedGoogleDriveTokens = { ...DEFAULT_VERIFIED_TOKENS || {}, ...data };
        if (googleDriveAuthClient && typeof googleDriveAuthClient.setCredentials === "function" && cachedGoogleDriveTokens) {
          googleDriveAuthClient.setCredentials(cachedGoogleDriveTokens);
        }
        return cachedGoogleDriveTokens;
      }
    } catch (err) {
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
    } catch {
    }
  }
  cachedGoogleDriveTokens = DEFAULT_VERIFIED_TOKENS;
  return cachedGoogleDriveTokens;
}
function initializeGoogleOAuth() {
  let credentials = null;
  if (import_fs2.default.existsSync(googleCredentialsPath)) {
    try {
      credentials = JSON.parse(
        import_fs2.default.readFileSync(googleCredentialsPath, "utf8")
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
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || (config.redirect_uris && config.redirect_uris.length > 0 ? config.redirect_uris[0] : null) || "https://mypolynet.com/auth/google/callback";
    const oauth2Client = new import_googleapis.google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      redirectUri
    );
    oauth2Client.setCredentials(DEFAULT_VERIFIED_TOKENS);
    oauth2Client.on("tokens", (newTokens) => {
      saveGoogleDriveTokensToFirestore(newTokens).catch((err) => {
        console.error("[Google Drive] Failed to save refreshed tokens to Firestore:", err);
      });
    });
    loadGoogleDriveTokensFromFirestore().then((tokens) => {
      if (tokens && oauth2Client) {
        oauth2Client.setCredentials(tokens);
      }
    }).catch(() => {
    });
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
initializeGoogleOAuth();
async function getAuthorizedGoogleDriveClient() {
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
  } catch (err) {
    console.warn("[Google Drive] Refreshing access token via refresh token...", err?.message || err);
    try {
      const refreshed = await googleDriveAuthClient.refreshAccessToken();
      if (refreshed?.credentials) {
        googleDriveAuthClient.setCredentials(refreshed.credentials);
      }
    } catch (refErr) {
      console.error("[Google Drive] Token refresh failed:", refErr?.message || refErr);
    }
  }
  return import_googleapis.google.drive({ version: "v3", auth: googleDriveAuthClient });
}
function getGoogleDriveClient() {
  if (!googleDriveAuthClient) {
    googleDriveAuthClient = initializeGoogleOAuth();
  }
  if (!googleDriveAuthClient) return null;
  return import_googleapis.google.drive({ version: "v3", auth: googleDriveAuthClient });
}
async function getOrCreatePolyNetReelsFolder(driveInstance) {
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
      return cachedReelsFolderId;
    }
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
    return cachedReelsFolderId;
  } catch (err) {
    console.error("[Google Drive] Failed to get/create 'PolyNet Reels' folder:", err);
    throw err;
  }
}
async function uploadReelToGoogleDrive(drive, buffer, originalFilename, mimeType, folderId) {
  const ext = originalFilename.includes(".") ? originalFilename.split(".").pop()?.toLowerCase() || "mp4" : mimeType.includes("webm") ? "webm" : mimeType.includes("quicktime") ? "mov" : "mp4";
  const sanitizedOriginal = originalFilename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
  const uniqueName = `polynet_reel_${Date.now()}_${import_crypto3.default.randomBytes(6).toString("hex")}_${sanitizedOriginal}.${ext}`;
  const readableStream = import_stream.Readable.from(buffer);
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
    media,
    fields: "id, name, size, mimeType, createdTime, webViewLink, webContentLink"
  });
  const uploadedFileId = uploadRes.data.id;
  drive.permissions.create({
    fileId: uploadedFileId,
    requestBody: {
      role: "reader",
      type: "anyone"
    }
  }).catch((permErr) => {
    console.warn("[Google Drive] Non-blocking permission set notice:", permErr?.message);
  });
  return {
    fileId: uploadedFileId,
    fileName: uploadRes.data.name,
    fileSize: uploadRes.data.size ? parseInt(uploadRes.data.size, 10) : buffer.length,
    mimeType: uploadRes.data.mimeType || mimeType,
    createdTime: uploadRes.data.createdTime || (/* @__PURE__ */ new Date()).toISOString(),
    webViewLink: uploadRes.data.webViewLink,
    webContentLink: uploadRes.data.webContentLink
  };
}
var upload = (0, import_multer.default)({
  storage: import_multer.default.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }
  // 200MB max video size for PolyNet Reels
});
function cleanReplyText(text) {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/Support\s+Pollinations\.AI:[\s\S]*/gi, "");
  cleaned = cleaned.replace(/Powered\s+by\s+Pollinations\.AI[\s\S]*/gi, "");
  cleaned = cleaned.replace(/---[\s]*\n*🌸\s*Ad\s*🌸[\s\S]*/gi, "");
  cleaned = cleaned.replace(/🌸\s*Ad\s*🌸[\s\S]*/gi, "");
  cleaned = cleaned.replace(/Pollinations\.AI\s+free\s+text\s+APIs[\s\S]*/gi, "");
  cleaned = cleaned.replace(/\[Support\s+our\s+mission\]\(https:\/\/pollinations\.ai\/redirect\/kofi\)[\s\S]*/gi, "");
  cleaned = cleaned.replace(/https:\/\/pollinations\.ai\/redirect\/kofi/gi, "");
  return cleaned.trim();
}
var SimpleRateLimiter = class {
  constructor(windowMs, maxRequests) {
    this.store = /* @__PURE__ */ new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1e3).unref();
  }
  isRateLimited(key) {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { limited: false, retryAfterSeconds: 0 };
    }
    if (entry.count >= this.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1e3));
      return { limited: true, retryAfterSeconds };
    }
    entry.count++;
    return { limited: false, retryAfterSeconds: 0 };
  }
};
var passwordResetLimiter = new SimpleRateLimiter(15 * 60 * 1e3, 5);
var aiLimiter = new SimpleRateLimiter(60 * 1e3, 30);
async function bootstrapServer() {
  const app = (0, import_express.default)();
  const ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
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
    "http://localhost"
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
  app.use(import_express.default.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
  app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      service: "polynet-backend",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/payment/create", async (req, res) => {
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
      const orderType = metadata?.type || "gig";
      let verifiedAmount = Math.max(1, Number(amount));
      let sellerUid = metadata?.sellerUid;
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
        ...metadata || {},
        type: orderType,
        itemId: String(orderId),
        buyerUid: authUser.uid,
        buyerEmail: authUser.email,
        sellerUid: sellerUid || metadata?.sellerUid
      };
      const result = await paymentService.createPayment({
        orderId: String(orderId),
        amount: verifiedAmount,
        productName: productName || `Order #${orderId}`,
        customer: customer || { name: "PolyNet Student", phone: "01700000000" },
        metadata: safeMetadata,
        appUrl: process.env.APP_URL || host
      });
      return res.json(result);
    } catch (err) {
      console.error("[Payment API] Error in /api/payment/create:", err);
      return res.status(500).json({ success: false, error: err?.message || "Failed to create payment session" });
    }
  });
  app.post("/api/payment/verify", async (req, res) => {
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
    } catch (err) {
      console.error("[Payment API] Error in /api/payment/verify:", err);
      return res.status(500).json({ success: false, error: err?.message || "Verification failed" });
    }
  });
  app.get("/api/payment/webhook", (_req, res) => {
    return res.status(405).json({
      error: "Method Not Allowed",
      message: "EPS Webhook receiver accepts POST requests only with valid x-gateway-signature header."
    });
  });
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const sigHeader = req.headers["x-gateway-signature"] || req.headers["X-Gateway-Signature"];
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : typeof req.body === "string" ? req.body : "";
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
    } catch (err) {
      console.error("[Payment Webhook] Processing error:", err?.message || String(err));
      return res.status(500).send("Internal server error");
    }
  });
  app.get("/api/payment/status/:orderId", async (req, res) => {
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
      const isAuthorized = authUser.isAdmin || authUser.isStoreGigAdmin || authUser.uid === buyerUid || sellerUid && authUser.uid === sellerUid;
      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: "Forbidden: You are not authorized to view this transaction." });
      }
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
          updatedAt: txData?.updatedAt
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to retrieve payment status." });
    }
  });
  app.post("/api/wallet/withdraw", async (req, res) => {
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
        userUid: authUser.uid,
        // Derived strictly from verified auth token
        amountBDT: Number(amount),
        method: method || "bKash",
        accountNumber: String(accountNumber || "").trim(),
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : void 0,
        userName: userName ? String(userName) : void 0
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error("[Wallet API] Error in /api/wallet/withdraw:", err);
      return res.status(500).json({ success: false, error: err?.message || "Withdrawal request failed." });
    }
  });
  app.get("/api/wallet/balance/:userId", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser) {
        return res.status(401).json({ success: false, error: "Unauthorized." });
      }
      const { userId } = req.params;
      if (authUser.uid !== userId && !authUser.isAdmin && !authUser.isStoreGigAdmin) {
        return res.status(403).json({ success: false, error: "Forbidden: You may only view your own wallet balance." });
      }
      if (!ledgerService) {
        ledgerService = new LedgerService(adminDb, notificationService);
      }
      const wallet = await ledgerService.getUserWallet(userId);
      return res.json({ success: true, wallet });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });
  app.post("/api/wallet/withdrawals/:id/payout", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin && !authUser.isStoreGigAdmin) {
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
        rejectionReason
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error("[Wallet API] Error in /api/wallet/withdrawals/:id/payout:", err);
      return res.status(500).json({ success: false, error: err?.message || "Payout processing failed." });
    }
  });
  app.post("/api/wallet/orders/:id/refund", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin && !authUser.isStoreGigAdmin) {
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
        refundReference: refundReference ? String(refundReference).trim() : void 0,
        refundMethod: refundMethod ? String(refundMethod).trim() : void 0,
        customerPhone: customerPhone ? String(customerPhone).trim() : void 0
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error("[Wallet API] Error in /api/wallet/orders/:id/refund:", err);
      return res.status(500).json({ success: false, error: err?.message || "Refund processing failed." });
    }
  });
  app.get("/llms.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const filePath = import_path2.default.join(process.cwd(), "public", "llms.txt");
    if (import_fs2.default.existsSync(filePath)) {
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
  app.get("/.well-known/ai-plugin.json", (_req, res) => {
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
  app.get("/api/platform/founder", (_req, res) => {
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
            <h2>\u26A0\uFE0F Google OAuth Client Configuration Missing</h2>
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
    async (req, res) => {
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
                <h2>\u26A0\uFE0F OAuth Client Not Configured</h2>
                <p>Google OAuth is not configured. <code>google-oauth-client.json</code> is missing or invalid.</p>
                <a href="/">Return to PolyNet</a>
              </div>
            </body>
            </html>
          `);
          return;
        }
        const error = req.query.error;
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
                <h2>\u274C Authorization Failed</h2>
                <p>Google returned an error: <strong>${escapeHtml(error)}</strong></p>
                <p>${escapeHtml(req.query.error_description || "Access was denied or request expired.")}</p>
                <a href="/auth/google">Try Again</a>
              </div>
            </body>
            </html>
          `);
          return;
        }
        const code = req.query.code;
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
                <h2>\u26A0\uFE0F Code Missing</h2>
                <p>No authorization code was found in the callback request.</p>
                <a href="/auth/google">Authorize Google Drive</a>
              </div>
            </body>
            </html>
          `);
          return;
        }
        const { tokens } = await googleOAuthClient.getToken(code);
        await saveGoogleDriveTokensToFirestore(tokens);
        console.log("[Google Drive] Server-side authorization successful! Tokens secured in Firestore (system_settings/google_drive_oauth).");
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
              <div class="icon-circle">\u2713</div>
              <h2>Google Drive Connected! \u2705</h2>
              <p>Your <strong>5 TB Google Drive</strong> has been successfully connected to PolyNet.</p>
              <p style="font-size: 0.85rem; color: #64748b;">Access Token &amp; Refresh Token have been securely stored in Firestore. All future Reels will be saved directly to your Google Drive.</p>
              <div class="badge">Folder: POLYNET \u2022 Storage: 5 TB \u2022 Status: Active</div>
              <div>
                <a href="/" class="btn">Return to PolyNet</a>
              </div>
            </div>
          </body>
          </html>
        `);
      } catch (error) {
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
              <h2>\u274C Authorization Exchange Failed</h2>
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
  app.post(
    ["/api/auth/google/exchange", "/auth/google/exchange"],
    async (req, res) => {
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
      } catch (err) {
        console.error("[Google Drive] Exchange API error:", err);
        res.status(500).json({
          success: false,
          error: err?.message || String(err)
        });
      }
    }
  );
  app.get(
    ["/api/auth/google/status", "/auth/google/status"],
    async (_req, res) => {
      const hasServiceAccount = import_fs2.default.existsSync(googleServiceAccountPath) || !!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
      if (!cachedGoogleDriveTokens && !hasServiceAccount) {
        await loadGoogleDriveTokensFromFirestore();
      }
      const isConfigured = hasServiceAccount || import_fs2.default.existsSync(googleCredentialsPath) || !!process.env.GOOGLE_OAUTH_CLIENT_JSON;
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
  const uploadsDir = import_path2.default.join(process.cwd(), "uploads", "reels");
  if (!import_fs2.default.existsSync(uploadsDir)) {
    import_fs2.default.mkdirSync(uploadsDir, { recursive: true });
  }
  const documentsDir = import_path2.default.join(process.cwd(), "uploads", "documents");
  if (!import_fs2.default.existsSync(documentsDir)) {
    import_fs2.default.mkdirSync(documentsDir, { recursive: true });
  }
  app.use("/uploads", import_express.default.static(import_path2.default.join(process.cwd(), "uploads")));
  async function authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ") && (0, import_app.getApps)().length > 0) {
      try {
        const idToken = authHeader.split("Bearer ")[1];
        const decoded = await (0, import_auth.getAuth)().verifyIdToken(idToken);
        const email = (decoded.email || "").toLowerCase();
        let isAdmin = email === "22222@gmail.com" || email === "hasanmahmud.cst@gmail.com" || email === "hdd@gmail.com" || decoded.admin === true || decoded.role === "super_admin";
        let isStoreGigAdmin = email === "polygig.store.polynet@gmail.com" || decoded.store_gig_admin === true || decoded.role === "store_gig_admin";
        if ((!isAdmin || !isStoreGigAdmin) && adminDb) {
          try {
            const uDoc = await adminDb.collection("users").doc(decoded.uid).get();
            if (uDoc.exists) {
              const uData = uDoc.data();
              if (uData?.isAdmin === true) isAdmin = true;
              if (uData?.isStoreGigAdmin === true) isStoreGigAdmin = true;
            }
          } catch {
          }
        }
        return {
          uid: decoded.uid,
          email,
          isAdmin,
          isStoreGigAdmin
        };
      } catch (e) {
      }
    }
    return null;
  }
  app.post("/api/upload-reel", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No video file provided for upload." });
        return;
      }
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
      const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = host ? `${proto}://${host}` : "";
      const relativePlayUrl = `/api/reels/stream/${driveFileId}`;
      const absolutePlayUrl = baseUrl ? `${baseUrl}${relativePlayUrl}` : relativePlayUrl;
      console.log(`[Google Drive] Reel video successfully uploaded to Google Drive! File ID: ${driveFileId}`);
      const directDriveUrl = uploadResult.webContentLink || `https://drive.google.com/uc?export=download&id=${driveFileId}`;
      res.json({
        success: true,
        fileId: driveFileId,
        driveFileId,
        fileName: uploadResult.fileName,
        mimeType: uploadResult.mimeType || mimeType,
        fileSize: uploadResult.fileSize,
        videoUrl: relativePlayUrl,
        absoluteVideoUrl: absolutePlayUrl,
        directDriveUrl,
        embedUrl: relativePlayUrl,
        storageProvider: "google_drive"
      });
    } catch (err) {
      console.error("[Reel Upload Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Google Drive upload failed: " + (err?.message || "Internal server error")
      });
    }
  });
  const documentUpload = (0, import_multer.default)({
    storage: import_multer.default.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }
    // 500MB max document / file size (PDF, DOC, ZIP, ISO, APK, Video, etc.)
  });
  app.post("/api/upload-chat-document", documentUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: "No document file provided." });
        return;
      }
      const originalName = req.file.originalname || "document";
      const ext = import_path2.default.extname(originalName).toLowerCase();
      const rawMime = req.file.mimetype || "application/octet-stream";
      const fileSize = req.file.size;
      let fileType = "other";
      if (ext === ".pdf" || rawMime.includes("pdf")) fileType = "pdf";
      else if (ext === ".doc" || ext === ".docx" || rawMime.includes("word") || rawMime.includes("msword")) fileType = "doc";
      else if (ext === ".zip" || ext === ".rar" || ext === ".7z" || ext === ".tar" || ext === ".gz" || rawMime.includes("zip") || rawMime.includes("archive")) fileType = "zip";
      else if (ext === ".xls" || ext === ".xlsx" || rawMime.includes("excel") || rawMime.includes("spreadsheet")) fileType = "xls";
      else if (ext === ".ppt" || ext === ".pptx" || rawMime.includes("powerpoint") || rawMime.includes("presentation")) fileType = "ppt";
      else if (ext === ".txt" || ext === ".csv") fileType = "txt";
      const formattedSize = fileSize > 1024 * 1024 ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(fileSize / 1024)} KB`;
      let fileUrl = "";
      let storageProvider = "local";
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
              body: import_stream.Readable.from(req.file.buffer)
            },
            fields: "id, name, size, mimeType, webViewLink, webContentLink"
          });
          if (uploadRes?.data?.id) {
            const driveId = uploadRes.data.id;
            drive.permissions.create({
              fileId: driveId,
              requestBody: { role: "reader", type: "anyone" }
            }).catch(() => {
            });
            fileUrl = `/api/documents/download/${driveId}?name=${encodeURIComponent(originalName)}`;
            storageProvider = "google_drive";
          }
        }
      } catch (driveErr) {
        console.warn("[Document Upload] Google Drive upload notice, saving locally:", driveErr);
      }
      if (!fileUrl) {
        const safeFileName = `${Date.now()}_${import_crypto3.default.randomBytes(4).toString("hex")}_${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const targetPath = import_path2.default.join(documentsDir, safeFileName);
        import_fs2.default.writeFileSync(targetPath, req.file.buffer);
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
    } catch (err) {
      console.error("[Document Upload Error]:", err?.message || err);
      res.status(500).json({
        success: false,
        error: "Failed to upload document: " + (err?.message || "Internal server error")
      });
    }
  });
  app.get("/api/documents/download/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const downloadName = req.query.name || "document";
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
  const driveMetaCache = /* @__PURE__ */ new Map();
  app.get("/api/reels/stream/:fileId", async (req, res) => {
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
      let fileMeta = null;
      const cached = driveMetaCache.get(fileId);
      const now = Date.now();
      if (cached && now - cached.cachedAt < 36e5) {
        fileMeta = cached;
      } else {
        try {
          const metaRes = await drive.files.get({
            fileId,
            fields: "id, name, size, mimeType, trashed"
          });
          fileMeta = {
            size: parseInt(metaRes.data.size || "0", 10),
            mimeType: metaRes.data.mimeType || "video/mp4",
            trashed: !!metaRes.data.trashed,
            cachedAt: now
          };
          driveMetaCache.set(fileId, fileMeta);
        } catch (metaErr) {
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
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=86400, no-transform"
        });
        const driveStream = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "stream", headers: { Range: `bytes=${start}-${end}` } }
        );
        driveStream.data.on("error", (streamErr) => {
          console.warn(`[Drive Stream Range Error] fileId ${fileId}:`, streamErr?.message);
          if (!res.headersSent) res.status(500).end();
        });
        req.on("close", () => {
          try {
            if (driveStream.data && typeof driveStream.data.destroy === "function") {
              driveStream.data.destroy();
            }
          } catch {
          }
        });
        driveStream.data.pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": totalSize > 0 ? totalSize : void 0,
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400, no-transform"
        });
        const driveStream = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "stream" }
        );
        driveStream.data.on("error", (streamErr) => {
          console.warn(`[Drive Stream Full Error] fileId ${fileId}:`, streamErr?.message);
          if (!res.headersSent) res.status(500).end();
        });
        req.on("close", () => {
          try {
            if (driveStream.data && typeof driveStream.data.destroy === "function") {
              driveStream.data.destroy();
            }
          } catch {
          }
        });
        driveStream.data.pipe(res);
      }
    } catch (err) {
      console.error("[Drive Stream API Error]:", err?.message || err);
      if (!res.headersSent) {
        res.status(500).send("Failed to stream video: " + (err?.message || "Internal server error"));
      }
    }
  });
  app.post("/api/reels/delete", async (req, res) => {
    try {
      const { reelId, driveFileId, userId } = req.body;
      if (!reelId && !driveFileId) {
        res.status(400).json({ success: false, error: "reelId or driveFileId is required." });
        return;
      }
      let targetDriveFileId = driveFileId;
      let authUid = userId || null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ") && (0, import_app.getApps)().length > 0) {
        try {
          const idToken = authHeader.split("Bearer ")[1];
          const decoded = await (0, import_auth.getAuth)().verifyIdToken(idToken);
          authUid = decoded.uid;
        } catch {
        }
      }
      if (adminDb && reelId) {
        try {
          const reelDoc = await adminDb.collection("reels").doc(reelId).get();
          if (reelDoc.exists) {
            const data = reelDoc.data();
            if (data) {
              const isOwner = !authUid || data.authorId === authUid || data.userId === authUid;
              const isAdmin = authUid && (authUid === "hasanmahmud.cst@gmail.com" || authUid === "hdd@gmail.com" || data.isAdmin === true);
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
      if (targetDriveFileId) {
        if (/^[a-zA-Z0-9_\-]+$/.test(targetDriveFileId)) {
          try {
            const drive = getGoogleDriveClient();
            if (drive) {
              await drive.files.delete({ fileId: targetDriveFileId });
              console.log(`[Google Drive] File ${targetDriveFileId} successfully deleted from Google Drive.`);
            }
          } catch (driveErr) {
            console.warn(`[Google Drive Delete Notice]: ${driveErr?.message || driveErr}`);
          }
        }
      }
      res.json({
        success: true,
        message: "Reel and Google Drive storage deleted successfully."
      });
    } catch (err) {
      console.error("[Reel Delete Error]:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to delete reel." });
    }
  });
  app.delete("/api/reels/:id", async (req, res) => {
    try {
      const reelId = req.params.id;
      let targetDriveFileId = null;
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
        } catch (driveErr) {
          console.warn("[Google Drive Delete Notice]:", driveErr?.message);
        }
      }
      res.json({ success: true, message: "Reel deleted successfully from Google Drive and database." });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || "Failed to delete reel." });
    }
  });
  app.get("/api/google-drive/status", async (req, res) => {
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
        folderId
      });
    } catch (err) {
      res.status(500).json({
        connected: false,
        storageProvider: "google_drive",
        error: err?.message || "Google Drive connection error"
      });
    }
  });
  function serverEncryptData(val) {
    if (!val) return "";
    const trimmed = String(val).trim();
    if (trimmed.startsWith("ENC:")) return trimmed;
    const shifted = trimmed.split("").map((c) => String.fromCharCode(c.charCodeAt(0) + 3)).join("");
    try {
      return "ENC:" + Buffer.from(shifted, "utf-8").toString("base64");
    } catch {
      return "ENC:" + shifted;
    }
  }
  function serverDecryptData(encryptedVal) {
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
      return rawShifted.split("").map((c) => String.fromCharCode(c.charCodeAt(0) - 3)).join("");
    } catch {
      return String(encryptedVal);
    }
  }
  app.post("/api/auth/lookup-student-recovery", (_req, res) => {
    res.status(410).json({
      error: "This legacy endpoint has been permanently disabled for account security and user privacy. Please use the official Backup Recovery Code or Student ID Verification methods."
    });
  });
  app.post("/api/profile/sync-avatars", async (req, res) => {
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
    } catch (err) {
      console.error("Avatar sync error:", err);
      res.status(500).json({ error: err.message || "Failed to sync avatars." });
    }
  });
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
    } catch (err) {
      console.error("[API] Error in register-device:", err);
      res.status(500).json({ error: err.message || "Failed to register device" });
    }
  });
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
    } catch (err) {
      console.error("[API] Error in unregister-device:", err);
      res.status(500).json({ error: err.message || "Failed to unregister device" });
    }
  });
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
    } catch (err) {
      console.error("[API] Error in send notification:", err);
      res.status(500).json({ error: err.message || "Failed to send notification" });
    }
  });
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
    } catch (err) {
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
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to update settings" });
    }
  });
  app.post("/api/user/delete-account", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      const { targetUserId } = req.body;
      const targetUid = targetUserId || authUser?.uid;
      if (!targetUid) {
        res.status(400).json({ success: false, error: "Target user ID is required for account deletion." });
        return;
      }
      if (!authUser || authUser.uid !== targetUid && !authUser.isAdmin) {
        res.status(403).json({ success: false, error: "Forbidden: You are not authorized to delete this account." });
        return;
      }
      console.log(`[Account Deletion] Initiating permanent deletion workflow for user: ${targetUid}`);
      if (adminDb) {
        try {
          const reelsSnap = await adminDb.collection("reels").where("authorId", "==", targetUid).get();
          const reelsSnap2 = await adminDb.collection("reels").where("userId", "==", targetUid).get();
          const allReelDocs = /* @__PURE__ */ new Map();
          reelsSnap.forEach((d) => allReelDocs.set(d.id, d));
          reelsSnap2.forEach((d) => allReelDocs.set(d.id, d));
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
      if (adminDb) {
        try {
          const devicesSnap = await adminDb.collection("users").doc(targetUid).collection("devices").get();
          const batch = adminDb.batch();
          devicesSnap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        } catch (devErr) {
          console.warn("[Account Deletion] Devices cleanup notice:", devErr);
        }
      }
      if (adminDb) {
        try {
          await adminDb.collection("users").doc(targetUid).delete();
          await adminDb.collection("user_profiles").doc(targetUid).delete();
          await adminDb.collection("typing_states").doc(targetUid).delete();
        } catch (docErr) {
          console.warn("[Account Deletion] Firestore doc cleanup notice:", docErr);
        }
      }
      try {
        if ((0, import_app.getApps)().length > 0) {
          await (0, import_auth.getAuth)().deleteUser(targetUid);
          console.log(`[Account Deletion] Firebase Auth user ${targetUid} deleted successfully.`);
        }
      } catch (authErr) {
        console.warn("[Account Deletion] Firebase Auth deleteUser notice:", authErr.message || authErr);
      }
      res.json({ success: true, message: "User account and all associated data permanently deleted." });
    } catch (err) {
      console.error("[Account Deletion] Critical error:", err);
      res.status(500).json({ success: false, error: "Account deletion encountered an error. Please try again." });
    }
  });
  const PORT = Number(process.env.PORT) || 3e3;
  if (adminDb && notificationService && hasAdminCredentials) {
    const serverStartTime = Date.now();
    console.log("Starting server-side central push notification listener pipeline...");
    let unsubscribeNotifListener = null;
    try {
      unsubscribeNotifListener = adminDb.collection("notifications").onSnapshot((snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const notifData = change.doc.data();
            const createdAtMs = notifData.createdAt ? Date.parse(notifData.createdAt) : Date.now();
            if (createdAtMs < serverStartTime - 1e4) {
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
            let notifTitle = customTitle || actorName || "PolyNet Notification";
            let notifBody = customBody || "You have a new update";
            if (!customTitle) {
              if (type === "message" || type === "chat") {
                notifTitle = `\u{1F4AC} ${actorName}`;
              } else if (type === "group_message") {
                notifTitle = `\u{1F465} ${actorName}`;
              } else if (type === "like" || type === "reel_like" || type === "post_react") {
                notifTitle = `\u2764\uFE0F ${actorName} reacted to your post`;
              } else if (type === "comment" || type === "reel_comment") {
                notifTitle = `\u{1F4DD} ${actorName} commented on your post`;
              } else if (type === "comment_reply") {
                notifTitle = `\u{1F4AC} ${actorName} replied to your comment`;
              } else if (type === "comment_react" || type === "comment_like") {
                notifTitle = `\u2764\uFE0F ${actorName} reacted to your comment`;
              } else if (type === "new_post" || type === "post_created") {
                notifTitle = `\u{1F4E2} ${actorName} published a new post`;
              } else if (type === "friend_request") {
                notifTitle = `\u{1F465} Classmate Connection Request`;
              } else if (type === "group_invite" || type === "group_created") {
                notifTitle = `\u{1F465} Study Group: ${actorName}`;
              } else if (type === "request_accepted") {
                notifTitle = `\u{1F91D} Request Accepted by ${actorName}`;
              } else if (type === "call" || type === "voice_call") {
                notifTitle = `\u{1F4DE} Incoming Call: ${actorName}`;
              } else if (type === "purchase" || type === "polystore_order") {
                notifTitle = `\u{1F6CD}\uFE0F PolyStore Order: ${actorName}`;
              } else if (type === "polystore" || type === "polystore_inquiry" || type === "product_inquiry") {
                notifTitle = `\u{1F6CD}\uFE0F PolyStore: ${actorName}`;
              } else if (type === "job" || type === "job_alert") {
                notifTitle = `\u{1F4BC} New Job / Internship Alert`;
              } else if (type === "job_application") {
                notifTitle = `\u{1F4C4} Job Application: ${actorName}`;
              } else if (type === "withdrawal") {
                notifTitle = `\u{1F4B8} Withdrawal Update`;
              } else if (type === "polygig_proposal") {
                notifTitle = `\u{1F4BC} PolyGig Proposal from ${actorName}`;
              } else if (type === "polygig_order") {
                notifTitle = `\u{1F6CD}\uFE0F PolyGig Order Update`;
              } else if (type === "polygig_message") {
                notifTitle = `\u{1F4AC} PolyGig Workspace: ${actorName}`;
              } else if (type === "polygig_delivery") {
                notifTitle = `\u{1F4E6} PolyGig Work Delivered`;
              } else if (type === "polygig_revision") {
                notifTitle = `\u{1F504} PolyGig Revision Requested`;
              } else if (type === "polygig_complete") {
                notifTitle = `\u2705 PolyGig Order Completed`;
              } else if (type && type.startsWith("polygig")) {
                notifTitle = `\u{1F4BC} PolyGig: ${actorName}`;
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
                saveToDb: false
                // Document is already in Firestore
              });
            } catch (notifErr) {
              console.error(`[FCM Pipeline] Delivery error for user ${targetUserId}:`, notifErr);
            }
          }
        });
      }, (error) => {
        if (error?.code === 7 || error?.message?.includes("Missing or insufficient permissions")) {
          console.warn("[FCM Pipeline] Firestore stream listener stopped: Service account requires Firestore access.");
          if (unsubscribeNotifListener) {
            try {
              unsubscribeNotifListener();
            } catch {
            }
            unsubscribeNotifListener = null;
          }
        } else {
          console.warn("[FCM Pipeline] FCM listener database snapshot stream notification:", error?.message || error);
        }
      });
    } catch (listenerErr) {
      console.warn("[FCM Pipeline] Notice: Could not attach realtime push listener:", listenerErr?.message || listenerErr);
    }
  }
  function getAiInstance() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key.trim() !== "" && key.startsWith("AIzaSy")) {
      try {
        return new import_genai.GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
      } catch (e) {
        console.warn("Dynamic Google GenAI initialization failed:", e);
      }
    }
    return null;
  }
  app.post("/api/migrate-polytechnics", async (req, res) => {
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
    } catch (err) {
      console.error("Migration error in server.ts:", err);
      res.status(500).json({ error: err.message || "Failed migrating polytechnic names" });
    }
  });
  app.post("/api/auth/universal-login", async (req, res) => {
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
      let foundUserDoc = null;
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
      if (!foundUserDoc) {
        const encRoll = serverEncryptData(cleanIdent);
        const rollSnap = await usersRef.where("rollNumber", "in", [cleanIdent, encRoll]).limit(1).get();
        if (!rollSnap.empty) {
          foundUserDoc = rollSnap.docs[0];
        }
      }
      if (!foundUserDoc) {
        const cleanHandle = cleanIdent.startsWith("@") ? cleanIdent.slice(1) : cleanIdent;
        const userSnap = await usersRef.where("username", "==", cleanHandle).limit(1).get();
        if (!userSnap.empty) {
          foundUserDoc = userSnap.docs[0];
        }
      }
      if (!foundUserDoc) {
        const encTemis = serverEncryptData(cleanIdent);
        const temisSnap = await usersRef.where("temisId", "in", [cleanIdent, encTemis]).limit(1).get();
        if (!temisSnap.empty) {
          foundUserDoc = temisSnap.docs[0];
        }
      }
      if (!foundUserDoc) {
        const allUsersSnap = await usersRef.limit(100).get();
        for (const docSnap of allUsersSnap.docs) {
          const u = docSnap.data();
          const uRoll = serverDecryptData(u.rollNumber) || u.rollNumber || "";
          const uUser = (u.username || "").toLowerCase();
          const uTemis = serverDecryptData(u.temisId) || u.temisId || "";
          const uEmail = (u.email || "").toLowerCase();
          if (uRoll === cleanIdent || uUser === cleanIdent.toLowerCase() || uUser === cleanIdent.toLowerCase().replace("@", "") || uTemis === cleanIdent || uEmail === cleanIdent.toLowerCase()) {
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
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.idToken) {
        const errReason = verifyData?.error?.message;
        console.warn("[Universal Login] Password verification failed:", errReason);
        res.status(401).json({ error: "Invalid credentials. Incorrect password!" });
        return;
      }
      const authAdmin = (0, import_auth.getAuth)();
      const customToken = await authAdmin.createCustomToken(uid);
      res.json({
        success: true,
        customToken,
        email: userEmail,
        uid,
        userProfile: userData
      });
    } catch (err) {
      console.error("[Universal Login] Error:", err);
      res.status(500).json({ error: err.message || "Login failed. Please try again." });
    }
  });
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username, currentUid } = req.body;
      const clean = (username || "").toLowerCase().replace(/^@+/, "").trim();
      const RESERVED = /* @__PURE__ */ new Set([
        "admin",
        "administrator",
        "support",
        "help",
        "official",
        "polynet",
        "system",
        "bteb_official",
        "developer",
        "contact",
        "security",
        "moderator",
        "bteb",
        "bot",
        "staff",
        "verified",
        "polytechnic",
        "root"
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
      const usernameDocSnap = await adminDb.collection("usernames").doc(clean).get();
      if (usernameDocSnap.exists) {
        const data = usernameDocSnap.data();
        if (data?.uid && data.uid !== currentUid) {
          res.json({ available: false, error: `@${clean} is already taken. Please choose another username.`, clean });
          return;
        }
      }
      const userSnap = await adminDb.collection("users").where("username", "in", [clean, `@${clean}`]).limit(1).get();
      if (!userSnap.empty) {
        const foundUid = userSnap.docs[0].id;
        if (foundUid !== currentUid) {
          res.json({ available: false, error: `@${clean} is already taken. Please choose another username.`, clean });
          return;
        }
      }
      res.json({ available: true, clean });
    } catch (err) {
      console.error("[Check Username] Error:", err);
      res.status(500).json({ error: "Failed to check username." });
    }
  });
  app.post("/api/auth/send-reset-link", async (req, res) => {
    try {
      const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
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
      if ((0, import_app.getApps)().length > 0) {
        try {
          const authAdmin = (0, import_auth.getAuth)();
          await authAdmin.generatePasswordResetLink(cleanEmail);
        } catch (authErr) {
          if (authErr?.code !== "auth/user-not-found") {
            console.warn("[Auth Reset] Reset processing notice:", authErr?.message || authErr);
          }
        }
      }
      res.json({
        success: true,
        message: "If an account exists for this email address, password reset instructions have been dispatched."
      });
    } catch (err) {
      console.error("[Auth Reset] Error:", err?.message || err);
      res.status(500).json({ error: "An error occurred while processing your request." });
    }
  });
  app.post("/api/ai-reply", async (req, res) => {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
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
    if (message.length > 2e3) {
      res.status(400).json({ error: "Message exceeds maximum allowed length of 2000 characters." });
      return;
    }
    if (history && (!Array.isArray(history) || history.length > 30)) {
      res.status(400).json({ error: "History must be an array with at most 30 entries." });
      return;
    }
    const activeAi = getAiInstance();
    if (activeAi) {
      try {
        const systemPrompt = `You are ${peerName || "a friendly classmate group member"} at Bangladesh Polytechnic Institute.
  You are a helpful, enthusiastic, and intelligent student companion. 
  Keep your answers relatively concise, student-friendly, and natural (use light colloquial terms, simple Banglish or Bengali/English mixed where appropriate). 
  Answer questions about routines, polytechnic subjects, programming, engineering, exam prep, or study. Keep it under 3 short sentences. Do not use markdown format.`;
        const contentsList = [];
        if (history && Array.isArray(history)) {
          history.forEach((h) => {
            const role = h.role === "model" || h.role === "assistant" ? "model" : "user";
            const textContent = typeof h === "string" ? h : h.text || h.content || "";
            if (!textContent || textContent.trim() === "") return;
            contentsList.push({
              role,
              parts: [{ text: textContent }]
            });
          });
        }
        contentsList.push({
          role: "user",
          parts: [{ text: message }]
        });
        while (contentsList.length > 0 && contentsList[0].role === "model") {
          contentsList.shift();
        }
        const cleanContents = [];
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
            systemInstruction: systemPrompt
          }
        });
        const text = response.text || "I'm checking that topic right now!";
        res.json({ reply: text.trim() });
        return;
      } catch (e) {
        console.warn("Gemini classmate processing failed, using local fallback responder: ", e.message || e);
      }
    }
    const lowMsg = message.toLowerCase();
    let fallbackText = `Hey there! That's super interesting. Let me review my class notes and get back to you! \u{1F4DA}`;
    if (lowMsg.includes("routine") || lowMsg.includes("class") || lowMsg.includes("time") || lowMsg.includes("schedule")) {
      fallbackText = `I have the semester schedule saved in my student desk. Let's look at the Academic tab to crosscheck the times! \u23F0`;
    } else if (lowMsg.includes("code") || lowMsg.includes("program") || lowMsg.includes("javascript") || lowMsg.includes("html") || lowMsg.includes("python") || lowMsg.includes("java")) {
      fallbackText = `Wow, are you coding right now? Share your code snippet here in our chat! I can help you debug it. \u{1F4BB}`;
    } else if (lowMsg.includes("exam") || lowMsg.includes("test") || lowMsg.includes("midterm") || lowMsg.includes("result")) {
      fallbackText = `Oh, the exams are coming up! Don't worry, we should form a study group and check the syllabus topics together. \u270D\uFE0F`;
    } else if (lowMsg.includes("salam") || lowMsg.includes("assalamu") || lowMsg.includes("assalamu alaikum") || lowMsg.includes("asalamu")) {
      fallbackText = `Walaikum Assalam! how are you? How is your polytechnic semester going? \u{1F60A}`;
    } else if (lowMsg.includes("hello") || lowMsg.includes("hi") || lowMsg.includes("hey") || lowMsg.includes("helo")) {
      fallbackText = `Hi classmate! How are you doing today? Ready to work on our lab report? \u{1F64C}`;
    } else if (lowMsg.includes("job") || lowMsg.includes("internship") || lowMsg.includes("career")) {
      fallbackText = `Have you checked the Jobs section on PolyNet? There are some awesome junior roles listed there today! \u{1F4BC}`;
    } else if (lowMsg.includes("syllabus") || lowMsg.includes("book") || lowMsg.includes("routine")) {
      fallbackText = `Let's look at the Academic Hub on PolyNet, it contains syllabus PDFs and routine structures! \u{1F4D6}`;
    }
    res.json({ reply: fallbackText });
  });
  app.post("/api/polyai", async (req, res) => {
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
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
    if (message.length > 2e3) {
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
        const contentsList = [];
        if (history && Array.isArray(history)) {
          history.forEach((h) => {
            const role = h.role === "model" || h.role === "assistant" ? "model" : "user";
            if (!h.text || h.text.trim() === "") return;
            if (h.text.startsWith("Hello ") || h.text.includes("academic assistant") || h.text.includes("Welcome to PolyAI")) {
              return;
            }
            contentsList.push({
              role,
              parts: [{ text: h.text }]
            });
          });
        }
        contentsList.push({
          role: "user",
          parts: [{ text: message }]
        });
        while (contentsList.length > 0 && contentsList[0].role === "model") {
          contentsList.shift();
        }
        const cleanContents = [];
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
        let response;
        let searchAttemptFailed = false;
        try {
          response = await activeAi.models.generateContent({
            model: "gemini-3.5-flash",
            contents: cleanContents,
            config: {
              systemInstruction: systemPrompt,
              tools: [{ googleSearch: {} }]
            }
          });
        } catch (searchError) {
          console.warn("PolyAI Gemini with googleSearch failed, retrying without tools:", searchError.message || searchError);
          searchAttemptFailed = true;
          response = await activeAi.models.generateContent({
            model: "gemini-3.5-flash",
            contents: cleanContents,
            config: {
              systemInstruction: systemPrompt
            }
          });
        }
        const text = response.text || "";
        let replyText = text.trim();
        if (!searchAttemptFailed) {
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            const searchSources = chunks.map((chunk) => chunk.web).filter((web) => web && web.uri && web.title);
            if (searchSources.length > 0) {
              const uniqueSources = [];
              const seenUris = /* @__PURE__ */ new Set();
              for (const source of searchSources) {
                if (!seenUris.has(source.uri)) {
                  seenUris.add(source.uri);
                  uniqueSources.push(source);
                }
              }
              replyText += "\n\n**Sources & Real-time References:**\n" + uniqueSources.map((s) => `- [${s.title}](${s.uri})`).join("\n");
            }
          }
        }
        if (text) {
          res.json({ reply: cleanReplyText(replyText) });
          return;
        }
      } catch (e) {
        console.warn("PolyAI Gemini generation failed completely, shifting to keyless fallback: ", e.message || e);
      }
    }
    try {
      const pollinationsHistory = history && Array.isArray(history) ? history.slice(-8).map((h) => ({
        role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
        content: h.text || h.content || ""
      })).filter((item) => item.content.trim() !== "") : [];
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
    } catch (pollErr) {
      console.error("PolyAI server-side keyless Pollinations AI fallback failed:", pollErr);
    }
    const lowMsg = message.toLowerCase();
    let reply = `Hello! I am PolyAI, your academic assistant. I received your message. Please provide more details or ask about class routines, syllabus, lab report guidelines, or CST programming! \u{1F4DA}`;
    const matchesGreetings = lowMsg.includes("salam") || lowMsg.includes("assalamu") || lowMsg.includes("asalamu") || lowMsg.includes("kemon") || lowMsg.includes("how are you");
    const matchesHello = lowMsg.includes("hello") || lowMsg.includes("hi") || lowMsg.includes("hey") || lowMsg.includes("helo");
    const matchesRoutine = lowMsg.includes("routine") || lowMsg.includes("rutin") || lowMsg.includes("exam") || lowMsg.includes("porikkha");
    const matchesProgramming = lowMsg.includes("cst") || lowMsg.includes("computer") || lowMsg.includes("programming") || lowMsg.includes("coding") || lowMsg.includes("code") || lowMsg.includes("kod");
    const matchesSyllabus = lowMsg.includes("syllabus") || lowMsg.includes("boikhata") || lowMsg.includes("book") || lowMsg.includes("boi");
    const matchesGPA = lowMsg.includes("gpa") || lowMsg.includes("cgpa") || lowMsg.includes("calculator") || lowMsg.includes("point") || lowMsg.includes("grade");
    const matchesLab = lowMsg.includes("lab") || lowMsg.includes("report");
    const matchesPolyNet = lowMsg.includes("polynet") || lowMsg.includes("poly net") || lowMsg.includes("app") || lowMsg.includes("software");
    const matchesCreator = lowMsg.includes("made you") || lowMsg.includes("create you") || lowMsg.includes("creator") || lowMsg.includes("developer") || lowMsg.includes("baniyeche") || lowMsg.includes("toiri koreche") || lowMsg.includes("toiri korche") || lowMsg.includes("baniyese") || lowMsg.includes("make you") || lowMsg.includes("built you") || lowMsg.includes("banayeche") || lowMsg.includes("banayese") || lowMsg.includes("owner") || lowMsg.includes("founder") || lowMsg.includes("hasan mahmud") || lowMsg.includes("hassan mahmud");
    const matchesOminiRelationship = lowMsg.includes("omini") || lowMsg.includes("relation") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai")) || lowMsg.includes("somporko") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai") || lowMsg.includes("omini")) || lowMsg.includes("shomporko") && (lowMsg.includes("polynet") || lowMsg.includes("polychat") || lowMsg.includes("polyai") || lowMsg.includes("omini"));
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
      reply = `Wa Alaikum Assalam! Kemon achen? I am PolyAI, your dedicated polytechnic assistant. How can I help you today? \u{1F60A}`;
    } else if (matchesHello) {
      reply = `Hello! Welcome to PolyAI, the official AI assistant of PolyNet. Feel free to ask any academic or programming questions! \u{1F64C}`;
    } else if (matchesRoutine) {
      reply = `To check the class routine, schedules, and exam dates, please go to the **Routine & Books** tab at the top. You can easily view and search routines there! \u23F0`;
    } else if (matchesProgramming) {
      reply = `Programming is highly essential for Computer Science & Technology (CST) students! \u{1F4BB}
I can assist you with:
- Debugging Python, JavaScript, and C/C++ code.
- Data structures and algorithm solutions.
- Database design and SQL query writing.
Please paste your code snippet or programming question here!`;
    } else if (matchesSyllabus) {
      reply = `You can check the updated syllabus, subject codes, and recommended reference books in the **Routine & Books** section. \u{1F4D6}`;
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
Ensure your diagrams are neat and well-labeled! \u{1F4DD}`;
    } else if (matchesPolyNet) {
      reply = `PolyNet is the ultimate academic & social ecosystem for polytechnic cadets! \u{1F31F}
Features:
- **Home Feed**: Stay updated with posts and share academic updates.
- **My Polytechnic**: Connect with classmates.
- **Routine & Books**: Get instant class routines.
- **Chats & Calling**: Message and call friends in real-time!`;
    }
    res.json({ reply });
  });
  app.post("/api/oauth/apps/register", async (req, res) => {
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
      const clientId = "pnc_app_" + import_crypto3.default.randomBytes(12).toString("hex");
      const clientSecret = "sec_" + import_crypto3.default.randomBytes(24).toString("hex");
      const newApp = {
        id: clientId,
        clientSecret,
        appName: String(appName).trim(),
        appIcon: appIcon || "",
        websiteUrl: websiteUrl || "",
        description: description || "",
        redirectUris: redirectUris.map((u) => String(u).trim()),
        developerUserId: authUser.uid,
        developerEmail: authUser.email || "",
        developerName: developerName || "Developer",
        status: "pending",
        // Requires Admin Approval for real-world security!
        scopes: ["profile", "email", "polytechnic"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (adminDb) {
        await adminDb.collection("oauth_apps").doc(clientId).set(newApp);
      }
      res.json({
        success: true,
        message: "Application registered successfully! Please store your Client Secret securely.",
        app: newApp
      });
    } catch (err) {
      console.error("Failed to register OAuth app:", err);
      res.status(500).json({ error: err.message || "Failed to register application." });
    }
  });
  app.get("/api/oauth/apps/developer/:userId", async (req, res) => {
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
      let appsList = [];
      if (adminDb) {
        const snap = await adminDb.collection("oauth_apps").where("developerUserId", "==", userId).get();
        appsList = snap.docs.map((doc) => {
          const data = doc.data();
          const rawSecret = data.clientSecret;
          const maskedSecret = rawSecret ? `${rawSecret.substring(0, 8)}****************` : void 0;
          return {
            ...data,
            clientSecret: maskedSecret,
            hasSecret: Boolean(rawSecret)
          };
        });
      }
      res.json({ success: true, apps: appsList });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch apps." });
    }
  });
  app.post("/api/oauth/apps/:clientId/update", async (req, res) => {
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
      if (!authUser || authUser.uid !== appData?.developerUserId && !authUser.isAdmin) {
        res.status(403).json({ error: "Unauthorized: Only the app developer or system administrator can update this application." });
        return;
      }
      const updateData = {
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (appName) updateData.appName = appName.trim();
      if (redirectUris && Array.isArray(redirectUris)) updateData.redirectUris = redirectUris.map((u) => u.trim());
      if (description !== void 0) updateData.description = description;
      if (appIcon !== void 0) updateData.appIcon = appIcon;
      if (websiteUrl !== void 0) updateData.websiteUrl = websiteUrl;
      await docRef.update(updateData);
      res.json({ success: true, message: "App updated successfully." });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to update app." });
    }
  });
  app.post("/api/oauth/apps/:clientId/regenerate-secret", async (req, res) => {
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
      if (!authUser || authUser.uid !== appData?.developerUserId && !authUser.isAdmin) {
        res.status(403).json({ error: "Unauthorized: Only the app developer or system administrator can regenerate client secret." });
        return;
      }
      const newSecret = "sec_" + import_crypto3.default.randomBytes(24).toString("hex");
      await docRef.update({
        clientSecret: newSecret,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ success: true, clientSecret: newSecret });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to regenerate secret." });
    }
  });
  app.get("/api/oauth/admin/apps", async (req, res) => {
    try {
      const authUser = await authenticateRequest(req);
      if (!authUser || !authUser.isAdmin) {
        res.status(403).json({ error: "Forbidden: Administrator access required." });
        return;
      }
      let appsList = [];
      if (adminDb) {
        const snap = await adminDb.collection("oauth_apps").get();
        appsList = snap.docs.map((doc) => doc.data());
      }
      res.json({ success: true, apps: appsList });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch admin apps list." });
    }
  });
  app.post("/api/oauth/admin/apps/:clientId/approve", async (req, res) => {
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
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      res.json({ success: true, message: "App approved successfully!" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to approve app." });
    }
  });
  app.post("/api/oauth/admin/apps/:clientId/reject", async (req, res) => {
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
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      res.json({ success: true, message: "App rejected." });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to reject app." });
    }
  });
  app.get("/api/oauth/authorize-info", async (req, res) => {
    try {
      const clientId = req.query.client_id;
      const redirectUri = req.query.redirect_uri;
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
      if (appData?.status !== "approved") {
        res.status(403).json({
          valid: false,
          error: appData?.status === "pending" ? "This application is currently pending Admin Approval before it can perform PolyNet SSO Logins." : `Application authorization rejected: ${appData?.rejectionReason || "Unauthorized app"}`
        });
        return;
      }
      const isRedirectValid = Array.isArray(appData?.redirectUris) && appData.redirectUris.some((uri) => uri.trim().toLowerCase() === redirectUri.trim().toLowerCase());
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
    } catch (err) {
      res.status(500).json({ valid: false, error: err.message || "Internal server error." });
    }
  });
  app.post("/api/oauth/grant-authorization", async (req, res) => {
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
      if (user_id && user_id !== authUser.uid) {
        res.status(403).json({ error: "Forbidden: You cannot grant authorization on behalf of another user." });
        return;
      }
      const authoritativeUid = authUser.uid;
      if (!adminDb) {
        res.status(500).json({ error: "Database connection unavailable." });
        return;
      }
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
      const isRedirectValid = Array.isArray(appData?.redirectUris) && appData.redirectUris.some((uri) => uri.trim().toLowerCase() === String(redirect_uri).trim().toLowerCase());
      if (!isRedirectValid) {
        res.status(400).json({ error: "Redirect URI mismatch." });
        return;
      }
      const allowedScopes = appData?.scopes || ["profile", "email", "polytechnic"];
      const requestedScopes = Array.isArray(scope) ? scope : ["profile", "email", "polytechnic"];
      const validatedScopes = requestedScopes.filter((s) => allowedScopes.includes(s));
      const code = "pnc_code_" + import_crypto3.default.randomBytes(24).toString("hex");
      const expiresAt = Date.now() + 5 * 60 * 1e3;
      await adminDb.collection("oauth_codes").doc(code).set({
        id: code,
        code,
        clientId: client_id,
        userId: authoritativeUid,
        redirectUri: String(redirect_uri).trim(),
        scope: validatedScopes,
        expiresAt,
        used: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ success: true, code });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to grant authorization code." });
    }
  });
  app.post("/api/oauth/token", async (req, res) => {
    try {
      let clientId = req.body.client_id;
      let clientSecret = req.body.client_secret;
      const code = req.body.code;
      const redirectUri = req.body.redirect_uri;
      const grantType = req.body.grant_type;
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
      const codeDoc = await adminDb.collection("oauth_codes").doc(code).get();
      if (!codeDoc.exists) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code invalid or not found." });
        return;
      }
      const codeData = codeDoc.data();
      if (codeData?.used) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code has already been used." });
        return;
      }
      if (Date.now() > codeData?.expiresAt) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code has expired." });
        return;
      }
      if (codeData?.clientId !== clientId || codeData?.redirectUri !== redirectUri) {
        res.status(400).json({ error: "invalid_grant", error_description: "Authorization code parameter mismatch." });
        return;
      }
      await adminDb.collection("oauth_codes").doc(code).update({ used: true });
      const accessToken = "pnt_" + import_crypto3.default.randomBytes(32).toString("hex");
      const refreshToken = "pnr_" + import_crypto3.default.randomBytes(32).toString("hex");
      const expiresInSeconds = 30 * 24 * 60 * 60;
      await adminDb.collection("oauth_tokens").doc(accessToken).set({
        id: accessToken,
        accessToken,
        refreshToken,
        clientId,
        userId: codeData.userId,
        scope: codeData.scope || ["profile", "email", "polytechnic"],
        expiresAt: Date.now() + expiresInSeconds * 1e3,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: expiresInSeconds,
        refresh_token: refreshToken,
        scope: (codeData.scope || ["profile", "email", "polytechnic"]).join(" "),
        user_id: codeData.userId
      });
    } catch (err) {
      console.error("Token endpoint failure:", err);
      res.status(500).json({ error: "server_error", error_description: err.message || "Failed to exchange token." });
    }
  });
  app.get("/api/oauth/userinfo", async (req, res) => {
    try {
      let accessToken = "";
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        accessToken = authHeader.split(" ")[1];
      } else if (req.query.access_token) {
        accessToken = req.query.access_token;
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
      const userDoc = await adminDb.collection("users").doc(tokenData.userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: "user_not_found", error_description: "User account associated with token no longer exists." });
        return;
      }
      const userData = userDoc.data();
      res.json({
        sub: userDoc.id,
        id: userDoc.id,
        name: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || userData?.displayName || "PolyNet Cadet",
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
    } catch (err) {
      console.error("UserInfo endpoint failure:", err);
      res.status(500).json({ error: "server_error", error_description: err.message || "Failed to fetch userinfo." });
    }
  });
  app.post("/api/oauth/userinfo", async (req, res) => {
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
        name: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() || userData?.displayName || "PolyNet Cadet",
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
    } catch (err) {
      res.status(500).json({ error: "server_error", error_description: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`PolyNet Server is running on port ${PORT}`);
  });
  const handleShutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[Server] Forceful shutdown after 10s timeout.");
      process.exit(1);
    }, 1e4);
  };
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
bootstrapServer().catch((err) => {
  console.error("Failed to start PolyNet server:", err);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAuthorizedGoogleDriveClient,
  getGoogleDriveClient,
  getOrCreatePolyNetReelsFolder,
  loadGoogleDriveTokensFromFirestore,
  saveGoogleDriveTokensToFirestore,
  uploadReelToGoogleDrive
});
//# sourceMappingURL=server.cjs.map
