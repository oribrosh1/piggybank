/**
 * Scheduled guest SMS (Twilio). Runs daily 9:00 America/Los_Angeles.
 * Sends for events whose date is today or in two days (fixed schedule).
 * Opt out per event: set `events/{eventId}.reminderSmsEnabled` to false.
 * Custom per-user date/time scheduling is not implemented (would need Cloud Tasks or similar).
 */
const admin = require("firebase-admin");
const twilio = require("twilio");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const db = admin.firestore();

function parseEventDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

function toYYYYMMDD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function uniqueGuestPhones(guests, predicate) {
    const seen = new Set();
    return guests
        .filter((guest) => guest && predicate(guest))
        .map((guest) => guest.phone)
        .filter((phone) => typeof phone === "string" && phone.trim())
        .map((phone) => phone.trim())
        .filter((phone) => {
            if (seen.has(phone)) return false;
            seen.add(phone);
            return true;
        });
}

exports.sendEventReminderSMS = onSchedule(
    { schedule: "0 9 * * *", timeZone: "America/Los_Angeles" },
    async () => {
        const baseUrl = process.env.EVENT_BASE_URL || "https://credit-kid.com";
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.warn("[sendEventReminderSMS] Twilio env not set, skipping");
            return;
        }

        const client = twilio(accountSid, authToken);
        const today = new Date();
        const todayStr = toYYYYMMDD(today);
        const inTwoDays = new Date(today);
        inTwoDays.setDate(inTwoDays.getDate() + 2);
        const inTwoDaysStr = toYYYYMMDD(inTwoDays);

        let snapshot;
        try {
            snapshot = await db.collection("events").get();
        } catch (err) {
            console.error("[sendEventReminderSMS] Failed to fetch events:", err);
            return;
        }

        for (const doc of snapshot.docs) {
            const eventId = doc.id;
            const event = doc.data();
            if (event.reminderSmsEnabled === false) continue;
            const eventDate = parseEventDate(event.date || event.eventDate);
            if (!eventDate) continue;

            const eventDateStr = toYYYYMMDD(eventDate);
            const isToday = eventDateStr === todayStr;
            const isInTwoDays = eventDateStr === inTwoDaysStr;
            if (!isToday && !isInTwoDays) continue;

            const dayLabel = isToday ? "today" : "in 2 days";
            const childName = event.eventName || event.childName || "Your child";
            const eventLink = `${baseUrl}/event/${eventId}`;
            const rsvpBody = `Reminder: ${childName}'s birthday party is ${dayLabel}! Don't forget to RSVP ${eventLink}`;
            const giftBody = `Reminder: ${childName}'s birthday party is ${dayLabel}! You can still send a gift here: ${eventLink}`;

            const messages = [];
            if (Array.isArray(event.guests)) {
                const pendingRsvpPhones = uniqueGuestPhones(
                    event.guests,
                    (guest) => guest.status === "added" || guest.status === "invited",
                );
                messages.push(...pendingRsvpPhones.map((phone) => ({ phone, body: rsvpBody })));

                if (event.reminderGiftNudgeEnabled === true) {
                    const giftReminderPhones = uniqueGuestPhones(
                        event.guests,
                        (guest) => guest.status === "confirmed",
                    );
                    messages.push(...giftReminderPhones.map((phone) => ({ phone, body: giftBody })));
                }
            } else if (Array.isArray(event.invitedGuests)) {
                const phones = event.invitedGuests.filter((p) => typeof p === "string" && p.trim());
                messages.push(...phones.map((phone) => ({ phone, body: rsvpBody })));
            }

            for (const { phone, body } of messages) {
                try {
                    await client.messages.create({
                        body,
                        from: fromNumber,
                        to: phone,
                    });
                    console.log(`[sendEventReminderSMS] Sent to ${phone} for event ${eventId}`);
                } catch (err) {
                    console.warn(`[sendEventReminderSMS] Twilio failed for ${phone} (event ${eventId}):`, err.message);
                }
            }
        }
    }
);
