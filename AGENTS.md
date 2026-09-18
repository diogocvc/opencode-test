# TEXTRIS — AGENTS

Markdown block editor with AI assistance. Detailed spec: `context.md` (read before structural changes). Visual reference: `expo-ui.md`.

## Commands (verified in package.json / .github/workflows/ci.yml)
- Dev server: `npm run dev` (Vite, http://localhost:5173)
- Quality gate before finishing — exact CI order: `npm run lint` → `npm run test:run` → `npm run build`.
- `npm run build` is `tsc -b && vite build`: it **typechecks via project references** (tsconfig.app.json + tsconfig.node.json) BEFORE bundling. There is no separate `typecheck` script — `build` is the typecheck gate.
- Single test: `npx vitest run <path>` (or `npm run test:run -- <path>`). Tests use jsdom + Testing Library; setup in `src/test/setup.ts`.

## Architecture gotchas
- **Tailwind v4 is CSS-configured** via `@theme` in `src/index.css`. There is NO `tailwind.config.js` — do not add one.
- **Dark mode is class-based**: `@variant dark (&:where(.dark, .dark *))` in `src/index.css`; the theme toggle adds/removes `.dark` on the root. Do NOT rely on `prefers-color-scheme`.
- **Two parallel theming systems**: main UI uses token classes (`bg-canvas`, `text-ink`, `border-divider`, `text-accent`); `Toast.tsx` and `SettingsModal.tsx` instead hardcode Tailwind grays/reds/greens with `dark:` utilities. Keep new UI on the token system.
- State: Zustand store with `localStorage` persistence in `src/store.ts` (undo history lives there too).
- **Editor is a controlled `<textarea>`** in `src/components/Block.tsx` with pure Markdown. NO rich-text editor library — do not introduce one. "Corrigir"/"Reescrever" are AI features, not formatting.
- Drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable`.
- Markdown → HTML export uses `marked` (`src/markdown.ts`, `src/richText.ts`).

## Constraints
- Never commit secrets / API keys. BYOK provider keys live only in `localStorage` (set via SettingsModal).
- Deploy: static build to Vercel; `vercel.json` rewrites all paths to `index.html` (SPA). Build output: `dist/`.

## i18n (Internationalization)
- Custom module (no react-i18next): `src/i18n/pt.ts`, `src/i18n/en.ts`, `src/i18n/index.ts`
- Hook `useT()` returns `{ t, locale, setLocale }` — reads locale from Zustand store
- `locale` persisted in Zustand store via `partialize` to `localStorage['editor-blocos-storage']`
- ~58 translation keys covering: header, footer, bridge, block, toolbar, settings, toasts, AI errors, IO
- AI prompts (`bridgePrompt`, `correctPrompt`, `rewritePrompt`) stay in PT regardless of locale
- Toggle `PT|EN` in header — shows opposite language label
- Default locale detected from `navigator.language.startsWith('en')`
- Tests: set `locale: 'pt'` in `beforeEach` via `useStore.setState({ locale: 'pt' })`
- `richText.ts` and `io.ts` read locale from store directly (not React components) via `useStore.getState().locale`

### Landing Page i18n
- Separate React app at `apps/landing/` — own i18n system (no Zustand dependency)
- `apps/landing/src/i18n/pt.ts`, `en.ts`, `index.ts` — ~55 strings each
- Hook `useT()` uses `useState` + `localStorage` (lightweight, no Zustand)
- Syncs with app via `localStorage['editor-blocos-storage'].locale`
- Toggle `PT|EN` in header next to dark mode toggle

## Local tooling (gitignored)
- `.opencode/` (juicer-kit) and `backlog/` are gitignored — agent/skill/command workflows are local-only.
- Workflow convention: run `@reviewer` and `@tester` after code changes.
