import React, { useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useShopping, ShoppingItem } from "@/lib/shopping-context";

const C = Colors.dark;

function ShoppingItemRow({
  item,
  index,
  onToggle,
}: {
  item: ShoppingItem;
  index: number;
  onToggle: (i: number) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onToggle(index);
      }}
      style={({ pressed }) => [
        styles.itemRow,
        item.checked && styles.itemRowChecked,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View
        style={[
          styles.checkbox,
          item.checked && styles.checkboxChecked,
        ]}
      >
        {item.checked && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>
      <Text
        style={[
          styles.itemText,
          item.checked && styles.itemTextChecked,
        ]}
      >
        {item.text}
      </Text>
    </Pressable>
  );
}

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { items, toggleItem, clearChecked, clearAll, checkedCount, totalCount } =
    useShopping();

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const renderItem = useCallback(
    ({ item, index }: { item: ShoppingItem; index: number }) => (
      <ShoppingItemRow item={item} index={index} onToggle={toggleItem} />
    ),
    [toggleItem]
  );

  const handleClearChecked = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    clearChecked();
  }, [clearChecked]);

  const handleClearAll = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    clearAll();
  }, [clearAll]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1f2a1a", "#131a12", C.background]}
        locations={[0, 0.35, 0.6]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.headerBar,
          { paddingTop: insets.top + webTopInset + 12 },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="cart" size={22} color={C.success} />
          <Text style={styles.headerTitle}>Shopping List</Text>
        </View>
        {totalCount > 0 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {checkedCount}/{totalCount}
            </Text>
          </View>
        )}
      </View>

      {totalCount === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={48} color={C.textSecondary} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            Browse recipes or ask AI Chef to generate one, then tap "Add to Shopping List" to populate your list.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + webBottomInset + 80 },
            ]}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={[
              styles.bottomActions,
              { paddingBottom: insets.bottom + webBottomInset + 12 },
            ]}
          >
            {checkedCount > 0 && (
              <Pressable
                onPress={handleClearChecked}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="trash-2" size={16} color={C.accent} />
                <Text style={styles.actionText}>
                  Remove checked ({checkedCount})
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [
                styles.actionBtnDanger,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Feather name="x" size={16} color="rgba(255,100,100,0.8)" />
              <Text style={styles.actionTextDanger}>Clear all</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
    color: C.text,
  },
  counterBadge: {
    backgroundColor: C.successLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.success,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: C.text,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  itemRowChecked: {
    backgroundColor: C.successLight,
    borderColor: "rgba(107,203,119,0.2)",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: C.success,
    borderColor: C.success,
  },
  itemText: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    flex: 1,
  },
  itemTextChecked: {
    color: C.textSecondary,
    textDecorationLine: "line-through" as const,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "rgba(11,11,16,0.9)",
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.accent,
  },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.3)",
  },
  actionTextDanger: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: "rgba(255,100,100,0.8)",
  },
});
