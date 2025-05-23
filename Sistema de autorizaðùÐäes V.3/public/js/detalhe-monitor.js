// Lógica para a tela de detalhe do monitor
document.addEventListener('DOMContentLoaded', function() {
  // Elementos da página
  const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
  const btnValidar = document.getElementById('btn-validar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const mensagemWhatsapp = document.getElementById('mensagem-whatsapp');
  const textoWhatsapp = document.getElementById('texto-whatsapp');
  const btnCopiar = document.getElementById('btn-copiar');
  const btnAbrirWhatsapp = document.getElementById('btn-abrir-whatsapp');
  const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  const DPO_EMAIL = 'dpo@internacional.com.br'; // Email do DPO para a mensagem
  
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
  btnEnviarWhatsapp.addEventListener('click', function() {
    prepararMensagemWhatsapp();
    mensagemWhatsapp.style.display = 'block';
  });
  
  btnValidar.addEventListener('click', function() {
    alert('Como monitor, você não pode validar diretamente. Esta ação é exclusiva do Serviço Social.');
  });
  
  btnReprovar.addEventListener('click', function() {
    alert('Como monitor, você não pode reprovar diretamente. Esta ação é exclusiva do Serviço Social.');
  });
  
  btnCopiar.addEventListener('click', function() {
    textoWhatsapp.select();
    document.execCommand('copy');
    alert('Mensagem copiada para a área de transferência!');
  });
  
  btnAbrirWhatsapp.addEventListener('click', function() {
    if (!solicitacaoAtual) return;
    
    // Formatar número de telefone (remover caracteres não numéricos)
    const telefone = solicitacaoAtual.telefone_responsavel.replace(/\D/g, '');
    
    // Codificar a mensagem para URL
    const mensagem = encodeURIComponent(textoWhatsapp.value);
    
    // Abrir WhatsApp Web com o número e mensagem
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
  });
  
  btnFecharMensagem.addEventListener('click', function() {
    mensagemWhatsapp.style.display = 'none';
  });
  
  // Função para carregar os dados da solicitação
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
    
    const statusSupervisor = document.getElementById('status-supervisor');
    statusSupervisor.textContent = solicitacao.status_supervisor;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_supervisor === 'Aprovado') {
      statusSupervisor.className = 'badge badge-approved';
    } else if (solicitacao.status_supervisor === 'Reprovado') {
      statusSupervisor.className = 'badge badge-rejected';
    } else {
      statusSupervisor.className = 'badge badge-pending';
    }
    
    document.getElementById('data-aprovacao-supervisor').textContent = 
      solicitacao.data_aprovacao_supervisor ? 
      formatarData(new Date(solicitacao.data_aprovacao_supervisor)) : 
      'N/A';
    
    const statusServicoSocial = document.getElementById('status-servico-social');
    statusServicoSocial.textContent = solicitacao.status_servico_social;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_servico_social === 'Aprovado') {
      statusServicoSocial.className = 'badge badge-approved';
    } else if (solicitacao.status_servico_social === 'Reprovado') {
      statusServicoSocial.className = 'badge badge-rejected';
    } else {
      statusServicoSocial.className = 'badge badge-pending';
    }
    
    const statusFinal = document.getElementById('status-final');
    statusFinal.textContent = solicitacao.status_final;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_final === 'Aprovado') {
      statusFinal.className = 'badge badge-approved';
    } else if (solicitacao.status_final === 'Reprovado') {
      statusFinal.className = 'badge badge-rejected';
    } else {
      statusFinal.className = 'badge badge-pending';
    }
    
    // Desabilitar botões de validação para o monitor (apenas visualização)
    btnValidar.disabled = true;
    btnReprovar.disabled = true;
  }
  
  // Função para preparar a mensagem de WhatsApp
  function prepararMensagemWhatsapp() {
    if (!solicitacaoAtual) return;
    
    // Função para formatar data no formato dd/MM/yyyy
    function fmt(dataStr, formato) {
      const data = new Date(dataStr);
      if (formato === "dd/MM/yyyy") {
        return data.toLocaleDateString('pt-BR');
      } else if (formato === "HH:mm") {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return dataStr;
    }
    
    // Construir a mensagem conforme o modelo fornecido pelo usuário
    const mensagem = `Prezado(a) ${solicitacaoAtual.nome_responsavel || 'Responsável'},

Informamos que o(a) atleta abaixo solicitou autorização de saída e retorno para o alojamento nos dias e horários descritos nesta autorização.

🙋🏽 Nome: ${solicitacaoAtual.nome}
⬆️ Saída: ${fmt(solicitacaoAtual.data_saida, "dd/MM/yyyy")} 
⏰ Hora: ${solicitacaoAtual.horario_saida}
⬇️ Retorno: ${fmt(solicitacaoAtual.data_retorno, "dd/MM/yyyy")}  
⏰ Hora: ${solicitacaoAtual.horario_retorno}
📍 Destino: ${solicitacaoAtual.motivo_destino}

Para autorizar, responda com a seguinte declaração:
Eu, ${solicitacaoAtual.nome_responsavel || '[seu nome]'}, autorizo o(a) atleta ${solicitacaoAtual.nome} a sair e retornar ao alojamento conforme informado nesta autorização.

Seus dados serão protegidos conforme nossa política de privacidade. 

Atenciosamente,
Serviço Social - Categoria de Base`;
    
    textoWhatsapp.value = mensagem;
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
