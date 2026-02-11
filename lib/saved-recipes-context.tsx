import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Ingredient {
  item: string;
  qty: number | null;
  unit: string | null;
  notes: string | null;
}

interface SideDish {
  name: string;
  why_it_works: string;
  how_to_make: string;
  shopping_list: string[];
}

export interface SavedRecipe {
  id: string;
  savedAt: number;
  type: "chef" | "doctor";
  title: string;
  tagline?: string;
  why?: string;
  servings?: number;
  prep_minutes?: number;
  cook_minutes?: number;
  ingredients?: Ingredient[];
  add_ingredients?: Ingredient[];
  steps?: string[];
  shopping_list?: string[];
  safety_note?: string | null;
  base_product?: string;
  base_description?: string;
  sides?: SideDish[];
}

interface SavedRecipesContextValue {
  recipes: SavedRecipe[];
  saveRecipe: (recipe: SavedRecipe) => void;
  removeRecipe: (id: string) => void;
  isRecipeSaved: (title: string) => boolean;
  totalSaved: number;
}

const SavedRecipesContext = createContext<SavedRecipesContextValue | null>(null);

const STORAGE_KEY = "doctor_it_up_saved_recipes_v1";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function SavedRecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setRecipes(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    }
  }, [recipes, loaded]);

  const saveRecipe = useCallback((recipe: SavedRecipe) => {
    setRecipes((prev) => {
      const exists = prev.some((r) => r.title.toLowerCase() === recipe.title.toLowerCase());
      if (exists) return prev;
      return [{ ...recipe, id: generateId(), savedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const isRecipeSaved = useCallback(
    (title: string) => recipes.some((r) => r.title.toLowerCase() === title.toLowerCase()),
    [recipes]
  );

  const value = useMemo(
    () => ({
      recipes,
      saveRecipe,
      removeRecipe,
      isRecipeSaved,
      totalSaved: recipes.length,
    }),
    [recipes, saveRecipe, removeRecipe, isRecipeSaved]
  );

  return (
    <SavedRecipesContext.Provider value={value}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

export function useSavedRecipes() {
  const ctx = useContext(SavedRecipesContext);
  if (!ctx) throw new Error("useSavedRecipes must be used within SavedRecipesProvider");
  return ctx;
}
