# ClimaRisk — Previsão de Risco Climático Regional (Brasil)

Sistema Vue 3 + Vite de previsão de risco climático para 28 municípios brasileiros,
com 6 riscos (Chuva Extrema, Seca, Onda de Calor, Frio Extremo, Ventos Fortes e
Deslizamento), dados do Open-Meteo/INPE e explicabilidade por IA.

## Stack

- **Frontend:** Vue 3 (Composition API + TS), Vite, Tailwind CSS v4, Leaflet, ECharts, pdfmake
- **Backend:** Express (`server.ts`) com motor de regras + IA (NVIDIA NIM ou OpenRouter)
- **Deploy:** Netlify (SPA estático + Netlify Functions serverless)

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

## Deploy no Render (gratuito)

O app é um **servidor Express único** que já serve tanto o frontend (build do Vite
em `dist/`) quanto a API `/api/*`. Nenhuma conversão para funções serverless
é necessária — o Render roda o `server.ts` como está.

### Passo a passo

1. Crie o repositório Git (o projeto ainda não tem `.git`):
   ```bash
   git init
   git add -A
   git commit -m "ClimaRisk MVP"
   git remote add origin <seu-repo-github>
   git push -u origin main
   ```
2. No [Render](https://render.com): **New → Web Service → conecte o repo**.
3. Configuração (o `render.yaml` já pré-preenche quase tudo):
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Plano:** Free
4. **Environment Variables** (mesmas do `.env`):
   - `AI_PROVIDER`, `OPENROUTER_API_KEY` (ou `NVIDIA_API_KEY`), modelos, etc.
   - `NODE_ENV=production` (já no `render.yaml`)
5. **Create Web Service.** O Render roda o build e sobe o servidor na porta
   que ele injeta via `PORT`. Acesse a URL gerada (`.onrender.com`).

### Sem Git? Deploy manual

No painel do Render escolha **Deploy an existing image / Manual**:
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Faça upload do projeto zipado.

### Observações

- O `render.yaml` define `healthCheckPath: /api/cities` para o Render
  verificar que o servidor está vivo.
- O `server.ts` usa `process.env.PORT || 3000`, então funciona tanto
  localmente quanto no Render.
- O cache de IA (1h) é em memória por instância.

## Estrutura

```
server.ts                  Backend Express (app exportado p/ função)
netlify/
  functions/api.ts        Netlify Function (serverless-http sobre o app)
netlify.toml              Config de build, função e redirects
src/
  components/             AppLayout, BrasilMap, RiskGauge
  pages/                  Dashboard, CityDetail, Ranking, Prevention, CrisisRoom, etc.
  composables/            useClimateRisk (estado + chamadas /api)
  utils/pdfExport.ts       Geração de relatório PDF
```
