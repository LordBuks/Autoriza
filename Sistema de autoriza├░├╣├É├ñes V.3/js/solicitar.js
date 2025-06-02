// Lógica para a tela de solicitação de autorização
document.addEventListener('DOMContentLoaded', function() {
  const autorizacaoForm = document.getElementById('autorizacao-form');
  const alertMessage = document.getElementById('alert-message');
  
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
  autorizacaoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar o formulário
    if (!validarFormulario()) {
      return;
    }
    
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
      status_final: 'Em Análise',
      dispositivo: deviceInfo // Adicionar informações do dispositivo à solicitação
    };
    
    // Em um sistema real, enviaríamos esses dados para o servidor
    // Aqui, vamos simular o armazenamento local
    
    // Recuperar solicitações existentes ou inicializar array vazio
    let solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Adicionar nova solicitação
    solicitacoes.push(formData);
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    // Registrar evento de auditoria
    if (window.auditoriaService) {
      window.auditoriaService.registrarSubmissaoAtleta(
        formData.id,
        {
          nome: formData.nome,
          email: formData.email,
          categoria: formData.categoria,
          telefone: formData.telefone
        },
        deviceInfo
      ).then(resultado => {
        console.log('Evento de auditoria registrado:', resultado);
      }).catch(erro => {
        console.error('Erro ao registrar evento de auditoria:', erro);
      });
    } else {
      console.warn('Serviço de auditoria não disponível');
    }
    
    // Simular envio de notificação ao supervisor
    enviarNotificacaoSupervisor(formData);
    
    // Mostrar mensagem de sucesso
    mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + formData.id, 'alert-success');
    
    // Limpar o formulário
    autorizacaoForm.reset();
    
    // Redirecionar após 3 segundos
    setTimeout(function() {
      window.location.href = 'consultar.html?id=' + formData.id;
    }, 3000);
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
