import type { EventType } from "@/types/events";

/** Ordinal suffix for ages (1st, 2nd, 3rd, …) */
export function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

/**
 * Builds the public event title stored as `eventName` (invitations, lists, posters)
 * from the honoree's name and event type.
 */
export function buildEventTitleFromChild(childName: string, eventType: EventType, age: string): string {
  const name = childName.trim();
  if (!name) return "Celebration";
  const ageNum = parseInt(age.trim(), 10);

  if (eventType === "birthday") {
    if (!Number.isNaN(ageNum) && ageNum > 0) {
      return `${name}'s ${ageNum}${ordinalSuffix(ageNum)} Birthday`;
    }
    return `${name}'s Birthday`;
  }
  if (eventType === "barMitzvah") {
    return `${name}'s Bar Mitzvah`;
  }
  if (eventType === "batMitzvah") {
    return `${name}'s Bat Mitzvah`;
  }
  if (eventType === "other") {
    if (!Number.isNaN(ageNum) && ageNum > 0) {
      return `${name}'s ${ageNum}${ordinalSuffix(ageNum)} Celebration`;
    }
    return `${name}'s Celebration`;
  }
  return `${name}'s Event`;
}

/** Same logic as extractChildFirstName for legacy docs without `childName`. */
export function legacyFirstNameFromEventTitle(eventName: string): string {
  const apos = eventName.match(/^([A-Za-z]+)'/);
  if (apos) return apos[1] ?? "";
  const first = eventName.trim().split(/\s+/)[0];
  if (!first) return "";
  return first.replace(/[^A-Za-z]/g, "") || "";
}

export function honoreeNameFromEvent(event: { childName?: string; eventName: string }): string {
  const c = event.childName?.trim();
  if (c) return c;
  const legacy = legacyFirstNameFromEventTitle(event.eventName);
  return legacy || event.eventName;
}
