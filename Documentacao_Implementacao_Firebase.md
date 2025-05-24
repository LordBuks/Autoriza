# Guia Detalhado de Implementação do Firebase no Sistema de Autorizações

## Introdução

Este documento fornece um guia passo a passo para implementar o banco de dados Firebase no Sistema de Autorizações Digitais. O guia é destinado a pessoas com pouco conhecimento técnico e assume que você já possui:

- Uma conta no GitHub
- A aplicação já hospedada na Vercel
- Uma conta no Firebase

## Índice

1. [Criando um Projeto no Firebase](#1-criando-um-projeto-no-firebase)
2. [Configurando o Firestore Database](#2-configurando-o-firestore-database)
3. [Configurando a Autenticação](#3-configurando-a-autenticação)
4. [Obtendo as Credenciais do Firebase](#4-obtendo-as-credenciais-do-firebase)
5. [Atualizando o Código da Aplicação](#5-atualizando-o-código-da-aplicação)
6. [Configurando Regras de Segurança](#6-configurando-regras-de-segurança)
7. [Testando a Implementação](#7-testando-a-implementação)
8. [Atualizando a Aplicação na Vercel](#8-atualizando-a-aplicação-na-vercel)
9. [Solução de Problemas Comuns](#9-solução-de-problemas-comuns)

## 1. Criando um Projeto no Firebase

### Passo 1: Acessar o Console do Firebase

1. Abra seu navegador e acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Faça login com sua conta Google (a mesma que você usa para acessar o Firebase)

### Passo 2: Criar um Novo Projeto

1. Clique no botão **"+ Adicionar projeto"**
2. Digite um nome para o projeto, por exemplo: "Sistema de Autorizações"
3. Clique em **"Continuar"**

### Passo 3: Configurar o Google Analytics (opcional)

1. Você pode habilitar o Google Analytics para seu projeto (recomendado)
2. Selecione **"Configurar Google Analytics"**
3. Escolha uma conta do Google Analytics ou crie uma nova
4. Clique em **"Criar projeto"**
5. Aguarde a criação do projeto (pode levar alguns segundos)
6. Quando aparecer **"Seu novo projeto está pronto"**, clique em **"Continuar"**

## 2. Configurando o Firestore Database

### Passo 1: Criar o Banco de Dados Firestore

1. No menu lateral esquerdo do console do Firebase, clique em **"Firestore Database"**
2. Clique no botão **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de produção"** (recomendado para aplicações reais)
4. Clique em **"Próxima"**
5. Selecione a região mais próxima de seus usuários (por exemplo, "us-east1" para América do Sul)
6. Clique em **"Ativar"**
7. Aguarde a criação do banco de dados (pode levar alguns minutos)

### Passo 2: Criar as Coleções Necessárias

O sistema utiliza as seguintes coleções principais:

1. No Firestore Database, clique em **"Iniciar coleção"**
2. Digite o ID da coleção: **"solicitacoes"**
3. Clique em **"Próxima"**
4. Você pode pular a criação do primeiro documento clicando em **"Cancelar"**
5. Repita os passos 1-4 para criar as seguintes coleções:
   - **"usuarios"**
   - **"confirmacoes"**
   - **"notificacoes"**
   - **"arquivos"**
   - **"emails_enviados"**

## 3. Configurando a Autenticação

### Passo 1: Habilitar a Autenticação por E-mail/Senha

1. No menu lateral esquerdo, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Na aba **"Sign-in method"**, clique em **"Email/Senha"**
4. Ative a opção **"Email/Senha"** (deixe a opção "Link de e-mail para login sem senha" desativada)
5. Clique em **"Salvar"**

### Passo 2: Criar Usuários para Teste

1. Na aba **"Usuários"**, clique em **"Adicionar usuário"**
2. Crie os seguintes usuários (substitua "dominio.com" pelo seu domínio real):
   - Email: **"atleta@dominio.com"**, Senha: escolha uma senha forte
   - Email: **"supervisor@dominio.com"**, Senha: escolha uma senha forte
   - Email: **"servico_social@dominio.com"**, Senha: escolha uma senha forte
   - Email: **"monitor@dominio.com"**, Senha: escolha uma senha forte

## 4. Obtendo as Credenciais do Firebase

### Passo 1: Registrar a Aplicação Web

1. Na página inicial do console do Firebase, clique no ícone **"</>"** (Adicionar aplicativo da Web)
2. Digite um apelido para o aplicativo, por exemplo: "Sistema de Autorizações Web"
3. Marque a opção **"Também configurar o Firebase Hosting para este app"** (opcional)
4. Clique em **"Registrar app"**

### Passo 2: Copiar as Credenciais

1. Após o registro, você verá um bloco de código com a configuração do Firebase
2. Copie o objeto `firebaseConfig` que contém as seguintes informações:
   ```javascript
   const firebaseConfig = {
     apiKey: "SUA_API_KEY",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto",
     storageBucket: "seu-projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
     measurementId: "G-ABCDEF123" // se o Google Analytics estiver habilitado
   };
   ```
3. Guarde essas informações em um local seguro, você precisará delas para configurar o código da aplicação

## 5. Atualizando o Código da Aplicação

### Passo 1: Baixar o Código da Aplicação do GitHub

1. Acesse seu repositório no GitHub
2. Clone o repositório para seu computador ou faça o download como ZIP
3. Extraia os arquivos para uma pasta de sua preferência

### Passo 2: Atualizar o Arquivo de Configuração do Firebase

1. Abra o arquivo `js/firebase-config.js` em um editor de texto (como Notepad, Visual Studio Code, etc.)
2. Localize o objeto `firebaseConfig` no início do arquivo
3. Substitua todo o conteúdo desse objeto pelas credenciais que você copiou anteriormente
4. Salve o arquivo

### Passo 3: Verificar as Dependências do Firebase

1. Abra o arquivo `index.html` e verifique se os scripts do Firebase estão sendo carregados corretamente:
   ```html
   <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
   ```
2. Verifique também se o arquivo de configuração está sendo carregado:
   ```html
   <script src="js/firebase-config.js"></script>
   ```

## 6. Configurando Regras de Segurança

### Passo 1: Acessar as Regras do Firestore

1. No console do Firebase, acesse **"Firestore Database"**
2. Clique na aba **"Regras"**

### Passo 2: Configurar Regras Básicas de Segurança

1. Substitua as regras existentes pelas seguintes:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Permitir acesso apenas para usuários autenticados
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
       
       // Regras específicas para a coleção de usuários
       match /usuarios/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
2. Clique em **"Publicar"**

## 7. Testando a Implementação

### Passo 1: Testar Localmente (Opcional)

1. Se você tiver um servidor web local, coloque os arquivos da aplicação nele
2. Abra a aplicação no navegador (geralmente em http://localhost ou http://127.0.0.1)
3. Tente fazer login com um dos usuários que você criou

### Passo 2: Verificar o Funcionamento do Firebase

1. Abra o console do navegador (pressione F12 e vá para a aba "Console")
2. Verifique se não há erros relacionados ao Firebase
3. Tente realizar as seguintes operações para testar:
   - Login com um usuário
   - Criar uma solicitação de autorização
   - Visualizar solicitações existentes

## 8. Atualizando a Aplicação na Vercel

### Passo 1: Fazer Upload do Código Atualizado para o GitHub

1. Faça commit das alterações no seu repositório local
2. Faça push para o repositório remoto no GitHub

### Passo 2: Reimplantar na Vercel

1. Acesse o dashboard da Vercel em [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá para a aba **"Deployments"**
4. Clique em **"Redeploy"** ou aguarde a implantação automática (se configurada)

### Passo 3: Configurar Variáveis de Ambiente (Opcional)

1. Na Vercel, vá para a aba **"Settings"** do seu projeto
2. Clique em **"Environment Variables"**
3. Adicione as credenciais do Firebase como variáveis de ambiente (para maior segurança)
4. Clique em **"Save"**

## 9. Solução de Problemas Comuns

### Problema: Erro de Autenticação

**Sintomas:** Não consegue fazer login, mensagens de erro como "Firebase: Error (auth/invalid-api-key)".

**Solução:**
1. Verifique se a `apiKey` no arquivo `firebase-config.js` está correta
2. Certifique-se de que o método de autenticação por e-mail/senha está habilitado no console do Firebase

### Problema: Erro ao Acessar o Firestore

**Sintomas:** Consegue fazer login, mas não consegue ler ou gravar dados, erros como "Missing or insufficient permissions".

**Solução:**
1. Verifique as regras de segurança do Firestore
2. Certifique-se de que o usuário está autenticado antes de tentar acessar o banco de dados
3. Verifique se o `projectId` no arquivo `firebase-config.js` está correto

### Problema: Aplicação Não Carrega os Scripts do Firebase

**Sintomas:** Erros no console como "Firebase is not defined" ou "Cannot read property 'initializeApp' of undefined".

**Solução:**
1. Verifique se os scripts do Firebase estão sendo carregados na ordem correta
2. Certifique-se de que não há bloqueadores de scripts no navegador
3. Verifique se as URLs dos scripts do Firebase estão corretas

---

## Conclusão

Parabéns! Você concluiu a implementação do Firebase no Sistema de Autorizações Digitais. Agora o sistema está utilizando um banco de dados em nuvem robusto e escalável, com autenticação segura para os usuários.

Se você encontrar algum problema não coberto neste guia, consulte a [documentação oficial do Firebase](https://firebase.google.com/docs) ou entre em contato com o suporte técnico.

---

**Nota:** Este documento foi criado em [DATA_ATUAL] e pode não refletir mudanças recentes na interface do Firebase ou na estrutura da aplicação. Consulte a documentação mais recente se necessário.