/**
 * Controlador de Consulta - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de consulta de autorizações
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const ConsultaController = (function() {
  // Elementos da interface
  let formConsulta;
  let resultadoConsulta;
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    formConsulta = document.getElementById('form-consulta');
    resultadoConsulta = document.getElementById('resultado-consulta');
    
    // Verificar se estamos na página correta
    if (!formConsulta) return;
    
    // Configurar eventos
    formConsulta.addEventListener('submit', handleSubmit);
    
    // Verificar se há um ID na URL para consulta direta
    const urlParams = new URLSearchParams(window.location.search);
    const idConsulta = urlParams.get('id');
    
    if (idConsulta) {
      document.getElementById('codigo').value = idConsulta;
      consultarSolicitacao(idConsulta);
    }
  }
  
  // Manipulador de envio do formulário
  function handleSubmit(e) {
    e.preventDefault();
    
    const codigoSolicitacao = document.getElementById('codigo').value.trim();
    
    if (!codigoSolicitacao) {
      mostrarMensagem('Por favor, informe o código da solicitação.', 'alert-danger');
      return;
    }
    
    consultarSolicitacao(codigoSolicitacao);
  }
  
  // Função para consultar uma solicitação
  function consultarSolicitacao(codigo) {
    // Usar o serviço de autorização para buscar a solicitação
    const solicitacao = window.AutorizacaoService.buscarSolicitacao(codigo);
    
    if (!solicitacao) {
      mostrarMensagem('Solicitação não encontrada. Verifique o código informado.', 'alert-danger');
      return;
    }
    
    // Exibir os detalhes da solicitação
    exibirDetalhes(solicitacao);
  }
  
  // Função para exibir os detalhes da solicitação
  function exibirDetalhes(solicitacao) {
    if (!resultadoConsulta) return;
    
    // Mostrar o container de resultado
    resultadoConsulta.style.display = 'block';
    
    // Preencher os dados
    document.getElementById('nome-atleta').textContent = solicitacao.nome;
    document.getElementById('categoria').textContent = solicitacao.categoria;
    document.getElementById('data-saida').textContent = window.AutorizacaoService.formatarData(solicitacao.data_saida);
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = window.AutorizacaoService.formatarData(solicitacao.data_retorno);
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno;
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino;
    
    // Exibir status
    const statusSupervisor = document.getElementById('status-supervisor');
    if (statusSupervisor) {
      statusSupervisor.textContent = solicitacao.status_supervisor;
      statusSupervisor.className = `badge ${getBadgeClass(solicitacao.status_supervisor)}`;
    }
    
    const statusServicoSocial = document.getElementById('status-servico-social');
    if (statusServicoSocial) {
      statusServicoSocial.textContent = solicitacao.status_servico_social;
      statusServicoSocial.className = `badge ${getBadgeClass(solicitacao.status_servico_social)}`;
    }
    
    const statusFinal = document.getElementById('status-final');
    if (statusFinal) {
      statusFinal.textContent = solicitacao.status_final;
      statusFinal.className = `badge ${getBadgeClass(solicitacao.status_final)}`;
    }
    
    // Exibir observações se existirem
    const observacaoSupervisor = document.getElementById('observacao-supervisor');
    if (observacaoSupervisor) {
      if (solicitacao.observacao_supervisor) {
        observacaoSupervisor.textContent = solicitacao.observacao_supervisor;
        document.getElementById('container-observacao-supervisor').style.display = 'block';
      } else {
        document.getElementById('container-observacao-supervisor').style.display = 'none';
      }
    }
    
    const observacaoServicoSocial = document.getElementById('observacao-servico-social');
    if (observacaoServicoSocial) {
      if (solicitacao.observacao_servico_social) {
        observacaoServicoSocial.textContent = solicitacao.observacao_servico_social;
        document.getElementById('container-observacao-servico-social').style.display = 'block';
      } else {
        document.getElementById('container-observacao-servico-social').style.display = 'none';
      }
    }
  }
  
  // Função para mostrar mensagens
  function mostrarMensagem(mensagem, tipo) {
    const alertElement = document.getElementById('alert-message');
    if (!alertElement) return;
    
    alertElement.textContent = mensagem;
    alertElement.className = `alert ${tipo}`;
    alertElement.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertElement.style.display = 'none';
    }, 5000);
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
  ConsultaController.inicializar();
});