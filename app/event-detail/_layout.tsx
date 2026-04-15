import { Stack } from "expo-router";

export default function EventDetailLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
            }}
        />
    );
}

