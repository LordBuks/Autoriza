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
    // Usar o próprio Firestore para gerar ID pode ser uma opção, mas manteremos o formato original por enquanto
    return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  // Manipulador de envio do formulário (agora assíncrono para esperar o Firebase)
  autorizacaoForm.addEventListener('submit', async function(e) { // Adicionado async
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
      // Não incluímos o ID aqui, pois vamos usar o ID gerado como nome do documento
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
      status_monitor: 'Pendente', // Adicionando status monitor como pendente por padrão
      status_final: 'Em Análise',
      dispositivo: deviceInfo // Adicionar informações do dispositivo à solicitação
    };

    const solicitacaoId = gerarId(); // Gerar o ID da solicitação

    // Verificar se o serviço Firebase está disponível
    if (!window.firebaseService) {
        mostrarAlerta('Erro: Serviço de banco de dados não inicializado.', 'alert-danger');
        return;
    }

    try {
        // Salvar no Firestore usando o ID gerado como nome do documento
        const resultadoSalvar = await window.firebaseService.salvarDocumento('solicitacoes', formData, solicitacaoId);

        if (!resultadoSalvar.sucesso) {
            console.error('Erro ao salvar no Firestore:', resultadoSalvar.erro);
            mostrarAlerta(`Erro ao enviar solicitação: ${resultadoSalvar.erro}`, 'alert-danger');
            return;
        }

        // --- Código de Auditoria e Notificação (mantido como estava, mas pode precisar de ajustes) ---
        // Registrar evento de auditoria
        if (window.auditoriaService) {
          window.auditoriaService.registrarSubmissaoAtleta(
            solicitacaoId, // Usar o ID gerado
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
        
        // Simular envio de notificação ao supervisor (manter ou integrar com Firebase Functions/Cloud Messaging)
        enviarNotificacaoSupervisor({...formData, id: solicitacaoId}); // Passar o ID gerado
        // ----------------------------------------------------------------------------------------

        // Mostrar mensagem de sucesso
        mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + solicitacaoId, 'alert-success');
        
        // Limpar o formulário
        autorizacaoForm.reset();
        
        // Redirecionar após 3 segundos para a tela de consulta com o ID
        setTimeout(function() {
          window.location.href = 'consultar.html?id=' + solicitacaoId;
        }, 3000);

    } catch (error) {
        console.error('Erro inesperado ao processar a solicitação:', error);
        mostrarAlerta('Ocorreu um erro inesperado. Tente novamente mais tarde.', 'alert-danger');
    }
  });
  
  // Função para simular o envio de notificação ao supervisor (manter ou refatorar para Firebase)
  function enviarNotificacaoSupervisor(dados) {
    console.log('Simulando notificação para supervisor da categoria ' + dados.categoria);
    console.log('Dados da notificação:', dados);
    
    // A lógica de salvar notificação no localStorage pode ser mantida para fins de log local
    // ou substituída por uma chamada ao Firestore/Cloud Functions
    let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    notificacoes.push({
      tipo: 'supervisor',
      categoria: dados.categoria,
      id_solicitacao: dados.id, // Usar o ID correto
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      mensagem: `Nova solicitação de autorização de saída. Atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    });
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  }
});

