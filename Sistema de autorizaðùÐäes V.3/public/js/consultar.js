// Lógica para a tela de consulta de solicitações (Refatorada para Firestore)
document.addEventListener("DOMContentLoaded", async function () {
  const btnConsultar = document.getElementById("btn-consultar");
  const inputCodigo = document.getElementById("codigo");
  const resultadoConsulta = document.getElementById("resultado-consulta");
  const solicitacoesRecentesContainer = document.getElementById("solicitacoes-recentes");
  const loadingIndicatorConsulta = document.getElementById("loading-indicator-consulta"); // Para consulta específica
  const loadingIndicatorRecentes = document.getElementById("loading-indicator-recentes"); // Para lista de recentes
  const alertContainerConsulta = document.getElementById("alert-container-consulta"); // Alertas para consulta
  const alertContainerRecentes = document.getElementById("alert-container-recentes"); // Alertas para recentes

  // Verificar dependências
  if (!window.AutorizacaoService) {
    console.error("AutorizacaoService não encontrado!");
    mostrarAlerta("Erro crítico: Serviço de dados indisponível.", "alert-danger", alertContainerConsulta);
    mostrarAlerta("Erro crítico: Serviço de dados indisponível.", "alert-danger", alertContainerRecentes);
    return;
  }

  // Verificar se há um ID na URL (redirecionamento após envio)
  const urlParams = new URLSearchParams(window.location.search);
  const idConsultaUrl = urlParams.get("id");

  if (idConsultaUrl) {
    inputCodigo.value = idConsultaUrl;
    await consultarSolicitacao(idConsultaUrl);
  }

  // Carregar solicitações recentes (assíncrono)
  await carregarSolicitacoesRecentes();

  // Manipulador do botão de consulta
  btnConsultar.addEventListener("click", async function () {
    const codigo = inputCodigo.value.trim();

    if (!codigo) {
      mostrarAlerta("Por favor, digite um código de solicitação.", "alert-warning", alertContainerConsulta);
      resultadoConsulta.style.display = "none"; // Esconde área de resultado
      return;
    }

    await consultarSolicitacao(codigo);
  });

  // Função para mostrar/ocultar indicador de carregamento
  function setLoading(isLoading, indicator) {
    if (indicator) {
      indicator.style.display = isLoading ? "block" : "none";
    }
  }

  // Função para exibir alertas
  function mostrarAlerta(mensagem, tipo, container) {
    if (!container) {
      console.error("Container de alerta não encontrado!");
      alert(mensagem); // Fallback
      return;
    }
    container.innerHTML = `<div class="alert ${tipo} alert-dismissible fade show" role="alert">
                              ${mensagem}
                              <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>`;
    container.style.display = "block";
  }

  // Função para consultar uma solicitação específica (assíncrona)
  async function consultarSolicitacao(codigo) {
    setLoading(true, loadingIndicatorConsulta);
    resultadoConsulta.style.display = "none"; // Esconde resultado anterior
    mostrarAlerta("Consultando solicitação...", "alert-info", alertContainerConsulta);

    try {
      // Usar o serviço (assíncrono) para buscar a solicitação
      const solicitacao = await window.AutorizacaoService.buscarSolicitacao(codigo);

      if (!solicitacao) {
        mostrarAlerta("Solicitação não encontrada. Verifique o código e tente novamente.", "alert-danger", alertContainerConsulta);
        setLoading(false, loadingIndicatorConsulta);
        return;
      }

      // Construir o HTML do resultado
      const html = construirHtmlDetalhes(solicitacao);
      resultadoConsulta.innerHTML = html;
      resultadoConsulta.style.display = "block";
      mostrarAlerta("Consulta realizada com sucesso.", "alert-success", alertContainerConsulta);
      setTimeout(() => { if (alertContainerConsulta) alertContainerConsulta.style.display = 'none'; }, 3000);

    } catch (error) {
      console.error("Erro ao consultar solicitação:", error);
      mostrarAlerta("Erro ao realizar a consulta. Tente novamente mais tarde.", "alert-danger", alertContainerConsulta);
    } finally {
      setLoading(false, loadingIndicatorConsulta);
    }
  }

  // Função para carregar solicitações recentes (assíncrona)
  async function carregarSolicitacoesRecentes() {
    setLoading(true, loadingIndicatorRecentes);
    mostrarAlerta("Carregando solicitações recentes...", "alert-info", alertContainerRecentes);
    solicitacoesRecentesContainer.innerHTML = "<p>Carregando...</p>";

    try {
      // Usar o serviço (assíncrono) para listar solicitações
      // Idealmente, o serviço deveria permitir buscar apenas as do usuário logado
      // ou limitar a quantidade no backend.
      // Por enquanto, buscamos todas e filtramos/limitamos no frontend.
      const todasSolicitacoes = await window.AutorizacaoService.listarSolicitacoes();

      // Simulação: Pegar as 5 mais recentes (já ordenadas pelo serviço)
      const recentes = todasSolicitacoes.slice(0, 5);

      if (recentes.length === 0) {
        solicitacoesRecentesContainer.innerHTML = '<p class="text-center">Nenhuma solicitação recente encontrada.</p>';
        mostrarAlerta("Nenhuma solicitação recente.", "alert-secondary", alertContainerRecentes);
      } else {
        // Construir o HTML das solicitações recentes
        const html = recentes.map(construirHtmlRecente).join("");
        solicitacoesRecentesContainer.innerHTML = html;
        mostrarAlerta(`${recentes.length} solicitações recentes carregadas.`, "alert-success", alertContainerRecentes);
        setTimeout(() => { if (alertContainerRecentes) alertContainerRecentes.style.display = 'none'; }, 3000);
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações recentes:", error);
      solicitacoesRecentesContainer.innerHTML = '<p class="text-center text-danger">Erro ao carregar solicitações.</p>';
      mostrarAlerta("Erro ao buscar solicitações recentes.", "alert-danger", alertContainerRecentes);
    } finally {
      setLoading(false, loadingIndicatorRecentes);
    }
  }

  // Função auxiliar para obter a classe do badge com base no status
  function getBadgeClass(status) {
    switch (status) {
      case "Aprovado": return "bg-success";
      case "Reprovado": return "bg-danger";
      case "Pendente": return "bg-secondary";
      default: return "bg-warning text-dark"; // Em Análise ou outros
    }
  }

  // Função para construir o HTML dos detalhes de uma solicitação
  function construirHtmlDetalhes(solicitacao) {
    const statusFinal = solicitacao.status_final || "Em Análise";
    const statusSupervisor = solicitacao.status_supervisor || "Pendente";
    const statusServicoSocial = solicitacao.status_servico_social || "Pendente";

    return `
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Detalhes da Solicitação: ${solicitacao.id || "N/A"}</h5>
                <span class="badge ${getBadgeClass(statusFinal)}">${statusFinal}</span>
            </div>
            <div class="card-body">
                <p><strong>Data da Solicitação:</strong> ${window.AutorizacaoService.formatarData(solicitacao.data_solicitacao) || "N/A"}</p>
                <hr>
                <h6>Dados da Saída</h6>
                <p><strong>Data de Saída:</strong> ${window.AutorizacaoService.formatarData(solicitacao.data_saida) || "N/A"}</p>
                <p><strong>Horário de Saída:</strong> ${solicitacao.horario_saida || "N/A"}</p>
                <p><strong>Data de Retorno:</strong> ${window.AutorizacaoService.formatarData(solicitacao.data_retorno) || "N/A"}</p>
                <p><strong>Horário de Retorno:</strong> ${solicitacao.horario_retorno || "N/A"}</p>
                <p><strong>Motivo/Destino:</strong> ${solicitacao.motivo_destino || "N/A"}</p>
                <hr>
                <h6>Status de Aprovação</h6>
                <p><strong>Supervisor:</strong> <span class="badge ${getBadgeClass(statusSupervisor)}">${statusSupervisor}</span></p>
                ${solicitacao.observacao_supervisor ? `<p class="text-muted small"><em>Obs. Supervisor: ${solicitacao.observacao_supervisor}</em></p>` : ''}
                <p><strong>Serviço Social:</strong> <span class="badge ${getBadgeClass(statusServicoSocial)}">${statusServicoSocial}</span></p>
                ${solicitacao.observacao_servico_social ? `<p class="text-muted small"><em>Obs. Serviço Social: ${solicitacao.observacao_servico_social}</em></p>` : ''}
            </div>
        </div>
    `;
  }

  // Função para construir o HTML de uma solicitação recente
  function construirHtmlRecente(solicitacao) {
    const statusFinal = solicitacao.status_final || "Em Análise";
    return `
        <div class="card mb-2">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="card-title mb-0">${solicitacao.id || "N/A"}</h6>
                    <span class="badge ${getBadgeClass(statusFinal)}">${statusFinal}</span>
                </div>
                <p class="card-text small mb-1"><strong>Data:</strong> ${window.AutorizacaoService.formatarData(solicitacao.data_solicitacao) || "N/A"}</p>
                <p class="card-text small mb-2"><strong>Destino:</strong> ${solicitacao.motivo_destino || "N/A"}</p>
                <button class="btn btn-outline-primary btn-sm" 
                        onclick="document.getElementById('codigo').value='${solicitacao.id}'; document.getElementById('btn-consultar').click();">
                    Ver Detalhes
                </button>
            </div>
        </div>
    `;
  }

  // Tornar a função de consulta acessível globalmente se o botão usa onclick="consultarSolicitacao(...)"
  // No entanto, o código atual usa addEventListener, então isso não é estritamente necessário.
  // window.consultarSolicitacao = consultarSolicitacao; 
});

