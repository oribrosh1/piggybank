const eventRepository = require("../repositories/eventRepository");
const aiService = require("../services/aiService");
const { AppError, handleError } = require("../utils/errors");

async function generatePoster(req, res) {
    const { eventId } = req.body;
    const uid = req.user?.uid;

    if (!eventId) {
        return res.status(400).json({ error: "Missing eventId" });
    }

    try {
        const event = await eventRepository.getById(eventId);
        if (!event) {
            throw new AppError("Event not found", { statusCode: 404 });
        }
        if (event.creatorId !== uid) {
            throw new AppError("Not authorized to modify this event", { statusCode: 403 });
        }

        const { posterPrompt, posterUrl } = await aiService.generatePoster(eventId, event);

        res.json({
            success: true,
            posterPrompt,
            posterUrl: posterUrl || null,
            message: posterUrl
                ? "AI poster generated successfully!"
                : "Poster prompt saved. Image generation unavailable or failed; you can use the prompt elsewhere.",
        });
    } catch (err) {
        if (err instanceof AppError) {
            return res.status(err.statusCode).json({ error: err.message, ...(err.code && { code: err.code }) });
        }
        if (err.message && err.message.includes("GEMINI_API_KEY")) {
            return res.status(503).json({ error: "Poster generation is not configured." });
        }
        if (err.message && err.message.includes("Failed to generate poster prompt")) {
            return res.status(502).json({ error: err.message });
        }
        handleError(err, res);
    }
}

module.exports = { generatePoster };
