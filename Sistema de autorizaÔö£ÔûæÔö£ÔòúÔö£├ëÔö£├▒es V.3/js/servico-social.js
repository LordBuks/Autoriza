// Lógica para o painel do serviço social
document.addEventListener("DOMContentLoaded", async function() { // Adicionado async
  const solicitacoesPreAprovadasContainer = document.getElementById("solicitacoes-pre-aprovadas");
  const historicoValidacoesContainer = document.getElementById("historico-validacoes");
  const filtroStatusSelect = document.getElementById("filtro-status");
  const detalhesContainer = document.getElementById("detalhes-solicitacao"); // Container para detalhes
  
  // Elementos dos botões de ação (serão buscados quando os detalhes forem carregados)
  let btnEnviarLink;
  let btnStatusFinal;
  let btnGerarPdf;
  
  // Solicitação atual sendo visualizada
  let solicitacaoAtual = null;
  let todasSolicitacoesCache = []; // Cache para dados do Firestore

  // Verificar dependências
  if (!window.firebaseService || !window.auditoriaService || !window.pdfService) {
      console.error("Erro crítico: Serviços essenciais (Firebase, Auditoria, PDF) não estão disponíveis.");
      mostrarErro(solicitacoesPreAprovadasContainer, "Erro ao carregar serviços. Tente recarregar a página.");
      mostrarErro(historicoValidacoesContainer, "Erro ao carregar serviços.");
      return;
  }

  // --- Funções Auxiliares ---
  function mostrarLoading(container, mensagem = "Carregando...") {
      if (container) container.innerHTML = `<p class="text-center">${mensagem}</p>`;
  }

  function mostrarErro(container, mensagem) {
      if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
  }

  function formatarData(dataString) {
      if (!dataString) return "N/A";
      try {
          const data = new Date(dataString);
          if (isNaN(data.getTime())) return "Data inválida";
          return data.toLocaleDateString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric"
          });
      } catch (e) {
          return "Data inválida";
      }
  }

  function getStatusBadge(status, tipo = "final") {
      let statusText = status || (tipo === "final" ? "Em Análise" : "Pendente");
      let badgeClass = "bg-warning text-dark"; // Padrão

      if (statusText === "Aprovado" || statusText === "Autorizado") {
          badgeClass = "bg-success";
          statusText = "Aprovado";
      } else if (statusText === "Reprovado" || statusText === "Não Autorizado") {
          badgeClass = "bg-danger";
          statusText = "Reprovado";
      }
      return `<span class="badge ${badgeClass}">${statusText}</span>`;
  }

  function gerarToken() {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
  }

  // --- Funções Principais ---

  async function carregarTodasSolicitacoesDoFirestore() {
      mostrarLoading(solicitacoesPreAprovadasContainer, "Carregando solicitações...");
      mostrarLoading(historicoValidacoesContainer, "Carregando histórico...");
      try {
          const resultado = await window.firebaseService.obterDocumentos("solicitacoes");
          if (resultado.sucesso) {
              todasSolicitacoesCache = resultado.dados;
              console.log("Solicitações carregadas do Firestore para Serviço Social:", todasSolicitacoesCache);
              renderizarSolicitacoesPreAprovadas();
              renderizarHistoricoValidacoes(); // Renderiza com filtro inicial "todos"
          } else {
              throw new Error(resultado.erro || "Falha ao buscar solicitações.");
          }
      } catch (error) {
          console.error("Erro ao carregar solicitações do Firestore:", error);
          mostrarErro(solicitacoesPreAprovadasContainer, `Erro ao carregar: ${error.message}`);
          mostrarErro(historicoValidacoesContainer, `Erro ao carregar: ${error.message}`);
      }
  }

  function renderizarSolicitacoesPreAprovadas() {
      if (!solicitacoesPreAprovadasContainer) return;

      const preAprovadas = todasSolicitacoesCache.filter(s => 
          s.status_supervisor === "Aprovado" && 
          s.status_servico_social === "Pendente"
      );

      if (preAprovadas.length === 0) {
          solicitacoesPreAprovadasContainer.innerHTML = 
              `<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>`;
          return;
      }

      const html = preAprovadas.map(s => `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${s.nome || "N/A"} • ${s.categoria || "N/A"}</h5>
              <p class="card-text mb-1"><strong>Destino:</strong> ${s.motivo_destino || "N/A"}</p>
              <p class="card-text mb-1"><strong>Período:</strong> ${formatarData(s.data_saida)} ${s.horario_saida || ""} até ${formatarData(s.data_retorno)} ${s.horario_retorno || ""}</p>
              <p class="card-text"><strong>Responsável:</strong> ${s.nome_responsavel || "N/A"} - ${s.telefone_responsavel || "N/A"}</p>
              <button class="btn btn-primary mt-2 btn-visualizar" data-id="${s.id}">Ver Detalhes</button>
            </div>
          </div>
      `).join("");
      solicitacoesPreAprovadasContainer.innerHTML = html;

      // Adicionar eventos aos botões de visualização DESTA seção
      solicitacoesPreAprovadasContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
          btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
          btn.addEventListener("click", handleVisualizarClick);
      });
  }

  function renderizarHistoricoValidacoes() {
      if (!historicoValidacoesContainer) return;

      let historico = todasSolicitacoesCache.filter(s => 
          s.status_servico_social && s.status_servico_social !== "Pendente"
      );

      const filtro = filtroStatusSelect ? filtroStatusSelect.value : "todos";
      if (filtro !== "todos") {
          historico = historico.filter(s => {
              const statusServSoc = s.status_servico_social ? s.status_servico_social.toLowerCase() : "";
              if (filtro === "aprovado") return statusServSoc === "aprovado";
              if (filtro === "reprovado") return statusServSoc === "reprovado";
              return false;
          });
      }

      historico.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

      if (historico.length === 0) {
          historicoValidacoesContainer.innerHTML = 
              `<p class="text-center">Nenhum histórico encontrado com os filtros aplicados.</p>`;
          return;
      }

      const html = `
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Código</th>
              <th>Atleta</th>
              <th>Categoria</th>
              <th>Data Solicitação</th>
              <th>Status Serviço Social</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${historico.map(s => `
              <tr>
                <td>${s.id || "N/A"}</td>
                <td>${s.nome || "N/A"}</td>
                <td>${s.categoria || "N/A"}</td>
                <td>${formatarData(s.data_solicitacao)}</td>
                <td>${getStatusBadge(s.status_servico_social, "servico_social")}</td>
                <td><button class="btn btn-primary btn-sm btn-visualizar" data-id="${s.id}">Ver</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      historicoValidacoesContainer.innerHTML = html;

      // Adicionar eventos aos botões de visualização DESTA seção
      historicoValidacoesContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
          btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
          btn.addEventListener("click", handleVisualizarClick);
      });
  }

  function handleVisualizarClick() {
      const id = this.getAttribute("data-id");
      carregarDetalhesSolicitacao(id);
  }

  async function carregarDetalhesSolicitacao(id) {
      if (!detalhesContainer) return;
      mostrarLoading(detalhesContainer, "Carregando detalhes...");

      // Buscar a solicitação específica no Firestore (ou usar o cache se preferir)
      // É mais seguro buscar novamente para garantir dados atualizados
      try {
          const resultado = await window.firebaseService.obterDocumento("solicitacoes", id);
          if (!resultado.sucesso) {
              throw new Error(resultado.erro || "Solicitação não encontrada.");
          }
          solicitacaoAtual = resultado.dados;

          // Preencher os dados na seção de detalhes
          document.getElementById("solicitacao-id").textContent = solicitacaoAtual.id || "N/A";
          document.getElementById("nome-atleta").textContent = solicitacaoAtual.nome || "N/A";
          document.getElementById("categoria-atleta").textContent = solicitacaoAtual.categoria || "N/A";
          document.getElementById("telefone-atleta").textContent = solicitacaoAtual.telefone || "N/A";
          
          document.getElementById("nome-responsavel").textContent = solicitacaoAtual.nome_responsavel || "N/A";
          document.getElementById("telefone-responsavel").textContent = solicitacaoAtual.telefone_responsavel || "N/A";
          
          document.getElementById("data-saida").textContent = formatarData(solicitacaoAtual.data_saida);
          document.getElementById("horario-saida").textContent = solicitacaoAtual.horario_saida || "N/A";
          document.getElementById("data-retorno").textContent = formatarData(solicitacaoAtual.data_retorno);
          document.getElementById("horario-retorno").textContent = solicitacaoAtual.horario_retorno || "N/A";
          document.getElementById("motivo-destino").textContent = solicitacaoAtual.motivo_destino || "N/A";
          
          // Atualizar badges de status
          document.getElementById("status-supervisor").innerHTML = getStatusBadge(solicitacaoAtual.status_supervisor, "supervisor");
          document.getElementById("status-servico-social").innerHTML = getStatusBadge(solicitacaoAtual.status_servico_social, "servico_social");
          document.getElementById("status-final").innerHTML = getStatusBadge(solicitacaoAtual.status_final, "final");
          
          // Exibir o container de detalhes
          detalhesContainer.style.display = "block";
          
          // Configurar botões de ação (buscar elementos aqui para garantir que existam)
          btnEnviarLink = document.getElementById("btn-enviar-link");
          btnStatusFinal = document.getElementById("btn-status-final"); // Este botão pode não ser responsabilidade do Serviço Social
          btnGerarPdf = document.getElementById("btn-gerar-pdf");
          
          // Remover listeners antigos e adicionar novos
          if(btnEnviarLink) {
              btnEnviarLink.removeEventListener("click", enviarLinkPais);
              btnEnviarLink.addEventListener("click", enviarLinkPais);
          }
          // if(btnStatusFinal) { // Comentado - Provavelmente não é do Serviço Social
          //     btnStatusFinal.removeEventListener("click", definirStatusFinal);
          //     btnStatusFinal.addEventListener("click", definirStatusFinal);
          // }
          if(btnGerarPdf) {
              btnGerarPdf.removeEventListener("click", gerarRelatorioPdf);
              btnGerarPdf.addEventListener("click", gerarRelatorioPdf);
          }

          // Adicionar botões específicos do Serviço Social (Aprovar/Reprovar)
          const acoesServicoSocialContainer = document.getElementById("acoes-servico-social");
          if (acoesServicoSocialContainer) {
              // Limpar ações anteriores
              acoesServicoSocialContainer.innerHTML = ""; 
              // Adicionar botões apenas se o status do serviço social for pendente
              if (solicitacaoAtual.status_servico_social === "Pendente") {
                  const btnAprovar = document.createElement("button");
                  btnAprovar.className = "btn btn-success me-2";
                  btnAprovar.textContent = "Aprovar (Serviço Social)";
                  btnAprovar.onclick = () => atualizarStatusServicoSocial("Aprovado");
                  acoesServicoSocialContainer.appendChild(btnAprovar);

                  const btnReprovar = document.createElement("button");
                  btnReprovar.className = "btn btn-danger";
                  btnReprovar.textContent = "Reprovar (Serviço Social)";
                  btnReprovar.onclick = () => atualizarStatusServicoSocial("Reprovado");
                  acoesServicoSocialContainer.appendChild(btnReprovar);
              }
          }

      } catch (error) {
          console.error("Erro ao carregar detalhes da solicitação:", error);
          mostrarErro(detalhesContainer, `Erro ao carregar detalhes: ${error.message}`);
          solicitacaoAtual = null; // Limpa a solicitação atual em caso de erro
      }
  }

  async function atualizarStatusServicoSocial(novoStatus) {
      if (!solicitacaoAtual || !solicitacaoAtual.id) {
          alert("Nenhuma solicitação selecionada para atualizar.");
          return;
      }

      const observacao = prompt(`Digite uma observação para ${novoStatus} (opcional):`);
      
      const dadosAtualizacao = {
          status_servico_social: novoStatus,
          data_validacao_servico_social: new Date().toISOString(),
          // Poderíamos adicionar a observação aqui também se necessário
          // observacao_servico_social: observacao
      };

      // Determinar o status final baseado na aprovação do serviço social
      // Assumindo que a aprovação do supervisor já ocorreu (pois está na lista pré-aprovada)
      dadosAtualizacao.status_final = (novoStatus === "Aprovado") ? "Autorizado" : "Não Autorizado";

      try {
          mostrarLoading(detalhesContainer, "Atualizando status...");
          const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);

          if (resultado.sucesso) {
              alert(`Solicitação ${novoStatus.toLowerCase()} pelo Serviço Social com sucesso!`);
              // Registrar auditoria
              if (window.auditoriaService) {
                  window.auditoriaService.registrarAprovacaoServicoSocial(
                      solicitacaoAtual.id,
                      novoStatus,
                      observacao || ""
                  ).catch(err => console.error("Erro ao registrar auditoria Serv. Social:", err));
              }
              // Recarregar tudo para refletir as mudanças nas listas
              await carregarTodasSolicitacoesDoFirestore(); 
              // Recarregar detalhes da solicitação atual para mostrar status atualizado
              await carregarDetalhesSolicitacao(solicitacaoAtual.id); 
          } else {
              throw new Error(resultado.erro || "Falha ao atualizar status.");
          }
      } catch (error) {
          console.error("Erro ao atualizar status do Serviço Social:", error);
          alert(`Erro ao atualizar status: ${error.message}`);
          // Recarregar detalhes para mostrar o estado anterior em caso de falha
          await carregarDetalhesSolicitacao(solicitacaoAtual.id); 
      }
  }

  // --- Funções de Ação (mantidas, mas podem precisar de revisão/integração com Firestore) ---
  async function enviarLinkPais() {
      if (!solicitacaoAtual || !solicitacaoAtual.id) return;
      
      const numeroTelefone = solicitacaoAtual.telefone_responsavel;
      if (!numeroTelefone) {
          alert("Número de telefone do responsável não encontrado.");
          return;
      }

      // Gerar link único para aprovação dos pais (esta lógica pode precisar ir para o backend/Cloud Functions)
      const token = gerarToken(); 
      const linkAprovacao = `${window.location.origin}/pais/aprovacao.html?id=${solicitacaoAtual.id}&token=${token}`;
      
      // Salvar o token no Firestore junto com a solicitação para validação posterior
      try {
          await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, { token_aprovacao_pais: token });
      } catch (error) {
          alert("Erro ao salvar token de aprovação. Não foi possível gerar o link.");
          return;
      }

      const mensagem = `Olá ${solicitacaoAtual.nome_responsavel || "Responsável"}, o atleta ${solicitacaoAtual.nome || ""} solicitou autorização para sair. Por favor, acesse o link para aprovar ou reprovar: ${linkAprovacao}`;
      console.log("Mensagem para WhatsApp:", mensagem);
      
      // Registrar evento de auditoria
      try {
          const resultadoAuditoria = await window.auditoriaService.registrarEnvioLinkPais(
              solicitacaoAtual.id,
              numeroTelefone,
              "WhatsApp"
          );
          if (resultadoAuditoria.sucesso) {
              alert("Link de aprovação gerado e registrado. Abra o WhatsApp para enviar.");
              const whatsappUrl = `https://wa.me/${numeroTelefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
              window.open(whatsappUrl, "_blank");
          } else {
              throw new Error(resultadoAuditoria.erro || "Falha ao registrar auditoria.");
          }
      } catch (error) {
          console.error("Erro no processo de envio do link:", error);
          alert(`Erro ao enviar link: ${error.message}`);
      }
  }

  // Esta função provavelmente não pertence ao Serviço Social
  // async function definirStatusFinal() { ... }

  async function gerarRelatorioPdf() {
      if (!solicitacaoAtual || !solicitacaoAtual.id) return;
      
      try {
          const resultado = await window.pdfService.gerarRelatorioPdf(solicitacaoAtual.id);
          if (resultado.sucesso) {
              alert("PDF gerado com sucesso! O arquivo será baixado automaticamente.");
              // O download deve ser tratado pela função do pdfService
          } else {
              throw new Error(resultado.erro || "Falha ao gerar PDF.");
          }
      } catch (error) {
          console.error("Erro ao gerar PDF:", error);
          alert(`Erro ao gerar PDF: ${error.message}`);
      }
  }

  // --- Inicialização e Eventos ---

  // Adicionar listener para o filtro de status do histórico
  if (filtroStatusSelect) {
      filtroStatusSelect.addEventListener("change", renderizarHistoricoValidacoes);
  }

  // Carregar os dados iniciais do Firestore
  await carregarTodasSolicitacoesDoFirestore();

});

