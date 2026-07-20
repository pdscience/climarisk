# ClimaRisk — Previsão de Risco Climático Regional (Brasil)

Sistema Vue 3 + Vite de previsão de risco climático para 28 municípios brasileiros,
com 6 riscos (Chuva Extrema, Seca, Onda de Calor, Frio Extremo, Ventos Fortes e
Deslizamento), dados do Open-Meteo/INPE e explicabilidade por IA.

## Stack

- **Frontend:** Vue 3 (Composition API + TS), Vite, Tailwind CSS v4, Leaflet, ECharts, pdfmake
- **Backend:** Express (`server.ts`) com motor de regras + IA (NVIDIA NIM ou OpenRouter)
- **Deploy:** Render (Web Service gratuito — servidor Express único)

## Como rodar localmente

**Pré-requisitos:** Node.js 18+

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env` na raiz (veja `.env.example` se existir) com as variáveis abaixo.
3. Rode o app:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

### Variáveis de ambiente (`.env`)

| Variável | Descrição | Obrigatória |
|----------|-------------|--------------|
| `AI_PROVIDER` | `openrouter` ou `nvidia` | Sim |
| `OPENROUTER_API_KEY` | Chave da OpenRouter (usado se `AI_PROVIDER=openrouter`) | Se usar OpenRouter |
| `OPENROUTER_MODEL` | Modelo (ex: `google/gemini-2.0-flash-exp`) | Não (tem default) |
| `NVIDIA_API_KEY` | Chave NVIDIA NIM (usado se `AI_PROVIDER=nvidia`) | Se usar NVIDIA |
| `NVIDIA_MODEL` | Modelo NVIDIA | Não (tem default) |

> Sem nenhuma chave de IA o sistema ainda funciona usando **regras técnicas** (fallback).

## Scripts

| Comando | O que faz |
|---------|-------------|
| `npm run dev` | Sobe o servidor Express + Vite (dev) na porta 3000 |
| `npm run build` | Build do frontend (`dist/`) + bundle do backend |
| `npm run start` | Sobe o backend compilado (`dist/server.cjs`) |
| `npm run lint` | `vue-tsc --noEmit` |

## Deploy no Render (gratuito) — COMO ATUALIZAR O CÓDIGO

O app é um **servidor Express único** que já serve tanto o frontend (build do Vite
em `dist/`) quanto a API `/api/*`. O Render roda o `server.ts` como está.

**O deploy é automático:** o GitHub é a "ponte" entre você e o Render. Você **nunca
sobe nada direto pro Render** — você só faz `git push` pro GitHub e o Render reconstrói
sozinho.

```
Seu código local  →  git push (GitHub)  →  Render detecta  →  rebuild + deploy automático
```

### Checklist para atualizar a URL do Render

Toda vez que alterar algum arquivo do projeto:

```bash
# 1. (opcional, mas recomendado) teste localmente se compila sem erro
npm run build

# 2. salve as alterações no Git
git add -A
git commit -m "descreva o que mudou"
git push origin main
```

Pronto. Em alguns minutos a URL `https://climarisk-543i.onrender.com` já estará
com a nova versão.

### Onde acompanhar o deploy no Render

No painel do [Render](https://dashboard.render.com) → serviço **climarisk**:
- **Aba "Deploy":** histórico de deploys e status
  (`Build in progress` → `Live` verde, ou erro se o build falhou).
- **Aba "Logs":** saída do build e do servidor em tempo real.

### Configuração (já feita via `render.yaml`)

- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Plano:** Free
- **Health Check:** `/api/cities` (o Render usa para saber que o servidor está vivo)
- **Environment Variables** (definidas no painel do Render, não no Git):
  `AI_PROVIDER`, `OPENROUTER_API_KEY` (ou `NVIDIA_API_KEY`), modelos, `NODE_ENV=production`.

> Nenhuma chave de IA? O sistema ainda funciona com **regras técnicas** (fallback).

### Observações importantes

- **Free tier "dorme"** após ~15 min sem tráfego. A primeira visita depois de um
  tempo demora ~20s para "acordar" — é normal, não é erro de deploy.
- O `server.ts` usa `process.env.PORT || 3000`, então funciona tanto
  localmente quanto no Render.
- O cache de IA (1h) é em memória por instância.
- **Nunca** commite o `.env` (ele está no `.gitignore`). As chaves de produção
  ficam nas Environment Variables do painel do Render.

## Estrutura

```
server.ts                  Backend Express único (serve frontend + API /api/*)
render.yaml                Config do Web Service no Render
src/
  components/             AppLayout, BrasilMap, RiskGauge
  pages/                  Dashboard, CityDetail, Ranking, Prevention, CrisisRoom, etc.
  composables/            useClimateRisk (estado + chamadas /api)
  utils/pdfExport.ts       Geração de relatório PDF
```
