# Manual de Bolso

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
   - `VITE_PUBLIC_APP_URL` (opcional em dev; obrigatório para gerar links públicos corretos em produção)
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

## Produção em Node/Hostinger

Para ambientes como Hostinger Node/VPS, o deploy de produção deve servir a SPA e a rota de preview compartilhado no mesmo processo Node.

1. Configure as variáveis de ambiente:
   - `PUBLIC_APP_URL`
   - `VITE_PUBLIC_APP_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Gere o build:
   `npm run build`
3. Suba o servidor:
   `npm start`

O servidor Node atende:
- assets estáticos de `dist`
- preview dinâmico em `/share/item/:id`
- fallback SPA para rotas como `/item/:id`

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

## Release 1.0

Checklist mínimo para fechar release estável:

1. Banco de dados (Supabase):
   - Execute `database/014_items_pdf_text_body_optional.sql` no SQL Editor.
   - Valide os checks ativos com a query de diagnóstico no topo da migration.
2. Qualidade:
   - `npm run lint`
   - `npm run clean`
   - `npm run build`
3. Deploy:
   - Faça deploy de preview na Vercel e rode smoke test manual.
   - Promova para produção após validação de rotas, áudio, favoritos, busca, detalhe e sugestões.
4. Versionamento:
   - Garanta `package.json` em `1.0.0`.
   - Atualize release notes em `CHANGELOG.md`.
   - Crie tag git `v1.0.0`.

Rollback básico:

- Se houver regressão em produção:
  1. Reverter para o deployment anterior na Vercel.
  2. Reverter o commit/tag localmente.
  3. Corrigir e publicar patch (`v1.0.1`).
