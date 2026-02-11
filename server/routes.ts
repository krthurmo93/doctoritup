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
You are Doctor It Up, a friendly recipe assistant.

RULES:
- Output MUST be valid JSON only. No markdown, no backticks, no extra text.
- Be realistic about cook times and quantities.
- Prefer common grocery-store ingredients.
- Include a shopping_list array derived from ingredients (item names only).
- Include a short doctor_it_up array with 3-6 upgrades (each has name + how).
- Include a safety_note if meat/seafood/eggs appear (e.g., cook to safe internal temps).
- If user asks for something unsafe/inedible, refuse and suggest safe alternatives.

JSON SCHEMA:
{
  "title": string,
  "servings": number,
  "prep_minutes": number,
  "cook_minutes": number,
  "ingredients": [{"item": string, "qty": number|null, "unit": string|null, "notes": string|null}],
  "steps": string[],
  "doctor_it_up": [{"name": string, "how": string}],
  "shopping_list": string[],
  "safety_note": string|null
}
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
        max_completion_tokens: 2048,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";

      let recipe;
      try {
        recipe = JSON.parse(text);
      } catch {
        return res.status(502).json({
          error: "AI did not return valid JSON",
          raw: text.slice(0, 2000),
        });
      }

      return res.json({ recipe });
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
