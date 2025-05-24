// Lógica para o painel do monitor
document.addEventListener('DOMContentLoaded', function() {
  const solicitacoesPreAprovadas = document.getElementById('solicitacoes-pre-aprovadas');
  const todasSolicitacoes = document.getElementById('todas-solicitacoes');
  const arquivos = document.getElementById('arquivos');
  const filtroStatus = document.getElementById('filtro-status');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const filtroData = document.getElementById('filtro-data');
  
  // Contadores
  const countPendentes = document.getElementById('count-pendentes');
  const countAprovadas = document.getElementById('count-aprovadas');
  const countReprovadas = document.getElementById('count-reprovadas');
  
  // Carregar solicitações pré-aprovadas
  carregarSolicitacoesPreAprovadas();
  
  // Carregar todas as solicitações
  carregarTodasSolicitacoes();
  
  // Carregar arquivos
  carregarArquivos();
  
  // Atualizar contadores
  atualizarContadores();
  
  // Adicionar eventos de mudança aos filtros
  filtroStatus.addEventListener('change', function() {
    carregarTodasSolicitacoes();
  });
  
  filtroCategoria.addEventListener('change', function() {
    carregarTodasSolicitacoes();
  });
  
  filtroData.addEventListener('change', function() {
    carregarArquivos();
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
  
  // Função para carregar todas as solicitações
  function carregarTodasSolicitacoes() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Aplicar filtros
    let filtradas = [...solicitacoes];
    
    // Filtro de status
    const status = filtroStatus.value;
    if (status !== 'todos') {
      filtradas = filtradas.filter(s => {
        if (status === 'pendente') return s.status_supervisor === 'Pendente';
        if (status === 'pre-aprovado') return s.status_supervisor === 'Aprovado' && s.status_servico_social === 'Pendente';
        if (status === 'aprovado') return s.status_final === 'Aprovado';
        if (status === 'reprovado') return s.status_final === 'Reprovado';
        return true;
      });
    }
    
    // Filtro de categoria
    const categoria = filtroCategoria.value;
    if (categoria !== 'todas') {
      filtradas = filtradas.filter(s => s.categoria === categoria);
    }
    
    // Ordenar por data de solicitação (mais recentes primeiro)
    filtradas.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
    
    if (filtradas.length === 0) {
      todasSolicitacoes.innerHTML = '<p class="text-center">Nenhuma solicitação encontrada.</p>';
      return;
    }
    
    // Construir o HTML de todas as solicitações
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
          ${filtradas.map(s => {
            const dataSolicitacao = new Date(s.data_solicitacao);
            let badgeClass = 'badge-pending';
            let statusText = s.status_final;
            
            if (s.status_final === 'Aprovado') {
              badgeClass = 'badge-approved';
            } else if (s.status_final === 'Reprovado') {
              badgeClass = 'badge-rejected';
            } else if (s.status_supervisor === 'Aprovado' && s.status_servico_social === 'Pendente') {
              statusText = 'Pré-Aprovado';
            }
            
            return `
              <tr>
                <td>${s.id}</td>
                <td>${s.nome}</td>
                <td>${s.categoria}</td>
                <td>${formatarData(dataSolicitacao)}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td><a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    todasSolicitacoes.innerHTML = html;
  }
  
  // Função para carregar arquivos
  function carregarArquivos() {
    // Recuperar arquivos do localStorage
    const arquivosData = JSON.parse(localStorage.getItem('arquivos')) || {};
    
    // Combinar arquivos aprovados e reprovados
    const todosArquivos = [
      ...(arquivosData.aprovadas || []),
      ...(arquivosData.reprovadas || [])
    ];
    
    // Aplicar filtro de data, se necessário
    let filtrados = [...todosArquivos];
    const dataFiltro = filtroData.value;
    
    if (dataFiltro) {
      const dataFiltroObj = new Date(dataFiltro);
      dataFiltroObj.setHours(0, 0, 0, 0);
      
      filtrados = filtrados.filter(a => {
        const dataArquivamento = new Date(a.data_arquivamento);
        dataArquivamento.setHours(0, 0, 0, 0);
        return dataArquivamento.getTime() === dataFiltroObj.getTime();
      });
    }
    
    // Ordenar por data de arquivamento (mais recentes primeiro)
    filtrados.sort((a, b) => new Date(b.data_arquivamento) - new Date(a.data_arquivamento));
    
    if (filtrados.length === 0) {
      arquivos.innerHTML = '<p class="text-center">Nenhum arquivo encontrado.</p>';
      return;
    }
    
    // Construir o HTML dos arquivos
    const html = `
      <table class="table">
        <thead>
          <tr>
            <th>ID Arquivo</th>
            <th>Atleta</th>
            <th>Categoria</th>
            <th>Data Arquivamento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtrados.map(a => {
            const dataArquivamento = new Date(a.data_arquivamento);
            let badgeClass = a.status_final === 'Aprovado' ? 'badge-approved' : 'badge-rejected';
            
            return `
              <tr>
                <td>${a.id_arquivo}</td>
                <td>${a.nome}</td>
                <td>${a.categoria}</td>
                <td>${formatarData(dataArquivamento)}</td>
                <td><span class="badge ${badgeClass}">${a.status_final}</span></td>
                <td><a href="detalhe.html?id=${a.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    arquivos.innerHTML = html;
  }
  
  // Função para atualizar contadores
  function atualizarContadores() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Contar por status
    const pendentes = solicitacoes.filter(s => 
      s.status_supervisor === 'Pendente' || 
      (s.status_supervisor === 'Aprovado' && s.status_servico_social === 'Pendente')
    ).length;
    
    const aprovadas = solicitacoes.filter(s => s.status_final === 'Aprovado').length;
    const reprovadas = solicitacoes.filter(s => s.status_final === 'Reprovado').length;
    
    // Atualizar contadores na interface
    countPendentes.textContent = pendentes;
    countAprovadas.textContent = aprovadas;
    countReprovadas.textContent = reprovadas;
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
