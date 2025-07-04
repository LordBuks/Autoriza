// Lógica para a tela de detalhe do supervisor (Refatorado para Firestore)
document.addEventListener("DOMContentLoaded", async function() { // Tornar a função principal assíncrona
    // Elementos da página
    const btnAcao = document.getElementById("btn-acao");
    const modalObservacao = document.getElementById("modal-observacao");
    const btnConfirmar = document.getElementById("btn-confirmar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const detalheContainer = document.getElementById("detalhe-solicitacao"); // Container principal para mostrar/ocultar
    const loadingIndicator = document.createElement("div"); // Criar indicador de loading dinamicamente
    loadingIndicator.id = "loading-indicator";
    loadingIndicator.textContent = "Carregando dados...";
    loadingIndicator.style.textAlign = "center";
    loadingIndicator.style.padding = "20px";
    loadingIndicator.style.display = "none"; // Começa oculto
    detalheContainer.parentNode.insertBefore(loadingIndicator, detalheContainer); // Inserir antes do container
  
    // Elementos da nova mensagem de alerta
    const alertMessageDiv = document.getElementById("alert-message");
    const alertTextSpan = document.getElementById("alert-text");
  
    // Variáveis de controle
    let solicitacaoAtual = null;
    let acaoAtual = null; // 'Aprovado' ou 'Reprovado' (usar os mesmos valores do serviço)
    let idSolicitacao = null;
  
    // Verificar dependências
    if (!window.AutorizacaoService || !window.firebaseService) {
        mostrarAlerta("Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis. A página não pode funcionar.", "alert-danger");
        if (detalheContainer) detalheContainer.style.display = "none"; // Ocultar interface
        return;
    }
  
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacao = urlParams.get("id");
  
    if (!idSolicitacao) {
      mostrarAlerta("ID da solicitação não fornecido na URL. Redirecionando para o painel.", "alert-warning");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 3000);
      return;
    }
  
    // --- Funções Auxiliares ---
  
    function setLoading(isLoading) {
        if (loadingIndicator) loadingIndicator.style.display = isLoading ? "block" : "none";
        if (detalheContainer) detalheContainer.style.display = isLoading ? "none" : "block"; // Ocultar/mostrar conteúdo
    }
  
    function mostrarAlerta(mensagem, tipo = "alert-info") {
        if (!alertMessageDiv || !alertTextSpan) return;

        alertTextSpan.textContent = mensagem;
        alertMessageDiv.className = `alert ${tipo}`;
        alertMessageDiv.style.display = "block";
    }
  
    function getBadgeClass(status) {
        switch (status) {
            case "Aprovado": return "bg-success"; // Usar classes Bootstrap 5
            case "Reprovado": return "bg-danger";
            default: return "bg-warning text-dark";
        }
    }
  
    function preencherDadosPagina(solicitacao) {
        if (!solicitacao) {
            mostrarAlerta("Não foi possível carregar os dados da solicitação.", "alert-danger");
            return;
        }
        document.getElementById("nome-atleta").textContent = solicitacao.nome || "N/A";
        document.getElementById("categoria-atleta").textContent = solicitacao.categoria || "N/A";
        document.getElementById("data-nascimento").textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento) || "N/A";
        document.getElementById("telefone-atleta").textContent = solicitacao.telefone || "N/A";
  
        document.getElementById("data-saida").textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida) || "N/A";
        document.getElementById("horario-saida").textContent = solicitacao.horario_saida || "N/A";
        document.getElementById("data-retorno").textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno) || "N/A";
        document.getElementById("horario-retorno").textContent = solicitacao.horario_retorno || "N/A";
        document.getElementById("motivo-destino").textContent = solicitacao.motivo_destino || "N/A";
  
        document.getElementById("nome-responsavel").textContent = solicitacao.nome_responsavel || "N/A";
        document.getElementById("telefone-responsavel").textContent = solicitacao.telefone_responsavel || "N/A";
  
        const infoDispositivo = document.getElementById("info-dispositivo");
        if (infoDispositivo && solicitacao.dispositivo) {
            infoDispositivo.innerHTML = `
                <p><strong>Plataforma:</strong> ${solicitacao.dispositivo.platform || "N/A"}</p>
                <p><strong>Navegador:</strong> ${solicitacao.dispositivo.userAgent ? solicitacao.dispositivo.userAgent.split(" ").pop() : "N/A"}</p>
                <p><strong>Data/Hora Envio:</strong> ${solicitacao.dispositivo.timestamp ? new Date(solicitacao.dispositivo.timestamp).toLocaleString("pt-BR") : "N/A"}</p>
            `;
            infoDispositivo.style.display = "block";
        } else if (infoDispositivo) {
            infoDispositivo.innerHTML = "<p>Informações não disponíveis</p>"; // Manter o parágrafo
            infoDispositivo.style.display = "block";
        }
  
        const statusAtualElement = document.getElementById("status-atual");
        const statusSupervisor = solicitacao.status_supervisor || "Pendente";
        if (statusAtualElement) {
            statusAtualElement.textContent = statusSupervisor;
            statusAtualElement.className = `badge ${getBadgeClass(statusSupervisor)}`; // Atualizar classe Bootstrap
        }
  
        const dataSolicitacaoElement = document.getElementById("data-solicitacao");
         if (dataSolicitacaoElement) {
             dataSolicitacaoElement.textContent = window.AutorizacaoService.formatarData(solicitacao.data_solicitacao) || "N/A";
         }
  
        // Lógica para o botão de ação
        if (btnAcao) {
            btnAcao.classList.remove("btn-primary", "btn-danger", "btn-success"); // Remover classes de cor existentes
            btnAcao.classList.add("btn-3d"); // Adicionar classe para estilo 3D

            if (statusSupervisor === "Aprovado") {
                btnAcao.textContent = "Reprovar Solicitação";
                btnAcao.classList.add("btn-danger"); // Cor vermelha para reprovar
            } else if (statusSupervisor === "Reprovado") {
                btnAcao.textContent = "Aprovar Solicitação";
                btnAcao.classList.add("btn-success"); // Cor verde para aprovar
            } else {
                // Se o status for pendente, pode-se decidir se exibe um botão para aprovar ou reprovar
                // Por enquanto, vamos manter o botão de aprovar como padrão para pendente
                btnAcao.textContent = "Aprovar Solicitação";
                btnAcao.classList.add("btn-primary"); // Cor padrão
            }
        }
    }
  
    // --- Lógica Principal ---
  
    // Carregar dados da solicitação (agora assíncrono)
    async function carregarSolicitacao(id) {
      setLoading(true);
      mostrarAlerta("Carregando dados da solicitação...", "alert-info");
      try {
        solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);
  
        if (!solicitacaoAtual) {
          mostrarAlerta("Solicitação não encontrada. Verifique o ID ou contate o suporte.", "alert-danger");
          if (btnAcao) btnAcao.disabled = true;
        } else {
          preencherDadosPagina(solicitacaoAtual);
          // Limpar alerta de carregamento (já feito pelo auto-hide)
        }
      } catch (error) {
        console.error("Erro ao carregar solicitação:", error);
        mostrarAlerta("Erro ao carregar dados da solicitação. Verifique o console.", "alert-danger");
        if (btnAcao) btnAcao.disabled = true;
      } finally {
        setLoading(false);
      }
    }
  
    // Função para aprovar/reprovar (agora assíncrona)
    async function atualizarStatusSolicitacao(novoStatus, observacao) {
      if (!solicitacaoAtual) {
          mostrarAlerta("Erro: Nenhuma solicitação carregada para atualizar.", "alert-danger");
          return;
      }
  
      setLoading(true); // Mostrar loading durante a atualização
      mostrarAlerta(`Atualizando status para ${novoStatus}...`, "alert-info");
  
      try {
        const resultado = await window.AutorizacaoService.atualizarStatus(
          solicitacaoAtual.id,
          "supervisor", // Perfil que está atualizando
          novoStatus,
          observacao
        );
  
        if (resultado.sucesso) {
          if (novoStatus === "Aprovado") {
            mostrarAlerta("Autorização validada com sucesso, atleta liberado!", "alert-success");
          } else if (novoStatus === "Reprovado") {
            mostrarAlerta("Solicitação reprovada com sucesso.", "alert-danger");
          }
          // Recarregar os dados da página para refletir a mudança
          solicitacaoAtual = resultado.solicitacao; // Atualiza a variável local com os dados retornados
          preencherDadosPagina(solicitacaoAtual);
        } else {
          mostrarAlerta(`Erro ao ${novoStatus.toLowerCase()} solicitação: ${resultado.mensagem || "Erro desconhecido."}`, "alert-danger");
        }
      } catch (error) {
          console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
          mostrarAlerta(`Erro técnico ao atualizar status. Verifique o console.`, "alert-danger");
      } finally {
          setLoading(false);
      }
    }
  
    // --- Configuração de Eventos ---
  
    if (btnAcao) {
        btnAcao.addEventListener("click", () => {
            if (btnAcao.disabled) return;
            const statusSupervisor = solicitacaoAtual.status_supervisor || "Pendente";
            if (statusSupervisor === "Aprovado") {
                acaoAtual = "Reprovado";
            } else if (statusSupervisor === "Reprovado") {
                acaoAtual = "Aprovado";
            } else {
                // Se for pendente, a ação padrão é aprovar
                acaoAtual = "Aprovado";
            }
            if (modalObservacao) modalObservacao.style.display = "block";
        });
    }
  
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", async () => { // Tornar o handler assíncrono
            const observacaoInput = document.getElementById("observacao");
            const observacao = observacaoInput ? observacaoInput.value.trim() : "";
  
            // Validação da observação para reprovação
            if (acaoAtual === "Reprovado" && !observacao) {
                alert("A observação é obrigatória ao reprovar."); // Usar alert simples para modal
                return;
            }
  
            if (modalObservacao) modalObservacao.style.display = "none";
            await atualizarStatusSolicitacao(acaoAtual, observacao); // Chamar a função assíncrona
            if (observacaoInput) observacaoInput.value = ""; // Limpar o campo
        });
    }
  
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            if (modalObservacao) modalObservacao.style.display = "none";
            const observacaoInput = document.getElementById("observacao");
            if (observacaoInput) observacaoInput.value = ""; // Limpar o campo
        });
    }
  
    // Fechar modal clicando fora (opcional)
    window.addEventListener("click", (event) => {
        if (modalObservacao && event.target == modalObservacao) {
            modalObservacao.style.display = "none";
        }
    });
  
    // --- Inicialização ---
    await carregarSolicitacao(idSolicitacao); // Carregar os dados ao iniciar
  
  });
  



