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
  async function carregarSolicitacao(id) { // Adicionado async
    if (!window.firebaseService) {
        console.error("FirebaseService não está disponível.");
        alert("Erro ao conectar com o banco de dados. Tente recarregar a página.");
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        // Tentar buscar do Firestore primeiro
        const resultado = await window.firebaseService.obterDocumento('solicitacoes', id);

        if (resultado.sucesso && resultado.dados) {
            solicitacaoAtual = resultado.dados;
            preencherDadosPagina(solicitacaoAtual);
        } else {
            // Fallback: Tentar buscar do localStorage (opcional, pode ser removido)
            console.warn("Solicitação não encontrada no Firestore, tentando localStorage (fallback).");
            const solicitacoesStorage = JSON.parse(localStorage.getItem('solicitacoes')) || [];
            const solicitacaoStorage = solicitacoesStorage.find(s => s.id === id);

            if (solicitacaoStorage) {
                solicitacaoAtual = solicitacaoStorage;
                preencherDadosPagina(solicitacaoAtual);
            } else {
                console.error("Erro ao buscar solicitação:", resultado.erro || 'Não encontrado no Firestore ou localStorage');
                alert('Solicitação não encontrada. Redirecionando para o painel.');
                window.location.href = 'dashboard.html';
            }
        }
    } catch (error) {
        console.error("Erro crítico ao carregar solicitação:", error);
        alert('Ocorreu um erro ao carregar os detalhes da solicitação. Redirecionando.');
        window.location.href = 'dashboard.html';
    }
  }

  // Função separada para preencher os dados na página
  function preencherDadosPagina(solicitacao) {
    // Armazenar a solicitação atual
    solicitacaoAtual = solicitacao;
    
    // Preencher os dados na página
    document.getElementById('nome-atleta').textContent = solicitacao.nome || 'N/A';
    document.getElementById('categoria-atleta').textContent = solicitacao.categoria || 'N/A';
    document.getElementById('data-nascimento').textContent = solicitacao.data_nascimento ? formatarData(solicitacao.data_nascimento) : 'N/A'; // Usar formatarData
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone || 'N/A';
    
    document.getElementById('data-saida').textContent = solicitacao.data_saida ? formatarData(solicitacao.data_saida) : 'N/A';
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida || 'N/A';
    document.getElementById('data-retorno').textContent = solicitacao.data_retorno ? formatarData(solicitacao.data_retorno) : 'N/A';
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno || 'N/A';
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino || 'N/A';
    
    document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel || 'N/A';
    document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel || 'N/A';
    
    const statusSupervisor = document.getElementById('status-supervisor');
    statusSupervisor.textContent = solicitacao.status_supervisor || 'Pendente';
    statusSupervisor.className = getStatusBadgeClass(solicitacao.status_supervisor);
    
    document.getElementById('data-aprovacao-supervisor').textContent = 
      solicitacao.data_aprovacao_supervisor ? 
      formatarData(solicitacao.data_aprovacao_supervisor) : 
      'N/A';
    
    const statusServicoSocial = document.getElementById('status-servico-social');
    statusServicoSocial.textContent = solicitacao.status_servico_social || 'Pendente';
    statusServicoSocial.className = getStatusBadgeClass(solicitacao.status_servico_social);

    document.getElementById('data-aprovacao-servico-social').textContent = 
      solicitacao.data_aprovacao_servico_social ? 
      formatarData(solicitacao.data_aprovacao_servico_social) : 
      'N/A';
    
    const statusFinal = document.getElementById('status-final');
    statusFinal.textContent = solicitacao.status_final || 'Em Análise';
    statusFinal.className = getStatusBadgeClass(solicitacao.status_final);
    
    // Desabilitar botões de validação para o monitor (apenas visualização)
    // Verificar se os botões existem antes de tentar desabilitar
    if(btnValidar) btnValidar.disabled = true;
    if(btnReprovar) btnReprovar.disabled = true;
    // Habilitar botão de WhatsApp se existir
    if(btnEnviarWhatsapp) btnEnviarWhatsapp.style.display = 'inline-block'; // Ou 'block'
  }

  // Função auxiliar para classes de badge (pode ser movida para um utilitário)
  function getStatusBadgeClass(status) {
      status = status ? status.toLowerCase() : 'pendente';
      if (status === 'aprovado' || status === 'autorizado') {
          return 'badge bg-success';
      } else if (status === 'reprovado' || status === 'não autorizado') {
          return 'badge bg-danger';
      } else { // Pendente, Em Análise, Pré-Aprovado
          return 'badge bg-warning text-dark';
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
