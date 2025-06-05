// Lógica para o painel do monitor
document.addEventListener("DOMContentLoaded", async function() { // Adicionado async
  const solicitacoesPreAprovadasContainer = document.getElementById("solicitacoes-pre-aprovadas");
  const todasSolicitacoesContainer = document.getElementById("todas-solicitacoes");
  const arquivosContainer = document.getElementById("arquivos"); // Renomeado para clareza
  const filtroStatusSelect = document.getElementById("filtro-status");
  const filtroCategoriaSelect = document.getElementById("filtro-categoria");
  const filtroDataInput = document.getElementById("filtro-data"); // Renomeado para clareza
  
  // Contadores
  const countPendentes = document.getElementById("count-pendentes");
  const countAprovadas = document.getElementById("count-aprovadas");
  const countReprovadas = document.getElementById("count-reprovadas");

  let todasSolicitacoesCache = []; // Cache para evitar múltiplas buscas no Firestore

  // Verificar dependências
  if (!window.firebaseService) {
      console.error("Erro crítico: FirebaseService não está disponível.");
      mostrarErro(todasSolicitacoesContainer, "Erro ao carregar serviços. Tente recarregar a página.");
      // Poderia adicionar mensagens de erro aos outros containers também
      return;
  }

  // --- Funções Auxiliares ---
  function mostrarLoading(container, mensagem = "Carregando...") {
      if (container) container.innerHTML = `<p class="text-center">${mensagem}</p>`;
  }

  function mostrarErro(container, mensagem) {
      if (container) container.innerHTML = `<p class="text-danger text-center">${mensagem}</p>`;
  }

  function formatarData(dataString) {
      if (!dataString) return "N/A";
      try {
          const data = new Date(dataString);
          if (isNaN(data.getTime())) return "Data inválida";
          return data.toLocaleDateString("pt-BR", {
              day: "2-digit", month: "2-digit", year: "numeric"
          });
      } catch (e) {
          return "Data inválida";
      }
  }

  function getStatusBadge(solicitacao) {
      let statusText = solicitacao.status_final || "Em Análise";
      let badgeClass = "bg-warning text-dark"; // Padrão para Pendente/Em Análise

      if (statusText === "Aprovado" || statusText === "Autorizado") {
          badgeClass = "bg-success";
          statusText = "Aprovado"; // Padronizar texto
      } else if (statusText === "Reprovado" || statusText === "Não Autorizado") {
          badgeClass = "bg-danger";
          statusText = "Reprovado"; // Padronizar texto
      } else if (solicitacao.status_supervisor === "Aprovado" && solicitacao.status_servico_social === "Pendente") {
          statusText = "Pré-Aprovado";
          // Mantém bg-warning
      }
      return `<span class="badge ${badgeClass}">${statusText}</span>`;
  }

  // --- Funções Principais ---

  async function carregarTodasSolicitacoesDoFirestore() {
      mostrarLoading(todasSolicitacoesContainer, "Carregando todas as solicitações...");
      try {
          const resultado = await window.firebaseService.obterDocumentos("solicitacoes");
          if (resultado.sucesso) {
              todasSolicitacoesCache = resultado.dados;
              console.log("Solicitações carregadas do Firestore:", todasSolicitacoesCache);
              aplicarFiltrosERenderizar();
              atualizarContadores(); // Atualiza contadores após carregar
              // Carregar pré-aprovadas e arquivos que dependem destes dados
              renderizarSolicitacoesPreAprovadas(); 
              renderizarArquivos();
          } else {
              throw new Error(resultado.erro || "Falha ao buscar solicitações.");
          }
      } catch (error) {
          console.error("Erro ao carregar todas as solicitações do Firestore:", error);
          mostrarErro(todasSolicitacoesContainer, `Erro ao carregar solicitações: ${error.message}`);
          // Mostrar erro nos outros containers também seria bom
          mostrarErro(solicitacoesPreAprovadasContainer, `Erro ao carregar solicitações.`);
          mostrarErro(arquivosContainer, `Erro ao carregar solicitações.`);
      }
  }

  function aplicarFiltrosERenderizar() {
      if (!todasSolicitacoesContainer) return;

      let filtradas = [...todasSolicitacoesCache];
      const statusFiltro = filtroStatusSelect ? filtroStatusSelect.value : "todos";
      const categoriaFiltro = filtroCategoriaSelect ? filtroCategoriaSelect.value : "todas";

      // Filtro de status
      if (statusFiltro !== "todos") {
          filtradas = filtradas.filter(s => {
              const finalStatus = s.status_final ? s.status_final.toLowerCase() : "em análise";
              const supervisorStatus = s.status_supervisor ? s.status_supervisor.toLowerCase() : "pendente";
              const servicoSocialStatus = s.status_servico_social ? s.status_servico_social.toLowerCase() : "pendente";

              if (statusFiltro === "pendente") return supervisorStatus === "pendente" || finalStatus === "em análise";
              if (statusFiltro === "pre-aprovado") return supervisorStatus === "aprovado" && servicoSocialStatus === "pendente";
              if (statusFiltro === "aprovado") return finalStatus === "aprovado" || finalStatus === "autorizado";
              if (statusFiltro === "reprovado") return finalStatus === "reprovado" || finalStatus === "não autorizado";
              return false; // Caso padrão, não deve acontecer com 'todos' tratado
          });
      }

      // Filtro de categoria
      if (categoriaFiltro !== "todas") {
          filtradas = filtradas.filter(s => s.categoria === categoriaFiltro);
      }

      // Ordenar por data de solicitação (mais recentes primeiro)
      filtradas.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

      if (filtradas.length === 0) {
          todasSolicitacoesContainer.innerHTML = 
              `<p class="text-center">Nenhuma solicitação encontrada com os filtros aplicados.</p>`;
          return;
      }

      // Construir o HTML da tabela
      const html = `
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Código</th>
              <th>Atleta</th>
              <th>Categoria</th>
              <th>Data Solicitação</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtradas.map(s => `
              <tr>
                <td>${s.id || "N/A"}</td>
                <td>${s.nome || "N/A"}</td>
                <td>${s.categoria || "N/A"}</td>
                <td>${formatarData(s.data_solicitacao)}</td>
                <td>${getStatusBadge(s)}</td>
                <td><a href="detalhe.html?id=${s.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      todasSolicitacoesContainer.innerHTML = html;
  }

  function renderizarSolicitacoesPreAprovadas() {
      if (!solicitacoesPreAprovadasContainer) return;

      const preAprovadas = todasSolicitacoesCache.filter(s => 
          s.status_supervisor === "Aprovado" && 
          s.status_servico_social === "Pendente"
      );

      if (preAprovadas.length === 0) {
          solicitacoesPreAprovadasContainer.innerHTML = 
              `<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>`;
          return;
      }

      const html = preAprovadas.map(s => `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${s.nome || "N/A"} • ${s.categoria || "N/A"}</h5>
              <p class="card-text mb-1"><strong>Destino:</strong> ${s.motivo_destino || "N/A"}</p>
              <p class="card-text mb-1"><strong>Período:</strong> ${formatarData(s.data_saida)} ${s.horario_saida || ""} até ${formatarData(s.data_retorno)} ${s.horario_retorno || ""}</p>
              <p class="card-text"><strong>Responsável:</strong> ${s.nome_responsavel || "N/A"} - ${s.telefone_responsavel || "N/A"}</p>
              <a href="detalhe.html?id=${s.id}" class="btn btn-primary mt-2">Ver Detalhes</a>
            </div>
          </div>
      `).join("");
      solicitacoesPreAprovadasContainer.innerHTML = html;
  }

  function renderizarArquivos() {
      if (!arquivosContainer) return;
      
      // Filtrar solicitações finalizadas (Aprovadas ou Reprovadas) do cache do Firestore
      let filtrados = todasSolicitacoesCache.filter(s => 
          s.status_final === "Aprovado" || 
          s.status_final === "Autorizado" ||
          s.status_final === "Reprovado" || 
          s.status_final === "Não Autorizado"
      );

      const dataFiltro = filtroDataInput ? filtroDataInput.value : null;

      if (dataFiltro) {
          const dataFiltroObj = new Date(dataFiltro);
          dataFiltroObj.setHours(0, 0, 0, 0);
          filtrados = filtrados.filter(a => {
              // Usar a data de solicitação ou uma nova propriedade de data de finalização, se existir
              const dataFinalizacao = new Date(a.data_solicitacao); // Ou a.data_finalizacao se você adicionar essa propriedade
              dataFinalizacao.setHours(0, 0, 0, 0);
              return dataFinalizacao.getTime() === dataFiltroObj.getTime();
          });
      }

      filtrados.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao)); // Ordenar por data de solicitação

      if (filtrados.length === 0) {
          arquivosContainer.innerHTML = 
              `<p class="text-center">Nenhum arquivo encontrado com os filtros aplicados.</p>`;
          return;
      }

      const html = `
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Código</th>
              <th>Atleta</th>
              <th>Categoria</th>
              <th>Data Solicitação</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtrados.map(a => `
              <tr>
                <td>${a.id || "N/A"}</td>
                <td>${a.nome || "N/A"}</td>
                <td>${a.categoria || "N/A"}</td>
                <td>${formatarData(a.data_solicitacao)}</td>
                <td>${getStatusBadge(a)}</td> 
                <td><a href="detalhe.html?id=${a.id}" class="btn btn-primary btn-sm">Ver</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
      arquivosContainer.innerHTML = html;
  }

  function atualizarContadores() {
      if (!countPendentes || !countAprovadas || !countReprovadas) return;

      const pendentes = todasSolicitacoesCache.filter(s => 
          (s.status_supervisor === "Pendente") || 
          (s.status_supervisor === "Aprovado" && s.status_servico_social === "Pendente") ||
          (s.status_final === "Em Análise")
      ).length;
      
      const aprovadas = todasSolicitacoesCache.filter(s => 
          s.status_final === "Aprovado" || s.status_final === "Autorizado"
      ).length;
      
      const reprovadas = todasSolicitacoesCache.filter(s => 
          s.status_final === "Reprovado" || s.status_final === "Não Autorizado"
      ).length;
      
      countPendentes.textContent = pendentes;
      countAprovadas.textContent = aprovadas;
      countReprovadas.textContent = reprovadas;
  }

  // --- Inicialização e Eventos ---

  // Adicionar listeners para os filtros
  if (filtroStatusSelect) {
      filtroStatusSelect.addEventListener("change", aplicarFiltrosERenderizar);
  }
  if (filtroCategoriaSelect) {
      filtroCategoriaSelect.addEventListener("change", aplicarFiltrosERenderizar);
  }
  if (filtroDataInput) {
      // O filtro de data afeta apenas a seção 'Arquivos' que ainda usa localStorage
      filtroDataInput.addEventListener("change", renderizarArquivos);
  }

  // Carregar os dados iniciais do Firestore
  await carregarTodasSolicitacoesDoFirestore();

});

