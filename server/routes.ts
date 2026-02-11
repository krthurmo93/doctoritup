import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/recipe-chat", async (req, res) => {
    try {
      const message = String(req.body?.message || "").trim();
      const preferences = req.body?.preferences || {};

      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      const system = `
You are Doctor It Up, a friendly recipe assistant that helps people make everyday recipes better, easier, or more creative.

YOUR JOB:
1. Generate a BASE recipe for what the user asks.
2. Generate 3 DOCTORED UP versions — each is a COMPLETE alternate recipe that creatively modifies the base. These are NOT small tips. Each doctored version is a FULL recipe with its own ingredients and steps.

WHAT MAKES A GOOD "DOCTOR IT UP" VERSION:
- Clever ingredient swaps that save time or add flavor (e.g., pancake mix instead of scratch batter, cream cheese frosting from a tub instead of homemade)
- Shortcut techniques (e.g., using a slow cooker, air fryer, or one-pot method)
- Flavor upgrades (e.g., adding bourbon to peach cobbler, using brown butter)
- Texture changes (e.g., making it crunchier with a streusel top, adding a layer of cream cheese)
Each doctored version should feel like a meaningfully different take on the dish, not just "add an extra egg."

RULES:
- Output MUST be valid JSON only. No markdown, no backticks, no extra text.
- Be realistic about cook times and quantities.
- Prefer common grocery-store ingredients.
- Include a safety_note on the base recipe if meat/seafood/eggs appear.
- If user asks for something unsafe/inedible, refuse politely and suggest alternatives.

JSON SCHEMA:
{
  "base": {
    "title": string,
    "servings": number,
    "prep_minutes": number,
    "cook_minutes": number,
    "ingredients": [{"item": string, "qty": number|null, "unit": string|null, "notes": string|null}],
    "steps": string[],
    "shopping_list": string[],
    "safety_note": string|null
  },
  "doctored": [
    {
      "title": string,
      "tagline": string,
      "why": string,
      "servings": number,
      "prep_minutes": number,
      "cook_minutes": number,
      "ingredients": [{"item": string, "qty": number|null, "unit": string|null, "notes": string|null}],
      "steps": string[],
      "shopping_list": string[]
    }
  ]
}

"tagline" is a short 3-6 word label like "Pancake Mix Shortcut" or "Brown Butter Upgrade" or "Slow Cooker Version".
"why" explains in 1-2 sentences why this version is better/easier/tastier.
Each doctored version MUST have completely rewritten ingredients and steps (not just additions to the base).
Generate exactly 3 doctored versions.
      `.trim();

      const user = `
User request: ${message}
Preferences (optional): ${JSON.stringify(preferences)}
      `.trim();

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_completion_tokens: 4096,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        return res.status(502).json({
          error: "AI did not return valid JSON",
          raw: text.slice(0, 2000),
        });
      }

      return res.json(result);
    } catch (e) {
      console.error("Recipe generation error:", e);
      return res
        .status(500)
        .json({ error: "Recipe generation failed", detail: String(e) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
