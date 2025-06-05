// Lógica para a tela de detalhe do serviço social
document.addEventListener('DOMContentLoaded', async function() {
  // Elementos da página
  const btnEnviarWhatsapp = document.getElementById('btn-enviar-whatsapp');
  const btnValidar = document.getElementById('btn-validar');
  const btnReprovar = document.getElementById('btn-reprovar');
  const mensagemWhatsapp = document.getElementById('mensagem-whatsapp');
  const textoWhatsapp = document.getElementById('texto-whatsapp');
  const btnCopiar = document.getElementById('btn-copiar');
  const btnAbrirWhatsapp = document.getElementById('btn-abrir-whatsapp');
  const btnFecharMensagem = document.getElementById('btn-fechar-mensagem');
  const modalObservacao = document.getElementById('modal-observacao');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnCancelar = document.getElementById('btn-cancelar');
  
  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'validar' ou 'reprovar'
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
    acaoAtual = 'validar';
    modalObservacao.style.display = 'block';
  });
  
  btnReprovar.addEventListener('click', function() {
    acaoAtual = 'reprovar';
    modalObservacao.style.display = 'block';
  });
  
  btnConfirmar.addEventListener('click', function() {
    const observacao = document.getElementById('observacao').value;
    
    if (acaoAtual === 'validar') {
      validarAutorizacao(observacao);
    } else if (acaoAtual === 'reprovar') {
      reprovarAutorizacao(observacao);
    }
    
    modalObservacao.style.display = 'none';
  });
  
  btnCancelar.addEventListener('click', function() {
    modalObservacao.style.display = 'none';
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
    const linkWhatsapp = window.whatsAppService.gerarLinkWhatsApp(telefone, mensagem);
    if (linkWhatsapp) {
      window.open(linkWhatsapp, "_blank");
    } else {
      alert("Não foi possível gerar o link do WhatsApp. Verifique o número de telefone.");
    }
  });
  
  btnFecharMensagem.addEventListener('click', function() {
    mensagemWhatsapp.style.display = 'none';
  });
  
  // Função para carregar os dados da solicitação
  async function carregarSolicitacao(id) {
    const solicitacao = await window.AutorizacaoService.buscarSolicitacao(id);
    
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
    
    const statusAtual = document.getElementById('status-atual');
    statusAtual.textContent = solicitacao.status_servico_social;
    
    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_servico_social === 'Aprovado') {
      statusAtual.className = 'badge badge-approved';
      // Desabilitar botões se já aprovado
      btnValidar.disabled = true;
      btnReprovar.disabled = true;
    } else if (solicitacao.status_servico_social === 'Reprovado') {
      statusAtual.className = 'badge badge-rejected';
      // Desabilitar botões se já reprovado
      btnValidar.disabled = true;
      btnReprovar.disabled = true;
    } else {
      statusAtual.className = 'badge badge-pending';
    }
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

Informamos que o(a) atleta abaixo solicitou autorização de saída, conforme Lei Pelé (Art. 29) e LGPD (Lei nº 13.709/2018):

🙋🏽 Nome: ${solicitacaoAtual.nome}
📅 Saída: ${fmt(solicitacaoAtual.data_saida, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_saida}
📅 Retorno: ${fmt(solicitacaoAtual.data_retorno, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_retorno}
📍 Destino: ${solicitacaoAtual.motivo_destino}

Para autorizar, responda com a seguinte declaração:
*Eu, ${solicitacaoAtual.nome_responsavel || '[seu nome]'}, autorizo o(a) atleta ${solicitacaoAtual.nome} a sair e retornar ao alojamento conforme informado, em conformidade com a Lei Pelé e LGPD.*

Seus dados serão protegidos conforme nossa política de privacidade. Contato do DPO: ${DPO_EMAIL}.

Atenciosamente,
Serviço Social - Sport Club Internacional`;
    
    textoWhatsapp.value = mensagem;
  }
  
  // Função para validar a autorização
  async function validarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;
    
    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        'servico_social',
        'Aprovado',
        observacao
      );

      if (resultado.sucesso) {
        alert('Autorização validada com sucesso!');
        window.location.reload();
      } else {
        alert(`Erro ao validar autorização: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error('Erro ao validar autorização:', error);
      alert('Ocorreu um erro ao validar a autorização. Tente novamente.');
    }
  }
  
  // Função para reprovar a autorização
  async function reprovarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;
    
    // Verificar se a observação foi fornecida (obrigatória para reprovação)
    if (!observacao.trim()) {
      alert("É necessário fornecer um motivo para a reprovação.");
      return;
    }

    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        "servico_social",
        "Reprovado",
        observacao
      );

      if (resultado.sucesso) {
        alert("Autorização reprovada.");
        window.location.reload();
      } else {
        alert(`Erro ao reprovar autorização: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error("Erro ao reprovar autorização:", error);
      alert("Ocorreu um erro ao reprovar a autorização. Tente novamente.");
    }
  }
  
  // Função para gerar hash único para validação legal
  // function gerarHashUnico(dados) {
  //   // Em um sistema real, usaríamos um algoritmo de hash criptográfico
  //   // Aqui, vamos simular um hash baseado nos dados e timestamp
  //   const timestamp = new Date().getTime();
  //   const randomStr = Math.random().toString(36).substring(2, 15);
  //   return `HASH-${timestamp}-${randomStr}-${dados.id}`;
  // }
  
  // Função para arquivar a autorização
  // function arquivarAutorizacao(dados, tipo) {
  //   // Em um sistema real, salvaríamos em um banco de dados ou sistema de arquivos
  //   // Aqui, vamos simular o arquivamento no localStorage
    
  //   // Recuperar arquivos existentes ou inicializar objeto vazio
  //   let arquivos = JSON.parse(localStorage.getItem("arquivos")) || {};
    
  //   // Inicializar a categoria se não existir
  //   if (!arquivos[tipo]) {
  //     arquivos[tipo] = [];
  //   }
    
  //   // Adicionar data e hora de arquivamento
  //   const dadosArquivados = {
  //     ...dados,
  //     data_arquivamento: new Date().toISOString(),
  //     id_arquivo: `${tipo.toUpperCase()}-${new Date().getTime()}-${dados.id}`
  //   };
    
  //   // Adicionar ao arquivo
  //   arquivos[tipo].push(dadosArquivados);
    
  //   // Salvar no localStorage
  //   localStorage.setItem("arquivos", JSON.stringify(arquivos));
    
  //   console.log(`Autorização ${dados.id} arquivada em ${tipo}`);
  // }
  
  // Função para formatar data
  function formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
});
