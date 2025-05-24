// Integração com serviço de notificações e Firestore
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se os serviços necessários foram carregados
  if (!window.notificacaoService) {
    console.error('Serviço de notificação não encontrado!');
    // Poderia adicionar um alerta visual para o usuário aqui
    // return;
  }
  if (!window.firebaseService) {
    console.error('Serviço Firebase não encontrado!');
    // Poderia adicionar um alerta visual para o usuário aqui
    // return;
  }

  const autorizacaoForm = document.getElementById('autorizacao-form');

  if (autorizacaoForm) {
    autorizacaoForm.addEventListener('submit', async function(e) { // Adicionado async aqui
      e.preventDefault();

      // Validar o formulário
      if (!validarFormulario()) {
        return;
      }

      // Mostrar indicador de carregamento (opcional, mas bom para UX)
      mostrarAlerta('Enviando solicitação...', 'alert-info');

      // Coletar dados do formulário
      const formData = {
        id: gerarId(), // Gerar ID único para a solicitação
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
        // Adicionar o UID do atleta logado, se disponível e necessário para regras
        // atletaUid: window.firebaseService.auth.currentUser ? window.firebaseService.auth.currentUser.uid : null
      };

      try {
        // Salvar no Firestore usando o ID gerado
        const resultadoSalvar = await window.firebaseService.salvarDocumento('solicitacoes', formData, formData.id);

        if (resultadoSalvar.sucesso) {
          // Enviar notificação ao supervisor (se necessário)
          if (window.notificacaoService) {
             window.notificacaoService.enviarNotificacaoSupervisor(formData); // Idealmente, esta função também deveria ser assíncrona ou lidar com erros
          }

          // Mostrar mensagem de sucesso
          mostrarAlerta('Solicitação enviada com sucesso! Seu código de acompanhamento é: ' + formData.id, 'alert-success');

          // Limpar o formulário
          autorizacaoForm.reset();

          // Redirecionar após 3 segundos
          setTimeout(function() {
            // Idealmente, redirecionar para uma página que busca do Firestore
            window.location.href = 'consultar.html?id=' + formData.id;
          }, 3000);

        } else {
          // Mostrar mensagem de erro do Firestore
          console.error('Erro ao salvar no Firestore:', resultadoSalvar.erro);
          mostrarAlerta('Erro ao salvar solicitação: ' + resultadoSalvar.erro, 'alert-danger');
        }
      } catch (error) {
        // Mostrar mensagem de erro genérico
        console.error('Erro inesperado ao enviar formulário:', error);
        mostrarAlerta('Ocorreu um erro inesperado ao enviar a solicitação. Tente novamente.', 'alert-danger');
      }
    });
  }

  // Funções auxiliares
  function validarFormulario() {
    // Adicionar validações mais robustas se necessário
    const dataSaidaInput = document.getElementById('data_saida');
    const dataRetornoInput = document.getElementById('data_retorno');

    if (!dataSaidaInput.value || !dataRetornoInput.value) {
        mostrarAlerta('Por favor, preencha as datas de saída e retorno.', 'alert-danger');
        return false;
    }

    const dataSaida = new Date(dataSaidaInput.value + 'T00:00:00'); // Considerar fuso horário se relevante
    const dataRetorno = new Date(dataRetornoInput.value + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas datas

    // Verificar se a data de saída é futura ou hoje
    if (dataSaida < hoje) {
      mostrarAlerta('A data de saída não pode ser anterior a hoje.', 'alert-danger');
      return false;
    }

    // Verificar se a data de retorno é posterior ou igual à data de saída
    if (dataRetorno < dataSaida) {
      mostrarAlerta('A data de retorno deve ser igual ou posterior à data de saída.', 'alert-danger');
      return false;
    }

    // Outras validações podem ser adicionadas aqui (campos obrigatórios, formato de email, etc.)

    return true;
  }

  function mostrarAlerta(mensagem, tipo) {
    const alertMessage = document.getElementById('alert-message');
    if (alertMessage) {
      alertMessage.textContent = mensagem;
      // Limpar classes antigas e adicionar novas
      alertMessage.className = 'alert'; // Reset classes
      alertMessage.classList.add(tipo); // Adiciona a classe do tipo (alert-success, alert-danger, alert-info)
      alertMessage.style.display = 'block';

      // Esconder a mensagem após 5 segundos, exceto se for de informação (carregando)
      if (tipo !== 'alert-info') {
          setTimeout(function() {
              if (alertMessage.style.display === 'block') { // Só esconde se ainda estiver visível
                 alertMessage.style.display = 'none';
              }
          }, 5000);
      }
    } else {
        console.warn('Elemento de alerta #alert-message não encontrado na página.');
        // Fallback para alert padrão do navegador
        alert(mensagem);
    }
  }

  function gerarId() {
    // Gerador de ID simples - considere usar UUIDs mais robustos se necessário
    return 'AUTH-' + Math.random().toString(36).substring(2, 11).toUpperCase();
  }
});

