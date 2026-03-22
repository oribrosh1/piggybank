const SENSITIVE_KEYS = new Set([
    "email", "phone", "ssn", "dob", "dateOfBirth", "date_of_birth",
    "line1", "line2", "address", "postal_code", "zipCode", "zip",
    "account_number", "routing_number", "account_holder_name",
    "number", "cvc", "first_name", "last_name", "name",
    "ip", "tosIp", "password",
]);

function maskValue(key, value) {
    if (typeof value !== "string") return value;
    if (key === "email") {
        const [local, domain] = value.split("@");
        if (!domain) return "***";
        return `${local[0]}***@${domain}`;
    }
    if (key === "phone") {
        return value.length > 4 ? `***${value.slice(-4)}` : "***";
    }
    if (value.length <= 4) return "***";
    return `${value.slice(0, 2)}***`;
}

function safelog(tag, message, data) {
    if (!data) {
        console.log(`[${tag}] ${message}`);
        return;
    }
    const masked = {};
    for (const [key, val] of Object.entries(data)) {
        masked[key] = SENSITIVE_KEYS.has(key) ? maskValue(key, val) : val;
    }
    console.log(`[${tag}] ${message}`, JSON.stringify(masked));
}

module.exports = { maskValue, safelog, SENSITIVE_KEYS };
