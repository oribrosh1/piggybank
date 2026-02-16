// Helper functions for event dashboard

export const getEventTypeLabel = (type: string) => {
    switch (type) {
        case "birthday": return "🎂 Birthday";
        case "barMitzvah": return "✡️ Bar Mitzvah";
        case "batMitzvah": return "✡️ Bat Mitzvah";
        default: return "🎉 Event";
    }
};

export const getEventCategoryLabel = (category?: string) => {
    if (!category) return null;
    return category === "party" ? "🎊 Party" : "🎩 Formal Event";
};

export const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

export const getKosherLabel = (type?: string) => {
    switch (type) {
        case "kosher-style": return "🍴 Kosher Style";
        case "kosher": return "✡️ Kosher";
        case "glatt-kosher": return "Ⓤ Glatt Kosher";
        case "not-kosher": return "🍽️ Not Kosher";
        default: return null;
    }
};

export const getMealTypeLabel = (type?: string) => {
    switch (type) {
        case "dairy": return "🥛 Dairy";
        case "meat": return "🥩 Meat";
        case "pareve": return "🥗 Pareve";
        default: return null;
    }
};

export const getVegetarianLabel = (type?: string) => {
    switch (type) {
        case "vegetarian": return "🥬 Vegetarian";
        case "vegan": return "🌱 Vegan";
        case "by_request": return "🌱 Vegetarian on request";
        default: return null;
    }
};

export const getGuestStatusConfig = (status: string) => {
    const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
        added: { bg: "#F3F4F6", color: "#6B7280", label: "Added" },
        invited: { bg: "#DBEAFE", color: "#1D4ED8", label: "Invited" },
        confirmed: { bg: "#D1FAE5", color: "#059669", label: "Confirmed" },
        paid: { bg: "#FEF3C7", color: "#D97706", label: "Paid ✓" },
    };
    return statusConfig[status] || statusConfig.added;
};

