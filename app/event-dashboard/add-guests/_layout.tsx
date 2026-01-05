import { Stack } from "expo-router";

export default function AddGuestsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="[id]" />
        </Stack>
    );
}

