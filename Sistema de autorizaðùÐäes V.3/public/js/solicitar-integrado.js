// Integração com serviço de notificações
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se o script de notificação foi carregado
  if (!window.notificacaoService) {
    console.error('Serviço de notificação não encontrado!');
    return;
  }
  
  // Sobrescrever a função de envio de notificação no script de solicitação
  const autorizacaoForm = document.getElementById('autorizacao-form');
  
  if (autorizacaoForm) {
    autorizacaoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validar o formulário (reaproveitando a lógica existente)
      if (!validarFormulario()) {
        return;
      }
      
      // Coletar dados do formulário
      const formData = {
        id: gerarId(),
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
        telefone_responsavel: document.getElementById('telefone_responsavel').value,
        data_solicitacao: new Date().toISOString(),
        status_supervisor: 'Pendente',
        status_servico_social: 'Pendente',
        status_final: 'Em Análise'
      };
      
      // Recuperar solicitações existentes ou inicializar array vazio
      let solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
      
      // Adicionar nova solicitação
      solicitacoes.push(formData);
      
      // Salvar no localStorage
      localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
      
      // Enviar notificação ao supervisor usando o serviço de notificações
      window.notificacaoService.enviarNotificacaoSupervisor(formData);
      
      // Mostrar mensagem de sucesso
      mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + formData.id, 'alert-success');
      
      // Limpar o formulário
      autorizacaoForm.reset();
      
      // Redirecionar após 3 segundos
      setTimeout(function() {
        window.location.href = 'consultar.html?id=' + formData.id;
      }, 3000);
    });
  }
  
  // Funções auxiliares (reaproveitadas do script original)
  function validarFormulario() {
    const dataSaida = new Date(document.getElementById('data_saida').value);
    const dataRetorno = new Date(document.getElementById('data_retorno').value);
    const hoje = new Date();
    
    // Verificar se a data de saída é futura
    if (dataSaida < hoje) {
      mostrarAlerta('A data de saída deve ser futura.', 'alert-danger');
      return false;
    }
    
    // Verificar se a data de retorno é posterior à data de saída
    if (dataRetorno < dataSaida) {
      mostrarAlerta('A data de retorno deve ser posterior à data de saída.', 'alert-danger');
      return false;
    }
    
    return true;
  }
  
  function mostrarAlerta(mensagem, tipo) {
    const alertMessage = document.getElementById('alert-message');
    if (alertMessage) {
      alertMessage.textContent = mensagem;
      alertMessage.className = `alert ${tipo}`;
      alertMessage.style.display = 'block';
      
      // Esconder a mensagem após 5 segundos
      setTimeout(function() {
        alertMessage.style.display = 'none';
      }, 5000);
    }
  }
  
  function gerarId() {
    return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
});
