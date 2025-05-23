/**
 * Controlador de Solicitações - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de solicitação (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const SolicitacaoController = (function() {
  // Elementos da interface
  let autorizacaoForm;
  let alertMessage;
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    autorizacaoForm = document.getElementById('autorizacao-form');
    alertMessage = document.getElementById('alert-message');
    
    // Verificar se estamos na página correta
    if (!autorizacaoForm) return;
    
    // Configurar eventos
    autorizacaoForm.addEventListener('submit', handleSubmit);
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem, tipo) {
    if (!alertMessage) return;
    
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertMessage.style.display = 'none';
    }, 5000);
  }
  
  // Manipulador de envio do formulário
  function handleSubmit(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = {
      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      data_nascimento: document.getElementById('data_nascimento').value,
      telefone: document.getElementById('telefone').value,
      categoria: document.getElementById('categoria').value,
      data_saida: document.getElementById('data_saida').value,
      horario_saida: document.getElementById('horario_saida').value,
      data_retorno: document.getElementById('data_retorno').value,
      horario_retorno: document.getElementById('horario_retorno').value,
      motivo_destino: document.getElementById('motivo_destino').value,
      nome_responsavel: document.getElementById('nome_responsavel').value,
      telefone_responsavel: document.getElementById('telefone_responsavel').value
    };
    
    // Usar o serviço de autorização para criar a solicitação
    const resultado = window.AutorizacaoService.criarSolicitacao(formData);
    
    if (resultado.sucesso) {
      // Mostrar mensagem de sucesso
      mostrarAlerta(`Solicitação enviada com sucesso! Seu código de acompanhamento é: ${resultado.solicitacao.id}`, 'alert-success');
      
      // Limpar o formulário
      autorizacaoForm.reset();
      
      // Redirecionar após 3 segundos
      setTimeout(function() {
        window.location.href = 'consultar.html?id=' + resultado.solicitacao.id;
      }, 3000);
    } else {
      // Mostrar mensagem de erro
      mostrarAlerta(resultado.mensagem, 'alert-danger');
    }
  }
  
  // API pública
  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  SolicitacaoController.inicializar();
});