// Lógica para a tela de detalhe do supervisor
document.addEventListener('DOMContentLoaded', function() {
  // Elementos da página
  const btnAprovar = document.getElementById('btn-aprovar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const modalObservacao = document.getElementById('modal-observacao');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'aprovar' ou 'reprovar'
  
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
  
  // Eventos dos botões
  btnAprovar.addEventListener('click', function() {
    acaoAtual = 'aprovar';
    modalObservacao.style.display = 'block';
  });
  
  btnReprovar.addEventListener('click', function() {
    acaoAtual = 'reprovar';
    modalObservacao.style.display = 'block';
  });
  
  btnConfirmar.addEventListener('click', function() {
    const observacao = document.getElementById('observacao').value;
    
    if (acaoAtual === 'aprovar') {
      aprovarSolicitacao(observacao);
    } else if (acaoAtual === 'reprovar') {
      reprovarSolicitacao(observacao);
    }
    
    modalObservacao.style.display = 'none';
  });
  
  btnCancelar.addEventListener('click', function() {
    modalObservacao.s  // Função para carregar os dados da solicitação
  function carregarSolicitacao(id) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Buscar a solicitação pelo ID
    const solicitacao = solicitacoes.find(s => s.id === id);
    
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
    document.getElementById('data-nascimento').textContent = formatarData(new Date(solicitacao.data_nascimento));
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone;
    
    document.getElementById('data-saida').textContent = formatarData(new Date(solicitacao.data_saida));
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = formatarData(new Date(solicitacao.data_retorno));
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
    statusAtual.textContent = solicitacao.status_supervisor;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_supervisor === 'Aprovado') {
      statusAtual.className = 'badge badge-approved';
      // Desabilitar botões se já aprovado
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } else if (solicitacao.status_supervisor === 'Reprovado') {
      statusAtual.className = 'badge badge-rejected';
      // Desabilitar botões se já reprovado
      if (btnAprovar) btnAprovar.disabled = true;
      if (btnReprovar) btnReprovar.disabled = true;
    } else {
      statusAtual.className = 'badge badge-pending';
    }
  }a-solicitacao').textContent = formatarData(new Date(solicitacao.data_solicitacao));
  }
  
  // Função para aprovar a solicitação
  function aprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação atual
    const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
    
    if (index === -1) {
      alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
      return;
    }
    
    // Atualizar o status da solicitação
    solicitacoes[index].status_supervisor = 'Aprovado';
    solicitacoes[index].observacao_supervisor = observacao;
    solicitacoes[index].data_aprovacao_supervisor = new Date().toISOString();
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    // Simular envio de notificação ao serviço social
    enviarNotificacaoServicoSocial(solicitacoes[index]);
    
    // Atualizar a interface
    alert('Solicitação aprovada com sucesso!');
    window.location.reload();
  }
  
  // Função para reprovar a solicitação
  function reprovarSolicitacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Verificar se a observação foi fornecida (obrigatória para reprovação)
    if (!observacao.trim()) {
      alert('É necessário fornecer um motivo para a reprovação.');
      return;
    }
    
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar o índice da solicitação atual
    const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
    
    if (index === -1) {
      alert('Erro ao atualizar a solicitação. Por favor, tente novamente.');
      return;
    }
    
    // Atualizar o status da solicitação
    solicitacoes[index].status_supervisor = 'Reprovado';
    solicitacoes[index].observacao_supervisor = observacao;
    solicitacoes[index].data_reprovacao_supervisor = new Date().toISOString();
    solicitacoes[index].status_final = 'Reprovado';
    
    // Salvar no localStorage
    localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    
    // Atualizar a interface
    alert('Solicitação reprovada.');
    window.location.reload();
  }
  
  // Função para simular o envio de notificação ao serviço social
  function enviarNotificacaoServicoSocial(dados) {
    console.log('Notificação enviada ao serviço social');
    console.log('Dados da notificação:', dados);
    
    // Em um sistema real, enviaríamos um e-mail ou outra forma de notificação
    // Aqui, apenas simulamos o registro da notificação
    
    // Recuperar notificações existentes ou inicializar array vazio
    let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [];
    
    // Adicionar nova notificação
    notificacoes.push({
      tipo: 'servico_social',
      id_solicitacao: dados.id,
      nome_atleta: dados.nome,
      data_envio: new Date().toISOString(),
      mensagem: `Autorização aguardando. Supervisor aprovou solicitação do atleta: ${dados.nome}, Categoria: ${dados.categoria}`
    });
    
    // Salvar no localStorage
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  }
  
  // Função para formatar data
  function formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
});
