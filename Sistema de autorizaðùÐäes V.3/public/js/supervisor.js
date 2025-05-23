// Lógica para o painel do supervisor
document.addEventListener('DOMContentLoaded', function() {
  const solicitacoesPendentes = document.getElementById('solicitacoes-pendentes');
  const historicoAprovacoes = document.getElementById('historico-aprovacoes');
  const filtroStatus = document.getElementById('filtro-status');
  
  // Carregar solicitações pendentes
  carregarSolicitacoesPendentes();
  
  // Carregar histórico de aprovações
  carregarHistoricoAprovacoes();
  
  // Adicionar evento de mudança ao filtro de status
  filtroStatus.addEventListener('change', function() {
    carregarHistoricoAprovacoes();
  });
  
  // Função para carregar solicitações pendentes
  function carregarSolicitacoesPendentes() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Filtrar apenas as solicitações pendentes de aprovação do supervisor
    // Em um sistema real, filtraríamos também pela categoria do supervisor logado
    const pendentes = solicitacoes.filter(s => s.status_supervisor === 'Pendente');
    
    if (pendentes.length === 0) {
      solicitacoesPendentes.innerHTML = '<p class="text-center">Nenhuma solicitação pendente encontrada.</p>';
      return;
    }
    
    // Construir o HTML das solicitações pendentes
    const html = pendentes.map(s => {
      const dataSaida = new Date(s.data_saida);
      const dataRetorno = new Date(s.data_retorno);
      
      return `
        <div class="card" style="margin-bottom: 15px;">
          <h3>${s.nome} • ${s.categoria}</h3>
          <p>🏠 Destino: ${s.motivo_destino}</p>
          <p>📅 Período: ${formatarData(dataSaida)} ${s.horario_saida} até ${formatarData(dataRetorno)} ${s.horario_retorno}</p>
          <div style="margin-top: 16px;">
            <a href="detalhe.html?id=${s.id}" class="btn btn-primary">Ver Detalhes</a>
          </div>
        </div>
      `;
    }).join('');
    
    solicitacoesPendentes.innerHTML = html;
  }
  
  // Função para carregar histórico de aprovações
  function carregarHistoricoAprovacoes() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Filtrar solicitações que já foram analisadas pelo supervisor
    // Em um sistema real, filtraríamos também pela categoria do supervisor logado
    let historico = solicitacoes.filter(s => s.status_supervisor !== 'Pendente');
    
    // Aplicar filtro de status, se necessário
    const filtro = filtroStatus.value;
    if (filtro !== 'todos') {
      historico = historico.filter(s => {
        if (filtro === 'aprovado') return s.status_supervisor === 'Aprovado';
        if (filtro === 'reprovado') return s.status_supervisor === 'Reprovado';
        return true;
      });
    }
    
    // Ordenar por data de solicitação (mais recentes primeiro)
    historico.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
    
    if (historico.length === 0) {
      historicoAprovacoes.innerHTML = '<p class="text-center">Nenhum histórico encontrado.</p>';
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
            if (s.status_supervisor === 'Aprovado') {
              badgeClass = 'badge-approved';
            } else if (s.status_supervisor === 'Reprovado') {
              badgeClass = 'badge-rejected';
            }
            
            return `
              <tr>
                <td>${s.id}</td>
                <td>${s.nome}</td>
                <td>${s.categoria}</td>
                <td>${formatarData(dataSolicitacao)}</td>
                <td><span class="badge ${badgeClass}">${s.status_supervisor}</span></td>
                <td><a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    historicoAprovacoes.innerHTML = html;
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
