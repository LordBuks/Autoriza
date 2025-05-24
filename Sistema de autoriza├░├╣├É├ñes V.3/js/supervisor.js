/**
 * Controlador do Dashboard do Supervisor - Sistema de Autorizações Digitais
 * 
 * Este módulo é responsável por carregar e exibir as solicitações
 * pendentes e o histórico no painel do supervisor, aplicando filtros.
 */

document.addEventListener("DOMContentLoaded", async function() {
    const solicitacoesPendentesContainer = document.getElementById("solicitacoes-pendentes");
    const historicoAprovacoesContainer = document.getElementById("historico-aprovacoes");
    const filtroStatusSelect = document.getElementById("filtro-status");
    const loadingPendentes = document.createElement("p");
    loadingPendentes.className = "text-center";
    loadingPendentes.textContent = "Carregando solicitações pendentes...";
    const loadingHistorico = document.createElement("p");
    loadingHistorico.className = "text-center";
    loadingHistorico.textContent = "Carregando histórico...";

    let supervisorCategoria = null; // Armazenará a categoria do supervisor logado
    let todasSolicitacoes = []; // Cache das solicitações buscadas

    // Verificar dependências
    if (!window.AutorizacaoService || !window.firebaseService) {
        console.error("Erro crítico: Serviços essenciais (AutorizacaoService ou FirebaseService) não estão disponíveis.");
        if (solicitacoesPendentesContainer) solicitacoesPendentesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços. Tente recarregar a página.</p>';
        if (historicoAprovacoesContainer) historicoAprovacoesContainer.innerHTML = 
            '<p class="text-danger text-center">Erro ao carregar serviços.</p>';
        return;
    }

    // --- Funções Auxiliares ---

    function mostrarLoading(container, loadingElement) {
        if (container) container.innerHTML = ""; // Limpa antes de mostrar loading
        if (container) container.appendChild(loadingElement);
    }

    function mostrarErro(container, mensagem) {
        if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
    }

    function getBadgeClass(status) {
        switch (status) {
            case "Aprovado": return "bg-success";
            case "Reprovado": return "bg-danger";
            default: return "bg-warning text-dark";
        }
    }

    function renderizarSolicitacoes(container, solicitacoes, tipo) {
        if (!container) return;

        if (solicitacoes.length === 0) {
            const mensagemSemSolicitacoes = tipo === "pendentes" 
                ? "Nenhuma solicitação pendente encontrada."
                : "Nenhuma solicitação encontrada no histórico.";
            container.innerHTML = `<p class="text-center">${mensagemSemSolicitacoes}</p>`;
            return;
        }

        container.innerHTML = ""; // Limpar container
        const listGroup = document.createElement("div");
        listGroup.className = "list-group";

        solicitacoes.forEach(sol => {
            const item = document.createElement("a");
            item.href = `detalhe.html?id=${sol.id}`;
            item.className = "list-group-item list-group-item-action flex-column align-items-start";

            const statusSupervisor = sol.status_supervisor || "Pendente";
            const statusServicoSocial = sol.status_servico_social || "Pendente";
            const statusFinal = sol.status_final || "Em Análise";

            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${sol.nome || "Nome não informado"} (${sol.categoria || "Cat. N/A"})</h5>
                    <small>${window.AutorizacaoService.formatarData(sol.data_solicitacao) || "Data N/A"}</small>
                </div>
                <p class="mb-1">Motivo: ${sol.motivo_destino || "Não informado"}</p>
                <small>
                    Status Supervisor: <span class="badge ${getBadgeClass(statusSupervisor)}">${statusSupervisor}</span>
                    ${tipo === "historico" ? ` | Status S. Social: <span class="badge ${getBadgeClass(statusServicoSocial)}">${statusServicoSocial}</span> | Status Final: <span class="badge ${getBadgeClass(statusFinal)}">${statusFinal}</span>` : ""}
                </small>
            `;
            listGroup.appendChild(item);
        });
        container.appendChild(listGroup);
    }

    async function carregarDadosDashboard() {
        mostrarLoading(solicitacoesPendentesContainer, loadingPendentes);
        mostrarLoading(historicoAprovacoesContainer, loadingHistorico);

        try {
            // 1. Obter UID do supervisor da sessão
            const sessionData = JSON.parse(localStorage.getItem("current_session"));
            if (!sessionData || !sessionData.uid || sessionData.profile !== "supervisor") {
                throw new Error("Sessão de supervisor inválida ou não encontrada.");
            }
            const supervisorUid = sessionData.uid;

            // 2. Buscar dados do supervisor (tentar obter categoria)
            let filtros = {}; // Inicia sem filtros
            try {
                const supervisorDoc = await window.firebaseService.obterDocumento("usuarios", supervisorUid);
                if (supervisorDoc.sucesso && supervisorDoc.dados && supervisorDoc.dados.categoria) {
                    supervisorCategoria = supervisorDoc.dados.categoria;
                    console.log("Supervisor logado pertence à categoria:", supervisorCategoria);
                    filtros = { categoria: supervisorCategoria }; // Define o filtro se a categoria existir
                } else {
                    console.warn(`Supervisor ${supervisorUid} não tem campo 'categoria' definido no Firestore. Exibindo todas as solicitações.`);
                    // Não define o filtro, buscará todas as solicitações
                }
            } catch (error) {
                 console.error("Erro ao buscar dados do supervisor no Firestore:", error);
                 // Continua sem filtro, mas loga o erro
                 console.warn("Não foi possível buscar a categoria do supervisor. Exibindo todas as solicitações.");
            }

            // 3. Buscar as solicitações (com ou sem filtro de categoria)
            todasSolicitacoes = await window.AutorizacaoService.listarSolicitacoes(filtros);

            // 4. Filtrar e renderizar pendentes e histórico inicial (todos)
            filtrarERenderizar();

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            mostrarErro(solicitacoesPendentesContainer, `Erro ao carregar solicitações: ${error.message}`);
            mostrarErro(historicoAprovacoesContainer, `Erro ao carregar histórico: ${error.message}`);
        }
    }

    function filtrarERenderizar() {
        const filtroStatus = filtroStatusSelect ? filtroStatusSelect.value : "todos";

        // Filtrar Pendentes (apenas as que o supervisor ainda não decidiu)
        const pendentes = todasSolicitacoes.filter(s => 
            (!s.status_supervisor || s.status_supervisor === "Pendente")
        );
        renderizarSolicitacoes(solicitacoesPendentesContainer, pendentes, "pendentes");

        // Filtrar Histórico (todas que o supervisor já decidiu ou que foram finalizadas)
        let historico = todasSolicitacoes.filter(s => 
            (s.status_supervisor && s.status_supervisor !== "Pendente") || 
            (s.status_final && s.status_final !== "Em Análise")
        );

        // Aplicar filtro de status do histórico
        if (filtroStatus !== "todos") {
            historico = historico.filter(s => {
                // Considera o status final para o filtro, mas pode ajustar
                const statusParaFiltrar = s.status_final || s.status_supervisor; // Fallback para status do supervisor se final não definido
                return statusParaFiltrar.toLowerCase() === filtroStatus.toLowerCase();
            });
        }
        renderizarSolicitacoes(historicoAprovacoesContainer, historico, "historico");
    }

    // --- Inicialização e Eventos ---

    // Adicionar listener para o filtro de status do histórico
    if (filtroStatusSelect) {
        filtroStatusSelect.addEventListener("change", filtrarERenderizar);
    }

    // Carregar os dados iniciais
    await carregarDadosDashboard();

});
