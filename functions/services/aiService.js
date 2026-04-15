const { GoogleGenerativeAI } = require("@google/generative-ai");
const eventRepository = require("../repositories/eventRepository");
const posterVersionRepository = require("../repositories/posterVersionRepository");
const storageRepository = require("../repositories/storageRepository");
const { getStyleInstructions } = require("../constants/posterThemes");

const PROMPT_MODELS = [
  "gemini-3.1-flash-lite-preview", 
  "gemini-3.1-flash-preview", 
  "gemini-3.1-pro-preview"
];

const IMAGE_MODELS = [
  "gemini-3-pro-image-preview", 
  "gemini-3.1-flash-image-preview",
  "imagen-3.0-generate-002", // High availability fallback
  "imagen-3.0-fast-001"     // Fastest fallback
];

// Helper to handle the "Please retry in X seconds" issue
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function buildPromptForPrompt(event, posterThemeId, hasHonoreeReferencePhoto) {
  const eventTypeLabel = { birthday: "Birthday Party", barMitzvah: "Bar Mitzvah", batMitzvah: "Bat Mitzvah" }[event.eventType] || "Celebration";
  const promptDetails = [
    `Event Type: ${eventTypeLabel}`,
    `Event Name: ${event.eventName || "Celebration"}`,
    event.age ? `Age: Turning ${event.age}` : null,
    `Date: ${formatDate(event.date)}`,
    event.time ? `Time: ${event.time}` : null,
    `Location: ${(event.address1 || "") + (event.address2 ? ", " + event.address2 : "")}`.trim() || "TBD",
  ].filter(Boolean);

  const portraitNote = hasHonoreeReferencePhoto
    ? " A parent-supplied reference photo of the honoree will be used in the image step — describe layout and style so a clear, celebratory portrait of this same child can be integrated (face and hair should read recognizably)."
    : "";

  return `Generate a detailed invitation poster prompt for: ${promptDetails.join(", ")}. Style: ${getStyleInstructions(posterThemeId)}. Ensure sharp, readable text for the name and date.${portraitNote}`;
}

function isGeminiImageModel(modelId) {
  return typeof modelId === "string" && modelId.startsWith("gemini") && modelId.includes("image");
}

async function generatePoster(eventId, event, posterThemeId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  let honoreeRef = null;
  try {
    honoreeRef = await storageRepository.readHonoreePhotoIfExists(eventId);
  } catch (err) {
    console.warn(`[AIService] honoree reference read skipped: ${err.message}`);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const promptForPrompt = buildPromptForPrompt(event, posterThemeId, Boolean(honoreeRef));

  let imagePrompt = null;
  for (const modelId of PROMPT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(promptForPrompt);
      if (result.response?.text) {
        imagePrompt = result.response.text().trim();
        break;
      }
    } catch (err) {
      console.warn(`[AIService] Stage A (${modelId}) failed.`);
    }
  }

  if (!imagePrompt) throw new Error("Prompt generation failed.");
  await eventRepository.updatePoster(eventId, imagePrompt, null);

  let posterUrl = null;
  for (const modelId of IMAGE_MODELS) {
    try {
      const imageModel = genAI.getGenerativeModel({ model: modelId });
      const parts = [];
      if (honoreeRef && isGeminiImageModel(modelId)) {
        parts.push({
          text:
            "Create one invitation poster image from the brief below. The next part is a REFERENCE PHOTO of the honoree — match this child's face, hair, skin tone, and general appearance closely in the artwork (celebratory, age-appropriate portrait integrated into the scene).\n\n--- BRIEF ---\n\n" +
            imagePrompt,
        });
        parts.push({
          inlineData: {
            mimeType: honoreeRef.mimeType,
            data: honoreeRef.buffer.toString("base64"),
          },
        });
      } else {
        parts.push({
          text:
            imagePrompt +
            (honoreeRef && !isGeminiImageModel(modelId)
              ? "\n\nInclude a prominent, warm portrait of the honoree child consistent with the name and age given."
              : ""),
        });
      }

      const imageResult = await imageModel.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE"] },
      });

      const inlineData = imageResult?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inlineData?.data) {
        const buffer = Buffer.from(inlineData.data, "base64");
        posterUrl = await storageRepository.savePoster(eventId, buffer, inlineData.mimeType || "image/png");
        await eventRepository.updatePoster(eventId, imagePrompt, posterUrl);
        break;
      }
    } catch (err) {
      console.warn(`[AIService] Stage B (${modelId}) quota/error. Trying next...`);
      console.warn(err);
      await sleep(500); // Tiny delay to help with burst limits
    }
  }

  return { posterPrompt: imagePrompt, posterUrl: posterUrl || undefined };
}

module.exports = { generatePoster, buildPromptForPrompt, formatDate };