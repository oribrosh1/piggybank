export type EventType = "birthday" | "barMitzvah" | "batMitzvah" | "other";
export type GuestStatus = 'added' | 'invited' | 'confirmed' | 'paid';

export interface Guest {
    id: string;
    name: string;
    phone: string;
    status: GuestStatus;
    addedAt?: Date;
    invitedAt?: Date;
    confirmedAt?: Date;
    paidAt?: Date;
    paymentAmount?: number;
}

export interface EventData {
    id: string;
    creatorId: string;
    creatorName: string;
    eventType: EventType;
    eventName: string;
    eventCategory?: string;
    partyType?: string;
    otherPartyType?: string;
    dressCode?: string;
    theme?: string;
    parking?: string;
    /** Gate, entrance, elevator, unit — guests see near address */
    locationNotes?: string;
    kosherType?: string;
    mealType?: string;
    vegetarianType?: string;
    age?: string;
    /** Poster hero; synced with app `HonoreeGender` */
    honoreeGender?: "boy" | "girl" | "other";
    date: string;
    time: string;
    address1: string;
    address2?: string;
    guests: Guest[];
    totalGuests: number;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    createdAt: Date;
}

export function getEventEmoji(eventType: EventType): string {
    switch (eventType) {
        case 'birthday': return '🎂';
        case 'barMitzvah': return '📖';
        case 'batMitzvah': return '📖';
        default: return '🎉';
    }
}

export function getEventTypeLabel(eventType: EventType): string {
    switch (eventType) {
        case 'birthday': return 'Birthday Party';
        case 'barMitzvah': return 'Bar Mitzvah';
        case 'batMitzvah': return 'Bat Mitzvah';
        default: return 'Celebration';
    }
}

export function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

