import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useShopping } from "@/lib/shopping-context";
import { getApiUrl } from "@/lib/query-client";

const C = Colors.dark;

interface Ingredient {
  item: string;
  qty: number | null;
  unit: string | null;
  notes: string | null;
}

interface Upgrade {
  title: string;
  tagline: string;
  why: string;
  add_ingredients: Ingredient[];
  steps: string[];
  shopping_list: string[];
}

interface SideDish {
  name: string;
  why_it_works: string;
  how_to_make: string;
  shopping_list: string[];
}

interface DoctorResult {
  base_product: string;
  base_description: string;
  upgrades: Upgrade[];
  sides?: SideDish[];
}

function formatIngredient(ing: Ingredient): string {
  let s = "";
  if (ing.qty != null) s += ing.qty;
  if (ing.unit) s += (s ? " " : "") + ing.unit;
  s += (s ? " " : "") + ing.item;
  if (ing.notes) s += ` (${ing.notes})`;
  return s;
}

function AddToShoppingBtn({ items, color }: { items: string[]; color?: string }) {
  const { addItems } = useShopping();
  const btnColor = color || C.accent;
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        addItems(items);
      }}
      style={({ pressed }) => [
        styles.addShoppingBtn,
        { borderColor: btnColor },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name="cart-outline" size={16} color={btnColor} />
      <Text style={[styles.addShoppingText, { color: btnColor }]}>
        Add Extras to Shopping List
      </Text>
    </Pressable>
  );
}

