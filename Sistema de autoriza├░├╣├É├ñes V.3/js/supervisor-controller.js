/**
 * Controlador de Supervisor - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de supervisor (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const SupervisorController = (function() {
  // Elementos da interface
  let btnAprovar;
  let btnReprovar;
  let modalObservacao;
  let btnConfirmar;
  let btnCancelar;
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    btnAprovar = document.getElementById('btn-aprovar');
    btnReprovar = document.getElementById('btn-reprovar');
    modalObservacao = document.getElementById('modal-observacao');
    btnConfirmar = document.getElementById('btn-confirmar');
    btnCancelar = document.getElementById('btn-cancelar');
    
    // Verificar se estamos na página correta (detalhe do supervisor)
    if (!btnAprovar && !btnReprovar) return;
    
    // Obter ID da solicitação da URL
    const urlParams = new URLSearchParams(window.location.search);
    const idSolicitacao = urlParams.get('id');
    
    if (!idSolicitacao) {
      alert('ID da solicitação não fornecido. Redirecionando para o painel.');
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Carregar dados da solicitação
    carregarSolicitacao(idSolicitacao);
    
    // Configurar eventos
    if (btnAprovar) {
      btnAprovar.addEventListener('click', function() {
        acaoAtual = 'aprovar';
        modalObservacao.style.display = 'block';
      });
    }
    
    if (btnReprovar) {
      btnReprovar.addEventListener('click', function() {
        acaoAtual = 'reprovar';
        modalObservacao.style.display = 'block';
      });
    }
    
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', function() {
        const observacao = document.getElementById('observacao').value;
        
        if (acaoAtual === 'aprovar') {
          aprovarSolicitacao(observacao);
        } else if (acaoAtual === 'reprovar') {
          reprovarSolicitacao(observacao);
        }
        
        modalObservacao.style.display = 'none';
      });
    }
    
    if (btnCancelar) {
      btnCancelar.addEventListener('click', function() {
        modalObservacao.style.display = 'none';
      });
    }
  }
  
  // Função para carregar os dados da solicitação
  function carregarSolicitacao(id) {
    // Usar o serviço de autorização para buscar a solicitação
    const solicitacao = window.AutorizacaoService.buscarSolicitacao(id);
    
    if (!solicitacao) {
      alert('Solicitação não encontrada. Redirecionando para o painel.');
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Armazenar a solicitação atual
    solicitacaoAtual = solicitacao;
    
    // Preencher os dados na página
    document.getElementById('nome-atleta').textContent = solicitacao.nome;
    document.getElementById('categoria-atleta').textContent = solicitacao.categoria;
    document.getElementById('data-nascimento').textContent = window.AutorizacaoService.formatarData(solicitacao.data_nascimento);
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone;
    
    document.getElementById('data-saida').textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida);
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno);
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno;
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino;
    
    document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel;
    document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel;
    
    // Exibir informações do dispositivo se disponíveis
    if (solicitacao.dispositivo) {
      const infoDispositivo = document.getElementById('info-dispositivo');
      if (infoDispositivo) {
        infoDispositivo.innerHTML = `
          <p><strong>Dispositivo:</strong> ${solicitacao.dispositivo.platform}</p>
          <p><strong>Navegador:</strong> ${solicitacao.dispositivo.userAgent.split(' ').slice(-1)[0]}</p>
          <p><strong>Resolução:</strong> ${solicitacao.dispositivo.screenWidth}x${solicitacao.dispositivo.screenHeight}</p>
          <p><strong>Data/Hora:</strong> ${new Date(solicitacao.dispositivo.timestamp).toLocaleString()}</p>
        `;
      }
    }
    
    const statusAtual = document.getElementById('status-atual');
    if (statusAtual) {
      statusAtual.textContent = solicitacao.status_supervisor;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_supervisor === 'Aprovado') {
        statusAtual.className = 'badge bg-success';
      } else if (solicitacao.status_supervisor === 'Reprovado') {
        statusAtual.className = 'badge bg-danger';
      } else {
        statusAtual.className = 'badge bg-warning';
      }
    }
    
    // Desabilitar botões se já houver uma decisão
    if (solicitacao.status_supervisor !== 'Pendente') {
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
      
      // Mostrar observação se existir
      if (solicitacao.observacao_supervisor) {
        const observacaoElement = document.getElementById('observacao-atual');
        if (observacaoElement) {
          observacaoElement.textContent = solicitacao.observacao_supervisor;
          document.getElementById('container-observacao').style.display = 'block';
        }
      }
    }
  }
  
  // Função para aprovar solicitação
  function aprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Usar o serviço de autorização para atualizar o status
    const resultado = window.AutorizacaoService.atualizarStatus(
      solicitacaoAtual.id,
      'supervisor',
      'Aprovado',
      observacao
    );
    
    // Registrar evento de auditoria
    if (window.auditoriaService) {
      window.auditoriaService.registrarDecisaoSupervisor(
        solicitacaoAtual.id,
        'Aprovado',
        observacao
      ).then(resultadoAuditoria => {
        console.log('Evento de auditoria registrado:', resultadoAuditoria);
      }).catch(erro => {
        console.error('Erro ao registrar evento de auditoria:', erro);
      });
    } else {
      console.warn('Serviço de auditoria não disponível');
    }
    
    if (resultado.sucesso) {
      alert('Solicitação aprovada com sucesso!');
      window.location.reload();
    } else {
      alert(`Erro ao aprovar solicitação: ${resultado.mensagem}`);
    }
  }
  
  // Função para reprovar solicitação
  function reprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Usar o serviço de autorização para atualizar o status
    const resultado = window.AutorizacaoService.atualizarStatus(
      solicitacaoAtual.id,
      'supervisor',
      'Reprovado',
      observacao
    );
    
    // Registrar evento de auditoria
    if (window.auditoriaService) {
      window.auditoriaService.registrarDecisaoSupervisor(
        solicitacaoAtual.id,
        'Reprovado',
        observacao
      ).then(resultadoAuditoria => {
        console.log('Evento de auditoria registrado:', resultadoAuditoria);
      }).catch(erro => {
        console.error('Erro ao registrar evento de auditoria:', erro);
      });
    } else {
      console.warn('Serviço de auditoria não disponível');
    }
    
    if (resultado.sucesso) {
      alert('Solicitação reprovada.');
      window.location.reload();
    } else {
      alert(`Erro ao reprovar solicitação: ${resultado.mensagem}`);
    }
  }
  
  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  SupervisorController.inicializar();
});
