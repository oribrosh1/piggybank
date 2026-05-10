import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
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
  Clipboard,
  Platform,
  StyleSheet,
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
  Type,
  Pencil,
  ImageIcon,
} from "lucide-react-native";
import { Event } from "@/types/events";
import {
  generateEventPoster,
  saveEventPoster,
  updateEvent,
  subscribeEventPosterGenerationProgress,
  type EventPosterGenerationSnapshot,
} from "@/src/lib/eventService";
import { BlurView } from "expo-blur";
import { formatDate } from "./utils";

const MIN_POSTER_PROMPT_CHARS = 10;

function eventHasOptionalDetailsForAi(e: Event): boolean {
  return !!(
    e.theme?.trim() ||
    e.partyVibe?.trim() ||
    e.partyType ||
    e.kosherType ||
    e.mealType ||
    e.eventCategory ||
    e.honoreePhotoUrl
  );
}

interface AIPosterGeneratorProps {
  event: Event;
  delay?: number;
  onPosterGenerated?: (posterUrl: string) => void;
  /** When true, only the modal is mounted (no inline card). Use with hero + ref.open(). */
  hideTrigger?: boolean;
}

export interface AIPosterGeneratorRef {
  open: () => void;
}

const AIPosterGenerator = forwardRef<
  AIPosterGeneratorRef,
  AIPosterGeneratorProps
