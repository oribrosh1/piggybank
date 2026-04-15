import { Stack } from "expo-router";

export default function BankingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
            }}
        />
    );
}

