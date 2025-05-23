/**
 * Controlador de Monitor - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de monitor
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const MonitorController = (function() {
  // Variáveis de controle
  let solicitacaoAtual = null;
  
  // Inicialização do controlador
  function inicializar() {
    // Verificar se estamos na página de detalhe do monitor
    const urlParams = new URLSearchParams(window.location.search);
    const idSolicitacao = urlParams.get('id');
    
    if (idSolicitacao) {
      // Estamos na página de detalhe
      carregarSolicitacao(idSolicitacao);
    } else {
      // Estamos na página de dashboard
      carregarListaSolicitacoes();
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
    
    // Exibir status do supervisor
    const statusSupervisor = document.getElementById('status-supervisor');
    if (statusSupervisor) {
      statusSupervisor.textContent = solicitacao.status_supervisor;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_supervisor === 'Aprovado') {
        statusSupervisor.className = 'badge bg-success';
      } else if (solicitacao.status_supervisor === 'Reprovado') {
        statusSupervisor.className = 'badge bg-danger';
      } else {
        statusSupervisor.className = 'badge bg-warning';
      }
    }
    
    // Exibir status do serviço social
    const statusServicoSocial = document.getElementById('status-servico-social');
    if (statusServicoSocial) {
      statusServicoSocial.textContent = solicitacao.status_servico_social;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_servico_social === 'Aprovado') {
        statusServicoSocial.className = 'badge bg-success';
      } else if (solicitacao.status_servico_social === 'Reprovado') {
        statusServicoSocial.className = 'badge bg-danger';
      } else {
        statusServicoSocial.className = 'badge bg-warning';
      }
    }
    
    // Exibir status final
    const statusFinal = document.getElementById('status-final');
    if (statusFinal) {
      statusFinal.textContent = solicitacao.status_final;
      
      // Ajustar a classe do badge de acordo com o status
      if (solicitacao.status_final === 'Aprovado') {
        statusFinal.className = 'badge bg-success';
      } else if (solicitacao.status_final === 'Reprovado') {
        statusFinal.className = 'badge bg-danger';
      } else {
        statusFinal.className = 'badge bg-warning';
      }
    }
    
    // Mostrar observações se existirem
    if (solicitacao.observacao_supervisor) {
      const observacaoSupervisorElement = document.getElementById('observacao-supervisor');
      if (observacaoSupervisorElement) {
        observacaoSupervisorElement.textContent = solicitacao.observacao_supervisor;
        document.getElementById('container-observacao-supervisor').style.display = 'block';
      }
    }
    
    if (solicitacao.observacao_servico_social) {
      const observacaoServicoSocialElement = document.getElementById('observacao-servico-social');
      if (observacaoServicoSocialElement) {
        observacaoServicoSocialElement.textContent = solicitacao.observacao_servico_social;
        document.getElementById('container-observacao-servico-social').style.display = 'block';
      }
    }
  }
  
  // Função para carregar a lista de solicitações no dashboard
  function carregarListaSolicitacoes() {
    const solicitacoes = window.AutorizacaoService.listarSolicitacoes();
    const tabelaSolicitacoes = document.getElementById('tabela-solicitacoes');
    
    if (!tabelaSolicitacoes) return;
    
    // Limpar tabela
    const tbody = tabelaSolicitacoes.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Adicionar cada solicitação à tabela
    solicitacoes.forEach(solicitacao => {
      const tr = document.createElement('tr');
      
      // Definir classe da linha com base no status
      if (solicitacao.status_final === 'Aprovado') {
        tr.className = 'table-success';
      } else if (solicitacao.status_final === 'Reprovado') {
        tr.className = 'table-danger';
      }
      
      tr.innerHTML = `
        <td>${solicitacao.id}</td>
        <td>${solicitacao.nome}</td>
        <td>${solicitacao.categoria}</td>
        <td>${window.AutorizacaoService.formatarData(solicitacao.data_saida)}</td>
        <td>
          <span class="badge ${getBadgeClass(solicitacao.status_final)}">
            ${solicitacao.status_final}
          </span>
        </td>
        <td>
          <a href="detalhe.html?id=${solicitacao.id}" class="btn btn-sm btn-primary">Detalhes</a>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
    switch (status) {
      case 'Aprovado': return 'bg-success';
      case 'Reprovado': return 'bg-danger';
      default: return 'bg-warning';
    }
  }
  
  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  MonitorController.inicializar();
});