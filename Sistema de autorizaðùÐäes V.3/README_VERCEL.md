# Instruções para Resolver o Erro DEPLOYMENT_NOT_FOUND no Vercel

## Problema

O erro `DEPLOYMENT_NOT_FOUND` (404) ocorre quando o Vercel não consegue encontrar a implantação do projeto. Isso geralmente acontece devido a problemas na configuração do projeto ou no processo de build.

## Soluções Implementadas

As seguintes alterações foram feitas para resolver o problema:

### 1. Atualização do script de build no package.json

O script de build foi atualizado para usar comandos compatíveis com Windows, garantindo que os arquivos sejam copiados corretamente para o diretório `public`:

```json
"build": "echo Criando diretorio public e copiando arquivos && if not exist public mkdir public && xcopy /E /I /Y index.html public\ && xcopy /E /I /Y primeiro-acesso.html public\ && xcopy /E /I /Y Converter_Para_PDF.html public\ && xcopy /E /I /Y content.png public\ && xcopy /E /I /Y css public\css\ && xcopy /E /I /Y js public\js\ && xcopy /E /I /Y templates public\templates\"
```

### 2. Atualização do vercel.json

O arquivo `vercel.json` foi atualizado para incluir configurações mais específicas:

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "cleanUrls": true,
  "trailingSlash": false,
  "buildCommand": "npm run build",
  "outputDirectory": "public",
  "public": true
}
```

### 3. Adição de arquivos de configuração

Foram adicionados os seguintes arquivos:
- `.gitignore` - Para evitar que arquivos desnecessários sejam enviados para o Vercel
- `vercel.json.bak` - Arquivo de backup com a configuração completa

## Como Implantar no Vercel

1. **Preparação do Projeto**:
   - Certifique-se de que os arquivos `vercel.json` e `package.json` estão na raiz do projeto
   - Verifique se o arquivo `index.html` está na raiz do projeto

2. **Implantação**:
   - Acesse [vercel.com](https://vercel.com) e faça login
   - Clique em "New Project" e importe seu repositório
   - Na configuração do projeto:
     - **Framework Preset**: Selecione "Other"
     - **Root Directory**: Deixe em branco (ou selecione a pasta que contém o index.html)
     - **Build Command**: Deixe em branco (será usado o comando definido no vercel.json)
     - **Output Directory**: Deixe em branco (será usado o diretório definido no vercel.json)
   - Clique em "Deploy"

3. **Verificação**:
   - Após a implantação, verifique se o site está funcionando corretamente
   - Se ainda ocorrer o erro 404, verifique os logs de implantação no painel do Vercel

## Solução de Problemas Adicionais

Se o erro persistir após a implantação:

1. Verifique os logs de implantação no painel do Vercel para identificar erros específicos
2. Certifique-se de que o script de build está sendo executado corretamente
3. Verifique se o diretório `public` está sendo criado e se contém todos os arquivos necessários
4. Tente reimplantar o projeto após fazer as correções

---

Estas configurações devem resolver o problema de erro 404 (DEPLOYMENT_NOT_FOUND) no Vercel. Se precisar de mais ajuda, consulte a [documentação oficial do Vercel](https://vercel.com/docs).