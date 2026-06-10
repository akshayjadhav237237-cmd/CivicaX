/**
 * cameraPoller.js — RTSP Camera Feed Registry Poller
 *
 * Implements the RTSP socket architecture stub for surveillance camera feeds.
 * Polls the CameraFeed table every 60 seconds.
 *
 * Architecture:
 *   connectRTSP(feedUrl)        — TCP socket stub simulating frame receipt
 *   detectWaterInFrame(buffer)  — CV stub (ready for real YOLO/OpenCV swap)
 *   pollCameraFeeds(io)         — Main polling loop
 *
 * The detectWaterInFrame function signature is stable — plug in real
 * computer vision inference here without changing any other code.
 *
 * To add real cameras: insert rows into the camera_feeds table with the
 * RTSP URL. The poller will automatically pick them up on the next cycle.
 */

const net = require('net');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

const prisma = new PrismaClient();

const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds
const RTSP_SOCKET_TIMEOUT_MS = 5000; // 5s connection timeout per feed

// ── CV Stub ───────────────────────────────────────────────────────────────────

/**
 * detectWaterInFrame — Stub for real-time flood water detection from CCTV frames.
 *
 * PRODUCTION REPLACEMENT: Swap this function with a real inference call:
 *   const result = await yoloModel.detect(frameBuffer, class='water');
 *
 * @param {Buffer} frameBuffer - Raw video frame bytes (JPEG or RGB)
 * @param {string} cameraId    - Camera identifier for logging
 * @returns {Object} Detection result
 * {
 *   waterDetected: boolean,
 *   confidence: number (0.0–1.0),
 *   method: 'stub_cv' | 'yolo_v8' | 'opencv_hsv',
 *   boundingBoxes: Array  (empty in stub),
 *   processedAt: string,
 * }
 */
function detectWaterInFrame(frameBuffer, cameraId = 'unknown') {
  // STUB: Always returns no water detected with 0 confidence
  // Replace with: await runYOLOInference(frameBuffer) or OpenCV HSV water mask
  return {
    waterDetected: false,
    confidence: 0.0,
    method: 'stub_cv',
    boundingBoxes: [],
    processedAt: new Date().toISOString(),
    note: 'Stub — replace detectWaterInFrame() with real CV inference',
  };
}

// ── RTSP Socket Stub ──────────────────────────────────────────────────────────

/**
 * connectRTSP — TCP socket stub that simulates an RTSP connection.
 *
 * A real RTSP implementation would use an FFmpeg subprocess or the
 * node-rtsp-stream library. This stub proves the connection attempt
 * without requiring a live camera endpoint.
 *
 * @param {string} feedUrl - rtsp://... URL
 * @param {string} cameraId
 * @returns {Promise<Object>} Connection result
 */
async function connectRTSP(feedUrl, cameraId) {
  return new Promise((resolve) => {
    let host, port;

    try {
      // Parse RTSP URL for TCP connection attempt
      const url = new URL(feedUrl.replace('rtsp://', 'http://'));
      host = url.hostname;
      port = parseInt(url.port) || 554; // RTSP default port
    } catch (e) {
      return resolve({
        connected: false,
        error: `Invalid RTSP URL: ${feedUrl}`,
        latencyMs: null,
      });
    }

    const startTime = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(RTSP_SOCKET_TIMEOUT_MS);

    socket.on('connect', () => {
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      resolve({ connected: true, latencyMs, error: null });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ connected: false, latencyMs: null, error: 'Connection timeout' });
    });

    socket.on('error', (err) => {
      resolve({ connected: false, latencyMs: null, error: err.message });
    });

    // In stub mode: if host is 'stub' or '0.0.0.0', resolve immediately as stub
    if (host === 'stub' || host === '0.0.0.0' || host === 'localhost') {
      socket.destroy();
      return resolve({
        connected: true,
        latencyMs: 1,
        error: null,
        note: 'Stub connection — no real camera',
      });
    }

    socket.connect(port, host);
  });
}

// ── Main Polling Loop ─────────────────────────────────────────────────────────

async function pollCameraFeeds(io) {
  try {
    const feeds = await prisma.cameraFeed.findMany({
      where: { isActive: true },
    });

    if (feeds.length === 0) {
      logger.info('[CameraPoller] No active camera feeds registered');
      return;
    }

    logger.info(`[CameraPoller] Polling ${feeds.length} camera feed(s)...`);

    for (const feed of feeds) {
      try {
        // Attempt RTSP connection
        const connResult = await connectRTSP(feed.rtspUrl, feed.id);

        // Simulate frame buffer (empty in stub mode)
        const frameBuffer = Buffer.alloc(0);
        const detection = detectWaterInFrame(frameBuffer, feed.id);

        // Update camera feed record
        await prisma.cameraFeed.update({
          where: { id: feed.id },
          data: {
            lastPolledAt: new Date(),
            isOnline: connResult.connected,
            latencyMs: connResult.latencyMs,
            lastWaterDetected: detection.waterDetected,
            lastDetectionConfidence: detection.confidence,
            lastDetectionMethod: detection.method,
            connectionError: connResult.error,
          },
        });

        logger.info(
          `[CameraPoller] Feed "${feed.name}" | Online: ${connResult.connected} | Water: ${detection.waterDetected} | Latency: ${connResult.latencyMs ?? 'n/a'}ms`
        );

        // Emit feed status to dashboard if water detected
        if (io && detection.waterDetected) {
          io.emit('camera:water-detected', {
            feedId: feed.id,
            feedName: feed.name,
            location: { lat: feed.latitude, lng: feed.longitude },
            confidence: detection.confidence,
            method: detection.method,
            detectedAt: detection.processedAt,
          });
        }
      } catch (feedErr) {
        logger.error(`[CameraPoller] Error processing feed ${feed.id}: ${feedErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`[CameraPoller] Poll cycle failed: ${err.message}`);
  }
}

// ── Starter ───────────────────────────────────────────────────────────────────

function startCameraPoller(io) {
  logger.info('[CameraPoller] Starting RTSP camera feed poller (60s interval, stub CV)');
  // Run immediately, then on interval
  pollCameraFeeds(io);
  return setInterval(() => pollCameraFeeds(io), POLL_INTERVAL_MS);
}

module.exports = {
  startCameraPoller,
  pollCameraFeeds,
  connectRTSP,
  detectWaterInFrame,
};
