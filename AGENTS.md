# TEXTRIS — Instruções do Projeto (AGENTS)

Editor de blocos baseado em Markdown com assistência de IA (TEXTRIS).

## Convenções e arquitetura

As regras detalhadas do projeto (stack, arquitetura, fluxos de teclado, decisões de
BYOK/streaming/undo, layout visual Expo UI, formatos de arquivo `.md`/`.html`) estão em
[`context.md`](./context.md). **Leia `context.md` antes de qualquer mudança estrutural.**

Resumo rápido:
- Frontend: React 19 + Vite 8 + TypeScript 6.
- Estado: Zustand com persistência em `localStorage` (`src/store.ts`).
- Estilo: Tailwind CSS v4, dark mode class-based (`@variant dark` em `src/index.css`).
- Drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable`.
- Testes: Vitest + Testing Library (`src/**/*.test.ts(x)`). Comandos: `npm run test:run`, `npm run lint`, `npm run build`.
- Deploy: Vercel (build estático). Repositório: `diogocvc/opencode-test`.

## Regras gerais
- Não introduzir biblioteca de editor rich-text; o editor é um `<textarea>` controlado (`src/components/Block.tsx`) cujo conteúdo é Markdown puro.
- Sempre rodar `npm run test:run`, `npm run lint` e `npm run build` antes de concluir.
- Nunca commitar secrets/API keys (BYOK fica só no `localStorage`).

## Juicer Kit (agentes/skills/commands)

Este projeto usa o [juicer-kit](https://github.com/diogocvc/juicer-kit). Os agentes,
skills e comandos estão em `.opencode/` (não versionados — ver `.gitignore`):

- **Agentes** (`.opencode/agents/`): `@orchestrator`, `@finder`, `@analyst`, `@architect`,
  `@planner`, `@coder`, `@editor`, `@fixer`, `@refactorer`, `@reviewer`, `@tester`,
  `@debugger`, `@security`, `@documenter`, `@commenter`, `@devops`, `@optimizer`.
- **Commands** (`.opencode/commands/`): `/add-backlog`, `/start`, `/plan`, `/review`,
  `/test`, `/security-audit`, `/document`, `/compact`, `/edit-backlog`, `/remove-backlog`.
- **Skills** (`.opencode/skills/`): `tdd-workflow`, `security-review`, `prd-template`,
  `api-design`, `code-review-checklist`, `context-management`.
- **Backlog** (`backlog/`): rastreamento de tarefas do kit.

Pipelines recomendadas (ver README do kit): nova feature →
`@finder → @analyst → @architect → @planner → @coder → @reviewer → @tester → @documenter`.
Sempre rode `@reviewer` e `@tester` após mudanças de código.
