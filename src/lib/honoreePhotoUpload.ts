import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { firebaseApp } from "@/src/firebase/firebaseWeb";

const HONOREE_STORAGE_PATH = "honoree_photo";

/**
 * Uploads a local image to `events/{eventId}/honoree_photo` and returns a download URL for the event doc.
 */
export async function uploadHonoreePhotoToEvent(eventId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storage = getStorage(firebaseApp);
  const storageRef = ref(storage, `events/${eventId}/${HONOREE_STORAGE_PATH}`);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type && blob.type !== "application/octet-stream" ? blob.type : "image/jpeg",
  });
  return getDownloadURL(storageRef);
}
