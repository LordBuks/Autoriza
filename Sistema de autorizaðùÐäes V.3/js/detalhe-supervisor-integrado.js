// Integração com Firebase para detalhes da solicitação do supervisor
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar serviços necessários
  if (!window.firebaseService) {
    console.error("Firebase Service não encontrado!");
    alert("Erro crítico: Serviço Firebase não carregado.");
    return;
  }
  if (!window.notificacaoService) {
    console.warn("Serviço de notificação não encontrado! Notificações podem não funcionar.");
    // Continuar mesmo sem notificações, mas avisar
  }

  // Elementos da página
  const btnAprovar = document.getElementById("btn-aprovar");
  const btnReprovar = document.getElementById("btn-reprovar");
  const modalObservacao = document.getElementById("modal-observacao");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const txtObservacao = document.getElementById("observacao");

  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'

  // Obter ID da solicitação da URL
  const urlParams = new URLSearchParams(window.location.search);
  const idSolicitacao = urlParams.get("id");

  if (!idSolicitacao) {
    alert("ID da solicitação não fornecido. Redirecionando para o painel.");
    window.location.href = "dashboard.html";
    return;
  }

  // Carregar dados da solicitação do Firestore
  await carregarSolicitacao(idSolicitacao);

  // --- Event Listeners --- 
  if (btnAprovar) {
    btnAprovar.addEventListener("click", function () {
      if (solicitacaoAtual && solicitacaoAtual.status_supervisor !== 'Pendente') {
        alert("Esta solicitação já foi processada.");
        return;
      }
      acaoAtual = "aprovar";
      txtObservacao.value = ""; // Limpar observação anterior
      modalObservacao.style.display = "block";
    });
  }

  if (btnReprovar) {
    btnReprovar.addEventListener("click", function () {
       if (solicitacaoAtual && solicitacaoAtual.status_supervisor !== 'Pendente') {
        alert("Esta solicitação já foi processada.");
        return;
      }
      acaoAtual = "reprovar";
      txtObservacao.value = ""; // Limpar observação anterior
      modalObservacao.style.display = "block";
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async function () {
      const observacao = txtObservacao.value.trim();

      if (acaoAtual === "reprovar" && !observacao) {
        alert("É necessário fornecer um motivo (observação) para a reprovação.");
        return;
      }

      modalObservacao.style.display = "none"; // Fechar modal antes de processar

      if (acaoAtual === "aprovar") {
        await aprovarSolicitacao(observacao);
      } else if (acaoAtual === "reprovar") {
        await reprovarSolicitacao(observacao);
      }
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", function () {
      modalObservacao.style.display = "none";
    });
  }
  // --- Fim Event Listeners ---

  // Função para carregar os dados da solicitação do Firestore
  async function carregarSolicitacao(id) {
    console.log(`Carregando solicitação com ID: ${id}`);
    const resultado = await window.firebaseService.obterDocumento("solicitacoes", id);

    if (resultado.sucesso && resultado.dados) {
      solicitacaoAtual = resultado.dados;
      console.log("Solicitação carregada:", solicitacaoAtual);
      preencherDadosNaPagina(solicitacaoAtual);
    } else {
      console.error("Erro ao carregar solicitação:", resultado.erro);
      alert("Erro ao carregar dados da solicitação. Verifique o console ou tente novamente.");
      // Poderia redirecionar, mas é melhor mostrar o erro primeiro
      // window.location.href = 'dashboard.html';
    }
  }

  // Função para preencher os dados na página
  function preencherDadosNaPagina(solicitacao) {
    // Helper para preencher texto ou 'N/A' se vazio
    const setText = (id, value) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value || 'N/A';
      } else {
        console.warn(`Elemento com ID ${id} não encontrado.`);
      }
    };
    
    // Helper para formatar data (considerando que pode vir como string ou Timestamp do Firestore)
    const formatarDataFirestore = (dataValue) => {
        if (!dataValue) return 'N/A';
        let dataObj;
        // Verificar se é um Timestamp do Firestore
        if (dataValue && typeof dataValue.toDate === 'function') {
            dataObj = dataValue.toDate();
        } else {
            // Tentar converter de string (ISO ou outro formato)
            dataObj = new Date(dataValue);
        }
        // Verificar se a conversão foi válida
        if (isNaN(dataObj.getTime())) {
            return 'Data inválida';
        }
        return dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    setText("nome-atleta", solicitacao.nomeAtleta);
    setText("categoria-atleta", solicitacao.categoria);
    setText("data-nascimento", formatarDataFirestore(solicitacao.dataNascimento));
    setText("telefone-atleta", solicitacao.telefoneAtleta);

    setText("data-saida", formatarDataFirestore(solicitacao.dataSaida));
    setText("horario-saida", solicitacao.horarioSaida);
    setText("data-retorno", formatarDataFirestore(solicitacao.dataRetorno));
    setText("horario-retorno", solicitacao.horarioRetorno);
    setText("motivo-destino", solicitacao.motivoDestino);

    setText("nome-responsavel", solicitacao.nomeResponsavel);
    setText("telefone-responsavel", solicitacao.telefoneResponsavel);

    const statusAtualElement = document.getElementById("status-atual");
    const statusSupervisor = solicitacao.status_supervisor || 'Pendente'; // Default para Pendente se não existir
    statusAtualElement.textContent = statusSupervisor;

    // Ajustar a classe do badge e desabilitar botões
    statusAtualElement.className = 'badge'; // Reset class
    let desabilitarBotoes = false;
    if (statusSupervisor === "Aprovado") {
      statusAtualElement.classList.add("badge-approved");
      desabilitarBotoes = true;
    } else if (statusSupervisor === "Reprovado") {
      statusAtualElement.classList.add("badge-rejected");
      desabilitarBotoes = true;
    } else {
      statusAtualElement.classList.add("badge-pending");
    }

    if (btnAprovar) btnAprovar.disabled = desabilitarBotoes;
    if (btnReprovar) btnReprovar.disabled = desabilitarBotoes;

    setText("data-solicitacao", formatarDataFirestore(solicitacao.dataSolicitacao));
    
    // Informações do Dispositivo (se existirem)
    const deviceInfoElement = document.getElementById('device-info-content'); // Supondo que haja um elemento para isso
    if (deviceInfoElement && solicitacao.deviceInfo) {
        deviceInfoElement.textContent = JSON.stringify(solicitacao.deviceInfo, null, 2);
    } else if (deviceInfoElement) {
        deviceInfoElement.textContent = 'Informações não disponíveis';
    }
  }

  // Função para aprovar a solicitação no Firestore
  async function aprovarSolicitacao(observacao) {
    if (!solicitacaoAtual || !solicitacaoAtual.id) return;

    const updates = {
      status_supervisor: "Aprovado",
      observacao_supervisor: observacao || "", // Salva observação mesmo se vazia
      data_aprovacao_supervisor: new Date(), // Firestore salva como Timestamp
      // Não definir status_final aqui, isso é com o Serviço Social
    };

    console.log("Aprovando solicitação:", solicitacaoAtual.id, "com updates:", updates);
    const resultado = await window.firebaseService.atualizarDocumento(
      "solicitacoes",
      solicitacaoAtual.id,
      updates
    );

    if (resultado.sucesso) {
      console.log("Solicitação aprovada no Firestore.");
      // Enviar notificação ao serviço social (se o serviço estiver disponível)
      if (window.notificacaoService) {
        // Passar a solicitação atualizada (ou buscar novamente se necessário)
        const solicitacaoAtualizada = { ...solicitacaoAtual, ...updates }; 
        window.notificacaoService.enviarNotificacaoServicoSocial(solicitacaoAtualizada);
      } else {
        console.warn("Não foi possível enviar notificação: serviço indisponível.");
      }
      alert("Solicitação aprovada com sucesso!");
      window.location.reload(); // Recarregar para ver o status atualizado
    } else {
      console.error("Erro ao aprovar solicitação:", resultado.erro);
      alert("Erro ao aprovar a solicitação. Verifique o console ou tente novamente.");
    }
  }

  // Função para reprovar a solicitação no Firestore
  async function reprovarSolicitacao(observacao) {
    if (!solicitacaoAtual || !solicitacaoAtual.id) return;
    if (!observacao) {
        // Já validado no event listener, mas bom ter dupla checagem
        alert("Observação é obrigatória para reprovação.");
        return;
    }

    const updates = {
      status_supervisor: "Reprovado",
      observacao_supervisor: observacao,
      data_reprovacao_supervisor: new Date(), // Firestore salva como Timestamp
      status_final: "Reprovado", // Reprovação do supervisor é final
    };

    console.log("Reprovando solicitação:", solicitacaoAtual.id, "com updates:", updates);
    const resultado = await window.firebaseService.atualizarDocumento(
      "solicitacoes",
      solicitacaoAtual.id,
      updates
    );

    if (resultado.sucesso) {
      console.log("Solicitação reprovada no Firestore.");
      // Enviar notificação ao atleta (se o serviço estiver disponível)
      if (window.notificacaoService) {
         const solicitacaoAtualizada = { ...solicitacaoAtual, ...updates };
        window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada, "Reprovado");
      } else {
         console.warn("Não foi possível enviar notificação: serviço indisponível.");
      }
      alert("Solicitação reprovada.");
      window.location.reload(); // Recarregar para ver o status atualizado
    } else {
      console.error("Erro ao reprovar solicitação:", resultado.erro);
      alert("Erro ao reprovar a solicitação. Verifique o console ou tente novamente.");
    }
  }
});
