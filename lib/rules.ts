import { Recipe } from "./recipes";

export interface Upgrade {
  id: string;
  title: string;
  why: string;
  addIngredients: string[];
  stepAdds: string[];
}

interface DoctorRule {
  key: string;
  match: string[];
  upgrades: Upgrade[];
}

export interface RemixedRecipe {
  title: string;
  why: string;
  ingredients: string[];
  steps: string[];
}

export const DOCTOR_RULES: DoctorRule[] = [
  {
    key: "box-cake",
    match: ["box cake", "cake mix", "cake"],
    upgrades: [
      {
        id: "cake-milk-butter",
        title: "Make it richer (milk + melted butter)",
        why: "Milk adds tenderness and flavor; butter adds richness.",
        addIngredients: [
          "Swap water for milk (same amount as box calls for)",
          "Swap oil for melted butter (same amount as oil)",
        ],
        stepAdds: [
          "Use milk instead of water.",
          "Use melted butter instead of oil.",
        ],
      },
      {
        id: "cake-extra-egg",
        title: "Moist + bakery texture (add 1 extra egg)",
        why: "An extra egg boosts structure and moisture for a more bakery-style crumb.",
        addIngredients: ["Add 1 extra egg (beyond box directions)"],
        stepAdds: ["Add one extra egg before mixing."],
      },
      {
        id: "cake-pudding",
        title: "Soft + thick crumb (add pudding mix)",
        why: "Instant pudding mix helps keep cakes softer and moister.",
        addIngredients: ["Add 1 small box instant pudding mix (dry)"],
        stepAdds: [
          "Whisk in dry pudding mix with the cake mix before adding wet ingredients.",
        ],
      },
    ],
  },
  {
    key: "brownies",
    match: ["brownies", "brownie"],
    upgrades: [
      {
        id: "brownie-espresso",
        title: "Deeper chocolate (espresso powder)",
        why: "A little espresso enhances chocolate without making it taste like coffee.",
        addIngredients: ["Add 1 tsp espresso powder (optional)"],
        stepAdds: [
          "Stir espresso powder into dry mix before adding wet ingredients.",
        ],
      },
      {
        id: "brownie-extra-yolk",
        title: "Fudgier (add 1 egg yolk)",
        why: "Extra yolk increases fat and gives a fudgier texture.",
        addIngredients: ["Add 1 extra egg yolk"],
        stepAdds: [
          "Add one additional egg yolk to the batter and mix until smooth.",
        ],
      },
      {
        id: "brownie-choc-chips",
        title: "Chocolate pockets (fold in chips)",
        why: "Chocolate chips create melty bites and richer flavor.",
        addIngredients: ["Fold in 1/2 cup chocolate chips"],
        stepAdds: ["Fold in chocolate chips right before baking."],
      },
    ],
  },
  {
    key: "ramen",
    match: ["ramen", "instant ramen", "noodles"],
    upgrades: [
      {
        id: "ramen-egg",
        title: "Protein upgrade (soft egg)",
        why: "Egg adds protein and makes it feel like a real meal.",
        addIngredients: ["Add 1 egg (soft-boiled or poached)"],
        stepAdds: ["Top with a soft-boiled or poached egg."],
      },
      {
        id: "ramen-broth",
        title: "Better broth (butter + garlic + soy)",
        why: "Butter and garlic add depth; soy adds umami.",
        addIngredients: [
          "Add 1 tsp butter",
          "Add 1/2 tsp garlic (minced or powder)",
          "Add 1 tsp soy sauce",
        ],
        stepAdds: ["Stir butter, garlic, and soy into the broth at the end."],
      },
      {
        id: "ramen-crunch",
        title: "Crunch + freshness (green onion + sesame)",
        why: "Fresh toppings make instant ramen taste upgraded.",
        addIngredients: [
          "Top with sliced green onion",
          "Sprinkle sesame seeds",
        ],
        stepAdds: ["Finish with green onion and sesame seeds."],
      },
    ],
  },
];

export function getUpgradesForRecipe(recipe: Recipe): Upgrade[] {
  if (!recipe) return [];
  const text = (recipe.title + " " + (recipe.tags || []).join(" ")).toLowerCase();
  for (const rule of DOCTOR_RULES) {
    if (rule.match.some((k) => text.includes(k))) return rule.upgrades;
  }
  return [];
}

export function applyUpgrade(
  recipe: Recipe,
  upgrade: Upgrade
): RemixedRecipe | null {
  if (!recipe || !upgrade) return null;

  const remixedIngredients = [
    ...recipe.ingredients,
    "",
    "--- Doctor It Up Adds ---",
    ...upgrade.addIngredients,
  ];

  const remixedSteps = [
    ...recipe.steps,
    "",
    "--- Doctor It Up Steps ---",
    ...upgrade.stepAdds,
  ];

  return {
    title: `${recipe.title} + ${upgrade.title}`,
    why: upgrade.why,
    ingredients: remixedIngredients,
    steps: remixedSteps,
  };
}
