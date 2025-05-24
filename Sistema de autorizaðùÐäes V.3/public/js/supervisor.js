/**
 * Controlador de Supervisor - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de supervisor (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações (agora assíncrono).
 */

const SupervisorController = (function() {
  // Elementos da interface
  let btnAprovar;
  let btnReprovar;
  let modalObservacao;
  let btnConfirmar;
  let btnCancelar;
  let loadingIndicator; // Adicionar um indicador de carregamento
  let alertContainer; // Container para mensagens de alerta

  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'
  let idSolicitacaoAtual = null;

  // Inicialização do controlador
  async function inicializar() {
    console.log("SupervisorController inicializando...");
    // Capturar elementos do DOM
    btnAprovar = document.getElementById("btn-aprovar");
    btnReprovar = document.getElementById("btn-reprovar");
    modalObservacao = document.getElementById("modal-observacao");
    btnConfirmar = document.getElementById("btn-confirmar");
    btnCancelar = document.getElementById("btn-cancelar");
    loadingIndicator = document.getElementById("loading-indicator"); // Assumindo que existe um <div id="loading-indicator">...</div>
    alertContainer = document.getElementById("alert-container"); // Assumindo que existe um <div id="alert-container"></div>

    // Verificar se estamos na página correta (detalhe do supervisor)
    if (!btnAprovar && !btnReprovar) {
        console.log("Não estamos na página de detalhe do supervisor.");
        return;
    }

    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacaoAtual = urlParams.get("id");

    if (!idSolicitacaoAtual) {
      mostrarAlerta("ID da solicitação não fornecido na URL.", "alert-danger");
      // Opcional: redirecionar ou desabilitar a interface
      // window.location.href = 'dashboard.html'; 
      return;
    }

    // Carregar dados da solicitação (agora assíncrono)
    await carregarSolicitacao(idSolicitacaoAtual);

    // Configurar eventos
    configurarEventos();
    console.log("SupervisorController inicializado.");
  }

  // Função para mostrar/ocultar indicador de carregamento
  function setLoading(isLoading) {
      if (loadingIndicator) {
          loadingIndicator.style.display = isLoading ? 'block' : 'none';
      }
  }

  // Função para exibir alertas
  function mostrarAlerta(mensagem, tipo) {
      if (!alertContainer) {
          console.error("Elemento 'alert-container' não encontrado!");
          alert(mensagem); // Fallback
          return;
      }
      alertContainer.innerHTML = `<div class="alert ${tipo} alert-dismissible fade show" role="alert">
                                    ${mensagem}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                  </div>`;
      alertContainer.style.display = 'block';
  }

  // Função para carregar os dados da solicitação (assíncrona)
  async function carregarSolicitacao(id) {
    setLoading(true);
    mostrarAlerta("Carregando dados da solicitação...", "alert-info");
    try {
      // Usar o serviço de autorização (assíncrono) para buscar a solicitação
      solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);

      if (!solicitacaoAtual) {
        mostrarAlerta("Solicitação não encontrada.", "alert-danger");
        // Desabilitar botões se a solicitação não for encontrada
        if (btnAprovar) btnAprovar.disabled = true;
        if (btnReprovar) btnReprovar.disabled = true;
        setLoading(false);
        return;
      }

      // Preencher os dados na página
      preencherDadosPagina(solicitacaoAtual);
      mostrarAlerta("Dados carregados.", "alert-success"); // Limpa alerta anterior
      setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 2000); // Esconde após 2s

    } catch (error) {
      console.error("Erro ao carregar solicitação:", error);
      mostrarAlerta("Erro ao carregar dados da solicitação. Verifique o console.", "alert-danger");
      // Desabilitar interface em caso de erro grave
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para preencher os dados na página
  function preencherDadosPagina(solicitacao) {
      document.getElementById('nome-atleta').textContent = solicitacao.nome || 'N/A';
      document.getElementById('categoria-atleta').textContent = solicitacao.categoria || 'N/A';
      document.getElementById('data-nascimento').textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento) || 'N/A';
      document.getElementById('telefone-atleta').textContent = solicitacao.telefone || 'N/A';
      
      document.getElementById('data-saida').textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida) || 'N/A';
      document.getElementById('horario-saida').textContent = solicitacao.horario_saida || 'N/A';
      document.getElementById('data-retorno').textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno) || 'N/A';
      document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno || 'N/A';
      document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino || 'N/A';
      
      document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel || 'N/A';
      document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel || 'N/A';
      
      // Exibir informações do dispositivo se disponíveis
      const infoDispositivo = document.getElementById('info-dispositivo');
      if (infoDispositivo && solicitacao.dispositivo) {
          infoDispositivo.innerHTML = `
              <p><strong>Plataforma:</strong> ${solicitacao.dispositivo.platform || 'N/A'}</p>
              <p><strong>Navegador:</strong> ${solicitacao.dispositivo.userAgent ? solicitacao.dispositivo.userAgent.split(' ').pop() : 'N/A'}</p>
              <p><strong>Data/Hora Envio:</strong> ${solicitacao.dispositivo.timestamp ? new Date(solicitacao.dispositivo.timestamp).toLocaleString('pt-BR') : 'N/A'}</p>
          `;
          infoDispositivo.style.display = 'block';
      } else if (infoDispositivo) {
          infoDispositivo.style.display = 'none';
      }
      
      const statusAtual = document.getElementById('status-atual');
      if (statusAtual) {
          statusAtual.textContent = solicitacao.status_supervisor || 'Pendente';
          statusAtual.className = `badge ${getBadgeClass(solicitacao.status_supervisor)}`;
      }

      // Mostrar observação atual se existir
      const containerObservacao = document.getElementById('container-observacao');
      const observacaoAtualElement = document.getElementById('observacao-atual');
      if (containerObservacao && observacaoAtualElement) {
          if (solicitacao.observacao_supervisor) {
              observacaoAtualElement.textContent = solicitacao.observacao_supervisor;
              containerObservacao.style.display = 'block';
          } else {
              containerObservacao.style.display = 'none';
          }
      }
      
      // Desabilitar botões se já houver uma decisão do supervisor
      if (solicitacao.status_supervisor !== 'Pendente') {
          if (btnAprovar) btnAprovar.disabled = true;
          if (btnReprovar) btnReprovar.disabled = true;
          if (btnAprovar) btnAprovar.textContent = `Status: ${solicitacao.status_supervisor}`; // Informa o status no botão
          if (btnReprovar) btnReprovar.style.display = 'none'; // Esconde o outro botão
      } else {
          if (btnAprovar) btnAprovar.disabled = false;
          if (btnReprovar) btnReprovar.disabled = false;
          if (btnAprovar) btnAprovar.textContent = 'Aprovar';
          if (btnReprovar) btnReprovar.style.display = 'inline-block'; 
      }
  }

  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
      switch (status) {
          case 'Aprovado': return 'bg-success';
          case 'Reprovado': return 'bg-danger';
          default: return 'bg-warning text-dark'; // Melhor contraste para amarelo
      }
  }

  // Configurar eventos dos botões e modal
  function configurarEventos() {
      if (btnAprovar) {
          btnAprovar.addEventListener('click', () => {
              if (btnAprovar.disabled) return;
              acaoAtual = 'Aprovado';
              abrirModalObservacao();
          });
      }

      if (btnReprovar) {
          btnReprovar.addEventListener('click', () => {
              if (btnReprovar.disabled) return;
              acaoAtual = 'Reprovado';
              abrirModalObservacao();
          });
      }

      if (btnConfirmar) {
          btnConfirmar.addEventListener('click', async () => {
              const observacaoInput = document.getElementById('observacao');
              const observacao = observacaoInput ? observacaoInput.value.trim() : '';
              
              // Validação simples da observação para reprovação
              if (acaoAtual === 'Reprovado' && !observacao) {
                  alert('A observação é obrigatória ao reprovar.');
                  return;
              }

              fecharModalObservacao();
              await atualizarStatusSolicitacao(acaoAtual, observacao);
              if(observacaoInput) observacaoInput.value = ''; // Limpa o campo após uso
          });
      }

      if (btnCancelar) {
          btnCancelar.addEventListener('click', () => {
              fecharModalObservacao();
              const observacaoInput = document.getElementById('observacao');
              if(observacaoInput) observacaoInput.value = ''; // Limpa o campo ao cancelar
          });
      }

      // Fechar modal clicando fora (opcional)
      window.addEventListener('click', (event) => {
          if (modalObservacao && event.target == modalObservacao) {
              fecharModalObservacao();
          }
      });
  }

  function abrirModalObservacao() {
      if (modalObservacao) {
          // Pré-popular observação se já existir?
          // const observacaoInput = document.getElementById('observacao');
          // if(observacaoInput && solicitacaoAtual && solicitacaoAtual.observacao_supervisor) {
          //     observacaoInput.value = solicitacaoAtual.observacao_supervisor;
          // }
          modalObservacao.style.display = 'block';
      }
  }

  function fecharModalObservacao() {
      if (modalObservacao) {
          modalObservacao.style.display = 'none';
      }
  }

  // Função para aprovar/reprovar solicitação (assíncrona)
  async function atualizarStatusSolicitacao(novoStatus, observacao) {
    if (!solicitacaoAtual) {
        mostrarAlerta("Erro: Nenhuma solicitação carregada.", "alert-danger");
        return;
    }

    setLoading(true);
    mostrarAlerta(`Atualizando status para ${novoStatus}...`, "alert-info");

    try {
      // Usar o serviço de autorização (assíncrono) para atualizar o status
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        'supervisor',
        novoStatus,
        observacao
      );

      if (resultado.sucesso) {
        mostrarAlerta(`Solicitação ${novoStatus.toLowerCase()} com sucesso!`, "alert-success");
        // Recarregar os dados da página para refletir a mudança
        solicitacaoAtual = resultado.solicitacao; // Atualiza a variável local
        preencherDadosPagina(solicitacaoAtual);
        // Opcional: recarregar a página inteira: window.location.reload();
      } else {
        mostrarAlerta(`Erro ao ${novoStatus.toLowerCase()} solicitação: ${resultado.mensagem}`, "alert-danger");
      }
    } catch (error) {
        console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
        mostrarAlerta(`Erro técnico ao atualizar status. Verifique o console.`, "alert-danger");
    } finally {
        setLoading(false);
        // Esconde a mensagem de sucesso/erro após alguns segundos
        setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 5000);
    }
  }

  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  // Garante que o firebaseService esteja pronto (se ele inicializar de forma assíncrona)
  // Se firebaseService for global e síncrono, isso pode não ser necessário,
  // mas é uma boa prática esperar por dependências.
  if (window.firebaseService) {
      SupervisorController.inicializar();
  } else {
      // Tenta inicializar um pouco depois, caso o firebase-config.js carregue depois
      console.warn("firebaseService não encontrado imediatamente. Tentando inicializar em 500ms...");
      setTimeout(() => {
          if (window.firebaseService) {
              SupervisorController.inicializar();
          } else {
              console.error("Falha ao inicializar SupervisorController: firebaseService não disponível.");
              alert("Erro crítico: Não foi possível conectar ao serviço de dados. Funcionalidades do supervisor podem não funcionar.");
          }
      }, 500);
  }
});

