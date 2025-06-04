/**
 * Controlador de Serviço Social - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de serviço social (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações (agora assíncrono).
 */

const ServicoSocialController = (function() {
  // Elementos da interface
  let btnAprovar;
  let btnReprovar;
  let modalObservacao;
  let btnConfirmar;
  let btnCancelar;
  let loadingIndicator; // Indicador de carregamento
  let alertContainer; // Container para mensagens de alerta

  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'Aprovado' ou 'Reprovado'
  let idSolicitacaoAtual = null;

  // Inicialização do controlador
  async function inicializar() {
    console.log("ServicoSocialController inicializando...");
    // Capturar elementos do DOM
    btnAprovar = document.getElementById("btn-aprovar");
    btnReprovar = document.getElementById("btn-reprovar");
    modalObservacao = document.getElementById("modal-observacao");
    btnConfirmar = document.getElementById("btn-confirmar");
    btnCancelar = document.getElementById("btn-cancelar");
    loadingIndicator = document.getElementById("loading-indicator");
    alertContainer = document.getElementById("alert-container");

    // Verificar se estamos na página correta (detalhe do serviço social)
    if (!btnAprovar && !btnReprovar) {
        console.log("Não estamos na página de detalhe do Serviço Social.");
        return;
    }

    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacaoAtual = urlParams.get("id");

    if (!idSolicitacaoAtual) {
      mostrarAlerta("ID da solicitação não fornecido na URL.", "alert-danger");
      return;
    }

    // Carregar dados da solicitação (agora assíncrono)
    await carregarSolicitacao(idSolicitacaoAtual);

    // Configurar eventos
    configurarEventos();
    console.log("ServicoSocialController inicializado.");
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
      solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);

      if (!solicitacaoAtual) {
        mostrarAlerta("Solicitação não encontrada.", "alert-danger");
        if (btnAprovar) btnAprovar.disabled = true;
        if (btnReprovar) btnReprovar.disabled = true;
        setLoading(false);
        return;
      }

      // Preencher os dados na página
      preencherDadosPagina(solicitacaoAtual);
      mostrarAlerta("Dados carregados.", "alert-success");
      setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 2000);

    } catch (error) {
      console.error("Erro ao carregar solicitação:", error);
      mostrarAlerta("Erro ao carregar dados da solicitação. Verifique o console.", "alert-danger");
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
      
      // Verificar status do supervisor
      const statusSupervisor = document.getElementById('status-supervisor');
      if (statusSupervisor) {
          statusSupervisor.textContent = solicitacao.status_supervisor || 'Pendente';
          statusSupervisor.className = `badge ${getBadgeClass(solicitacao.status_supervisor)}`;
      }
      
      // Exibir status atual do serviço social
      const statusAtual = document.getElementById('status-atual');
      if (statusAtual) {
          statusAtual.textContent = solicitacao.status_servico_social || 'Pendente';
          statusAtual.className = `badge ${getBadgeClass(solicitacao.status_servico_social)}`;
      }

      // Mostrar observação do supervisor se existir
      const containerObsSup = document.getElementById('container-observacao-supervisor');
      const obsSupElement = document.getElementById('observacao-supervisor');
      if (containerObsSup && obsSupElement) {
          if (solicitacao.observacao_supervisor) {
              obsSupElement.textContent = solicitacao.observacao_supervisor;
              containerObsSup.style.display = 'block';
          } else {
              containerObsSup.style.display = 'none';
          }
      }

      // Mostrar observação atual do serviço social se existir
      const containerObservacao = document.getElementById('container-observacao');
      const observacaoAtualElement = document.getElementById('observacao-atual');
      if (containerObservacao && observacaoAtualElement) {
          if (solicitacao.observacao_servico_social) {
              observacaoAtualElement.textContent = solicitacao.observacao_servico_social;
              containerObservacao.style.display = 'block';
          } else {
              containerObservacao.style.display = 'none';
          }
      }
      
      // Desabilitar botões se:
      // 1. O supervisor já reprovou
      // 2. O serviço social já tomou uma decisão
      const supervisorReprovou = solicitacao.status_supervisor === 'Reprovado';
      const servicoSocialDecidiu = solicitacao.status_servico_social !== 'Pendente';

      if (supervisorReprovou || servicoSocialDecidiu) {
          if (btnAprovar) btnAprovar.disabled = true;
          if (btnReprovar) btnReprovar.disabled = true;
          
          if (supervisorReprovou && btnAprovar) {
              btnAprovar.textContent = 'Reprovado pelo Supervisor';
              btnAprovar.classList.add('btn-danger'); // Indica visualmente
              btnAprovar.classList.remove('btn-success');
          } else if (servicoSocialDecidiu && btnAprovar) {
              btnAprovar.textContent = `Status: ${solicitacao.status_servico_social}`;
          }
          if (btnReprovar) btnReprovar.style.display = 'none';

      } else {
          // Habilitar botões se o supervisor aprovou ou está pendente E o serviço social está pendente
          if (btnAprovar) btnAprovar.disabled = false;
          if (btnReprovar) btnReprovar.disabled = false;
          if (btnAprovar) {
              btnAprovar.textContent = 'Aprovar';
              btnAprovar.classList.remove('btn-danger');
              btnAprovar.classList.add('btn-success');
          }
          if (btnReprovar) btnReprovar.style.display = 'inline-block'; 
      }
  }

  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
      switch (status) {
          case 'Aprovado': return 'bg-success';
          case 'Reprovado': return 'bg-danger';
          case 'Pendente': return 'bg-secondary';
          default: return 'bg-warning text-dark'; // Em Análise ou outros
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
              
              if (acaoAtual === 'Reprovado' && !observacao) {
                  alert('A observação é obrigatória ao reprovar.');
                  return;
              }

              fecharModalObservacao();
              await atualizarStatusSolicitacao(acaoAtual, observacao);
              if(observacaoInput) observacaoInput.value = '';
          });
      }

      if (btnCancelar) {
          btnCancelar.addEventListener('click', () => {
              fecharModalObservacao();
              const observacaoInput = document.getElementById('observacao');
              if(observacaoInput) observacaoInput.value = '';
          });
      }

      window.addEventListener('click', (event) => {
          if (modalObservacao && event.target == modalObservacao) {
              fecharModalObservacao();
          }
      });
  }

  function abrirModalObservacao() {
      if (modalObservacao) {
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
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        'servico_social', // Perfil correto
        novoStatus,
        observacao
      );

      if (resultado.sucesso) {
        mostrarAlerta(`Solicitação ${novoStatus.toLowerCase()} com sucesso!`, "alert-success");
        solicitacaoAtual = resultado.solicitacao; // Atualiza a variável local
        preencherDadosPagina(solicitacaoAtual); // Recarrega dados na página
      } else {
        mostrarAlerta(`Erro ao ${novoStatus.toLowerCase()} solicitação: ${resultado.mensagem}`, "alert-danger");
      }
    } catch (error) {
        console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
        mostrarAlerta(`Erro técnico ao atualizar status. Verifique o console.`, "alert-danger");
    } finally {
        setLoading(false);
        setTimeout(() => { if (alertContainer) alertContainer.style.display = 'none'; }, 5000);
    }
  }

  // Funções que estavam no código original mas parecem não ser usadas aqui 
  // (aprovarSolicitacao, reprovarSolicitacao, enviarWhatsApp, obterSolicitacao, carregarSolicitacoes, atualizarInterface)
  // Foram substituídas pela lógica integrada em inicializar, carregarSolicitacao e atualizarStatusSolicitacao.
  // Removê-las ou mantê-las comentadas.

  // API pública
  return {
    inicializar: inicializar
    // Não expor funções internas como aprovarSolicitacao, etc.
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  if (window.firebaseService && window.AutorizacaoService) {
      ServicoSocialController.inicializar();
  } else {
      console.warn("firebaseService ou AutorizacaoService não encontrado imediatamente. Tentando inicializar em 500ms...");
      setTimeout(() => {
          if (window.firebaseService && window.AutorizacaoService) {
              ServicoSocialController.inicializar();
          } else {
              console.error("Falha ao inicializar ServicoSocialController: dependências não disponíveis.");
              alert("Erro crítico: Não foi possível conectar aos serviços de dados. Funcionalidades do serviço social podem não funcionar.");
          }
      }, 500);
  }
});

