// Lógica para a tela de solicitação de autorização
document.addEventListener('DOMContentLoaded', function() {
  const autorizacaoForm = document.getElementById('autorizacao-form');
  const alertMessage = document.getElementById('alert-message');
  
  // Função para validar o formulário (validação de data e hora de saída/retorno)
  function validarFormulario() {
    const agora = new Date(); // Data e hora atuais

    const dataSaidaStr = document.getElementById('data_saida').value;
    const horarioSaidaStr = document.getElementById('horario_saida').value;
    const dataRetornoStr = document.getElementById('data_retorno').value;
    const horarioRetornoStr = document.getElementById('horario_retorno').value;

    // Verifica se todos os campos de data e hora estão preenchidos
    if (!dataSaidaStr || !horarioSaidaStr || !dataRetornoStr || !horarioRetornoStr) {
        mostrarAlerta('Por favor, preencha todas as datas e horários.', 'alert-danger');
        return false;
    }

    // Constrói objetos Date para saída e retorno
    // Formato de data: "YYYY-MM-DD", Formato de hora: "HH:MM"
    const [anoSaida, mesSaida, diaSaida] = dataSaidaStr.split('-').map(Number);
    const [horaSaida, minutoSaida] = horarioSaidaStr.split(':').map(Number);
    const dataHoraSaida = new Date(anoSaida, mesSaida - 1, diaSaida, horaSaida, minutoSaida);

    const [anoRetorno, mesRetorno, diaRetorno] = dataRetornoStr.split('-').map(Number);
    const [horaRetorno, minutoRetorno] = horarioRetornoStr.split(':').map(Number);
    const dataHoraRetorno = new Date(anoRetorno, mesRetorno - 1, diaRetorno, horaRetorno, minutoRetorno);

    // Validação 1: Data/Hora de Saída deve ser futura
    if (dataHoraSaida < agora) {
      mostrarAlerta('A data e hora de saída devem ser futuras.', 'alert-danger');
      return false;
    }
    
    // Validação 2: Data/Hora de Retorno deve ser posterior à Data/Hora de Saída
    if (dataHoraRetorno <= dataHoraSaida) {
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
    
    if (!validarFormulario()) {
      return;
    }
    
    const session = JSON.parse(localStorage.getItem('current_session')) || {};
    const deviceInfo = session.deviceInfo || capturarInfoDispositivo();
    
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
      dispositivo: deviceInfo
    };
    
    let solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    solicitacoes.push(formData);
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    enviarNotificacaoSupervisor(formData);
    
    mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + formData.id, 'alert-success');
    
    autorizacaoForm.reset();
    
    setTimeout(function() {
      window.location.href = 'consultar.html?id=' + formData.id;
    }, 3000);
  });
  
  // Função para simular o envio de notificação ao supervisor
  function enviarNotificacaoSupervisor(dados) {
    console.log('Notificação enviada ao supervisor da categoria ' + dados.categoria);
    console.log('Dados da notificação:', dados);
    
    let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    
    notificacoes.push({
      tipo: 'supervisor',
      categoria: dados.categoria,
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      mensagem: `Nova solicitação de autorização de saída. Atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    });
    
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  }
});