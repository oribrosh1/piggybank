const eventRepository = require("../repositories/eventRepository");
const { AppError, handleError } = require("../utils/errors");

/** Lazy-load: avoids pulling Gemini + Vertex/aiplatform into cold start for every function. */
function loadAiService() {
    return require("../services/aiService");
}

async function generatePoster(req, res) {
    const { eventId, posterPrompt: posterPromptBody, imageModelIds: imageModelIdsBody } = req.body;
    const uid = req.user?.uid;
    console.log(`[generatePoster] uid=${uid} eventId=${eventId}`);

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    const posterPrompt =
        typeof posterPromptBody === "string" ? posterPromptBody.trim() : "";

    if (imageModelIdsBody !== undefined && imageModelIdsBody !== null) {
        if (!Array.isArray(imageModelIdsBody)) {
            return res.status(400).json({ error: "imageModelIds must be an array of strings" });
        }
    }

    try {
        const event = await eventRepository.getById(eventId);
        if (!event) {
            throw new AppError("Event not found", { statusCode: 404 });
        }
        if (event.creatorId !== uid) {
            throw new AppError("Not authorized to modify this event", { statusCode: 403 });
        }

        const options = {};
        if (posterPrompt.length > 0) {
            options.posterPrompt = posterPrompt;
        }
        const { posterPrompt: savedPrompt, posterUrl, skeletonPosterUrl, visualTeaser } = await loadAiService().generatePoster(
            eventId,
            event,
            options,
        );
        console.log(`[generatePoster] success uid=${uid} eventId=${eventId} hasUrl=${!!posterUrl}`);

        res.json({
            success: true,
            posterPrompt: savedPrompt,
            posterUrl: posterUrl || null,
            skeletonPosterUrl: skeletonPosterUrl ?? null,
            ...(visualTeaser ? { visualTeaser } : {}),
            message: posterUrl
                ? "AI poster generated successfully!"
                : "Poster prompt saved. Image generation unavailable or failed; you can use the prompt elsewhere.",
        });
    } catch (err) {
        console.error(`[generatePoster] error uid=${uid} eventId=${eventId} message=${err.message}`);
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
        }
        if (err.message && err.message.includes("GEMINI_API_KEY")) {
            return res.status(503).json({ error: "Poster generation is not configured." });
        }
        if (err.message && err.message.includes("OPENAI_API_KEY")) {
            return res.status(503).json({ error: "OpenAI image generation is not configured." });
        }
        if (err.message && err.message.includes("posterPrompt must be at least")) {
            return res.status(400).json({ error: err.message });
        }
        if (err.message && err.message.includes("Failed to generate poster prompt")) {
            return res.status(502).json({ error: err.message });
        }
        handleError(err, res);
    }
}

module.exports = { generatePoster };
