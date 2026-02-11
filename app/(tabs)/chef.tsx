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

interface BaseRecipe {
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: Ingredient[];
  steps: string[];
  shopping_list: string[];
  safety_note: string | null;
}

interface DoctoredRecipe {
  title: string;
  tagline: string;
  why: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: Ingredient[];
  steps: string[];
  shopping_list: string[];
}

interface SideDish {
  name: string;
  why_it_works: string;
  how_to_make: string;
  shopping_list: string[];
}

interface RecipeResult {
  base: BaseRecipe;
  doctored: DoctoredRecipe[];
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

function MetaChips({ recipe }: { recipe: BaseRecipe | DoctoredRecipe }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaChip}>
        <Ionicons name="people-outline" size={13} color={C.textSecondary} />
        <Text style={styles.metaText}>{recipe.servings} servings</Text>
      </View>
      <View style={styles.metaChip}>
        <Ionicons name="time-outline" size={13} color={C.textSecondary} />
        <Text style={styles.metaText}>
          {recipe.prep_minutes}m prep + {recipe.cook_minutes}m cook
        </Text>
      </View>
    </View>
  );
}

function IngredientsList({ ingredients, accentColor }: { ingredients: Ingredient[]; accentColor?: string }) {
  const color = accentColor || C.textSecondary;
  return (
    <View style={styles.listBlock}>
      <View style={styles.listBlockHeader}>
        <Feather name="shopping-bag" size={14} color={color} />
        <Text style={[styles.listBlockTitle, { color }]}>Ingredients</Text>
      </View>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.listItem}>
          <View style={[styles.bulletDot, accentColor ? { backgroundColor: accentColor } : undefined]} />
          <Text style={styles.listItemText}>{formatIngredient(ing)}</Text>
        </View>
      ))}
    </View>
  );
}

function StepsList({ steps, accentColor }: { steps: string[]; accentColor?: string }) {
  const color = accentColor || C.textSecondary;
  return (
    <View style={styles.listBlock}>
      <View style={styles.listBlockHeader}>
        <Feather name="list" size={14} color={color} />
        <Text style={[styles.listBlockTitle, { color }]}>Steps</Text>
      </View>
      {steps.map((step, i) => (
        <View key={i} style={styles.stepItem}>
          <View
            style={[
              styles.stepNum,
              accentColor
                ? { backgroundColor: accentColor + "18", borderColor: accentColor + "40" }
                : undefined,
            ]}
          >
            <Text style={[styles.stepNumText, accentColor ? { color: accentColor } : undefined]}>
              {i + 1}
            </Text>
          </View>
          <Text style={styles.listItemText}>{step}</Text>
        </View>
      ))}
    </View>
  );
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
        Add to Shopping List
      </Text>
    </Pressable>
  );
}

