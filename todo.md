## Tarefas a serem realizadas:

- [ ] **Fase 1: Clonar e analisar o repositório**
  - [x] Clonar o repositório do GitHub.
  - [x] Listar arquivos e diretórios para entender a estrutura.

- [ ] **Fase 2: Analisar a estrutura do sistema e identificar problemas**
  - [x] Analisar `servico-social-controller.js` para entender a lógica de aprovação/reprovação e envio de WhatsApp.
  - [x] Analisar `detalhe.html` para identificar os elementos da interface do usuário relacionados ao serviço social.
  - [x] Analisar `aprovacao.html` para entender a interface de aprovação dos pais.
  - [x] Analisar `whatsapp-service.js` para identificar problemas na API do WhatsApp.

- [ ] **Fase 3: Corrigir o fluxo do serviço social e modificar botões**
  - [x] Modificar o botão "Definir Status" em `detalhe.html` para ter opções "Aprovar" e "Cancelar".
  - [x] Ajustar a lógica em `servico-social-controller.js` para refletir as novas opções do botão.

- [ ] **Fase 4: Corrigir a API do WhatsApp**
  - [x] Debugar e corrigir a função `enviarNotificacaoWhatsApp` em `notificacao-service.js` (ou `whatsapp-service.js` se a lógica estiver lá).
  - [x] Garantir que o mockup seja enviado corretamente para os pais.

- [ ] **Fase 5: Testar as modificações localmente**
  - [ ] Configurar um ambiente de teste.
  - [ ] Testar o fluxo completo de aprovação/cancelamento.
  - [ ] Testar o envio de mensagens via WhatsApp.

- [ ] **Fase 6: Fazer commit e push das mudanças**
  - [ ] Fazer commit das alterações.
  - [ ] Fazer push para o repositório do GitHub.



- [x] Corrigir erro de geração de PDF: Expor a função `gerarRelatorio` no `window.pdfService`.
- [x] Corrigir exibição de cores nos status do serviço social: Verificar e ajustar a lógica de aplicação de classes CSS nos arquivos `detalhe-servico-social-integrado.js` e `servico-social-controller.js`.