>(function AIPosterGenerator(
  { event, delay = 750, onPosterGenerated, hideTrigger = false },
  ref,
) {
  const [showModal, setShowModal] = useState(false);
  useImperativeHandle(ref, () => ({ open: () => setShowModal(true) }), []);
  const [generating, setGenerating] = useState(false);
  const [promptText, setPromptText] = useState(event.posterPrompt ?? "");
  const [posterUrl, setPosterUrl] = useState<string | null>(
    event.posterUrl || null,
  );
  const [editingPrompt, setEditingPrompt] = useState(false);
  /** Live Firestore poster / skeleton URLs during an in-flight `generateEventPoster`. */
  const [genSnap, setGenSnap] = useState<EventPosterGenerationSnapshot | null>(
    null,
  );
  const prevModalOpen = useRef(false);

  useEffect(() => {
    if (showModal && !prevModalOpen.current) {
      setPromptText(event.posterPrompt ?? "");
      setPosterUrl(event.posterUrl ?? null);
      setEditingPrompt(false);
    }
    prevModalOpen.current = showModal;
  }, [showModal, event.id, event.posterPrompt, event.posterUrl]);

  const handleGenerate = async () => {
    if (
      event.optionalDetailsLater &&
      !event.posterUrl &&
      !eventHasOptionalDetailsForAi(event)
    ) {
      Alert.alert(
        "AI poster",
        "Add party mode, theme, or catering in Edit event first. Then you can generate an AI poster.",
        [{ text: "OK" }],
      );
      return;
    }
    setGenerating(true);
    setGenSnap(null);
    const unsub = subscribeEventPosterGenerationProgress(event.id, setGenSnap);
    try {
      const result = await generateEventPoster(event.id);

      if (result.success) {
        if (result.posterPrompt) {
          setPromptText(result.posterPrompt);
        }
        if (result.posterUrl) {
          setPosterUrl(result.posterUrl);
          onPosterGenerated?.(result.posterUrl);
          if (event.optionalDetailsLater) {
            await updateEvent(event.id, { optionalDetailsLater: false });
          }
        }
        Alert.alert(
          "Success! 🎨",
          result.posterUrl
            ? "Your AI invitation poster has been generated!"
            : "AI prompt generated! You can use this with an image generator to create your poster.",
          [{ text: "Awesome!" }],
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate poster");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      unsub();
      setGenSnap(null);
      setGenerating(false);
    }
  };

  const handleImageFromPromptOnly = async () => {
    const trimmed = promptText.trim();
    if (trimmed.length < MIN_POSTER_PROMPT_CHARS) {
      Alert.alert(
        "Prompt too short",
        `Add or paste at least ${MIN_POSTER_PROMPT_CHARS} characters in the AI prompt, or use the full generate button.`,
        [{ text: "OK" }],
      );
      return;
    }
    setGenerating(true);
    setGenSnap(null);
    const unsub = subscribeEventPosterGenerationProgress(event.id, setGenSnap);
    try {
      const result = await generateEventPoster(event.id, {
        posterPrompt: trimmed,
      });
      if (result.success) {
        if (result.posterPrompt) {
          setPromptText(result.posterPrompt);
        }
        if (result.posterUrl) {
          setPosterUrl(result.posterUrl);
          onPosterGenerated?.(result.posterUrl);
        }
        Alert.alert(
          result.posterUrl ? "Poster updated" : "Image not created",
          result.posterUrl
            ? "New poster image saved using your prompt (prompt rewrite skipped)."
            : "The API did not return an image. Try again or use full regenerate.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate image");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      unsub();
      setGenSnap(null);
      setGenerating(false);
    }
  };

  const handleSavePoster = async (url: string) => {
    const result = await saveEventPoster(
      event.id,
      url,
      promptText.trim() || undefined,
    );
    if (result.success) {
      setPosterUrl(url);
      onPosterGenerated?.(url);
      Alert.alert("Saved!", "Poster has been saved to your event.");
    } else {
      Alert.alert("Error", result.error || "Failed to save poster");
    }
  };

  const pickNonEmpty = (...urls: (string | null | undefined)[]) => {
    for (const u of urls) {
      if (typeof u === "string" && u.length > 0) return u;
    }
    return null;
  };

  /** During generation, prefer live Firestore `posterUrl`; otherwise saved poster. */
  const modalPreviewFinalUrl = generating
    ? pickNonEmpty(genSnap?.posterUrl)
    : pickNonEmpty(posterUrl, genSnap?.posterUrl);

  /** Progressive OpenAI stream preview, else fast Vertex skeleton, while waiting for final. */
  const modalPreviewProgressUrl: string | null =
    generating && !pickNonEmpty(genSnap?.posterUrl)
      ? pickNonEmpty(
          genSnap?.posterStreamingPreviewUrl,
          genSnap?.skeletonPosterUrl,
        )
      : null;

  const progressIsStreaming = Boolean(
    generating &&
      pickNonEmpty(genSnap?.posterStreamingPreviewUrl) &&
      !pickNonEmpty(genSnap?.posterUrl),
  );

  const showModalPosterSection =
    generating ||
    !!modalPreviewFinalUrl ||
    !!modalPreviewProgressUrl ||
    !!posterUrl;

  const copyPromptToClipboard = async () => {
    const text = promptText.trim();
    if (!text) {
      Alert.alert("Nothing to copy", "Generate or edit a prompt first.");
      return;
    }
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(text);
      } else {
        Clipboard.setString(text);
      }
      Alert.alert(
        "Copied!",
        "The AI prompt is on your clipboard — paste it into Midjourney, DALL·E, etc.",
      );
    } catch {
      Alert.alert("Copy failed", "Could not copy to the clipboard.");
    }
  };

  return (
    <>
      {/* Card Button */}
      {!hideTrigger && (
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
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {posterUrl ? "AI Poster Ready" : "Create AI Poster"}
                </Text>
                <Text
                  style={{ fontSize: 13, color: "#6B7280", fontWeight: "500" }}
                >
                  {posterUrl
                    ? "Tap to view or regenerate your poster"
                    : "Generate a stunning invitation with AI ✨"}
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
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: posterUrl ? "#059669" : "#D97706",
                  }}
                >
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
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    🤖 AI Generated Invitation
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

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
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#111827",
                  marginLeft: 10,
                }}
              >
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#9CA3AF",
                  marginBottom: 12,
                  letterSpacing: 0.5,
                }}
              >
                EVENT DETAILS FOR AI
              </Text>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🎉</Text>
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        fontWeight: "600",
                      }}
                    >
                      Event
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {event.eventName}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>📅</Text>
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        fontWeight: "600",
                      }}
                    >
                      Date & Time
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {formatDate(event.date)} at {event.time}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        fontWeight: "600",
                      }}
                    >
                      Location
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#111827",
                      }}
                    >
                      {event.address1}
                    </Text>
                  </View>
                </View>

                {event.theme && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>🎭</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#9CA3AF",
                          fontWeight: "600",
                        }}
                      >
                        Theme
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {event.theme}
                      </Text>
                    </View>
                  </View>
                )}

                {event.age && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>🎂</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#9CA3AF",
                          fontWeight: "600",
                        }}
                      >
                        Age
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        Turning {event.age}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Generated Poster Preview — live snapshot during generate (skeleton → final) */}
            {showModalPosterSection && (
              <View style={{ marginBottom: 20 }}>
                {modalPreviewFinalUrl || (!generating && posterUrl) ? (
                  <View
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      overflow: "hidden",
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
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#059669",
                          marginLeft: 8,
                        }}
                      >
                        Your AI-Generated Poster
                      </Text>
                    </View>
                    <Image
                      source={{
                        uri: modalPreviewFinalUrl || posterUrl || "",
                      }}
                      style={{ width: "100%", height: 400 }}
                      resizeMode="contain"
                    />
                    {!generating ? (
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
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: "#FFFFFF",
                              marginLeft: 8,
                            }}
                          >
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
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: "#374151",
                              marginLeft: 8,
                            }}
                          >
                            Share
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ paddingBottom: 12, paddingHorizontal: 16 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Final image — saving…
                        </Text>
                      </View>
                    )}
                  </View>
                ) : modalPreviewProgressUrl ? (
                  <View
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: "#F59E0B",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#FEF3C7",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Wand2 size={18} color="#D97706" strokeWidth={2} />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#D97706",
                          marginLeft: 8,
                        }}
                      >
                        {progressIsStreaming
                          ? "Rendering preview — sharpening…"
                          : "Preview (fast) — final rendering…"}
                      </Text>
                    </View>
                    <View style={{ position: "relative", height: 400 }}>
                      <Image
                        source={{ uri: modalPreviewProgressUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                        blurRadius={
                          progressIsStreaming
                            ? Platform.select({
                                ios: 3,
                                android: 2,
                                default: 2,
                              })
                            : Platform.select({
                                ios: 14,
                                android: 10,
                                default: 10,
                              })
                        }
                      />
                      {!progressIsStreaming ? (
                        <BlurView
                          intensity={18}
                          tint="light"
                          style={StyleSheet.absoluteFill}
                        />
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: "#E5E7EB",
                      paddingVertical: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}>
                      Generating your poster…
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* AI Prompt — full text, edit, copy */}
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Type size={18} color="#8B5CF6" strokeWidth={2} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#111827",
                      marginLeft: 8,
                    }}
                  >
                    AI Prompt
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setEditingPrompt(!editingPrompt)}
                    style={{
                      backgroundColor: editingPrompt ? "#FEF3C7" : "#F3F4F6",
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Pencil size={14} color="#374151" strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      {editingPrompt ? "Done" : "Edit"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={copyPromptToClipboard}
                    style={{
                      backgroundColor: "#EDE9FE",
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#7C3AED",
                      }}
                    >
                      Copy
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {editingPrompt ? (
                <TextInput
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 14,
                    color: "#111827",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    minHeight: 220,
                    maxHeight: 360,
                    textAlignVertical: "top",
                  }}
                  placeholder="Paste or write the poster image brief…"
                  placeholderTextColor="#9CA3AF"
                  value={promptText}
                  onChangeText={setPromptText}
                  multiline
                  scrollEnabled
                />
              ) : promptText.trim() ? (
                <Text
                  selectable
                  style={{ fontSize: 13, color: "#374151", lineHeight: 21 }}
                >
                  {promptText}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                    fontStyle: "italic",
                    lineHeight: 20,
                  }}
                >
                  Your prompt will appear here after you generate a poster. Tap
                  Edit to paste your own brief and use “Update image from
                  prompt” to skip rewriting the prompt (faster).
                </Text>
              )}

              <Text
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginTop: 12,
                  fontStyle: "italic",
                  lineHeight: 18,
                }}
              >
                💡 Copy this for Midjourney / DALL·E, or edit it and update the
                poster image without running Stage A again.
              </Text>
            </View>

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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#92400E",
                  marginBottom: 8,
                }}
              >
                💡 How it works
              </Text>
              <Text style={{ fontSize: 13, color: "#B45309", lineHeight: 20 }}>
                Our AI analyzes your event details and creates a custom
                invitation poster design. You can use the generated image
                directly or copy the AI prompt to create variations with your
                favorite image generator!
              </Text>
            </View>
          </ScrollView>

          {/* Bottom actions */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: "#E5E7EB",
              gap: 12,
            }}
          >
            {promptText.trim().length >= MIN_POSTER_PROMPT_CHARS && (
              <TouchableOpacity
                onPress={handleImageFromPromptOnly}
                disabled={generating}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: generating ? "#D1D5DB" : "#8B5CF6",
                }}
              >
                <ImageIcon size={20} color="#7C3AED" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#6D28D9",
                    marginLeft: 10,
                  }}
                >
                  Update image from prompt (faster)
                </Text>
              </TouchableOpacity>
            )}
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
                  <ActivityIndicator
                    color="#FFFFFF"
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#FFFFFF",
                    }}
                  >
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
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#FFFFFF",
                      marginLeft: 10,
                    }}
                  >
                    {posterUrl
                      ? "New AI prompt + poster"
                      : "Generate AI Poster"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});

export default AIPosterGenerator;
