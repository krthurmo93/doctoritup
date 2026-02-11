export interface Recipe {
  id: string;
  title: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

export const RECIPES: Recipe[] = [
  {
    id: "box-cake-vanilla",
    title: "Vanilla Box Cake (Base)",
    tags: ["box cake", "dessert", "easy"],
    ingredients: [
      "1 box vanilla cake mix",
      "Eggs, water, oil (per box directions)",
    ],
    steps: [
      "Preheat oven as directed on box.",
      "Mix cake batter using box directions.",
      "Bake and cool.",
    ],
  },
  {
    id: "boxed-brownies",
    title: "Boxed Brownies (Base)",
    tags: ["brownies", "dessert", "easy"],
    ingredients: [
      "1 box brownie mix",
      "Eggs, water, oil (per box directions)",
    ],
    steps: [
      "Preheat oven as directed on box.",
      "Mix batter using box directions.",
      "Bake until set. Cool before slicing.",
    ],
  },
  {
    id: "instant-ramen",
    title: "Instant Ramen (Base)",
    tags: ["ramen", "quick", "savory"],
    ingredients: ["1 pack instant ramen", "2 cups water"],
    steps: [
      "Bring water to a boil.",
      "Add noodles and cook 2-3 minutes.",
      "Stir in seasoning packet and serve.",
    ],
  },
];

export function searchRecipes(query: string): Recipe[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return RECIPES.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q))
  );
}
