// Lógica para o painel do serviço social
document.addEventListener('DOMContentLoaded', function() {
  const solicitacoesPreAprovadas = document.getElementById('solicitacoes-pre-aprovadas');
  const historicoValidacoes = document.getElementById('historico-validacoes');
  const filtroStatus = document.getElementById('filtro-status');
  
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
            <a href="detalhe.html?id=${s.id}" class="btn btn-primary">Ver Detalhes</a>
          </div>
        </div>
      `;
    }).join('');
    
    solicitacoesPreAprovadas.innerHTML = html;
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
                <td><a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    historicoValidacoes.innerHTML = html;
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
