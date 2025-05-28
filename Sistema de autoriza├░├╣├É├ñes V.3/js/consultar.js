// Lógica para a tela de solicitação de autorização
document.addEventListener('DOMContentLoaded', function() {
  const autorizacaoForm = document.getElementById('autorizacao-form');
  const alertMessage = document.getElementById('alert-message');
  
  // Verificar se os serviços necessários estão disponíveis
  if (!window.firebaseService) {
    console.error("Serviço Firebase não encontrado!");
    mostrarAlerta("Erro crítico: Serviço de dados indisponível.", "alert-danger");
    return;
  }
  
  // Função para validar o formulário
  function validarFormulario() {
    const dataSaidaStr = document.getElementById('data_saida').value;
    const horaSaidaStr = document.getElementById('horario_saida').value;
    const dataRetornoStr = document.getElementById('data_retorno').value;
    const horaRetornoStr = document.getElementById('horario_retorno').value;

    // Combinar data e hora para criar objetos Date completos
    const dataSaida = new Date(`${dataSaidaStr}T${horaSaidaStr}`);
    const dataRetorno = new Date(`${dataRetornoStr}T${horaRetornoStr}`);
    const agora = new Date();

    // Ajustar 'agora' para não considerar segundos e milissegundos na comparação de tempo
    agora.setSeconds(0, 0);

    // Verificar se a data e hora de saída são futuras
    if (dataSaida < agora) {
      mostrarAlerta('A data e hora de saída devem ser futuras.', 'alert-danger');
      return false;
    }

    // Verificar se a data e hora de retorno são posteriores à data e hora de saída
    if (dataRetorno <= dataSaida) {
      mostrarAlerta('A data e hora de retorno devem ser posteriores à data e hora de saída.', 'alert-danger');
      return false;
    }

    return true;
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem, tipo) {
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertMessage.style.display = 'none';
    }, 5000);
  }
  
  // Função para gerar um ID único
  function gerarId() {
    return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  // Manipulador de envio do formulário
  autorizacaoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validar o formulário
    if (!validarFormulario()) {
      return;
    }
    
    // Desabilitar o botão de envio para evitar múltiplos envios
    const submitButton = autorizacaoForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    // Obter informações do dispositivo da sessão atual
    const session = JSON.parse(localStorage.getItem('current_session')) || {};
    const deviceInfo = session.deviceInfo || capturarInfoDispositivo();
    
    // Função para capturar informações do dispositivo caso não esteja na sessão
    function capturarInfoDispositivo() {
      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      };
    }
    
    // Gerar ID único para a solicitação
    const solicitacaoId = gerarId();
    
    // Coletar dados do formulário
    const formData = {
      id: solicitacaoId,
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
      status_final: 'Em Análise',
      dispositivo: deviceInfo // Adicionar informações do dispositivo à solicitação
    };
    
    try {
      // Salvar no Firestore usando o serviço Firebase
      const resultado = await window.firebaseService.salvarDocumento('solicitacoes', formData, solicitacaoId);
      
      if (!resultado.sucesso) {
        throw new Error(resultado.erro || 'Erro ao salvar no banco de dados');
      }
      
      // Também salvar no localStorage para compatibilidade com código existente
      let solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
      solicitacoes.push(formData);
      localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
      
      // Simular envio de notificação ao supervisor
      enviarNotificacaoSupervisor(formData);
      
      // Mostrar mensagem de sucesso
      mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + solicitacaoId, 'alert-success');
      
      // Limpar o formulário
      autorizacaoForm.reset();
      
      // Redirecionar após 3 segundos
      setTimeout(function() {
        window.location.href = 'consultar.html?id=' + solicitacaoId;
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      mostrarAlerta('Erro ao enviar solicitação: ' + error.message, 'alert-danger');
      
      // Reativar o botão de envio
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar Solicitação';
    }
  });
  
  // Função para simular o envio de notificação ao supervisor
  function enviarNotificacaoSupervisor(dados) {
    console.log('Notificação enviada ao supervisor da categoria ' + dados.categoria);
    console.log('Dados da notificação:', dados);
    
    // Em um sistema real, enviaríamos um e-mail ou outra forma de notificação
    // Aqui, apenas simulamos o registro da notificação
    
    // Recuperar notificações existentes ou inicializar array vazio
    let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    
    // Adicionar nova notificação
    notificacoes.push({
      tipo: 'supervisor',
      categoria: dados.categoria,
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      mensagem: `Nova solicitação de autorização de saída. Atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    });
    
    // Salvar no localStorage
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  }
});
