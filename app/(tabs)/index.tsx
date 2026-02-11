import React, { useState, useCallback, useRef } from "react";
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

interface RecipeResult {
  base: BaseRecipe;
  doctored: DoctoredRecipe[];
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

function IngredientsList({
  ingredients,
  accentColor,
}: {
  ingredients: Ingredient[];
  accentColor?: string;
}) {
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

function StepsList({
  steps,
  accentColor,
}: {
  steps: string[];
  accentColor?: string;
}) {
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

function AddToShoppingBtn({
  items,
  color,
}: {
  items: string[];
  color?: string;
}) {
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

const SUGGESTIONS = [
  "Peach cobbler",
  "Chicken alfredo",
  "Mac and cheese",
  "Banana bread",
  "Beef tacos",
  "Chocolate brownies",
];

export default function HomeScreen() {
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
              <MaterialCommunityIcons name="chef-hat" size={28} color={C.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Doctor It Up</Text>
              <Text style={styles.headerSubtitle}>
                Tell me what to cook, I'll make it better
              </Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="What do you want to cook?"
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
            <Animated.View entering={FadeIn.duration(300)} style={styles.loadingCard}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={styles.loadingText}>
                Cooking up your recipe and 3 doctored-up versions...
              </Text>
            </Animated.View>
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

                <View style={styles.baseCard}>
                  <Text style={styles.baseTitle}>{result.base.title}</Text>
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
                    Doctor It Up
                  </Text>
                </View>
                <Text style={styles.doctoredSubtitle}>
                  3 creative twists — each is a complete recipe
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
                Describe any dish and get the recipe
              </Text>
              <Text style={styles.emptySubtitle}>
                Plus 3 creative "doctored up" versions with ingredient swaps, shortcuts, and flavor upgrades
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
    backgroundColor: C.accentDim,
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
    backgroundColor: C.accent,
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
    backgroundColor: C.tag,
    borderWidth: 1,
    borderColor: C.tagBorder,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: C.text,
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    flex: 1,
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
  baseCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  baseTitle: {
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
