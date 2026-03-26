const twilio = require("twilio");

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

function isSmsConfigured() {
    return !!(ACCOUNT_SID && AUTH_TOKEN && FROM_NUMBER);
}

function getClient() {
    if (!ACCOUNT_SID || !AUTH_TOKEN) {
        throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)");
    }
    return twilio(ACCOUNT_SID, AUTH_TOKEN);
}

async function sendSMS(to, body) {
    if (!FROM_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER not configured");
    }
    const client = getClient();
    const message = await client.messages.create({
        to,
        from: FROM_NUMBER,
        body,
    });
    console.log(`[smsService] sent SMS to ***${to.slice(-4)} sid=${message.sid}`);
    return message.sid;
}

module.exports = { sendSMS, isSmsConfigured };
