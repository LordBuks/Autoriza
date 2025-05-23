// Lógica para a tela de consulta de solicitações
document.addEventListener('DOMContentLoaded', function() {
  const btnConsultar = document.getElementById('btn-consultar');
  const resultadoConsulta = document.getElementById('resultado-consulta');
  const solicitacoesRecentes = document.getElementById('solicitacoes-recentes');
  
  // Verificar se há um ID na URL (redirecionamento após envio)
  const urlParams = new URLSearchParams(window.location.search);
  const idConsulta = urlParams.get('id');
  
  if (idConsulta) {
    document.getElementById('codigo').value = idConsulta;
    consultarSolicitacao(idConsulta);
  }
  
  // Carregar solicitações recentes
  carregarSolicitacoesRecentes();
  
  // Manipulador do botão de consulta
  btnConsultar.addEventListener('click', function() {
    const codigo = document.getElementById('codigo').value.trim();
    
    if (!codigo) {
      mostrarResultado('<div class="alert alert-danger">Por favor, digite um código de solicitação.</div>');
      return;
    }
    
    consultarSolicitacao(codigo);
  });
  
  // Função para consultar uma solicitação específica
  function consultarSolicitacao(codigo) {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Buscar a solicitação pelo ID
    const solicitacao = solicitacoes.find(s => s.id === codigo);
    
    if (!solicitacao) {
      mostrarResultado('<div class="alert alert-danger">Solicitação não encontrada. Verifique o código e tente novamente.</div>');
      return;
    }
    
    // Formatar datas para exibição
    const dataSolicitacao = new Date(solicitacao.data_solicitacao);
    const dataSaida = new Date(solicitacao.data_saida);
    const dataRetorno = new Date(solicitacao.data_retorno);
    
    // Determinar a classe do badge com base no status
    let badgeClass = 'badge-pending';
    if (solicitacao.status_final === 'Aprovado') {
      badgeClass = 'badge-approved';
    } else if (solicitacao.status_final === 'Reprovado') {
      badgeClass = 'badge-rejected';
    }
    
    // Construir o HTML do resultado
    const html = `
      <div class="auth-details">
        <h3>Detalhes da Solicitação</h3>
        <p><strong>Código:</strong> ${solicitacao.id}</p>
        <p><strong>Data da Solicitação:</strong> ${formatarData(dataSolicitacao)}</p>
        <p><strong>Status:</strong> <span class="badge ${badgeClass}">${solicitacao.status_final}</span></p>
        
        <h3>Dados da Saída</h3>
        <p><strong>Data de Saída:</strong> ${formatarData(dataSaida)}</p>
        <p><strong>Horário de Saída:</strong> ${solicitacao.horario_saida}</p>
        <p><strong>Data de Retorno:</strong> ${formatarData(dataRetorno)}</p>
        <p><strong>Horário de Retorno:</strong> ${solicitacao.horario_retorno}</p>
        <p><strong>Motivo/Destino:</strong> ${solicitacao.motivo_destino}</p>
        
        <h3>Status de Aprovação</h3>
        <p><strong>Supervisor:</strong> ${solicitacao.status_supervisor}</p>
        <p><strong>Serviço Social:</strong> ${solicitacao.status_servico_social}</p>
      </div>
    `;
    
    mostrarResultado(html);
  }
  
  // Função para mostrar o resultado da consulta
  function mostrarResultado(html) {
    resultadoConsulta.innerHTML = html;
    resultadoConsulta.style.display = 'block';
  }
  
  // Função para carregar solicitações recentes
  function carregarSolicitacoesRecentes() {
    // Recuperar solicitações do localStorage
    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoes')) || [];
    
    // Filtrar apenas as solicitações do atleta atual (em um sistema real, usaríamos o ID do usuário logado)
    // Aqui, vamos simular mostrando as 5 solicitações mais recentes
    const recentesSorted = [...solicitacoes].sort((a, b) => {
      return new Date(b.data_solicitacao) - new Date(a.data_solicitacao);
    }).slice(0, 5);
    
    if (recentesSorted.length === 0) {
      solicitacoesRecentes.innerHTML = '<p class="text-center">Nenhuma solicitação encontrada.</p>';
      return;
    }
    
    // Construir o HTML das solicitações recentes
    const html = recentesSorted.map(s => {
      // Determinar a classe do badge com base no status
      let badgeClass = 'badge-pending';
      if (s.status_final === 'Aprovado') {
        badgeClass = 'badge-approved';
      } else if (s.status_final === 'Reprovado') {
        badgeClass = 'badge-rejected';
      }
      
      return `
        <div class="auth-details" style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0;">${s.id}</h4>
            <span class="badge ${badgeClass}">${s.status_final}</span>
          </div>
          <p><strong>Data:</strong> ${formatarData(new Date(s.data_solicitacao))}</p>
          <p><strong>Destino:</strong> ${s.motivo_destino}</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('codigo').value='${s.id}'; document.getElementById('btn-consultar').click();">Ver Detalhes</button>
        </div>
      `;
    }).join('');
    
    solicitacoesRecentes.innerHTML = html;
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
