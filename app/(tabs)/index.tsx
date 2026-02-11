import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { searchRecipes, RECIPES, Recipe } from "@/lib/recipes";
import { useShopping } from "@/lib/shopping-context";
import {
  getUpgradesForRecipe,
  applyUpgrade,
  Upgrade,
  RemixedRecipe,
} from "@/lib/rules";

const C = Colors.dark;

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function RecipeResultItem({
  recipe,
  isSelected,
  onPress,
}: {
  recipe: Recipe;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.resultItem,
        isSelected && styles.resultItemActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.resultItemContent}>
        <View style={styles.resultItemLeft}>
          <View
            style={[
              styles.resultDot,
              { backgroundColor: isSelected ? C.accent : C.border },
            ]}
          />
          <Text
            style={[
              styles.resultItemTitle,
              isSelected && { color: C.accent },
            ]}
          >
            {recipe.title}
          </Text>
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "chevron-forward"}
          size={18}
          color={isSelected ? C.accent : C.textSecondary}
        />
      </View>
      <View style={styles.tagRow}>
        {recipe.tags.slice(0, 3).map((t) => (
          <Tag key={t} label={t} />
        ))}
      </View>
    </Pressable>
  );
}

function UpgradeItem({
  upgrade,
  isSelected,
  onPress,
}: {
  upgrade: Upgrade;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.upgradeItem,
        isSelected && styles.upgradeItemActive,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.upgradeItemHeader}>
        <MaterialCommunityIcons
          name="magic-staff"
          size={16}
          color={isSelected ? C.upgrade : C.textSecondary}
        />
        <Text
          style={[
            styles.upgradeItemTitle,
            isSelected && { color: C.upgrade },
          ]}
          numberOfLines={2}
        >
          {upgrade.title}
        </Text>
      </View>
      <Text style={styles.upgradeItemWhy} numberOfLines={2}>
        {upgrade.why}
      </Text>
    </Pressable>
  );
}

