# Sistema de Autorizações - Vite + Vercel

Sistema de controle de autorizações adaptado para usar Vite e deploy no Vercel.

## 🚀 Instalação e Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure suas credenciais do Firebase:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
VITE_FIREBASE_API_KEY="sua_api_key_aqui"
VITE_FIREBASE_AUTH_DOMAIN="seu_auth_domain_aqui"
VITE_FIREBASE_PROJECT_ID="seu_project_id_aqui"
VITE_FIREBASE_STORAGE_BUCKET="seu_storage_bucket_aqui"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu_messaging_sender_id_aqui"
VITE_FIREBASE_APP_ID="seu_app_id_aqui"
VITE_FIREBASE_MEASUREMENT_ID="seu_measurement_id_aqui"
```

### 3. Executar em desenvolvimento
```bash
npm run dev
```

### 4. Build para produção
```bash
npm run build
```

### 5. Preview da build
```bash
npm run preview
```

## 📦 Deploy no Vercel

### Opção 1: Via CLI do Vercel
```bash
npm install -g vercel
vercel
```

### Opção 2: Via GitHub
1. Faça push do projeto para um repositório GitHub
2. Conecte o repositório no painel do Vercel
3. Configure as variáveis de ambiente no painel do Vercel
4. Deploy automático será feito a cada push

### Configuração de Variáveis no Vercel
No painel do Vercel, adicione as seguintes variáveis de ambiente:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 🔧 Principais Alterações

### 1. Package.json
- Configurado para usar Vite como bundler
- Adicionado Firebase como dependência
- Scripts de dev, build e preview

### 2. Firebase Config
- Atualizado para usar variáveis de ambiente do Vite (`import.meta.env.VITE_*`)
- Mantida compatibilidade com o código existente

### 3. HTML Files
- Todos os scripts locais agora usam `type="module"`
- Mantida compatibilidade com Firebase CDN

### 4. Vite Config
- Configuração básica para servir arquivos estáticos
- Porta 3000 para desenvolvimento

## 📁 Estrutura do Projeto

```
sistema-autorizacoes/
├── css/                    # Estilos CSS
├── js/                     # Scripts JavaScript
├── templates/              # Templates HTML
├── pais/                   # Páginas específicas
├── .env                    # Variáveis de ambiente (não commitado)
├── .env.example           # Exemplo de variáveis
├── vite.config.js         # Configuração do Vite
├── package.json           # Dependências e scripts
└── index.html             # Página principal
```

## 🛠️ Tecnologias

- **Vite** - Build tool e dev server
- **Firebase** - Backend e autenticação
- **Vanilla JavaScript** - Frontend (mantido original)
- **HTML/CSS** - Interface (mantida original)

## 📝 Notas Importantes

- O sistema mantém toda a funcionalidade original
- Compatível com deploy no Vercel
- Variáveis de ambiente seguras
- Hot reload em desenvolvimento
- Build otimizada para produção

