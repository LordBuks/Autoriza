# Sistema de Autorizações Digitais - SC Internacional

## Instruções para Implantação no Vercel

Este documento contém instruções para implantar corretamente o Sistema de Autorizações Digitais no Vercel.

### Problema de Erro 404

Se você estiver enfrentando o erro 404 (NOT_FOUND) ao acessar o site implantado no Vercel, isso geralmente ocorre devido a problemas na configuração do projeto. Os seguintes arquivos foram adicionados para resolver este problema:

1. **vercel.json** - Configuração específica para o Vercel que define as rotas e comportamentos
2. **package.json** - Arquivo que identifica o projeto como uma aplicação web
3. **.vercelignore** - Define quais arquivos não devem ser enviados para o Vercel

### Como Implantar no Vercel

1. **Preparação do Projeto**:
   - Certifique-se de que os arquivos `vercel.json` e `package.json` estão na raiz do projeto
   - Verifique se o arquivo `index.html` está na raiz do projeto

2. **Implantação**:
   - Acesse [vercel.com](https://vercel.com) e faça login
   - Clique em "New Project" e importe seu repositório
   - Na configuração do projeto:
     - **Framework Preset**: Selecione "Other"
     - **Root Directory**: Deixe em branco (ou selecione a pasta que contém o index.html)
     - **Build Command**: Deixe em branco ou use `npm run build`
     - **Output Directory**: Deixe em branco
   - Clique em "Deploy"

3. **Verificação**:
   - Após a implantação, verifique se o site está funcionando corretamente
   - Se ainda ocorrer o erro 404, verifique os logs de implantação no painel do Vercel

### Estrutura de Arquivos Importante

Certifique-se de que a estrutura de arquivos está correta:

```
/
├── index.html         # Página principal
├── vercel.json        # Configuração do Vercel
├── package.json       # Configuração do projeto
├── css/
│   └── styles.css     # Estilos CSS
└── js/
    └── ...            # Arquivos JavaScript
```

### Solução de Problemas

Se o erro persistir após a implantação:

1. Verifique os logs de implantação no painel do Vercel
2. Certifique-se de que o arquivo `index.html` está na raiz do projeto
3. Verifique se o arquivo `vercel.json` está configurado corretamente
4. Tente reimplantar o projeto após fazer as correções

---

Estas configurações devem resolver o problema de erro 404 no Vercel. Se precisar de mais ajuda, consulte a [documentação oficial do Vercel](https://vercel.com/docs).