function IngredientsList({ items, isRemix }: { items: string[]; isRemix?: boolean }) {
  return (
    <View style={styles.listBlock}>
      <View style={styles.listBlockHeader}>
        <Feather
          name="shopping-bag"
          size={14}
          color={isRemix ? C.success : C.textSecondary}
        />
        <Text
          style={[
            styles.listBlockTitle,
            isRemix && { color: C.success },
          ]}
        >
          Ingredients
        </Text>
      </View>
      {items.map((item, i) => {
        if (item === "") return <View key={i} style={styles.listSpacer} />;
        const isDivider = item.startsWith("---");
        if (isDivider) {
          return (
            <View key={i} style={styles.addsDivider}>
              <View style={styles.addsDividerLine} />
              <Text style={styles.addsDividerText}>
                {item.replace(/---/g, "").trim()}
              </Text>
              <View style={styles.addsDividerLine} />
            </View>
          );
        }
        return (
          <View key={i} style={styles.listItem}>
            <View style={styles.bulletDot} />
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StepsList({ items, isRemix }: { items: string[]; isRemix?: boolean }) {
  let stepNum = 0;
  return (
    <View style={styles.listBlock}>
      <View style={styles.listBlockHeader}>
        <Feather
          name="list"
          size={14}
          color={isRemix ? C.success : C.textSecondary}
        />
        <Text
          style={[
            styles.listBlockTitle,
            isRemix && { color: C.success },
          ]}
        >
          Steps
        </Text>
      </View>
      {items.map((item, i) => {
        if (item === "") return <View key={i} style={styles.listSpacer} />;
        const isDivider = item.startsWith("---");
        if (isDivider) {
          return (
            <View key={i} style={styles.addsDivider}>
              <View style={styles.addsDividerLine} />
              <Text style={styles.addsDividerText}>
                {item.replace(/---/g, "").trim()}
              </Text>
              <View style={styles.addsDividerLine} />
            </View>
          );
        }
        stepNum++;
        return (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepNum, isRemix && stepNum > 3 && { backgroundColor: C.successLight, borderColor: C.success }]}>
              <Text style={[styles.stepNumText, isRemix && stepNum > 3 && { color: C.success }]}>{stepNum}</Text>
            </View>
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addItems } = useShopping();
  const [query, setQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const results = useMemo(() => {
    if (!query.trim()) return RECIPES;
    return searchRecipes(query);
  }, [query]);

  const upgrades = useMemo(
    () => (selectedRecipe ? getUpgradesForRecipe(selectedRecipe) : []),
    [selectedRecipe]
  );

  const remixed: RemixedRecipe | null = useMemo(() => {
    if (!selectedRecipe || !selectedUpgrade) return null;
    return applyUpgrade(selectedRecipe, selectedUpgrade);
  }, [selectedRecipe, selectedUpgrade]);

  const handleSelectRecipe = useCallback(
    (recipe: Recipe) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedRecipe(recipe);
      setSelectedUpgrade(null);
      Keyboard.dismiss();
    },
    []
  );

  const handleSelectUpgrade = useCallback(
    (upgrade: Upgrade) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSelectedUpgrade(upgrade);
    },
    []
  );

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2a1f4a", "#15121f", C.background]}
        locations={[0, 0.35, 0.6]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: insets.bottom + webBottomInset + 24,
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
              Upgrade everyday recipes into something special
            </Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons
                name="search"
                size={18}
                color={C.textSecondary}
                style={{ marginLeft: 14 }}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search recipes..."
                placeholderTextColor={C.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => setQuery("")}
                  style={styles.clearBtn}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={C.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>
          <View style={styles.quickTags}>
            {["cake", "brownies", "ramen"].map((q) => (
              <Pressable
                key={q}
                onPress={() => setQuery(q)}
                style={({ pressed }) => [
                  styles.quickTag,
                  query.toLowerCase() === q && styles.quickTagActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.quickTagText,
                    query.toLowerCase() === q && styles.quickTagTextActive,
                  ]}
                >
                  {q}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            icon={
              <Feather name="book-open" size={16} color={C.textSecondary} />
            }
            title="Recipes"
            color={C.text}
          />
          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={C.textSecondary} />
              <Text style={styles.emptyText}>
                No recipes found. Try "cake", "brownies", or "ramen".
              </Text>
            </View>
          ) : (
            results.map((r) => (
              <RecipeResultItem
                key={r.id}
                recipe={r}
                isSelected={selectedRecipe?.id === r.id}
                onPress={() => handleSelectRecipe(r)}
              />
            ))
          )}
        </View>

        {selectedRecipe && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <SectionHeader
              icon={
                <MaterialCommunityIcons
                  name="food-variant"
                  size={18}
                  color={C.textSecondary}
                />
              }
              title="Base Recipe"
              color={C.text}
            />
            <View style={styles.recipeCard}>
              <Text style={styles.recipeCardTitle}>
                {selectedRecipe.title}
              </Text>
              <IngredientsList items={selectedRecipe.ingredients} />
              <StepsList items={selectedRecipe.steps} />
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  addItems(selectedRecipe.ingredients);
                }}
                style={({ pressed }) => [
                  styles.addShoppingBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="cart-outline" size={16} color={C.accent} />
                <Text style={styles.addShoppingText}>Add to Shopping List</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {selectedRecipe && upgrades.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.section}>
            <SectionHeader
              icon={
                <MaterialCommunityIcons
                  name="magic-staff"
                  size={18}
                  color={C.upgrade}
                />
              }
              title="Doctor It Up"
              color={C.upgrade}
            />
            <Text style={styles.upgradeSub}>
              Choose an upgrade to remix this recipe
            </Text>
            {upgrades.map((u) => (
              <UpgradeItem
                key={u.id}
                upgrade={u}
                isSelected={selectedUpgrade?.id === u.id}
                onPress={() => handleSelectUpgrade(u)}
              />
            ))}
          </Animated.View>
        )}

        {remixed && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <SectionHeader
              icon={
                <Ionicons name="sparkles" size={18} color={C.success} />
              }
              title="Remixed Recipe"
              color={C.success}
            />
            <View style={[styles.recipeCard, styles.remixCard]}>
              <Text style={[styles.recipeCardTitle, { color: C.success }]}>
                {remixed.title}
              </Text>
              <View style={styles.whyBadge}>
                <Ionicons name="bulb-outline" size={14} color={C.accent} />
                <Text style={styles.whyText}>{remixed.why}</Text>
              </View>
              <IngredientsList items={remixed.ingredients} isRemix />
              <StepsList items={remixed.steps} isRemix />
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  addItems(remixed.ingredients.filter((x) => x && !x.startsWith("---")));
                }}
                style={({ pressed }) => [
                  styles.addShoppingBtn,
                  { borderColor: C.success },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="cart-outline" size={16} color={C.success} />
                <Text style={[styles.addShoppingText, { color: C.success }]}>
                  Add to Shopping List
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
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
  searchCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: C.text,
  },
  clearBtn: {
    paddingRight: 12,
  },
  quickTags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.tag,
    borderWidth: 1,
    borderColor: C.tagBorder,
  },
  quickTagActive: {
    backgroundColor: C.accentLight,
    borderColor: C.accent,
  },
  quickTagText: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: C.textSecondary,
  },
  quickTagTextActive: {
    color: C.accent,
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
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  resultItem: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  resultItemActive: {
    backgroundColor: C.accentDim,
    borderColor: "rgba(232,148,90,0.25)",
  },
  resultItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultItemTitle: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
    color: C.text,
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: C.tag,
    borderWidth: 1,
    borderColor: C.tagBorder,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
  },
  recipeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  remixCard: {
    borderColor: "rgba(107,203,119,0.2)",
    backgroundColor: "rgba(107,203,119,0.04)",
  },
  recipeCardTitle: {
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
    color: C.text,
    marginBottom: 14,
  },
  whyBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.accentDim,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  whyText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.accent,
    flex: 1,
    lineHeight: 18,
  },
  upgradeSub: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    marginBottom: 12,
    marginTop: -4,
  },
  upgradeItem: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  upgradeItemActive: {
    backgroundColor: C.upgradeLight,
    borderColor: "rgba(123,104,238,0.3)",
  },
  upgradeItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  upgradeItemTitle: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: C.text,
    flex: 1,
  },
  upgradeItemWhy: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    marginLeft: 24,
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
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  listSpacer: {
    height: 4,
  },
  addsDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  addsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.divider,
  },
  addsDividerText: {
    fontSize: 11,
    fontFamily: "Outfit_500Medium",
    color: C.accent,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: "Outfit_600SemiBold",
    color: C.textSecondary,
  },
  addShoppingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent,
    marginTop: 12,
  },
  addShoppingText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.accent,
  },
});
