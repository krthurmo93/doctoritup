import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useShopping } from "@/lib/shopping-context";
import { getApiUrl } from "@/lib/query-client";

const C = Colors.dark;

interface AIRecipe {
  title: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: { item: string; qty: number | null; unit: string | null; notes: string | null }[];
  steps: string[];
  doctor_it_up: { name: string; how: string }[];
  shopping_list: string[];
  safety_note: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  recipe?: AIRecipe;
}

function RecipeCard({ recipe }: { recipe: AIRecipe }) {
  const { addItems } = useShopping();

  const handleAddToShopping = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const items = recipe.shopping_list?.length
      ? recipe.shopping_list
      : recipe.ingredients.map((i) => i.item);
    addItems(items);
  }, [recipe, addItems]);

  return (
    <View style={styles.recipeCard}>
      <Text style={styles.recipeTitle}>{recipe.title}</Text>
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

      {recipe.safety_note && (
        <View style={styles.safetyBadge}>
          <Ionicons name="warning-outline" size={14} color="#FFB347" />
          <Text style={styles.safetyText}>{recipe.safety_note}</Text>
        </View>
      )}

      <Text style={styles.sectionLabel}>Ingredients</Text>
      {recipe.ingredients.map((ing, i) => (
        <View key={i} style={styles.ingredientRow}>
          <View style={styles.dot} />
          <Text style={styles.ingredientText}>
            {ing.qty ?? ""} {ing.unit ?? ""} {ing.item}
            {ing.notes ? ` (${ing.notes})` : ""}
          </Text>
        </View>
      ))}

      <Pressable
        onPress={handleAddToShopping}
        style={({ pressed }) => [
          styles.addShoppingBtn,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Ionicons name="cart-outline" size={16} color={C.accent} />
        <Text style={styles.addShoppingText}>Add to Shopping List</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Steps</Text>
      {recipe.steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      {recipe.doctor_it_up?.length > 0 && (
        <>
          <View style={styles.upgradeHeader}>
            <MaterialCommunityIcons name="magic-staff" size={16} color={C.upgrade} />
            <Text style={[styles.sectionLabel, { color: C.upgrade, marginBottom: 0, marginTop: 0 }]}>
              Doctor It Up
            </Text>
          </View>
          {recipe.doctor_it_up.map((d, i) => (
            <View key={i} style={styles.upgradeCard}>
              <Text style={styles.upgradeName}>{d.name}</Text>
              <Text style={styles.upgradeHow}>{d.how}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <View
      style={[
        styles.bubbleWrap,
        isUser ? styles.bubbleWrapUser : styles.bubbleWrapAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser && { color: "#fff" },
          ]}
        >
          {msg.text}
        </Text>
      </View>
      {msg.recipe && <RecipeCard recipe={msg.recipe} />}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: 'Tell me what you want to cook or what ingredients you have. Example: "I have chicken thighs, rice, and broccoli. Make it spicy and creamy."',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    Keyboard.dismiss();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: msg,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/recipe-chat", baseUrl);

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, preferences: {} }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Generation failed");
      }

      const recipe = data.recipe as AIRecipe;
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `Here's your recipe: ${recipe.title}`,
        recipe,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: `Sorry, I couldn't generate that recipe. ${e.message || "Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble msg={item} />,
    []
  );

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
        <View
          style={[
            styles.headerBar,
            { paddingTop: insets.top + webTopInset + 12 },
          ]}
        >
          <MaterialCommunityIcons name="chef-hat" size={22} color={C.accent} />
          <Text style={styles.headerTitle}>AI Chef</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={C.accent} />
            <Text style={styles.typingText}>Cooking up your recipe...</Text>
          </View>
        )}

        <View
          style={[
            styles.inputBar,
            { paddingBottom: insets.bottom + webBottomInset + 8 },
          ]}
        >
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Describe what you want to cook..."
              placeholderTextColor={C.textSecondary}
              style={styles.textInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit
            />
            <Pressable
              onPress={sendMessage}
              disabled={loading || !input.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                (!input.trim() || loading) && { opacity: 0.4 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.hintText}>
            Try: "high-protein", "dairy-free", "15 minutes", "kid friendly"
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
    color: C.text,
  },
  chatList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  bubbleWrap: {
    maxWidth: "88%",
    gap: 8,
  },
  bubbleWrapUser: {
    alignSelf: "flex-end",
  },
  bubbleWrapAssistant: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    lineHeight: 20,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
  },
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: C.inputBackground,
    borderRadius: 22,
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
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  recipeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: C.accent,
    marginBottom: 8,
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
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.textSecondary,
    marginTop: 7,
  },
  ingredientText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    flex: 1,
    lineHeight: 19,
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
    marginTop: 10,
  },
  addShoppingText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.accent,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
  stepText: {
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    color: C.text,
    flex: 1,
    lineHeight: 19,
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    marginBottom: 8,
  },
  upgradeCard: {
    backgroundColor: C.upgradeLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  upgradeName: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: C.upgrade,
    marginBottom: 3,
  },
  upgradeHow: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: C.textSecondary,
    lineHeight: 17,
  },
});