function UpgradeCard({
  upgrade,
  index,
  isExpanded,
  onPress,
}: {
  upgrade: Upgrade;
  index: number;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const cardColors = ["#E8945A", "#7B68EE", "#4FC1A6"];
  const color = cardColors[index % cardColors.length];
  const shoppingItems = upgrade.shopping_list?.length
    ? upgrade.shopping_list
    : upgrade.add_ingredients.map((i) => formatIngredient(i));

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 80)}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          onPress();
        }}
        style={({ pressed }) => [
          styles.upgradeCard,
          { borderColor: color + "30" },
          isExpanded && { borderColor: color + "60", backgroundColor: color + "08" },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={styles.upgradeCardHeader}>
          <View style={[styles.upgradeDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.upgradeTitle, { color }]}>{upgrade.title}</Text>
            <View style={[styles.taglineBadge, { backgroundColor: color + "18" }]}>
              <Text style={[styles.taglineText, { color }]}>{upgrade.tagline}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={color}
          />
        </View>

        <Text style={styles.whyText}>{upgrade.why}</Text>

        {isExpanded && (
          <Animated.View entering={FadeIn.duration(250)}>
            <View style={[styles.expandedDivider, { backgroundColor: color + "20" }]} />

            <View style={styles.listBlock}>
              <View style={styles.listBlockHeader}>
                <Ionicons name="add-circle-outline" size={14} color={color} />
                <Text style={[styles.listBlockTitle, { color }]}>What to Add</Text>
              </View>
              {upgrade.add_ingredients.map((ing, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bulletDot, { backgroundColor: color }]} />
                  <Text style={styles.listItemText}>{formatIngredient(ing)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.listBlock}>
              <View style={styles.listBlockHeader}>
                <Feather name="list" size={14} color={color} />
                <Text style={[styles.listBlockTitle, { color }]}>Steps</Text>
              </View>
              {upgrade.steps.map((step, i) => (
                <View key={i} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepNum,
                      { backgroundColor: color + "18", borderColor: color + "40" },
                    ]}
                  >
                    <Text style={[styles.stepNumText, { color }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.listItemText}>{step}</Text>
                </View>
              ))}
            </View>

            <AddToShoppingBtn items={shoppingItems} color={color} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function LoadingProgress({ messages, color }: { messages: string[]; color: string }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    setMsgIndex(0);
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  const progress = ((msgIndex + 1) / messages.length) * 100;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.loadingCard}>
      <View style={styles.loadingTop}>
        <ActivityIndicator size="small" color={color} />
        <Animated.Text key={msgIndex} entering={FadeIn.duration(200)} style={styles.loadingText}>
          {messages[msgIndex]}
        </Animated.Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </Animated.View>
  );
}

function SideDishCard({ side, index }: { side: SideDish; index: number }) {
  const { addItems } = useShopping();
  const color = "#4FC1A6";
  return (
    <Animated.View entering={FadeInDown.duration(250).delay(index * 60)}>
      <View style={[styles.sideCard, { borderColor: color + "25" }]}>
        <View style={styles.sideCardHeader}>
          <View style={[styles.sideDot, { backgroundColor: color }]} />
          <Text style={[styles.sideName, { color }]}>{side.name}</Text>
        </View>
        <Text style={styles.sideWhy}>{side.why_it_works}</Text>
        <View style={[styles.sideHowBlock, { backgroundColor: color + "0A" }]}>
          <Text style={styles.sideHowLabel}>How to make it:</Text>
          <Text style={styles.sideHow}>{side.how_to_make}</Text>
        </View>
        {side.shopping_list?.length > 0 && (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              addItems(side.shopping_list);
            }}
            style={({ pressed }) => [
              styles.sideShopBtn,
              { borderColor: color + "40" },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="cart-outline" size={14} color={color} />
            <Text style={[styles.sideShopText, { color }]}>Add to List</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const SUGGESTIONS = [
  "Box cake mix",
  "Instant ramen",
  "Boxed mac & cheese",
  "Frozen pizza",
  "Canned soup",
  "Brownie mix",
];

export default function DoctorItUpScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const generate = useCallback(
    async (query?: string) => {
      const msg = (query || input).trim();
      if (!msg || loading) return;

      Keyboard.dismiss();
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setLoading(true);
      setResult(null);
      setError(null);
      setExpandedIndex(null);

      try {
        const baseUrl = getApiUrl();
        const url = new URL("/api/doctor-it-up", baseUrl);
        const res = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Generation failed");

        setResult(data as DoctorResult);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => scrollRef.current?.scrollTo({ y: 250, animated: true }), 400);
      } catch (e: any) {
        setError(e.message || "Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [input, loading]
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      setInput(text);
      generate(text);
    },
    [generate]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2a1f4a", "#15121f", C.background]}
        locations={[0, 0.35, 0.6]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + webTopInset + 16,
              paddingBottom: insets.bottom + webBottomInset + 100,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="magic-staff" size={26} color={C.upgrade} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Doctor It Up</Text>
              <Text style={styles.headerSubtitle}>
                Upgrade what you already have
              </Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>What do you have?</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Box cake mix, instant ramen..."
                placeholderTextColor={C.textSecondary}
                style={styles.textInput}
                returnKeyType="send"
                onSubmitEditing={() => generate()}
                blurOnSubmit
                editable={!loading}
              />
              <Pressable
                onPress={() => generate()}
                disabled={loading || !input.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: C.upgrade },
                  (!input.trim() || loading) && { opacity: 0.4 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="magic-staff" size={18} color="#fff" />
                )}
              </Pressable>
            </View>

            {!result && !loading && (
              <View style={styles.suggestionsWrap}>
                <Text style={styles.suggestLabel}>Popular items:</Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => handleSuggestion(s)}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {loading && (
            <LoadingProgress
              messages={[
                `Looking at your ${input.trim() || "item"}...`,
                "Thinking up 3 ways to make it better...",
                "Adding that Southern grandma touch...",
                "Picking the perfect side dishes...",
                "Almost ready to serve...",
              ]}
              color={C.upgrade}
            />
          )}

          {error && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color="#E85D75" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {result && (
            <>
              <Animated.View entering={FadeInDown.duration(300)} style={styles.baseSection}>
                <View style={styles.baseCard}>
                  <View style={styles.baseCardHeader}>
                    <Ionicons name="cube-outline" size={20} color={C.textSecondary} />
                    <Text style={styles.baseProductName}>{result.base_product}</Text>
                  </View>
                  <Text style={styles.baseDescription}>{result.base_description}</Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(150)}
                style={styles.section}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="auto-fix" size={18} color={C.upgrade} />
                  <Text style={[styles.sectionTitle, { color: C.upgrade }]}>
                    3 Ways to Upgrade
                  </Text>
                </View>
                <Text style={styles.upgradeSubtitle}>
                  Tap any upgrade to see what to add and how
                </Text>

                {result.upgrades.map((u, i) => (
                  <UpgradeCard
                    key={i}
                    upgrade={u}
                    index={i}
                    isExpanded={expandedIndex === i}
                    onPress={() => setExpandedIndex(expandedIndex === i ? null : i)}
                  />
                ))}
              </Animated.View>

              {result.sides && result.sides.length > 0 && (
                <Animated.View
                  entering={FadeInDown.duration(300).delay(300)}
                  style={styles.section}
                >
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="silverware-variant" size={18} color="#4FC1A6" />
                    <Text style={[styles.sectionTitle, { color: "#4FC1A6" }]}>
                      What to Serve Alongside
                    </Text>
                  </View>
                  <Text style={styles.upgradeSubtitle}>
                    Sides that round out the meal
                  </Text>

                  {result.sides.map((side, i) => (
                    <SideDishCard key={i} side={side} index={i} />
                  ))}
                </Animated.View>
              )}
            </>
          )}

          {!result && !loading && !error && (
            <View style={styles.emptyHero}>
              <MaterialCommunityIcons
                name="package-variant"
                size={56}
                color={C.textSecondary}
                style={{ opacity: 0.4 }}
              />
              <Text style={styles.emptyTitle}>
                Got a box mix or pre-made item?
              </Text>
              <Text style={styles.emptySubtitle}>
                Tell us what you have and we'll show you 3 ways to make it taste way better
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.upgradeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.textSecondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsWrap: {
    marginTop: 14,
  },
  suggestLabel: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    color: C.textSecondary,
    marginBottom: 8,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.upgradeLight,
    borderWidth: 1,
    borderColor: "rgba(123,104,238,0.2)",
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: C.upgrade,
  },
  loadingCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 24,
    gap: 14,
  },
  loadingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    flex: 1,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(232,93,117,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,93,117,0.2)",
    padding: 14,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#E85D75",
    flex: 1,
    lineHeight: 20,
  },
  baseSection: {
    marginBottom: 20,
  },
  baseCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  baseCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  baseProductName: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: C.text,
  },
  baseDescription: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    lineHeight: 20,
    marginLeft: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
  },
  upgradeSubtitle: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    marginBottom: 14,
    marginTop: 4,
  },
  upgradeCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  upgradeCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  upgradeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  upgradeTitle: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    marginBottom: 6,
  },
  taglineBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  taglineText: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
  },
  whyText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    lineHeight: 19,
    marginTop: 10,
  },
  expandedDivider: {
    height: 1,
    marginVertical: 14,
  },
  listBlock: {
    marginBottom: 12,
  },
  listBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  listBlockTitle: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 3,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.textSecondary,
    marginTop: 7,
  },
  listItemText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    flex: 1,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
  },
  addShoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  addShoppingText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
  sideCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sideCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  sideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sideName: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
  },
  sideWhy: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  sideHowBlock: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  sideHowLabel: {
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
    color: C.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  sideHow: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    lineHeight: 19,
  },
  sideShopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sideShopText: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
  },
  emptyHero: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Outfit_600SemiBold",
    color: C.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
