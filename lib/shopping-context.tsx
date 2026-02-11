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

export interface ShoppingItem {
  text: string;
  checked: boolean;
}

interface ShoppingContextValue {
  items: ShoppingItem[];
  addItems: (newItems: string[]) => void;
  toggleItem: (index: number) => void;
  clearChecked: () => void;
  clearAll: () => void;
  checkedCount: number;
  totalCount: number;
}

const ShoppingContext = createContext<ShoppingContextValue | null>(null);

const STORAGE_KEY = "doctor_it_up_shopping_v1";

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItems = useCallback((newItems: string[]) => {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.text.toLowerCase()));
      const toAdd = newItems
        .map((t) => t.trim())
        .filter((t) => t && !existing.has(t.toLowerCase()));
      return [...prev, ...toAdd.map((text) => ({ text, checked: false }))];
    });
  }, []);

  const toggleItem = useCallback((index: number) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, checked: !it.checked } : it
      )
    );
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((it) => !it.checked));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const checkedCount = useMemo(
    () => items.filter((i) => i.checked).length,
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItems,
      toggleItem,
      clearChecked,
      clearAll,
      checkedCount,
      totalCount: items.length,
    }),
    [items, addItems, toggleItem, clearChecked, clearAll, checkedCount]
  );

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error("useShopping must be used within ShoppingProvider");
  return ctx;
}
