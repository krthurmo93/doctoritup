import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useSavedRecipes, SavedRecipe } from "@/lib/saved-recipes-context";
import { useShopping } from "@/lib/shopping-context";

const C = Colors.dark;

function formatIngredient(ing: any): string {
  let s = "";
  if (ing.qty != null) s += ing.qty;
  if (ing.unit) s += (s ? " " : "") + ing.unit;
  s += (s ? " " : "") + ing.item;
  if (ing.notes) s += ` (${ing.notes})`;
  return s;
}

function SavedRecipeCard({
  recipe,
  index,
  isExpanded,
  onPress,
  onRemove,
}: {
  recipe: SavedRecipe;
  index: number;
  isExpanded: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { addItems } = useShopping();
  const color = recipe.type === "chef" ? C.accent : C.upgrade;
  const typeLabel = recipe.type === "chef" ? "AI Chef" : "Doctor It Up";

  const ingredients =
    recipe.type === "chef" ? recipe.ingredients : recipe.add_ingredients;

  const shoppingItems = recipe.shopping_list?.length
    ? recipe.shopping_list
    : (ingredients || []).map((i) => formatIngredient(i));

  const hasMeta =
    recipe.servings != null ||
    (recipe.prep_minutes != null && recipe.cook_minutes != null);

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          onPress();
        }}
        style={({ pressed }) => [
          styles.card,
          { borderColor: color + "30" },
          isExpanded && { borderColor: color + "60", backgroundColor: color + "08" },
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color }]}>{recipe.title}</Text>
            <View style={styles.badgeRow}>
              {recipe.tagline ? (
                <View style={[styles.taglineBadge, { backgroundColor: color + "18" }]}>
                  <Text style={[styles.taglineText, { color }]}>{recipe.tagline}</Text>
                </View>
              ) : null}
              <View style={[styles.typeBadge, { backgroundColor: color + "12" }]}>
                <Ionicons
                  name={recipe.type === "chef" ? "flame" : "sparkles"}
                  size={10}
                  color={color}
                />
                <Text style={[styles.typeText, { color }]}>{typeLabel}</Text>
              </View>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={color}
          />
        </View>

        {recipe.why ? (
          <Text style={styles.whyText}>{recipe.why}</Text>
        ) : recipe.base_description ? (
          <Text style={styles.whyText}>{recipe.base_description}</Text>
        ) : null}

        {isExpanded && (
          <Animated.View entering={FadeIn.duration(250)}>
            <View style={[styles.expandedDivider, { backgroundColor: color + "20" }]} />

            {hasMeta && (
              <View style={styles.metaRow}>
                {recipe.servings != null && (
                  <View style={styles.metaChip}>
                    <Ionicons name="people-outline" size={13} color={C.textSecondary} />
                    <Text style={styles.metaText}>{recipe.servings} servings</Text>
                  </View>
                )}
                {recipe.prep_minutes != null && recipe.cook_minutes != null && (
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={13} color={C.textSecondary} />
                    <Text style={styles.metaText}>
                      {recipe.prep_minutes}m prep + {recipe.cook_minutes}m cook
                    </Text>
                  </View>
                )}
              </View>
            )}

            {ingredients && ingredients.length > 0 && (
              <View style={styles.listBlock}>
                <View style={styles.listBlockHeader}>
                  <Feather name="shopping-bag" size={14} color={color} />
                  <Text style={[styles.listBlockTitle, { color }]}>
                    {recipe.type === "chef" ? "Ingredients" : "What to Add"}
                  </Text>
                </View>
                {ingredients.map((ing, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.bulletDot, { backgroundColor: color }]} />
                    <Text style={styles.listItemText}>{formatIngredient(ing)}</Text>
                  </View>
                ))}
              </View>
            )}

            {recipe.steps && recipe.steps.length > 0 && (
              <View style={styles.listBlock}>
                <View style={styles.listBlockHeader}>
                  <Feather name="list" size={14} color={color} />
                  <Text style={[styles.listBlockTitle, { color }]}>Steps</Text>
                </View>
                {recipe.steps.map((step, i) => (
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
            )}

            {shoppingItems.length > 0 && (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  addItems(shoppingItems);
                }}
                style={({ pressed }) => [
                  styles.addShoppingBtn,
                  { borderColor: color },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="cart-outline" size={16} color={color} />
                <Text style={[styles.addShoppingText, { color }]}>
                  Add to Shopping List
                </Text>
              </Pressable>
            )}

            {recipe.sides && recipe.sides.length > 0 && (
              <View style={styles.sidesSection}>
                <View style={styles.listBlockHeader}>
                  <MaterialCommunityIcons name="silverware-variant" size={14} color="#4FC1A6" />
                  <Text style={[styles.listBlockTitle, { color: "#4FC1A6" }]}>
                    Side Dishes
                  </Text>
                </View>
                {recipe.sides.map((side, i) => (
                  <SideDishItem key={i} side={side} />
                ))}
              </View>
            )}

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
                onRemove();
              }}
              style={({ pressed }) => [
                styles.removeBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#E85D75" />
              <Text style={styles.removeText}>Remove Recipe</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function SideDishItem({ side }: { side: { name: string; why_it_works: string; how_to_make: string; shopping_list: string[] } }) {
  const { addItems } = useShopping();
  const color = "#4FC1A6";
  return (
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
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, removeRecipe, totalSaved } = useSavedRecipes();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (expandedId === id) setExpandedId(null);
      removeRecipe(id);
    },
    [removeRecipe, expandedId]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SavedRecipe; index: number }) => (
      <SavedRecipeCard
        recipe={item}
        index={index}
        isExpanded={expandedId === item.id}
        onPress={() => toggleExpand(item.id)}
        onRemove={() => handleRemove(item.id)}
      />
    ),
    [expandedId, toggleExpand, handleRemove]
  );

  const keyExtractor = useCallback((item: SavedRecipe) => item.id, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1f2a3a", "#121520", C.background]}
        locations={[0, 0.35, 0.6]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: insets.bottom + webBottomInset + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={recipes.length > 0}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: C.accentDim }]}>
              <Ionicons name="bookmark" size={26} color={C.accent} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Saved Recipes</Text>
              <Text style={styles.headerSubtitle}>
                {totalSaved} {totalSaved === 1 ? "recipe" : "recipes"} saved
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyHero}>
            <Ionicons
              name="bookmark-outline"
              size={56}
              color={C.textSecondary}
              style={{ opacity: 0.4 }}
            />
            <Text style={styles.emptyTitle}>No saved recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Bookmark recipes from Doctor It Up or AI Chef to see them here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  listContent: {
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
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
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
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
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
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    color: C.textSecondary,
  },
  listBlock: {
    marginBottom: 14,
  },
  listBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  listBlockTitle: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
    backgroundColor: C.textSecondary,
  },
  listItemText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    lineHeight: 19,
    flex: 1,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
    borderColor: C.border,
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
    color: C.textSecondary,
  },
  addShoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 10,
  },
  addShoppingText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
  },
  sidesSection: {
    marginTop: 10,
    marginBottom: 10,
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
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,93,117,0.25)",
    backgroundColor: "rgba(232,93,117,0.06)",
  },
  removeText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: "#E85D75",
  },
});
