const { GoogleGenerativeAI } = require("@google/generative-ai");
const eventRepository = require("../repositories/eventRepository");
const storageRepository = require("../repositories/storageRepository");

const PROMPT_MODELS = ["gemini-3-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
const IMAGE_MODELS = ["nano-banana-pro-001", "imagen-3.0-generate-002", "imagen-3.0-generate-001"];

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function buildPromptForPrompt(event) {
    const eventTypeLabel = {
        birthday: "Birthday Party",
        barMitzvah: "Bar Mitzvah",
        batMitzvah: "Bat Mitzvah",
    }[event.eventType] || "Celebration";

    const promptDetails = [
        `Event Type: ${eventTypeLabel}`,
        `Event Name: ${event.eventName || "Celebration"}`,
        event.age ? `Age: Turning ${event.age}` : null,
        `Date: ${formatDate(event.date)}`,
        event.time ? `Time: ${event.time}` : null,
        `Location: ${(event.address1 || "") + (event.address2 ? ", " + event.address2 : "")}`.trim() || "TBD",
        event.theme ? `Theme: ${event.theme}` : null,
        event.attireType ? `Dress Code: ${event.attireType}` : null,
        event.partyType ? `Party Type: ${event.partyType}` : null,
    ].filter(Boolean);

    return `You are creating a detailed image-generation prompt for a printed invitation poster. The poster must include the following event details as clearly legible text (not just implied):

${promptDetails.join("\n")}

Requirements for the image prompt you generate:
- High-resolution, print-ready output (4K-ready, suitable for printing invitations).
- Specify elegant, readable typography so the actual event text (name, date, time, location) is the focal point and crystal clear.
- Festive, celebratory visual elements (e.g. confetti, balloons, sparkles) appropriate for a ${eventTypeLabel}, without obscuring text.
- Modern, premium aesthetic; vibrant but tasteful colors.
- Portrait orientation suitable for both digital sharing and physical printing.
- Style and mood: ${event.theme ? `themed around "${event.theme}"` : "elegant and modern"}.

Generate a single, detailed image-generation prompt that will produce this invitation poster. The prompt must explicitly ask for the event name, date, time, and location to appear as sharp, high-fidelity text in the image.`;
}

/**
 * Generate poster prompt using Gemini, then optionally generate image (Nano Banana Pro / Imagen).
 * Persists posterPrompt and posterUrl to event via eventRepository; saves image via storageRepository.
 * @param {string} eventId
 * @param {object} event - event data (name, theme, date, type, etc.)
 * @returns {{ posterPrompt: string, posterUrl?: string }}
 */
async function generatePoster(eventId, event) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const promptForPrompt = buildPromptForPrompt(event);

    let imagePrompt = null;
    for (const modelId of PROMPT_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent(promptForPrompt);
            const response = result.response;
            if (response && response.text) {
                imagePrompt = response.text().trim();
                break;
            }
        } catch (err) {
            console.warn(`[AIService] prompt model ${modelId} failed`, err.message);
        }
    }
    if (!imagePrompt) {
        throw new Error("Failed to generate poster prompt; all prompt models failed");
    }

    await eventRepository.updatePoster(eventId, imagePrompt, null);

    let posterUrl = null;
    for (const modelId of IMAGE_MODELS) {
        try {
            const imageModel = genAI.getGenerativeModel({
                model: modelId,
                generationConfig: {
                    responseModalities: ["image"],
                    responseMimeType: "image/png",
                },
            });
            const imageResult = await imageModel.generateContent({
                contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
                generationConfig: {
                    responseModalities: ["image"],
                    responseMimeType: "image/png",
                },
            });
            const inlineData = imageResult?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inlineData && inlineData.data) {
                const buffer = Buffer.from(inlineData.data, "base64");
                posterUrl = await storageRepository.savePoster(
                    eventId,
                    buffer,
                    inlineData.mimeType || "image/png"
                );
                await eventRepository.updatePoster(eventId, imagePrompt, posterUrl);
                console.log(`[AIService] Poster saved for event ${eventId} (${modelId}): ${posterUrl}`);
                break;
            }
        } catch (err) {
            console.warn(`[AIService] image model ${modelId} failed`, err.message);
        }
    }

    return { posterPrompt: imagePrompt, posterUrl: posterUrl || undefined };
}

module.exports = { generatePoster, buildPromptForPrompt, formatDate };