function DoctoredCard({
  recipe,
  index,
  isExpanded,
  onPress,
}: {
  recipe: DoctoredRecipe;
  index: number;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const cardColors = ["#7B68EE", "#E85D75", "#4FC1A6"];
  const color = cardColors[index % cardColors.length];
  const shoppingItems = recipe.shopping_list?.length
    ? recipe.shopping_list
    : recipe.ingredients.map((i) => formatIngredient(i));

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
          styles.doctoredCard,
          { borderColor: color + "30" },
          isExpanded && { borderColor: color + "60", backgroundColor: color + "08" },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={styles.doctoredCardHeader}>
          <View style={[styles.doctoredDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.doctoredTitle, { color }]}>{recipe.title}</Text>
            <View style={[styles.taglineBadge, { backgroundColor: color + "18" }]}>
              <Text style={[styles.taglineText, { color }]}>{recipe.tagline}</Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={color}
          />
        </View>

        <Text style={styles.whyText}>{recipe.why}</Text>

        {isExpanded && (
          <Animated.View entering={FadeIn.duration(250)}>
            <View style={[styles.expandedDivider, { backgroundColor: color + "20" }]} />
            <MetaChips recipe={recipe} />
            <IngredientsList ingredients={recipe.ingredients} accentColor={color} />
            <StepsList steps={recipe.steps} accentColor={color} />
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
  "Peach cobbler",
  "Chicken alfredo",
  "Beef tacos",
  "Banana bread",
  "Pad thai",
  "Chocolate lava cake",
];

export default function ChefScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const generateRecipe = useCallback(
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
        const url = new URL("/api/recipe-chat", baseUrl);
        const res = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, preferences: {} }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Generation failed");

        setResult(data as RecipeResult);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setTimeout(() => scrollRef.current?.scrollTo({ y: 300, animated: true }), 400);
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
      generateRecipe(text);
    },
    [generateRecipe]
  );

  const baseShoppingItems = result?.base
    ? result.base.shopping_list?.length
      ? result.base.shopping_list
      : result.base.ingredients.map((i) => formatIngredient(i))
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a2f3a", "#12181f", C.background]}
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
            <View style={[styles.headerIcon, { backgroundColor: C.accentDim }]}>
              <MaterialCommunityIcons name="chef-hat" size={28} color={C.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Chef</Text>
              <Text style={styles.headerSubtitle}>
                Tell me what to make, I'll give you options
              </Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>What do you want to cook?</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Peach cobbler, chicken alfredo..."
                placeholderTextColor={C.textSecondary}
                style={styles.textInput}
                returnKeyType="send"
                onSubmitEditing={() => generateRecipe()}
                blurOnSubmit
                editable={!loading}
              />
              <Pressable
                onPress={() => generateRecipe()}
                disabled={loading || !input.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: C.accent },
                  (!input.trim() || loading) && { opacity: 0.4 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="sparkles" size={18} color="#fff" />
                )}
              </Pressable>
            </View>

            {!result && !loading && (
              <View style={styles.suggestionsWrap}>
                <Text style={styles.suggestLabel}>Try something:</Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => handleSuggestion(s)}
                      style={({ pressed }) => [
                        styles.suggestionChip,
                        { backgroundColor: C.accentLight, borderColor: "rgba(232,148,90,0.2)" },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.suggestionText, { color: C.accent }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {loading && (
            <LoadingProgress
              messages={[
                "Building your base recipe...",
                "Cooking up 3 creative variations...",
                "Adding that Southern grandma touch...",
                "Picking the perfect side dishes...",
                "Plating it all up for you...",
              ]}
              color={C.accent}
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
              <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="food-variant" size={18} color={C.accent} />
                  <Text style={[styles.sectionTitle, { color: C.accent }]}>
                    Base Recipe
                  </Text>
                </View>

                <View style={styles.baseRecipeCard}>
                  <Text style={styles.baseRecipeTitle}>{result.base.title}</Text>
                  <MetaChips recipe={result.base} />

                  {result.base.safety_note && (
                    <View style={styles.safetyBadge}>
                      <Ionicons name="warning-outline" size={14} color="#FFB347" />
                      <Text style={styles.safetyText}>{result.base.safety_note}</Text>
                    </View>
                  )}

                  <IngredientsList ingredients={result.base.ingredients} />
                  <StepsList steps={result.base.steps} />
                  <AddToShoppingBtn items={baseShoppingItems} />
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(150)}
                style={styles.section}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="magic-staff" size={18} color={C.upgrade} />
                  <Text style={[styles.sectionTitle, { color: C.upgrade }]}>
                    Alternative Versions
                  </Text>
                </View>
                <Text style={styles.doctoredSubtitle}>
                  3 different takes on this dish — tap to see full recipe
                </Text>

                {result.doctored.map((d, i) => (
                  <DoctoredCard
                    key={i}
                    recipe={d}
                    index={i}
                    isExpanded={expandedIndex === i}
                    onPress={() =>
                      setExpandedIndex(expandedIndex === i ? null : i)
                    }
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
                  <Text style={styles.doctoredSubtitle}>
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
                name="silverware-fork-knife"
                size={56}
                color={C.textSecondary}
                style={{ opacity: 0.4 }}
              />
              <Text style={styles.emptyTitle}>
                Describe any dish and get a full recipe
              </Text>
              <Text style={styles.emptySubtitle}>
                Plus 3 creative alternative versions with different techniques, ingredient swaps, and shortcuts
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
  },
  baseRecipeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  baseRecipeTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: C.text,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
  },
  safetyBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,179,71,0.1)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  safetyText: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#FFB347",
    flex: 1,
    lineHeight: 17,
  },
  listBlock: {
    marginTop: 4,
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
    color: C.textSecondary,
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
    backgroundColor: C.accentDim,
    borderWidth: 1,
    borderColor: "rgba(232,148,90,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
    color: C.accent,
  },
  addShoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent,
    marginTop: 6,
  },
  addShoppingText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.accent,
  },
  doctoredSubtitle: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    marginBottom: 14,
    marginTop: -4,
  },
  doctoredCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  doctoredCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  doctoredDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  doctoredTitle: {
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
