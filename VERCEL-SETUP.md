# Configuração Vercel - Deploy Dual

Este guia explica como configurar dois projetos Vercel independentes para o TEXTRIS:
- **Landing Page**: `textris.xyz` (domínio principal)
- **App**: `app.textris.xyz` (subdomínio)

## Visão Geral

```
textris.xyz          →  Landing Page (apps/landing/)
app.textris.xyz      →  App Principal (raiz do repositório)
```

## 1. Criar Projeto: Landing Page

### Passos no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. Configure o projeto:
   - **Project Name**: `textris-landing`
   - **Framework Preset**: Outro (Vite)
   - **Root Directory**: `apps/landing`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Configuração de Domínio

1. Vá em **Settings → Domains**
2. Adicione `textris.xyz`
3. Vercel mostrará os valores DNS necessários

### DNS (no registrador de domínio)

| Record | Type | Name | Value |
|--------|------|------|-------|
| Apex | A | `@` | `76.76.21.21` |
| Redirect | CNAME | `www` | `cname.vercel-dns-0.com` |

> **Nota**: O valor CNAME pode variar. Copie exatamente o valor mostrado nas configurações de domínio do Vercel.

## 2. Criar Projeto: App

### Passos no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o **mesmo repositório** do GitHub
3. Configure o projeto:
   - **Project Name**: `textris-app`
   - **Framework Preset**: Outro (Vite)
   - **Root Directory**: `(leave empty)` ou `/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Configuração de Domínio

1. Vá em **Settings → Domains**
2. Adicione `app.textris.xyz`

### DNS (no registrador de domínio)

| Record | Type | Name | Value |
|--------|------|------|-------|
| Subdomain | CNAME | `app` | `cname.vercel-dns-0.com` |

> **Nota**: O valor CNAME pode variar. Copie exatamente o valor mostrado nas configurações de domínio do Vercel.

## 3. Otimizar Builds (Monorepo)

Para evitar builds desnecessários, configure o "Ignored Build Step" em cada projeto:

### No projeto `textris-landing`

1. Vá em **Settings → Git**
2. Em **Ignored Build Step**, adicione:
   ```bash
   git diff HEAD^ HEAD --quiet ./apps/landing/
   ```

### No projeto `textris-app`

1. Vá em **Settings → Git**
2. Em **Ignored Build Step**, adicione:
   ```bash
   git diff HEAD^ HEAD --quiet ./ -- . ':!apps/landing/'
   ```

## 4. Variáveis de Ambiente

### Landing Page (`textris-landing`)

Nenhuma variável de ambiente necessária por enquanto.

### App (`textris-app`)

Se o app usar variáveis de ambiente (ex: API keys), configure-as no painel do Vercel:

1. Vá em **Settings → Environment Variables**
2. Adicione as variáveis necessárias
3. Selecione os ambientes (Production, Preview, Development)

## 5. Verificação

### Deploy da Landing Page

1. Faça push para o repositório
2. Verifique se o build foi disparado no projeto `textris-landing`
3. Acesse `textris.xyz` e verifique se a landing page está funcionando

### Deploy do App

1. Faça push para o repositório
2. Verifique se o build foi disparado no projeto `textris-app`
3. Acesse `app.textris.xyz` e verifique se o app está funcionando

## Solução de Problemas

### Build não é disparado

- Verifique se o "Ignored Build Step" está configurado corretamente
- Verifique se há erros no build (Logs do Vercel)

### Domínio não aponta para o Vercel

- Verifique os registros DNS no registrador
- Agarde a propagação DNS (pode levar até 48h)
- Use [dnschecker.org](https://dnschecker.org/) para verificar

### SSL não funciona

- O Vercel emite certificados SSL automaticamente
- Verifique se o domínio está apontando corretamente
- Agarde alguns minutos após a configuração do domínio

## Referências

- [Vercel: Custom Domains](https://vercel.com/docs/domains/working-with-domains)
- [Vercel: Multiple Projects](https://vercel.com/docs/getting-started/with-multiple-projects)
- [Vercel: Build Configuration](https://vercel.com/docs/projects/project-configuration)