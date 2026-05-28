import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  Easing,
} from "react-native";
import CreateEventTopBar from "./CreateEventTopBar";
import InvitationExamplesModal from "./InvitationExamplesModal";
import { GlassCardDarkLottie } from "@/src/components/common/GlassCardDarkLottie";
import { colors, spacing, typography, fontFamily, radius } from "@/src/theme";

/** Uniform “playing card” tile for the fan (poster aspect). */
const DECK_CARD_W = 120;
const DECK_CARD_H = 120;
/** Shared clockwise tilt for every card (deg). */
const FAN_CARD_ROTATE = 20;
/**
 * Horizontal offset (dp) per layer, back → front: small stagger so same-angle cards
 * don’t sit fully on top of each other (pivot stays bottom center).
 */
const FAN_SHIFT_X = [-110, 0, 110] as const;
/** Hit area — width fits rotated square cards + horizontal stagger. */
const EXAMPLES_DECK_W = 210;
const EXAMPLES_DECK_H = 132;
/** Draw order & z-index: example-03 back, 02 mid, 01 on top. */
const FAN_ASSET_ORDER = [2, 1, 0] as const;

/** Pause between card animations (ms). */
const DECK_CARD_GAP_MS = 800;
/** Single-card slide duration (ms). */
const DECK_CARD_SLIDE_MS = 620;

const EXAMPLES_ASSETS = [
  require("../../../assets/images/invitation-examples/example-01.png"),
  require("../../../assets/images/invitation-examples/example-02.png"),
  require("../../../assets/images/invitation-examples/example-03.png"),
] as const;

/** Horizontal travel for “flies in from the left” (dp). */
const EXAMPLES_THUMB_SLIDE_FROM = Math.round(Dimensions.get("window").width * 0.45);

type EventDetailsScreenHeaderProps = {
  onBack: () => void;
};

export default function EventDetailsScreenHeader({ onBack }: EventDetailsScreenHeaderProps) {
  const [examplesOpen, setExamplesOpen] = useState(false);

  const cardSlideX = useRef(
    Array.from({ length: FAN_ASSET_ORDER.length }, () => new Animated.Value(-EXAMPLES_THUMB_SLIDE_FROM)),
  ).current;
  const cardOpacity = useRef(
    Array.from({ length: FAN_ASSET_ORDER.length }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const slideOpacityPair = (i: number) =>
      Animated.parallel([
        Animated.timing(cardSlideX[i], {
          toValue: 0,
          duration: DECK_CARD_SLIDE_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity[i], {
          toValue: 1,
          duration: Math.min(480, DECK_CARD_SLIDE_MS),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);

    const chain: Animated.CompositeAnimation[] = [];
    for (let i = 0; i < FAN_ASSET_ORDER.length; i += 1) {
      if (i > 0) chain.push(Animated.delay(DECK_CARD_GAP_MS));
      chain.push(slideOpacityPair(i));
    }
    Animated.sequence(chain).start();
  }, [cardSlideX, cardOpacity]);

  return (
    <>
      <GlassCardDarkLottie
        padding={0}
        borderRadius={radius.md}
        borderColor="rgba(107, 56, 212, 0.1)"
        shellOverflow="visible"
        contentStyle={{ paddingBottom: spacing[2] }}
      >
        <CreateEventTopBar
          onBack={onBack}
          showTrailingSparkles={false}
        />
        <View style={styles.inner}>
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={styles.title}>Design your invitation</Text>
              <Text style={styles.subtitle}>
                We'll use your answers to generate a unique poster and fill in your event.
              </Text>
              <View style={styles.examplesRowWrap}>
                
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => setExamplesOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Sample invitation thumbnails — opens gallery"
                  accessibilityHint="Opens a gallery of sample posters"
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={styles.examplesDeckHit}
                >
                  <View style={styles.examplesDeck} pointerEvents="box-none">
                    {FAN_ASSET_ORDER.map((assetIdx, i) => (
                      <Animated.View
                        key={`example-deck-${assetIdx}`}
                        style={[
                          styles.deckFanCard,
                          {
                            marginLeft: -DECK_CARD_W / 2 + FAN_SHIFT_X[i],
                            zIndex: i + 1,
                            elevation: Platform.OS === "android" ? 4 + i * 3 : undefined,
                            opacity: cardOpacity[i],
                            transform: [
                              { translateX: cardSlideX[i] },
                              { rotate: `${FAN_CARD_ROTATE}deg` },
                            ],
                            ...(Platform.OS !== "web"
                              ? { transformOrigin: "50% 100%" }
                              : {}),
                          },
                        ]}
                        accessibilityElementsHidden
                      >
                        <Image
                          source={EXAMPLES_ASSETS[assetIdx]}
                          style={styles.deckFanImage}
                          resizeMode="cover"
                          resizeMethod={Platform.OS === "android" ? "resize" : undefined}
                        />
                      </Animated.View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </GlassCardDarkLottie>
      <InvitationExamplesModal
        visible={examplesOpen}
        onClose={() => setExamplesOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  titleCol: {
    flex: 1,
    paddingRight: spacing[3],
  },
  title: {
    fontFamily: fontFamily.headline,
    fontSize: 26,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.bodyMd,
    fontFamily: fontFamily.title,
    fontWeight: "200",
    marginTop: spacing[2],
    marginBottom: spacing[1],
    lineHeight: 20,
  },
  examplesRowWrap: {
    position: "relative",
    width: "100%",
    alignSelf: "flex-start",
    marginTop: spacing[2],
    zIndex: 1,
  },
  examplesBtn: {
    paddingVertical: spacing[1],
  },
  examplesDeckHit: {
    position: "absolute",
    right: 90,
    top: 60,
    marginTop: -EXAMPLES_DECK_H / 2,
    width: EXAMPLES_DECK_W,
    height: EXAMPLES_DECK_H,
    zIndex: 3,
  },
  examplesDeck: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  deckFanCard: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: DECK_CARD_W,
    height: DECK_CARD_H,
    marginLeft: -DECK_CARD_W / 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: "#0c1c2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  deckFanImage: {
    width: "100%",
    height: "100%",
  },
  examplesBtnText: {
    fontFamily: fontFamily.title,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.1,
    textDecorationColor: "rgba(107, 56, 212, 0.45)",
  },
});
