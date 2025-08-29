# Deploy no Vercel (Vite + Firebase v9 modular)

## Passo a passo
1. Crie o arquivo `.env.local` (ou configure variáveis no Vercel) com base em `.env.example`.
2. Instale as dependências: `npm install`
3. Cheque tipos: `npm run typecheck`
4. Build: `npm run build`
5. Deploy: conecte o repositório ao Vercel. Framework: **Vite**. Caminho de build: `dist`.

## Notas da migração
- Foi criado `js/firebase-compat-shim.ts` que expõe `window.firebase` usando a API modular (v9) por baixo dos panos.
- Arquivos que ainda usam `firebase.*` continuam funcionando sem alterar o layout/markup.
- Serviços que já importavam `auth`, `db`, `storage` passaram a usar o path correto `../src/firebase`.

## Emuladores (opcional)
- Se quiser, é possível habilitar emuladores localmente ajustando `src/firebase.ts`.
