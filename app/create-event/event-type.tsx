import { Redirect } from "expo-router";
import { routes } from "@/types/routes";

/**
 * Event-type picker was removed; flow starts on poster style (step 0).
 * Keeps old `/create-event/event-type` links working.
 */
export default function EventTypeRedirect() {
  return (
    <Redirect
      href={{
        pathname: routes.createEvent.posterStyle,
        params: { eventType: "birthday" },
      }}
    />
  );
}
