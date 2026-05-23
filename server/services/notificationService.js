/**
 * Notification service — handles SMS via Twilio and push notifications via Firebase FCM.
 *
 * INTEGRATION STATUS:
 * - Twilio SMS: REQUIRES credentials (register at https://twilio.com, free trial available)
 *   Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * - Firebase FCM: REQUIRES credentials (register at https://console.firebase.google.com, free)
 *   Required env var: FIREBASE_SERVER_KEY
 *
 * When credentials are not configured, both services log a warning and return early.
 * The UI setting "Enable SMS Alerts" stores the preference but shows a note if Twilio isn't configured.
 */
const logger = require('../config/logger');

// ─── Twilio SMS ────────────────────────────────────────────────────────────────

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    logger.info('[NotificationService] Twilio SMS initialized successfully.');
  } catch (err) {
    logger.warn('[NotificationService] Twilio init failed:', err.message);
  }
} else {
  logger.warn('[NotificationService] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — SMS disabled.');
}

const sendSMS = async (to, body) => {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    logger.warn('[NotificationService] SMS skipped — Twilio not configured.');
    return { sent: false, reason: 'Twilio not configured' };
  }
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info(`[NotificationService] SMS sent to ${to}: ${message.sid}`);
    return { sent: true, sid: message.sid };
  } catch (err) {
    logger.error('[NotificationService] Twilio SMS failed:', err.message);
    return { sent: false, reason: err.message };
  }
};

// ─── Firebase FCM ──────────────────────────────────────────────────────────────

let firebaseAdmin = null;
if (process.env.FIREBASE_SERVER_KEY && process.env.GEE_SERVICE_ACCOUNT_JSON_PATH) {
  try {
    const admin = require('firebase-admin');
    const serviceAccount = require(process.env.GEE_SERVICE_ACCOUNT_JSON_PATH);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info('[NotificationService] Firebase FCM initialized successfully.');
  } catch (err) {
    logger.warn('[NotificationService] Firebase Admin initialization failed:', err.message);
  }
} else {
  logger.warn('[NotificationService] Firebase credentials not configured. Push notifications disabled. Set FIREBASE_SERVER_KEY in .env');
}

/**
 * Sends a Firebase Cloud Messaging push notification.
 * @param {string} fcmToken - The target device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional extra data payload
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseAdmin) {
    logger.warn('[NotificationService] Push notification skipped — Firebase not configured.');
    return { sent: false, reason: 'Firebase FCM not configured' };
  }

  try {
    const { getMessaging } = require('firebase-admin/messaging');
    const response = await getMessaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
    logger.info('[NotificationService] FCM push sent:', response);
    return { sent: true, messageId: response };
  } catch (err) {
    logger.error('[NotificationService] FCM push failed:', err.message);
    return { sent: false, reason: err.message };
  }
};

/**
 * Returns whether SMS integration is configured.
 */
const isSMSConfigured = () => !!twilioClient && !!process.env.TWILIO_PHONE_NUMBER;

/**
 * Returns whether FCM integration is configured.
 */
const isFCMConfigured = () => !!firebaseAdmin;

module.exports = { sendSMS, sendPushNotification, isSMSConfigured, isFCMConfigured };
