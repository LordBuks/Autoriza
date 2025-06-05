# Checklist de Análise e Correção - Projeto Autoriza

Este arquivo acompanha o progresso da análise e correção dos problemas no projeto Autoriza.

## Etapas Planejadas:

*   [ ] 001: Clonar o repositório `Autoriza`.
*   [ ] 002: Analisar a estrutura do projeto e dependências.
*   [x] 003: Levantar os erros reportados para cada perfil.
*   [x] 004: Investigar e corrigir funções Firebase e integrações.
    *   [x] 4.1: Corrigir erro `TypeError: window.firebaseService.listarDocumentos is not a function` (Supervisor).
    *   [x] 4.2: Corrigir erro `net::ERR_FILE_NOT_FOUND` para `auditoria-service.js` (Serviço Social - verificar typo `autitoria-service.js`).
    *   [x] 4.3: Investigar falha ao carregar detalhes da solicitação (Monitor - "Solicitação não encontrada").    *   [x] 4.4: Revisar uso de `localStorage` na seção \'Arquivos\' (Monitor). (Revisado, mantido por ora - sugerir refatoração)*   [x] 005: Corrigir fluxo detalhe monitor para buscar do Firestore.
*   [x] 006: Validar visualização e fluxos para cada perfil após correções.
*   [x] 007: Consolidar checklist final de problemas e soluções aplicadas.

## Detalhamento dos Erros Identificados (Etapa 003):

1.  **Supervisor:**
    *   **Sintoma:** Não visualiza nenhuma autorização (listas vazias).
    *   **Erro Console:** `TypeError: window.firebaseService.listarDocumentos is not a function` em `autorizacao-service.js:185` (chamado por `supervisor.js:139`).
    *   **Arquivos Relevantes:** `js/supervisor.js`, `js/autorizacao-service.js`, `js/firebase-config.js`.
    *   **Hipótese:** Problema na disponibilidade/escopo da função `listarDocumentos` no objeto `firebaseService`.

2.  **Serviço Social:**
    *   **Sintoma:** Não visualiza autorizações; mensagem de erro sobre serviços indisponíveis.
    *   **Erro Console:** `net::ERR_FILE_NOT_FOUND` para `auditoria-service.js:1` e `Erro crítico: Serviços essenciais (Firebase, Auditoria, PDF) não estão disponíveis.` em `servico-social.js:19`.
    *   **Arquivos Relevantes:** `js/servico-social.js`, `templates/servico_social/dashboard.html` (ou onde `auditoria-service.js` é carregado), `js/autitoria-service.js` (nome correto?).
    *   **Hipótese:** Erro de digitação no nome do arquivo (`auditoria-service.js` vs `autitoria-service.js`) no HTML, impedindo o carregamento do script e a inicialização dos serviços.

3.  **Monitor:**
    *   **Sintoma 1:** Visualiza a lista geral de autorizações.
    *   **Info Console:** Carregamento bem-sucedido da lista (`Solicitações carregadas do Firestore`).
    *   **Sintoma 2:** Ao clicar em "Ver" detalhes, recebe "Solicitação não encontrada".
    *   **Erro Console:** Não explícito na imagem para esta ação, mas o sintoma indica falha.
    *   **Aviso Console:** Uso de `localStorage` para seção 'Arquivos' (`monitor.js:193`).
    *   **Arquivos Relevantes:** `js/monitor.js`, `templates/monitor/detalhe.html`, `js/autorizacao-service.js`.
    *   **Hipótese:** Falha na função que busca *uma* solicitação específica por ID para a tela de detalhes. O aviso sobre `localStorage` é um ponto de atenção secundário.

4.  **Atleta:**
    *   **Sintoma:** Envio de formulário e recebimento de código funcionam (segundo relato do usuário).
    *   **Status:** Aparentemente sem erros nesta funcionalidade.

