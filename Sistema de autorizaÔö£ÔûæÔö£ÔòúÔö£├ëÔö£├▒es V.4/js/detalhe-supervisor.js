// Lógica para a tela de detalhe do supervisor (Refatorado para Firestore)
document.addEventListener('DOMContentLoaded', async function() { // Tornar a função principal assíncrona
    // Elementos da página
    const btnAprovar = document.getElementById('btn-aprovar');
    const btnReprovar = document.getElementById('btn-reprovar');
    const modalObservacao = document.getElementById('modal-observacao');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const detalheContainer = document.getElementById('detalhe-solicitacao'); // Container principal para mostrar/ocultar
    const loadingIndicator = document.createElement('div'); // Criar indicador de loading dinamicamente
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = 'Carregando dados...';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.display = 'none'; // Começa oculto
    detalheContainer.parentNode.insertBefore(loadingIndicator, detalheContainer); // Inserir antes do container
  
    const alertContainer = document.createElement('div'); // Criar container de alerta dinamicamente
    alertContainer.id = 'alert-container';
    alertContainer.style.marginTop = '15px';
    detalheContainer.parentNode.insertBefore(alertContainer, detalheContainer.nextSibling); // Inserir depois do container
  
    // Variáveis de controle
    let solicitacaoAtual = null;
    let acaoAtual = null; // 'Aprovado' ou 'Reprovado' (usar os mesmos valores do serviço)
    let idSolicitacao = null;
  
    // Verificar dependências
    if (!window.AutorizacaoService || !window.firebaseService) {
        mostrarAlerta('Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis. A página não pode funcionar.', 'alert-danger');
        if (detalheContainer) detalheContainer.style.display = 'none'; // Ocultar interface
        return;
    }
  
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    idSolicitacao = urlParams.get('id');
  
    if (!idSolicitacao) {
      mostrarAlerta('ID da solicitação não fornecido na URL. Redirecionando para o painel.', 'alert-warning');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 3000);
      return;
    }
  
    // --- Funções Auxiliares ---
  
    function setLoading(isLoading) {
        if (loadingIndicator) loadingIndicator.style.display = isLoading ? 'block' : 'none';
        if (detalheContainer) detalheContainer.style.display = isLoading ? 'none' : 'block'; // Ocultar/mostrar conteúdo
    }
  
    function mostrarAlerta(mensagem, tipo = 'alert-info') {
        if (!alertContainer) return;
        alertContainer.innerHTML = `<div class="alert ${tipo} alert-dismissible fade show" role="alert">
                                      ${mensagem}
                                      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>`;
        alertContainer.style.display = 'block';
        // Auto-hide info/success messages after a delay
        if (tipo === 'alert-info' || tipo === 'alert-success') {
            setTimeout(() => {
                const alertDiv = alertContainer.querySelector('.alert');
                if (alertDiv) {
                    // Use bootstrap's dismiss method if available, otherwise just hide
                    if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                        bootstrap.Alert.getOrCreateInstance(alertDiv).close();
                    } else {
                        alertContainer.style.display = 'none';
                    }
                }
            }, 5000);
        }
    }
  
    function getBadgeClass(status) {
        switch (status) {
            case 'Aprovado': return 'bg-success'; // Usar classes Bootstrap 5
            case 'Reprovado': return 'bg-danger';
            default: return 'bg-warning text-dark';
        }
    }
  
    function preencherDadosPagina(solicitacao) {
        if (!solicitacao) {
            mostrarAlerta('Não foi possível carregar os dados da solicitação.', 'alert-danger');
            return;
        }
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
  
        const infoDispositivo = document.getElementById('info-dispositivo');
        if (infoDispositivo && solicitacao.dispositivo) {
            infoDispositivo.innerHTML = `
                <p><strong>Plataforma:</strong> ${solicitacao.dispositivo.platform || 'N/A'}</p>
                <p><strong>Navegador:</strong> ${solicitacao.dispositivo.userAgent ? solicitacao.dispositivo.userAgent.split(' ').pop() : 'N/A'}</p>
                <p><strong>Data/Hora Envio:</strong> ${solicitacao.dispositivo.timestamp ? new Date(solicitacao.dispositivo.timestamp).toLocaleString('pt-BR') : 'N/A'}</p>
            `;
            infoDispositivo.style.display = 'block';
        } else if (infoDispositivo) {
            infoDispositivo.innerHTML = '<p>Informações não disponíveis</p>'; // Manter o parágrafo
            infoDispositivo.style.display = 'block';
        }
  
        const statusAtualElement = document.getElementById('status-atual');
        const statusSupervisor = solicitacao.status_supervisor || 'Pendente';
        if (statusAtualElement) {
            statusAtualElement.textContent = statusSupervisor;
            statusAtualElement.className = `badge ${getBadgeClass(statusSupervisor)}`; // Atualizar classe Bootstrap
        }
  
        const dataSolicitacaoElement = document.getElementById('data-solicitacao');
         if (dataSolicitacaoElement) {
             dataSolicitacaoElement.textContent = window.AutorizacaoService.formatarData(solicitacao.data_solicitacao) || 'N/A';
         }
  
  
        // Habilitar/desabilitar botões com base no status
        const jaDecidido = statusSupervisor === 'Aprovado' || statusSupervisor === 'Reprovado';
        if (btnAprovar) btnAprovar.disabled = jaDecidido;
        if (btnReprovar) btnReprovar.disabled = jaDecidido;
  
        if (jaDecidido && btnAprovar) {
             btnAprovar.textContent = `Status: ${statusSupervisor}`;
             if(btnReprovar) btnReprovar.style.display = 'none';
        } else {
             if(btnAprovar) btnAprovar.textContent = 'Aprovar Solicitação';
             if(btnReprovar) btnReprovar.style.display = 'inline-block';
        }
    }
  
    // --- Lógica Principal ---
  
    // Carregar dados da solicitação (agora assíncrono)
    async function carregarSolicitacao(id) {
      setLoading(true);
      mostrarAlerta('Carregando dados da solicitação...', 'alert-info');
      try {
        solicitacaoAtual = await window.AutorizacaoService.buscarSolicitacao(id);
  
        if (!solicitacaoAtual) {
          mostrarAlerta('Solicitação não encontrada. Verifique o ID ou contate o suporte.', 'alert-danger');
          if (btnAprovar) btnAprovar.disabled = true;
          if (btnReprovar) btnReprovar.disabled = true;
        } else {
          preencherDadosPagina(solicitacaoAtual);
          // Limpar alerta de carregamento (já feito pelo auto-hide)
        }
      } catch (error) {
        console.error('Erro ao carregar solicitação:', error);
        mostrarAlerta('Erro ao carregar dados da solicitação. Verifique o console.', 'alert-danger');
        if (btnAprovar) btnAprovar.disabled = true;
        if (btnReprovar) btnReprovar.disabled = true;
      } finally {
        setLoading(false);
      }
    }
  
    // Função para aprovar/reprovar (agora assíncrona)
    async function atualizarStatusSolicitacao(novoStatus, observacao) {
      if (!solicitacaoAtual) {
          mostrarAlerta('Erro: Nenhuma solicitação carregada para atualizar.', 'alert-danger');
          return;
      }
  
      setLoading(true); // Mostrar loading durante a atualização
      mostrarAlerta(`Atualizando status para ${novoStatus}...`, 'alert-info');
  
      try {
        const resultado = await window.AutorizacaoService.atualizarStatus(
          solicitacaoAtual.id,
          'supervisor', // Perfil que está atualizando
          novoStatus,
          observacao
        );
  
        if (resultado.sucesso) {
          mostrarAlerta(`Solicitação ${novoStatus.toLowerCase()} com sucesso!`, 'alert-success');
          // Recarregar os dados da página para refletir a mudança
          solicitacaoAtual = resultado.solicitacao; // Atualiza a variável local com os dados retornados
          preencherDadosPagina(solicitacaoAtual);
          // Opcional: redirecionar para dashboard após sucesso?
          // setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
        } else {
          mostrarAlerta(`Erro ao ${novoStatus.toLowerCase()} solicitação: ${resultado.mensagem || 'Erro desconhecido.'}`, 'alert-danger');
        }
      } catch (error) {
          console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
          mostrarAlerta(`Erro técnico ao atualizar status. Verifique o console.`, 'alert-danger');
      } finally {
          setLoading(false);
          // Mensagem de sucesso/erro já tem auto-hide
      }
    }
  
    // --- Configuração de Eventos ---
  
    if (btnAprovar) {
        btnAprovar.addEventListener('click', () => {
            if (btnAprovar.disabled) return;
            acaoAtual = 'Aprovado';
            if (modalObservacao) modalObservacao.style.display = 'block';
        });
    }
  
    if (btnReprovar) {
        btnReprovar.addEventListener('click', () => {
            if (btnReprovar.disabled) return;
            acaoAtual = 'Reprovado';
            if (modalObservacao) modalObservacao.style.display = 'block';
        });
    }
  
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => { // Tornar o handler assíncrono
            const observacaoInput = document.getElementById('observacao');
            const observacao = observacaoInput ? observacaoInput.value.trim() : '';
  
            // Validação da observação para reprovação
            if (acaoAtual === 'Reprovado' && !observacao) {
                alert('A observação é obrigatória ao reprovar.'); // Usar alert simples para modal
                return;
            }
  
            if (modalObservacao) modalObservacao.style.display = 'none';
            await atualizarStatusSolicitacao(acaoAtual, observacao); // Chamar a função assíncrona
            if (observacaoInput) observacaoInput.value = ''; // Limpar o campo
        });
    }
  
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (modalObservacao) modalObservacao.style.display = 'none';
            const observacaoInput = document.getElementById('observacao');
            if (observacaoInput) observacaoInput.value = ''; // Limpar o campo
        });
    }
  
    // Fechar modal clicando fora (opcional)
    window.addEventListener('click', (event) => {
        if (modalObservacao && event.target == modalObservacao) {
            modalObservacao.style.display = 'none';
        }
    });
  
    // --- Inicialização ---
    await carregarSolicitacao(idSolicitacao); // Carregar os dados ao iniciar
  
  });
  
  