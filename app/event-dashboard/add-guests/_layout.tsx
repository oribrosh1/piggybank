import { Stack } from "expo-router";

export default function AddGuestsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
            }}
        >
            <Stack.Screen name="[id]" />
        </Stack>
    );
}

