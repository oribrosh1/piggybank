import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Sparkles,
    X,
    Wand2,
    Check,
    RefreshCw,
    Download,
    Share2,
    ImageIcon,
    Palette,
    Type,
} from "lucide-react-native";
import { Event } from "@/types/events";
import { generateEventPoster, saveEventPoster } from "@/src/lib/eventService";
import { formatDate } from "./utils";

interface AIPosterGeneratorProps {
    event: Event;
    delay?: number;
    onPosterGenerated?: (posterUrl: string) => void;
}

export default function AIPosterGenerator({ event, delay = 750, onPosterGenerated }: AIPosterGeneratorProps) {
    const [showModal, setShowModal] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(event.posterPrompt || null);
    const [posterUrl, setPosterUrl] = useState<string | null>(event.posterUrl || null);
    const [customPrompt, setCustomPrompt] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    const getEventTypeLabel = () => {
        switch (event.eventType) {
            case "birthday": return "Birthday Party";
            case "barMitzvah": return "Bar Mitzvah";
            case "batMitzvah": return "Bat Mitzvah";
            default: return "Celebration";
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const result = await generateEventPoster(event.id);

            if (result.success) {
                setGeneratedPrompt(result.posterPrompt || null);
                if (result.posterUrl) {
                    setPosterUrl(result.posterUrl);
                    onPosterGenerated?.(result.posterUrl);
                }
                Alert.alert(
                    "Success! 🎨",
                    result.posterUrl
                        ? "Your AI invitation poster has been generated!"
                        : "AI prompt generated! You can use this with an image generator to create your poster.",
                    [{ text: "Awesome!" }]
                );
            } else {
                Alert.alert("Error", result.error || "Failed to generate poster");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setGenerating(false);
        }
    };

    const handleSavePoster = async (url: string) => {
        const result = await saveEventPoster(event.id, url, generatedPrompt || undefined);
        if (result.success) {
            setPosterUrl(url);
            onPosterGenerated?.(url);
            Alert.alert("Saved!", "Poster has been saved to your event.");
        } else {
            Alert.alert("Error", result.error || "Failed to save poster");
        }
    };

    const copyPromptToClipboard = async () => {
        if (generatedPrompt) {
            // In a real app, use Clipboard API
            Alert.alert("Copied!", "The AI prompt has been copied to your clipboard. Use it with any AI image generator!");
        }
    };

    return (
        <>
            {/* Card Button */}
            <Animated.View
                entering={FadeInDown.delay(delay).duration(400)}
                style={{
                    marginHorizontal: 24,
                    marginTop: 16,
                }}
            >
                <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 20,
                        padding: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                        borderWidth: 2,
                        borderColor: posterUrl ? "#D1FAE5" : "#FEF3C7",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: 16,
                                backgroundColor: posterUrl ? "#10B981" : "#F59E0B",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 14,
                            }}
                        >
                            {posterUrl ? (
                                <Check size={24} color="#FFFFFF" strokeWidth={3} />
                            ) : (
                                <Wand2 size={24} color="#FFFFFF" strokeWidth={2} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 4 }}>
                                {posterUrl ? "AI Poster Ready" : "Create AI Poster"}
                            </Text>
                            <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}>
                                {posterUrl
                                    ? "Tap to view or regenerate your poster"
                                    : "Generate a stunning invitation with AI ✨"
                                }
                            </Text>
                        </View>
                        <View
                            style={{
                                backgroundColor: posterUrl ? "#D1FAE5" : "#FEF3C7",
                                borderRadius: 20,
                                paddingVertical: 6,
                                paddingHorizontal: 12,
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: posterUrl ? "#059669" : "#D97706" }}>
                                {posterUrl ? "View" : "New"}
                            </Text>
                        </View>
                    </View>

                    {/* Preview thumbnail if poster exists */}
                    {posterUrl && (
                        <View
                            style={{
                                marginTop: 16,
                                borderRadius: 12,
                                overflow: "hidden",
                                backgroundColor: "#F3F4F6",
                            }}
                        >
                            <Image
                                source={{ uri: posterUrl }}
                                style={{ width: "100%", height: 120 }}
                                resizeMode="cover"
                            />
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>
                                    🤖 AI Generated Invitation
                                </Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Full Modal */}
            <Modal
                visible={showModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: 16,
                            backgroundColor: "#FFFFFF",
                            borderBottomWidth: 1,
                            borderBottomColor: "#E5E7EB",
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Sparkles size={24} color="#F59E0B" strokeWidth={2} />
                            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827", marginLeft: 10 }}>
                                AI Poster Generator
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: "#F3F4F6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <X size={20} color="#374151" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Event Summary Card */}
                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 20,
                                padding: 20,
                                marginBottom: 20,
                                borderWidth: 2,
                                borderColor: "#E5E7EB",
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#9CA3AF", marginBottom: 12, letterSpacing: 0.5 }}>
                                EVENT DETAILS FOR AI
                            </Text>

                            <View style={{ gap: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ fontSize: 20, marginRight: 10 }}>🎉</Text>
                                    <View>
                                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>Event</Text>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.eventName}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ fontSize: 20, marginRight: 10 }}>📅</Text>
                                    <View>
                                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>Date & Time</Text>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
                                            {formatDate(event.date)} at {event.time}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ fontSize: 20, marginRight: 10 }}>📍</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>Location</Text>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.address1}</Text>
                                    </View>
                                </View>

                                {event.theme && (
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={{ fontSize: 20, marginRight: 10 }}>🎭</Text>
                                        <View>
                                            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>Theme</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>{event.theme}</Text>
                                        </View>
                                    </View>
                                )}

                                {event.age && (
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Text style={{ fontSize: 20, marginRight: 10 }}>🎂</Text>
                                        <View>
                                            <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "600" }}>Age</Text>
                                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>Turning {event.age}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Generated Poster Preview */}
                        {posterUrl && (
                            <View
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 20,
                                    overflow: "hidden",
                                    marginBottom: 20,
                                    borderWidth: 2,
                                    borderColor: "#10B981",
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: "#D1FAE5",
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Check size={18} color="#059669" strokeWidth={3} />
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#059669", marginLeft: 8 }}>
                                        Your AI-Generated Poster
                                    </Text>
                                </View>
                                <Image
                                    source={{ uri: posterUrl }}
                                    style={{ width: "100%", height: 400 }}
                                    resizeMode="contain"
                                />
                                <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#8B5CF6",
                                            borderRadius: 12,
                                            paddingVertical: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Download size={18} color="#FFFFFF" strokeWidth={2} />
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                                            Save
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: "#F3F4F6",
                                            borderRadius: 12,
                                            paddingVertical: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Share2 size={18} color="#374151" strokeWidth={2} />
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginLeft: 8 }}>
                                            Share
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Generated Prompt */}
                        {generatedPrompt && (
                            <View
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 20,
                                    padding: 20,
                                    marginBottom: 20,
                                    borderWidth: 2,
                                    borderColor: "#E5E7EB",
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Type size={18} color="#8B5CF6" strokeWidth={2} />
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginLeft: 8 }}>
                                            AI Prompt
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={copyPromptToClipboard}
                                        style={{
                                            backgroundColor: "#EDE9FE",
                                            borderRadius: 8,
                                            paddingVertical: 6,
                                            paddingHorizontal: 10,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#7C3AED" }}>Copy</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ fontSize: 13, color: "#6B7280", lineHeight: 20 }} numberOfLines={8}>
                                    {generatedPrompt}
                                </Text>
                                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, fontStyle: "italic" }}>
                                    💡 Use this prompt with DALL-E, Midjourney, or any AI image generator
                                </Text>
                            </View>
                        )}

                        {/* Advanced Options */}
                        <TouchableOpacity
                            onPress={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 20,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Palette size={20} color="#6B7280" strokeWidth={2} />
                                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginLeft: 10 }}>
                                    Advanced Options
                                </Text>
                            </View>
                            <Text style={{ fontSize: 16, color: "#9CA3AF" }}>{showAdvanced ? "▲" : "▼"}</Text>
                        </TouchableOpacity>

                        {showAdvanced && (
                            <View
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 20,
                                    borderWidth: 1,
                                    borderColor: "#E5E7EB",
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                                    Custom Style Instructions
                                </Text>
                                <TextInput
                                    style={{
                                        backgroundColor: "#F9FAFB",
                                        borderRadius: 12,
                                        padding: 14,
                                        fontSize: 14,
                                        color: "#111827",
                                        borderWidth: 1,
                                        borderColor: "#E5E7EB",
                                        minHeight: 80,
                                        textAlignVertical: "top",
                                    }}
                                    placeholder="e.g., Use pastel colors, vintage style, add flowers..."
                                    placeholderTextColor="#9CA3AF"
                                    value={customPrompt}
                                    onChangeText={setCustomPrompt}
                                    multiline
                                />
                            </View>
                        )}

                        {/* How it Works */}
                        <View
                            style={{
                                backgroundColor: "#FEF3C7",
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 20,
                                borderLeftWidth: 4,
                                borderLeftColor: "#F59E0B",
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400E", marginBottom: 8 }}>
                                💡 How it works
                            </Text>
                            <Text style={{ fontSize: 13, color: "#B45309", lineHeight: 20 }}>
                                Our AI analyzes your event details and creates a custom invitation poster design.
                                You can use the generated image directly or copy the AI prompt to create variations
                                with your favorite image generator!
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Bottom Action Button */}
                    <View
                        style={{
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            backgroundColor: "#FFFFFF",
                            borderTopWidth: 1,
                            borderTopColor: "#E5E7EB",
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleGenerate}
                            disabled={generating}
                            style={{
                                backgroundColor: generating ? "#D1D5DB" : "#F59E0B",
                                borderRadius: 16,
                                paddingVertical: 18,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {generating ? (
                                <>
                                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 10 }} />
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF" }}>
                                        Generating Magic...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    {posterUrl ? (
                                        <RefreshCw size={20} color="#FFFFFF" strokeWidth={2.5} />
                                    ) : (
                                        <Wand2 size={20} color="#FFFFFF" strokeWidth={2.5} />
                                    )}
                                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginLeft: 10 }}>
                                        {posterUrl ? "Regenerate Poster" : "Generate AI Poster"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

