import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { File } from "expo-file-system";
import { getCloudFunctionAuthHeaders } from "@/src/lib/api";

const CLOUD_API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "https://us-central1-piggybank-a0011.cloudfunctions.net/api";

export async function captureQuickPosterImage(
  captureView: RefObject<View | null>,
): Promise<string> {
  if (!captureView.current) {
    throw new Error("Poster preview is not ready");
  }

  return captureRef(captureView, {
    format: "png",
    quality: 1,
    result: "tmpfile",
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  const encode =
    typeof globalThis.btoa === "function"
      ? globalThis.btoa.bind(globalThis)
      : null;
  if (!encode) {
    throw new Error("Base64 encoding is not available");
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return encode(binary);
}

async function readLocalImageAsBase64(localUri: string): Promise<string> {
  const file = new File(localUri);
  const buffer = await file.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

/**
 * Uploads a captured quick poster via Cloud Function (Admin SDK Storage).
 * Client direct Storage upload is blocked by security rules on `events/.../quick_poster.png`.
 */
export async function uploadQuickPosterToEvent(
  eventId: string,
  localUri: string,
): Promise<string> {
  const imageBase64 = await readLocalImageAsBase64(localUri);
  const headers = await getCloudFunctionAuthHeaders();

  const response = await fetch(`${CLOUD_API_BASE}/saveQuickPoster`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ eventId, imageBase64 }),
  });

  const raw = await response.text();
  let data: { error?: string; posterUrl?: string } = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(raw.slice(0, 200) || "Invalid response from server");
    }
  }

  if (!response.ok) {
    throw new Error(data.error || `Failed to save quick poster (${response.status})`);
  }

  if (!data.posterUrl) {
    throw new Error("Server did not return a poster URL");
  }

  return data.posterUrl;
}
