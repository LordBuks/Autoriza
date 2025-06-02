// Lógica para o painel do serviço social
document.addEventListener('DOMContentLoaded', function() {
  const solicitacoesPreAprovadas = document.getElementById('solicitacoes-pre-aprovadas');
  const historicoValidacoes = document.getElementById('historico-validacoes');
  const filtroStatus = document.getElementById('filtro-status');
  const detalhesContainer = document.getElementById('detalhes-solicitacao');
  
  // Elementos dos botões de ação
  let btnEnviarLink;
  let btnStatusFinal;
  let btnGerarPdf;
  
  // Solicitação atual sendo visualizada
  let solicitacaoAtual = null;
  
  // Carregar solicitações pré-aprovadas
  carregarSolicitacoesPreAprovadas();
  
  // Carregar histórico de validações
  carregarHistoricoValidacoes();
  
  // Adicionar evento de mudança ao filtro de status
  filtroStatus.addEventListener('change', function() {
    carregarHistoricoValidacoes();
  });
  
  // Função para carregar solicitações pré-aprovadas
  function carregarSolicitacoesPreAprovadas() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Filtrar apenas as solicitações aprovadas pelo supervisor e pendentes de validação do serviço social
    const preAprovadas = solicitacoes.filter(s => 
      s.status_supervisor === 'Aprovado' && 
      s.status_servico_social === 'Pendente'
    );
    
    if (preAprovadas.length === 0) {
      solicitacoesPreAprovadas.innerHTML = '<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>';
      return;
    }
    
    // Construir o HTML das solicitações pré-aprovadas
    const html = preAprovadas.map(s => {
      const dataSaida = new Date(s.data_saida);
      const dataRetorno = new Date(s.data_retorno);
      
      return `
        <div class="card" style="margin-bottom: 15px;">
          <h3>${s.nome} • ${s.categoria}</h3>
          <p>🏠 Destino: ${s.motivo_destino}</p>
          <p>📅 Período: ${formatarData(dataSaida)} ${s.horario_saida} até ${formatarData(dataRetorno)} ${s.horario_retorno}</p>
          <p>📱 Responsável: ${s.nome_responsavel} - ${s.telefone_responsavel}</p>
          <div style="margin-top: 16px;">
            <button class="btn btn-primary btn-visualizar" data-id="${s.id}">Ver Detalhes</button>
          </div>
        </div>
      `;
    }).join('');
    
    solicitacoesPreAprovadas.innerHTML = html;
    
    // Adicionar eventos aos botões de visualização
    document.querySelectorAll('.btn-visualizar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        carregarDetalhesSolicitacao(id);
      });
    });
  }
  
  // Função para carregar detalhes de uma solicitação
  function carregarDetalhesSolicitacao(id) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Encontrar a solicitação pelo ID
    const solicitacao = solicitacoes.find(s => s.id === id);
    
    if (!solicitacao) {
      alert('Solicitação não encontrada.');
      return;
    }
    
    // Armazenar a solicitação atual
    solicitacaoAtual = solicitacao;
    
    // Preencher os dados na página
    document.getElementById('solicitacao-id').textContent = solicitacao.id;
    document.getElementById('nome-atleta').textContent = solicitacao.nome;
    document.getElementById('categoria-atleta').textContent = solicitacao.categoria;
    document.getElementById('telefone-atleta').textContent = solicitacao.telefone;
    
    document.getElementById('nome-responsavel').textContent = solicitacao.nome_responsavel;
    document.getElementById('telefone-responsavel').textContent = solicitacao.telefone_responsavel;
    
    document.getElementById('data-saida').textContent = formatarData(new Date(solicitacao.data_saida));
    document.getElementById('horario-saida').textContent = solicitacao.horario_saida;
    document.getElementById('data-retorno').textContent = formatarData(new Date(solicitacao.data_retorno));
    document.getElementById('horario-retorno').textContent = solicitacao.horario_retorno;
    document.getElementById('motivo-destino').textContent = solicitacao.motivo_destino;
    
    // Atualizar status
    const statusSupervisor = document.getElementById('status-supervisor');
    statusSupervisor.textContent = solicitacao.status_supervisor;
    statusSupervisor.className = `badge ${solicitacao.status_supervisor === 'Aprovado' ? 'bg-success' : 'bg-danger'}`;
    
    const statusServicoSocial = document.getElementById('status-servico-social');
    statusServicoSocial.textContent = solicitacao.status_servico_social;
    if (solicitacao.status_servico_social === 'Aprovado') {
      statusServicoSocial.className = 'badge bg-success';
    } else if (solicitacao.status_servico_social === 'Reprovado') {
      statusServicoSocial.className = 'badge bg-danger';
    } else {
      statusServicoSocial.className = 'badge bg-warning';
    }
    
    const statusFinal = document.getElementById('status-final');
    statusFinal.textContent = solicitacao.status_final || 'Em Análise';
    if (solicitacao.status_final === 'Autorizado') {
      statusFinal.className = 'badge bg-success';
    } else if (solicitacao.status_final === 'Não Autorizado') {
      statusFinal.className = 'badge bg-danger';
    } else {
      statusFinal.className = 'badge bg-warning';
    }
    
    // Exibir o container de detalhes
    detalhesContainer.style.display = 'block';
    
    // Configurar botões de ação
    btnEnviarLink = document.getElementById('btn-enviar-link');
    btnStatusFinal = document.getElementById('btn-status-final');
    btnGerarPdf = document.getElementById('btn-gerar-pdf');
    
    // Adicionar eventos aos botões
    btnEnviarLink.addEventListener('click', enviarLinkPais);
    btnStatusFinal.addEventListener('click', definirStatusFinal);
    btnGerarPdf.addEventListener('click', gerarRelatorioPdf);
  }
  
  // Função para enviar link aos pais
  function enviarLinkPais() {
    if (!solicitacaoAtual) return;
    
    const numeroTelefone = solicitacaoAtual.telefone_responsavel;
    
    // Gerar link único para aprovação dos pais
    const token = gerarToken();
    const linkAprovacao = `${window.location.origin}/templates/pais/aprovacao.html?id=${solicitacaoAtual.id}&token=${token}`;
    
    // Simular envio de WhatsApp (em um sistema real, isso seria feito pelo backend)
    const mensagem = `Olá ${solicitacaoAtual.nome_responsavel}, o atleta ${solicitacaoAtual.nome} solicitou autorização para sair. Por favor, acesse o link para aprovar ou reprovar: ${linkAprovacao}`;
    console.log('Mensagem para WhatsApp:', mensagem);
    
    // Registrar evento de auditoria
    if (window.auditoriaService) {
      window.auditoriaService.registrarEnvioLinkPais(
        solicitacaoAtual.id,
        numeroTelefone,
        'WhatsApp'
      ).then(resultado => {
        if (resultado.sucesso) {
          alert('Link enviado com sucesso! O link foi registrado no sistema de auditoria.');
          
          // Em um sistema real, aqui seria feita a chamada para a API de WhatsApp
          // Por enquanto, apenas simulamos abrindo o link do WhatsApp
          const whatsappUrl = `https://wa.me/${numeroTelefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
          window.open(whatsappUrl, '_blank');
        } else {
          alert('Erro ao registrar envio do link: ' + resultado.erro);
        }
      }).catch(erro => {
        console.error('Erro ao registrar evento de auditoria:', erro);
        alert('Erro ao registrar evento de auditoria: ' + erro.message);
      });
    } else {
      alert('Serviço de auditoria não disponível');
    }
  }
  
  // Função para definir status final
  function definirStatusFinal() {
    if (!solicitacaoAtual) return;
    
    const statusFinal = prompt('Digite o status final (Autorizado/Não Autorizado):');
    if (!statusFinal) return;
    
    const observacao = prompt('Observação (opcional):');
    
    // Registrar evento de auditoria
    if (window.auditoriaService) {
      window.auditoriaService.registrarStatusFinal(
        solicitacaoAtual.id,
        statusFinal,
        observacao
      ).then(resultado => {
        if (resultado.sucesso) {
          alert('Status final registrado com sucesso!');
          
          // Atualizar status na solicitação
          const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
          const index = solicitacoes.findIndex(s => s.id === solicitacaoAtual.id);
          
          if (index !== -1) {
            solicitacoes[index].status_final = statusFinal;
            if (observacao) {
              solicitacoes[index].observacao_final = observacao;
            }
            localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
            
            // Atualizar a interface
            const statusFinalElement = document.getElementById('status-final');
            statusFinalElement.textContent = statusFinal;
            
            if (statusFinal === 'Autorizado') {
              statusFinalElement.className = 'badge bg-success';
            } else if (statusFinal === 'Não Autorizado') {
              statusFinalElement.className = 'badge bg-danger';
            } else {
              statusFinalElement.className = 'badge bg-warning';
            }
          }
        } else {
          alert('Erro ao registrar status final: ' + resultado.erro);
        }
      }).catch(erro => {
        console.error('Erro ao registrar evento de auditoria:', erro);
        alert('Erro ao registrar evento de auditoria: ' + erro.message);
      });
    } else {
      alert('Serviço de auditoria não disponível');
    }
  }
  
  // Função para gerar relatório PDF
  function gerarRelatorioPdf() {
    if (!solicitacaoAtual) return;
    
    if (window.pdfService) {
      window.pdfService.gerarRelatorioPdf(solicitacaoAtual.id)
        .then(resultado => {
          if (resultado.sucesso) {
            alert('PDF gerado com sucesso! O arquivo será baixado automaticamente.');
          } else {
            alert('Erro ao gerar PDF: ' + resultado.erro);
          }
        })
        .catch(erro => {
          console.error('Erro ao gerar PDF:', erro);
          alert('Erro ao gerar PDF: ' + erro.message);
        });
    } else {
      alert('Serviço de PDF não disponível');
    }
  }
  
  // Função para carregar histórico de validações
  function carregarHistoricoValidacoes() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Filtrar solicitações que já foram analisadas pelo serviço social
    let historico = solicitacoes.filter(s => s.status_servico_social !== 'Pendente');
    
    // Aplicar filtro de status, se necessário
    const filtro = filtroStatus.value;
    if (filtro !== 'todos') {
      historico = historico.filter(s => {
        if (filtro === 'aprovado') return s.status_servico_social === 'Aprovado';
        if (filtro === 'reprovado') return s.status_servico_social === 'Reprovado';
        return true;
      });
    }
    
    // Ordenar por data de solicitação (mais recentes primeiro)
    historico.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
    
    if (historico.length === 0) {
      historicoValidacoes.innerHTML = '<p class="text-center">Nenhum histórico encontrado.</p>';
      return;
    }
    
    // Construir o HTML do histórico
    const html = `
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Atleta</th>
            <th>Categoria</th>
            <th>Data</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${historico.map(s => {
            const dataSolicitacao = new Date(s.data_solicitacao);
            let badgeClass = 'badge-pending';
            if (s.status_servico_social === 'Aprovado') {
              badgeClass = 'badge-approved';
            } else if (s.status_servico_social === 'Reprovado') {
              badgeClass = 'badge-rejected';
            }
            
            return `
              <tr>
                <td>${s.id}</td>
                <td>${s.nome}</td>
                <td>${s.categoria}</td>
                <td>${formatarData(dataSolicitacao)}</td>
                <td><span class="badge ${badgeClass}">${s.status_servico_social}</span></td>
                <td><button class="btn btn-primary btn-sm btn-visualizar" data-id="${s.id}">Ver</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    historicoValidacoes.innerHTML = html;
    
    // Adicionar eventos aos botões de visualização do histórico
    document.querySelectorAll('.btn-visualizar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        carregarDetalhesSolicitacao(id);
      });
    });
  }
  
  // Função para formatar data
  function formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Função para gerar token único
  function gerarToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
});
