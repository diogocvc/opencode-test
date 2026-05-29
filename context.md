# Contexto do Projeto — Editor de Blocos com IA

## Visão Geral

Editor de texto baseado em blocos atômicos com assistência de IA. Cada bloco é uma unidade independente que pode ser movida, editada isoladamente, e conectada a outros blocos via IA para gerar transições fluidas.

## Stack

- **Frontend:** React 19 + Vite 8 + TypeScript 6
- **Estado:** Zustand com persistência em localStorage
- **Estilo:** Tailwind CSS v4 com class-based dark mode (`@variant dark`)
- **Drag & drop:** @dnd-kit/core + @dnd-kit/sortable
- **Testes:** Vitest + @testing-library/react + @testing-library/jest-dom + jsdom
- **CI:** GitHub Actions (`.github/workflows/ci.yml` — lint → test → build)
- **Hospedagem:** Vercel (plano free, build estático — sem backend)

## Decisões de Arquitetura

### BYOK (Bring Your Own Key)
- Usuário seleciona o provedor de IA e insere sua própria API Key
- Chave armazenada apenas no localStorage, nunca enviada a servidor
- Chamadas feitas diretamente do frontend para a API do provedor
- Provedores suportados: OpenAI, Anthropic, Groq, Google Gemini
- Custo de API zero para o desenvolvedor

### Streaming (SSE)
- Chamadas de IA usam streaming (SSE) com `ReadableStream` para exibir texto em tempo real
- Cada provedor tem implementação específica de parsing do SSE
- `callAIStream(provider, apiKey, model, system, user, onChunk)` → retorna texto completo
- Bloco alvo recebe `streamingBlockId` no store para indicador visual (`ring-2 ring-blue-200`)

### Tratamento de Erros (IA)
- Classe `AIError` com código tipado: `auth`, `rate_limit`, `timeout`, `server_error`, `network`
- Timeout de 30s via `AbortController` em todas as chamadas
- Respostas não-ok são classificadas por status HTTP e viram toasts específicos
- Erros de rede e timeout têm mensagens amigáveis em português

### Dark Mode
- Class-based: classe `.dark` no `<html>`, controlado pelo store
- Tailwind v4: `@variant dark (&:where(.dark, .dark *))` no `index.css`
- Preferência persiste via Zustand (campo `darkMode` no `partialize`)

### Undo
- Pilha de snapshots (`undoStack: Block[][]`) com limite de 50 entradas
- Auto-undo em addBlock, removeBlock, moveBlock
- Push manual no onBlur do textarea (edição de texto) e antes de operações de IA
- Atalho Ctrl+Z / Cmd+Z via `keydown` listener no App
- Undo também limpa a seleção atual

### Persistência (Zustand)
- `partialize` salva apenas: `blocks`, `settings`, `darkMode`
- Não persiste: `selectedBlockIds`, `loading`, `streamingBlockId`, `toasts`, `undoStack`

### Toast (Notificações)
- Substituiu `alert()` por componente Toast com auto-dismiss (5s)
- 3 tipos: `error` (vermelho), `success` (verde), `info` (azul)
- Posicionado no canto inferior direito, empilhável

## Estrutura de Arquivos

```
src/
├── ai.ts                   # Chamadas IA (normal + streaming) + prompts + AIError
├── store.ts                # Estado global (Zustand): blocos, seleção, settings, undo, dark mode, toasts
├── test/
│   └── setup.ts            # Configuração do Vitest (import @testing-library/jest-dom)
├── components/
│   ├── Block.tsx           # Bloco individual: textarea, drag handle, ↑↓, seleção, ações, streaming indicator
│   ├── Block.test.tsx      # 16 testes
│   ├── SettingsModal.tsx   # Modal de configuração do provedor e API Key
│   ├── Toast.tsx           # Componente de notificação toast
│   └── Toast.test.tsx      # 4 testes
├── App.tsx                 # Layout principal: header (com dark mode toggle), toolbar, lista de blocos, footer, toast
├── App.test.tsx            # 13 testes
├── main.tsx                # Entry point
├── index.css               # @import "tailwindcss" + @variant dark
├── store.test.ts           # 23 testes (blocos, seleção, settings, dark mode, toasts, undo)
├── ai.test.ts              # 21 testes (prompts, callAI, callAIStream 4 provedores, erros)
└── assets/                 # Ícones SVG e hero.png
```

## Fluxo de Teclado

- **Enter** → cria novo bloco abaixo do atual
- **Cmd+Enter** (ou Ctrl+Enter) → quebra de linha dentro do mesmo bloco
- **Ctrl+Z / Cmd+Z** → undo (restaura snapshot anterior)

## Funcionalidades Implementadas (v2.0)

### v1.0 (original)
- Criar, editar e excluir blocos
- Reordenar blocos via drag & drop e botões ↑↓
- Selecionar blocos (toggle) e "Ligar" → IA gera texto-ponte entre os blocos
- Corrigir bloco individual (ortografia/gramática via IA)
- Reescrever bloco com instrução personalizada (ex: "tornar mais formal", "resumir")
- Exportar Markdown (copiar para área de transferência + download .md)
- Salvamento automático no localStorage
- Configuração de provedor e API Key

### Fase 1 — Fundação (adicionado)
- Vitest + Testing Library + jsdom configurados
- `npm run test` / `npm run test:run` disponíveis
- Testes para store, ai.ts, Block, App (43 testes iniciais)
- CI via GitHub Actions (lint → test → build)
- Test files excluídos do tsconfig de produção

### Fase 2 — Qualidade de vida (adicionado)
- Dark mode funcional com toggle no header e persistência
- Tratamento de erros de IA por tipo (auth, rate_limit, timeout, server_error, network)
- Timeout de 30s em todas as chamadas de IA
- Toast substituindo `alert()`
- Testes expandidos para 56 testes

### Fase 3 — Streaming IA (adicionado)
- SSE streaming para OpenAI, Anthropic, Groq e Google Gemini
- `callAIStream` com callback `onChunk` para atualização progressiva
- Bridge: bloco vazio criado imediatamente, texto preenchido em tempo real
- Corrigir/Reescrever: bloco limpo e preenchido caractere por caractere
- Indicador visual de streaming no bloco (`ring-2`)
- Testes com `ReadableStream` mockado (65 testes)

### Fase 4 — Undo (adicionado)
- Pilha de undo com 50 entradas máximas
- Auto-snapshot em add/remove/mover blocos
- Snapshot manual via `pushUndo()` em edição de texto (onBlur) e operações IA
- Atalho Ctrl+Z / Cmd+Z
- Verificado com 73 testes

## Pendentes / Próximos Passos

- **Fase 5: Deploy na Vercel** — configurar `vercel.json` (SPA fallback), conectar GitHub
- Modo claro/escuro: seguir preferência do sistema como fallback inicial (`prefers-color-scheme`)
- Melhorias no undo: feedback visual de quantos passos atrás, botão de redo (Ctrl+Shift+Z)
- Streaming: tratamento de erro parcial se stream falha no meio
- Performance: debounce no pushUndo do onBlur para evitar snapshots duplicados
- Acessibilidade: labels, aria, foco gerenciado
- Testes de integração mais robustos para fluxos de IA

## Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção (tsc + vite)
npm run lint     # ESLint
npm run preview  # Preview do build
npm run test     # Testes (modo watch)
npm run test:run # Testes (single run)
```
