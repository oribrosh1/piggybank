// Route types for Expo Router
// This file contains all valid route paths in the app

import { ExternalPathString } from "expo-router";

// Helper to cast routes to ExternalPathString (bypasses Expo Router's strict types)
const route = <T extends string>(path: T): ExternalPathString => path as ExternalPathString;

export type AppRoute =
    // Root
    | "/"
    // Auth routes
    | "/(auth)/login"
    | "/(auth)/signup"
    | "/(auth)/email-signin"
    // Tab routes
    | "/(tabs)/home"
    | "/(tabs)/banking"
    | "/(tabs)/create-event"
    | "/(tabs)/my-events"
    | "/(tabs)/profile"
    // Create Event flow
    | "/create-event/event-type"
    | "/create-event/event-details"
    | "/create-event/select-guests"
    | "/create-event/review-invitation"
    | `/event-dashboard/${string}`
    // Banking setup flow
    | "/banking/setup/identity-verification"
    | "/banking/setup/personal-info"
    | "/banking/setup/document-upload"
    | "/banking/setup/review-submit"
    | "/banking/setup/success"
    | "/banking/setup/apple-pay-setup"
    // Event detail
    | `/event-detail/${string}`
    // Event dashboard sub-routes
    | `/event-dashboard/${string}/edit`
    | `/event-dashboard/${string}/add-guests`
    // Not found
    | "/+not-found";

// Helper type for routes with parameters
export type RouteParams = {
    "/create-event/event-details": { eventType: string };
    "/create-event/select-guests": { eventType: string; eventDetails: string };
    "/create-event/review-invitation": {
        eventType: string;
        eventDetails: string;
        guests: string;
    };
    "/event-detail/[id]": { id: string };
};

/**
 * Centralized routes object for type-safe navigation
 * 
 * Benefits:
 * - Autocomplete for all routes
 * - Prevents typos
 * - Single source of truth
 * - Easy refactoring
 * 
 * Usage:
 * ```ts
 * router.push(routes.tabs.home)
 * router.push(routes.auth.login)
 * router.push(routes.eventDetail("123"))
 * ```
 */
export const routes = {
    root: route("/"),
    auth: {
        login: route("/(auth)/login"),
        signup: route("/(auth)/signup"),
        emailSignin: route("/(auth)/email-signin"),
    },
    tabs: {
        home: route("/(tabs)/home"),
        banking: route("/(tabs)/banking"),
        createEvent: route("/(tabs)/create-event"),
        myEvents: route("/(tabs)/my-events"),
        profile: route("/(tabs)/profile"),
    },
    createEvent: {
        eventType: route("/create-event/event-type"),
        eventDetails: route("/create-event/event-details"),
        selectGuests: route("/create-event/select-guests"),
        review: route("/create-event/review-invitation"),
    },
    banking: {
        setup: {
            identityVerification: route("/banking/setup/identity-verification"),
            personalInfo: route("/banking/setup/personal-info"),
            documentUpload: route("/banking/setup/document-upload"),
            reviewSubmit: route("/banking/setup/review-submit"),
            success: route("/banking/setup/success"),
            applePaySetup: route("/banking/setup/apple-pay-setup"),
        },
    },
    eventDetail: (id: string) => route(`/event-detail/${id}`),
    eventDashboard: (id: string) => route(`/event-dashboard/${id}`),
    editEvent: (id: string) => route(`/event-dashboard/edit/${id}`),
    addGuests: (id: string) => route(`/event-dashboard/add-guests/${id}`),
    notFound: route("/+not-found"),
} as const;

