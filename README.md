# Bizu PWA

App React + Vite com roteamento SPA (`BrowserRouter`) e integração com Supabase no frontend.

## Pré-requisitos

- Node.js 20+ (recomendado)
- npm

## Rodar localmente

1. Instale as dependências:
   `npm install`
2. Crie o arquivo `.env.local` com base no exemplo:
   `copy .env.example .env.local` (Windows)
   `cp .env.example .env.local` (Linux/macOS)
3. Preencha no `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Suba o projeto:
   `npm run dev`

Sem as variáveis do Supabase, o app inicia em modo limitado (sem quebra de startup), usando fallback local quando disponível.

## Build local e preview

1. Gerar build:
   `npm run build`
2. Servir build localmente:
   `npm run preview`
3. Limpar artefatos de build:
   `npm run clean`

## Deploy na Vercel

1. Importe este repositório na Vercel.
2. Configure:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Adicione as variáveis de ambiente na Vercel (Production/Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Faça o deploy.

O fallback de rotas SPA para `index.html` já está configurado em `vercel.json`, evitando erro 404 ao atualizar páginas internas.
