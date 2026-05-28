/**
 * Build a **face-only** square PNG from a parent-uploaded honoree photo for image APIs
 * (Vertex Imagen reference, Together `reference_images`, OpenAI `images.edit`, etc.).
 *
 * 1. **Google Cloud Vision** `FACE_DETECTION` → largest face `boundingPoly`, expand, square crop.
 * 2. If Vision fails or finds no faces → **heuristic** upper-center square (typical portrait framing).
 *
 * Env:
 * - `HONOREE_FACE_CROP_ENABLED` — `0`/`false`/`off` disables this module (callers keep full photo).
 * - `HONOREE_FACE_USE_VISION` — `0` skips Vision and uses heuristic only (no Vision API billing).
 * - `HONOREE_FACE_PAD_FACTOR` — expand face box (default `1.48`).
 * - `HONOREE_FACE_OUTPUT_SIZE` — output width/height in px (default `768`).
 */

const sharp = require("sharp");
const vision = require("@google-cloud/vision");

const DEFAULT_PAD = 1.48;
const DEFAULT_OUT = 768;

let visionClient = null;

function getVisionClient() {
    if (!visionClient) {
        visionClient = new vision.ImageAnnotatorClient();
    }
    return visionClient;
}

function envTruthy(name, defaultTrue = true) {
    const v = process.env[name];
    if (v === undefined || v === null || String(v).trim() === "") return defaultTrue;
    const s = String(v).trim().toLowerCase();
    return s !== "0" && s !== "false" && s !== "no" && s !== "off";
}

function isHonoreeFaceCropEnabled() {
    return envTruthy("HONOREE_FACE_CROP_ENABLED", true);
}

function isVisionFaceDetectionEnabled() {
    return envTruthy("HONOREE_FACE_USE_VISION", true);
}

function parsePadFactor() {
    const raw = process.env.HONOREE_FACE_PAD_FACTOR?.trim();
    if (!raw) return DEFAULT_PAD;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n >= 1 && n <= 2.5 ? n : DEFAULT_PAD;
}

function parseOutputSize() {
    const raw = process.env.HONOREE_FACE_OUTPUT_SIZE?.trim();
    if (!raw) return DEFAULT_OUT;
    const n = parseInt(String(raw), 10);
    if (!Number.isFinite(n)) return DEFAULT_OUT;
    return Math.min(1024, Math.max(256, n));
}

/**
 * @param {{ x?: number; y?: number }[]} vertices
 * @returns {{ minX: number; minY: number; maxX: number; maxY: number } | null}
 */
function bboxFromVertices(vertices) {
    if (!Array.isArray(vertices) || vertices.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const v of vertices) {
        const x = typeof v?.x === "number" ? v.x : 0;
        const y = typeof v?.y === "number" ? v.y : 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;
    return { minX, minY, maxX, maxY };
}

/**
 * @param {{ minX: number; minY: number; maxX: number; maxY: number }} b
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} padFactor
 * @returns {{ left: number; top: number; width: number; height: number }}
 */
function squareExpandBox(b, imgW, imgH, padFactor) {
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const bw = (b.maxX - b.minX) * padFactor;
    const bh = (b.maxY - b.minY) * padFactor;
    let side = Math.max(bw, bh);
    side = Math.min(side, Math.min(imgW, imgH));
    let left = Math.round(cx - side / 2);
    let top = Math.round(cy - side / 2);
    left = Math.max(0, Math.min(left, imgW - 1));
    top = Math.max(0, Math.min(top, imgH - 1));
    const maxSide = Math.min(imgW - left, imgH - top);
    const width = Math.max(1, Math.min(Math.round(side), maxSide));
    const height = width;
    return { left, top, width, height };
}

/**
 * Upper-center square when Vision finds nothing (common phone portrait of a child).
 * @param {number} imgW
 * @param {number} imgH
 */
function heuristicSquare(imgW, imgH) {
    const side = Math.round(Math.min(imgW, imgH) * 0.72);
    const left = Math.max(0, Math.floor((imgW - side) / 2));
    const top = Math.max(0, Math.min(Math.floor(imgH * 0.06), imgH - side));
    return { left, top, width: Math.min(side, imgW - left), height: Math.min(side, imgH - top) };
}

/**
 * @param {Buffer} inputBuffer
 * @param {{ left: number; top: number; width: number; height: number }} region
 * @param {number} outSize
 * @returns {Promise<Buffer>}
 */
async function cropResizeToPng(inputBuffer, region, outSize) {
    const { left, top, width, height } = region;
    return sharp(inputBuffer)
        .extract({
            left,
            top,
            width: Math.max(1, width),
            height: Math.max(1, height),
        })
        .resize(outSize, outSize, { fit: "cover" })
        .png({ compressionLevel: 6 })
        .toBuffer();
}

/**
 * @param {Buffer} inputBuffer
 * @param {string} [_mimeType] reserved for future format-specific paths
 * @returns {Promise<Buffer>}
 */
async function extractFaceReferencePng(inputBuffer, _mimeType = "image/jpeg") {
    if (!Buffer.isBuffer(inputBuffer) || inputBuffer.length < 32) {
        throw new Error("honoreeFaceCropService: invalid input buffer");
    }

    const meta = await sharp(inputBuffer).metadata();
    const imgW = meta.width || 0;
    const imgH = meta.height || 0;
    if (imgW < 32 || imgH < 32) {
        throw new Error("honoreeFaceCropService: image dimensions too small");
    }

    const padFactor = parsePadFactor();
    const outSize = parseOutputSize();
    let region = null;

    if (isVisionFaceDetectionEnabled()) {
        try {
            const client = getVisionClient();
            const [imgResult] = await client.faceDetection(inputBuffer);
            const faces = imgResult?.faceAnnotations || [];
            let best = null;
            let bestArea = 0;
            for (const f of faces) {
                const b = bboxFromVertices(f.boundingPoly?.vertices);
                if (!b) continue;
                const area = (b.maxX - b.minX) * (b.maxY - b.minY);
                if (area > bestArea) {
                    bestArea = area;
                    best = b;
                }
            }
            if (best && bestArea >= 200) {
                region = squareExpandBox(best, imgW, imgH, padFactor);
                console.info(
                    `[honoreeFaceCrop] Vision face OK area=${Math.round(bestArea)} extract=${region.width}x${region.height}@${region.left},${region.top}`,
                );
            } else {
                console.info("[honoreeFaceCrop] Vision: no usable face box — heuristic crop");
            }
        } catch (e) {
            console.warn(`[honoreeFaceCrop] Vision faceDetection failed: ${e.message} — heuristic crop`);
        }
    } else {
        console.info("[honoreeFaceCrop] HONOREE_FACE_USE_VISION off — heuristic crop");
    }

    if (!region) {
        region = heuristicSquare(imgW, imgH);
    }

    const out = await cropResizeToPng(inputBuffer, region, outSize);
    console.info(`[honoreeFaceCrop] output png ${out.length} bytes (${outSize}x${outSize})`);
    return out;
}

module.exports = {
    isHonoreeFaceCropEnabled,
    isVisionFaceDetectionEnabled,
    extractFaceReferencePng,
};
