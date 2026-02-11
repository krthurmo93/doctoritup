# Doctor It Up

## Overview

Doctor It Up is a recipe enhancement mobile app built with Expo (React Native) and an Express backend. The app has three tabs:

1. **Doctor It Up** (main tab) — Users enter a pre-made/boxed item they already have (box cake mix, instant ramen, frozen pizza, etc.) and get 3 creative upgrade suggestions with extra ingredients and modified steps to make it taste homemade.
2. **AI Chef** — Users describe what they want to cook from scratch, AI generates a base recipe plus 3 complete alternative versions with different techniques, ingredient swaps, and shortcuts.
3. **Shopping List** — A persistent shopping list where users can add ingredients from any recipe or side dish and check them off.

Both recipe tabs also recommend 2-4 complementary side dishes that balance the meal, with brief explanations of why each works and simple preparation methods.

The app targets mobile (iOS/Android) via Expo and also supports web.

## User Preferences

Preferred communication style: Simple, everyday language.

### Cooking Style Defaults
- Default to Southern home-style cooking inspired by a skilled grandmother
- Prioritize flavor, comfort, and practical techniques
- Use familiar, affordable ingredients — nothing fancy or hard to find
- Avoid chef jargon — write instructions like you're talking to a neighbor
- Always recommend 2-4 complementary side dishes that balance the meal
- Each side explains why it works and gives a simple preparation method
- Sides should feel realistic for a home cook, not restaurant-level

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: Tab-based layout with two tabs: Doctor It Up, Shopping (defined in `app/(tabs)/`)
- **Styling**: Dark theme throughout using a centralized color constants file (`constants/colors.ts`), StyleSheet-based styling
- **State Management**: React Context for shopping list (`lib/shopping-context.tsx`), TanStack React Query for server state (`lib/query-client.ts`)
- **Persistence**: AsyncStorage for the shopping list (local-first, no server round-trip needed)
- **Fonts**: Outfit font family (400-700 weights) via `@expo-google-fonts/outfit`
- **Key Libraries**: react-native-reanimated (animations), expo-haptics (tactile feedback), expo-linear-gradient (gradients), react-native-gesture-handler, react-native-keyboard-controller

### Backend (Express)

- **Runtime**: Node.js with Express 5, written in TypeScript (compiled with tsx for dev, esbuild for production)
- **API Pattern**: JSON REST API served from `/api/*` routes
- **Main Endpoint**: `POST /api/recipe-chat` — Sends user message + preferences to OpenAI and returns a structured JSON response with a base recipe and 3 complete "doctored up" alternative versions (each with full ingredients, steps, tagline, and why explanation)
- **AI Integration**: OpenAI API via Replit AI Integrations (uses `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables)
- **CORS**: Dynamic origin allowlist based on Replit environment variables, plus localhost support for Expo web dev
- **Static Serving**: In production, serves pre-built Expo web bundle from `dist/` directory

### Local Recipe Engine

- **Recipe Catalog**: Hardcoded recipes in `lib/recipes.ts` with search functionality
- **Upgrade Rules**: Pattern-matching rules in `lib/rules.ts` that suggest upgrades based on recipe tags (e.g., box cake → add milk+butter, extra egg, pudding mix)
- **Remix Logic**: `applyUpgrade()` function merges upgrade ingredients and steps into base recipe to create a "remixed" version

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (users table) and `shared/models/chat.ts` (conversations + messages tables)
- **Tables**:
  - `users` — id (UUID), username, password
  - `conversations` — id (serial), title, created_at
  - `messages` — id (serial), conversation_id (FK), role, content, created_at
- **Storage Layer**: `server/storage.ts` provides an in-memory implementation (`MemStorage`) for users; `server/replit_integrations/chat/storage.ts` uses Drizzle/Postgres for chat persistence
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable

### Replit Integration Modules

Located in `server/replit_integrations/`, these are pre-built integration modules:

- **chat/** — CRUD routes and storage for conversations/messages using Postgres
- **audio/** — Voice chat capabilities (speech-to-text, text-to-speech, audio format detection, ffmpeg conversion)
- **image/** — Image generation via OpenAI's gpt-image-1 model
- **batch/** — Generic batch processing with rate limiting and retries (p-limit + p-retry)

### Build & Deploy

- **Dev**: Two processes run concurrently — Expo dev server and Express server (`server:dev` script)
- **Production Build**: Custom build script (`scripts/build.js`) creates static Expo web bundle, then Express serves it
- **Server Build**: esbuild bundles server code to `server_dist/`

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable
- **OpenAI API** — Used for AI recipe generation (`/api/recipe-chat`), image generation, and voice features. Accessed through Replit AI Integrations proxy (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- **AsyncStorage** — Local device storage for shopping list persistence
- **Expo Services** — Font loading, splash screen, haptics, image picker, location, and other native capabilities
- **ffmpeg** — Used server-side for audio format conversion (required for voice features)