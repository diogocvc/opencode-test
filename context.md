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
- **GitHub:** `diogocvc/opencode-test` (HTTPS)

## Decisões de Arquitetura

### BYOK (Bring Your Own Key)
- Usuário seleciona o provedor de IA e insere sua própria API Key
- Chave armazenada apenas no localStorage, nunca enviada a servidor
- Chamadas feitas diretamente do frontend para a API do provedor
- **Apenas Groq e Google Gemini funcionam** direto do navegador (CORS). OpenAI e Anthropic bloqueiam chamadas browser-side.
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
│   ├── Block.test.tsx      # 18 testes
│   ├── SettingsModal.tsx   # Modal de configuração do provedor e API Key
│   ├── Toast.tsx           # Componente de notificação toast
│   └── Toast.test.tsx      # 4 testes
├── App.tsx                 # Layout principal: header (com dark mode toggle), toolbar, lista de blocos, footer, toast
├── App.test.tsx            # 13 testes
├── main.tsx                # Entry point
├── index.css               # @import "tailwindcss" + @variant dark
├── store.test.ts           # 24 testes (blocos, seleção, settings, dark mode, toasts, undo)
├── ai.test.ts              # 21 testes (prompts, callAI, callAIStream 4 provedores, erros)
└── assets/                 # Ícones SVG e hero.png
```

## Fluxo de Teclado

- **Enter** → cria novo bloco abaixo do atual (cursor foca no novo bloco)
- **Shift+Enter** → quebra de linha dentro do mesmo bloco
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

### Fase 5 — Deploy na Vercel (adicionado)
- `vercel.json` com rewrite SPA (`/*` → `/index.html`) para client-side routing
- Repositório criado em `diogocvc/opencode-test`, push via HTTPS
- Deploy automático via Vercel (conectado ao GitHub)
- Build e testes verificados (75 testes)

### Fase 6 — Correções de Bugs (adicionado)
- **Enter foca novo bloco**: `focusedBlockId` no store + `useEffect` no Block
- **Shift+Enter quebra linha**: condicional `!e.shiftKey` adicionada
- **Fundo responsivo**: layout com wrapper full-width + conteúdo `max-w-3xl mx-auto`
- **CORS**: OpenAI e Anthropic removidos dos provedores (não funcionam sem backend). Padrão alterado para Groq.

## Fase 7 — Qualidade da Ponte IA (adicionado em 31/05/2026)

> ⚠️ **Nota importante:** Todos os testes e observações feitos antes deste commit (incluindo os erros de CORS com API Key inválida e os testes de qualidade da ponte) foram na versão anterior do código (`608bb63`). As correções só passam a valer a partir deste commit.

### Bugs corrigidos
- **API Key com espaços**: `SettingsModal.tsx` — adicionado `.trim()` no `onChange` do input da API Key para evitar espaços extras que invalidam a chave.
- **Mensagem de erro de rede**: `ai.ts` — mensagem do `fetchWithTimeout` agora sugere verificar se a API Key tem espaços extras.
- **Ordem dos blocos no "Ligar"**: `App.tsx:handleBridge` — `selectedBlockIds` era usado na ordem de clique do usuário. Agora ordena os blocos pela posição no documento antes de definir A (primeiro) e B (segundo). O bloco de transição é inserido depois de A (`idxA + 1`) em vez de antes de B.

### Prompt do bridgePrompt (7 iterações)
O prompt de `bridgePrompt` em `ai.ts` passou por várias iterações para melhorar a qualidade da transição:

|#|Abordagem|Resultado|
|---|---|---|
|1|"Gere transição fluida entre os dois textos"|IA misturava/resumia ambos os blocos|
|2|Envia última frase de A + primeira de B explicitamente|IA repetia a primeira frase de B na ponte → redundância|
|3|Instrução "NÃO use palavras/ideias do Texto B"|IA ainda referenciava B (ex: "hype")|
|4|Remove Texto B do prompt; só direção genérica|Usuário questionou relevância de B|
|5|`summarize(textB)` — resumo curto no lugar do texto bruto|IA ainda extraía conceitos específicos do resumo|
|6|Texto completo de ambos + regras mais fortes|Ainda referenciou "hype" e "inteligências artificiais"|
|7|**Atual:** framing de "escritor criando ponte invisível" — foco em criar expectativa sem revelar B|A testar|

**Decisão final (v7):** Manter texto completo de ambos os blocos no prompt (contexto máximo), mas reformular com:
- Metáfora de "ponte invisível" — leitor sente continuidade sem perceber a emenda
- Ênfase em criar expectativa/antecipação, não em revelar B
- Proibição de conectivos forçados ("entretanto", "todavia", "porém")
- Resposta limitada a 1-2 frases

**Problema ainda aberto:** IA tende a referenciar conceitos específicos do Texto B (ex: "hype", "IA") mesmo quando instruída a não fazer. A abordagem v7 tenta contornar isso mudando o framing de "regras" para "papel de escritor".

### Erro conhecido: CORS com API Key inválida
Quando a API Key é inválida, a Groq retorna HTTP 401 **sem headers CORS**. O navegador bloqueia a resposta como erro de CORS, e o código cai no catch de rede (`fetchWithTimeout`) com mensagem genérica. A solução atual foi melhorar a mensagem para sugerir verificar a key. Idealmente, deveria-se detectar esse caso e mostrar um erro de autenticação mais preciso.

### Provedor OpenRouter adicionado
OpenRouter (`https://openrouter.ai`) foi adicionado como provedor compatível com CORS. Ele funciona como agregador de modelos (DeepSeek, OpenAI, Anthropic, etc.) com **uma única chave**. Útil caso a VPN bloqueie provedores específicos — o OpenRouter geralmente não é bloqueado.

## Pendentes / Próximos Passos

- Adicionar mais provedores compatíveis com CORS (DeepSeek direto, Perplexity, Together, etc.)
- Modo claro/escuro: seguir preferência do sistema como fallback inicial (`prefers-color-scheme`)
- Melhorias no undo: feedback visual de quantos passos atrás, botão de redo (Ctrl+Shift+Z)
- Streaming: tratamento de erro parcial se stream falha no meio
- Performance: debounce no pushUndo do onBlur para evitar snapshots duplicados
- Acessibilidade: labels, aria, foco gerenciado
- Testes de integração mais robustos para fluxos de IA
- **BridgePrompt:** prompt da ponte entre blocos ainda precisa de ajustes — IA tende a referenciar conteúdo do Bloco B. Testar abordagem v7 (framing de "escritor criando ponte invisível").
- **CORS com erro 401**: Detectar quando a resposta da API é bloqueada por CORS devido a erro de autenticação (Groq não envia headers CORS em respostas 4xx) e mostrar toast de auth em vez de network.

## Comandos

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção (tsc + vite)
npm run lint     # ESLint
npm run preview  # Preview do build
npm run test     # Testes (modo watch)
npm run test:run # Testes (single run)
```
