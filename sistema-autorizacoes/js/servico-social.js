// Lógica para o painel do serviço social
document.addEventListener("DOMContentLoaded", async function() { // Adicionado async
    const solicitacoesPreAprovadasContainer = document.getElementById("solicitacoes-pre-aprovadas");
    const historicoValidacoesContainer = document.getElementById("historico-validacoes");
    const filtroStatusSelect = document.getElementById("filtro-status");
    const detalhesContainer = document.getElementById("detalhes-solicitacao"); // Container para detalhes
    
    // Elementos dos botões de ação (serão buscados quando os detalhes forem carregados)
    let btnEnviarLink;
    let btnStatusFinal;
    let btnGerarPdf;
    
    // Solicitação atual sendo visualizada
    let solicitacaoAtual = null;
    let todasSolicitacoesCache = []; // Cache para dados do Firestore
  
    // Verificar dependências
    console.log("Verificando serviços:", {
      firebase: !!window.firebaseService,
      auditoria: !!window.auditoriaService,
      pdf: !!window.pdfService
    });
    if (!window.firebaseService || !window.auditoriaService || !window.pdfService) {
        console.error("Erro crítico: Serviços essenciais (Firebase, Auditoria, PDF) não estão disponíveis.");
        mostrarErro(solicitacoesPreAprovadasContainer, "Erro ao carregar serviços. Tente recarregar a página.");
        mostrarErro(historicoValidacoesContainer, "Erro ao carregar serviços.");
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
  
    function getStatusBadge(status, tipo = "final") {
        let statusText = status || (tipo === "final" ? "Em Análise" : "Pendente");
        let badgeClass = "bg-warning text-dark"; // Padrão
  
        if (statusText === "Aprovado" || statusText === "Autorizado") {
            badgeClass = "bg-success";
            statusText = "Aprovado";
        } else if (statusText === "Reprovado" || statusText === "Não Autorizado") {
            badgeClass = "bg-danger";
            statusText = "Reprovado";
        }
        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    }
  
    function gerarToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
  
    // --- Funções Principais ---
  
    async function carregarTodasSolicitacoesDoFirestore() {
        mostrarLoading(solicitacoesPreAprovadasContainer, "Carregando solicitações...");
        mostrarLoading(historicoValidacoesContainer, "Carregando histórico...");
        try {
            const resultado = await window.firebaseService.obterDocumentos("solicitacoes");
            if (resultado.sucesso) {
                todasSolicitacoesCache = resultado.dados;
                console.log("Solicitações carregadas do Firestore para Serviço Social:", todasSolicitacoesCache);
                renderizarSolicitacoesPreAprovadas();
                renderizarHistoricoValidacoes(); // Renderiza com filtro inicial "todos"
            } else {
                throw new Error(resultado.erro || "Falha ao buscar solicitações.");
            }
        } catch (error) {
            console.error("Erro ao carregar solicitações do Firestore:", error);
            mostrarErro(solicitacoesPreAprovadasContainer, `Erro ao carregar: ${error.message}`);
            mostrarErro(historicoValidacoesContainer, `Erro ao carregar: ${error.message}`);
        }
    }
  
    function renderizarSolicitacoesPreAprovadas() {
        if (!solicitacoesPreAprovadasContainer) return;
  
        // Modificado para incluir solicitações que foram aprovadas pelos pais mas ainda estão pendentes no serviço social
        const preAprovadas = todasSolicitacoesCache.filter(s => 
            s.status_supervisor === "Aprovado" && 
            (s.status_servico_social === "Pendente" || !s.status_servico_social)
        );
  
        if (preAprovadas.length === 0) {
            solicitacoesPreAprovadasContainer.innerHTML = 
                `<p class="text-center">Nenhuma solicitação pré-aprovada encontrada.</p>`;
            return;
        }
  
        const html = preAprovadas.map(s => {
            // Verificar se os pais já tomaram uma decisão
            const decisaoPais = s.status_pais ? `<span class="badge ${s.status_pais === 'Aprovado' ? 'bg-success' : 'bg-danger'}">${s.status_pais}</span>` : '<span class="badge bg-warning text-dark">Pendente</span>';
            
            return `
            <div class="card mb-3">
              <div class="card-body">
                <h5 class="card-title">${s.nome || "N/A"} • ${s.categoria || "N/A"}</h5>
                <p class="card-text mb-1"><strong>Destino:</strong> ${s.motivo_destino || "N/A"}</p>
                <p class="card-text mb-1"><strong>Período:</strong> ${formatarData(s.data_saida)} ${s.horario_saida || ""} até ${formatarData(s.data_retorno)} ${s.horario_retorno || ""}</p>
                <p class="card-text"><strong>Responsável:</strong> ${s.nome_responsavel || "N/A"} - ${s.telefone_responsavel || "N/A"}</p>
                <p class="card-text"><strong>Decisão dos Pais:</strong> ${decisaoPais}</p>
                <button class="btn btn-primary mt-2 btn-visualizar" data-id="${s.id}">Ver Detalhes</button>
              </div>
            </div>
        `}).join("");
        solicitacoesPreAprovadasContainer.innerHTML = html;
  
        // Adicionar eventos aos botões de visualização DESTA seção
        solicitacoesPreAprovadasContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
            btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
            btn.addEventListener("click", handleVisualizarClick);
        });
    }
  
    function renderizarHistoricoValidacoes() {
        if (!historicoValidacoesContainer) return;
  
        let historico = todasSolicitacoesCache.filter(s => 
            s.status_servico_social && s.status_servico_social !== "Pendente"
        );
  
        const filtro = filtroStatusSelect ? filtroStatusSelect.value : "todos";
        if (filtro !== "todos") {
            historico = historico.filter(s => {
                const statusServSoc = s.status_servico_social ? s.status_servico_social.toLowerCase() : "";
                if (filtro === "aprovado") return statusServSoc === "aprovado";
                if (filtro === "reprovado") return statusServSoc === "reprovado";
                return false;
            });
        }
  
        historico.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
  
        if (historico.length === 0) {
            historicoValidacoesContainer.innerHTML = 
                `<p class="text-center">Nenhum histórico encontrado com os filtros aplicados.</p>`;
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
                <th>Status Serviço Social</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${historico.map(s => `
                <tr>
                  <td>${s.id || "N/A"}</td>
                  <td>${s.nome || "N/A"}</td>
                  <td>${s.categoria || "N/A"}</td>
                  <td>${formatarData(s.data_solicitacao)}</td>
                  <td>${getStatusBadge(s.status_servico_social, "servico_social")}</td>
                  <td><button class="btn btn-primary btn-sm btn-visualizar" data-id="${s.id}">Ver</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
        historicoValidacoesContainer.innerHTML = html;
  
        // Adicionar eventos aos botões de visualização DESTA seção
        historicoValidacoesContainer.querySelectorAll(".btn-visualizar").forEach(btn => {
            btn.removeEventListener("click", handleVisualizarClick); // Remove listener antigo se houver
            btn.addEventListener("click", handleVisualizarClick);
        });
    }
  
    function handleVisualizarClick() {
        const id = this.getAttribute("data-id");
        carregarDetalhesSolicitacao(id);
    }
  
      async function carregarDetalhesSolicitacao(id) {
          if (!detalhesContainer) return;
          // Mostrar o container e definir campos como "Carregando..." individualmente
          detalhesContainer.style.display = "block";
          document.getElementById("solicitacao-id").textContent = "Carregando...";
          document.getElementById("nome-atleta").textContent = "Carregando...";
          document.getElementById("categoria-atleta").textContent = "Carregando...";
          document.getElementById("telefone-atleta").textContent = "Carregando...";
          document.getElementById("nome-responsavel").textContent = "Carregando...";
          document.getElementById("telefone-responsavel").textContent = "Carregando...";
          document.getElementById("data-saida").textContent = "Carregando...";
          document.getElementById("horario-saida").textContent = "Carregando...";
          document.getElementById("data-retorno").textContent = "Carregando...";
          document.getElementById("horario-retorno").textContent = "Carregando...";
          document.getElementById("motivo-destino").textContent = "Carregando...";
          document.getElementById("status-supervisor").innerHTML = "Carregando...";
          document.getElementById("status-servico-social").innerHTML = "Carregando...";
          document.getElementById("status-final").innerHTML = "Carregando...";
          document.getElementById("status-pais").innerHTML = "Carregando..."; // Adicionado
          // Limpar botões de ação anteriores
          const acoesServicoSocialContainer = document.getElementById("acoes-servico-social");
          if (acoesServicoSocialContainer) acoesServicoSocialContainer.innerHTML = "";
  
          // Buscar a solicitação específica no Firestore
          try {
              const resultado = await window.firebaseService.obterDocumento("solicitacoes", id);
              if (!resultado.sucesso) {
                  throw new Error(resultado.erro || "Solicitação não encontrada.");
              }
              solicitacaoAtual = resultado.dados;
  
              // Preencher os dados na seção de detalhes (agora que os elementos existem)
              document.getElementById("solicitacao-id").textContent = solicitacaoAtual.id || "N/A";
              document.getElementById("nome-atleta").textContent = solicitacaoAtual.nome || "N/A";
              document.getElementById("categoria-atleta").textContent = solicitacaoAtual.categoria || "N/A";
              document.getElementById("telefone-atleta").textContent = solicitacaoAtual.telefone || "N/A";
              
              document.getElementById("nome-responsavel").textContent = solicitacaoAtual.nome_responsavel || "N/A";
              document.getElementById("telefone-responsavel").textContent = solicitacaoAtual.telefone_responsavel || "N/A";
              
              document.getElementById("data-saida").textContent = formatarData(solicitacaoAtual.data_saida);
              document.getElementById("horario-saida").textContent = solicitacaoAtual.horario_saida || "N/A";
              document.getElementById("data-retorno").textContent = formatarData(solicitacaoAtual.data_retorno);
              document.getElementById("horario-retorno").textContent = solicitacaoAtual.horario_retorno || "N/A";
              document.getElementById("motivo-destino").textContent = solicitacaoAtual.motivo_destino || "N/A";
              
              // Atualizar badges de status
              document.getElementById("status-supervisor").innerHTML = getStatusBadge(solicitacaoAtual.status_supervisor, "supervisor");
              document.getElementById("status-servico-social").innerHTML = getStatusBadge(solicitacaoAtual.status_servico_social, "servico_social");
              document.getElementById("status-final").innerHTML = getStatusBadge(solicitacaoAtual.status_final, "final");
              document.getElementById("status-pais").innerHTML = getStatusBadge(solicitacaoAtual.status_pais, "pais"); // Adicionado
              
              // Configurar botões de ação (buscar elementos aqui para garantir que existam)
              btnEnviarLink = document.getElementById("btn-enviar-link");
              btnStatusFinal = document.getElementById("btn-status-final");
              btnGerarPdf = document.getElementById("btn-gerar-pdf");
              
              // Remover listeners antigos e adicionar novos
              if(btnEnviarLink) {
                   btnEnviarLink.removeEventListener("click", enviarLinkPais);
                  btnEnviarLink.addEventListener("click", enviarLinkPais);
                  
                  // Sempre habilitar o botão de enviar/reenviar
                  btnEnviarLink.disabled = false;

                  // Adicionar botão de 'Ver Link' se já foi enviado
                  const acoesServicoSocialContainer = document.getElementById("acoes-servico-social");
                  if (solicitacaoAtual.data_envio_link_pais) {
                      btnEnviarLink.textContent = "Reenviar Link aos Pais";
                      // Remover botão 'Ver Link' antigo para evitar duplicação
                      let btnVerLinkExistente = document.getElementById("btn-ver-link");
                      if (btnVerLinkExistente) {
                          btnVerLinkExistente.remove();
                      }
                      const btnVerLink = document.createElement("button");
                      btnVerLink.id = "btn-ver-link";
                      btnVerLink.className = "btn btn-secondary mt-2";
                      btnVerLink.textContent = "Ver Link Enviado";
                      acoesServicoSocialContainer.appendChild(btnVerLink);
                  } else {
                      btnEnviarLink.textContent = "Enviar Link aos Pais";
                      // Remover botão 'Ver Link' se não houver link enviado
                      let btnVerLinkExistente = document.getElementById("btn-ver-link");
                      if (btnVerLinkExistente) {
                          btnVerLinkExistente.remove();
                      }
                  }
              }
              
              if(btnStatusFinal) {
                  btnStatusFinal.removeEventListener("click", definirStatusFinal);
                  btnStatusFinal.addEventListener("click", definirStatusFinal);
                  
                  // Habilitar o botão apenas se os pais já tomaram uma decisão
                  if (solicitacaoAtual.status_pais && solicitacaoAtual.status_servico_social === "Pendente") {
                      btnStatusFinal.disabled = false;
                      btnStatusFinal.textContent = "Definir Status Final";
                  } else {
                      btnStatusFinal.disabled = true;
                      btnStatusFinal.textContent = "Aguardando Decisão dos Pais";
                  }
              }
              
              if(btnGerarPdf) {
                  btnGerarPdf.removeEventListener("click", gerarRelatorioPdf);
                  btnGerarPdf.addEventListener("click", gerarRelatorioPdf);
                  
                  // Desabilitar se PDF já foi gerado
                  if (solicitacaoAtual.pdf_gerado) {
                      btnGerarPdf.disabled = true;
                      btnGerarPdf.textContent = "PDF Gerado";
                  } else if (!solicitacaoAtual.status_pais) {
                      btnGerarPdf.disabled = true;
                      btnGerarPdf.textContent = "Aguardando Pais";
                  } else {
                      btnGerarPdf.disabled = false;
                      btnGerarPdf.textContent = "Gerar PDF Final";
                  }
              }
  
              // REMOVIDO: Adicionar botões específicos do Serviço Social (Aprovar/Reprovar)
              if (acoesServicoSocialContainer) {
                  acoesServicoSocialContainer.innerHTML = ""; // Limpa o container para evitar duplicação
              }
  
          } catch (error) {
              console.error("Erro ao carregar detalhes da solicitação:", error);
              mostrarErro(detalhesContainer, `Erro ao carregar detalhes: ${error.message}`);
              solicitacaoAtual = null; // Limpa a solicitação atual em caso de erro
          }
      }
  
    async function atualizarStatusServicoSocial(novoStatus) {
        if (!solicitacaoAtual || !solicitacaoAtual.id) {
            alert("Nenhuma solicitação selecionada para atualizar.");
            return;
        }
  
        const observacao = prompt(`Digite uma observação para ${novoStatus} (opcional):`);
        
        const dadosAtualizacao = {
            status_servico_social: novoStatus,
            data_validacao_servico_social: new Date().toISOString(),
            observacao_servico_social: observacao || ""
        };
  
        // Determinar o status final baseado na aprovação do serviço social
        // Assumindo que a aprovação do supervisor já ocorreu (pois está na lista pré-aprovada)
        dadosAtualizacao.status_final = (novoStatus === "Aprovado") ? "Autorizado" : "Não Autorizado";
  
        try {
            mostrarLoading(detalhesContainer, "Atualizando status...");
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
  
            if (resultado.sucesso) {
                alert(`Solicitação ${novoStatus.toLowerCase()} pelo Serviço Social com sucesso!`);
                
                // Registrar auditoria
                if (window.auditoriaService) {
                    window.auditoriaService.registrarEvento(
                        "definicao_status_final",
                        solicitacaoAtual.id,
                        { status_final: statusFinal, decisao_servico_social: statusFinal }
                    ).catch(err => console.error("Erro ao registrar auditoria Serv. Social:", err));
                }
                
                // Recarregar dados
                await carregarTodasSolicitacoesDoFirestore();
                await carregarDetalhesSolicitacao(solicitacaoAtual.id);
            } else {
                throw new Error(resultado.erro || "Falha ao definir status final.");
            }
        } catch (error) {
            console.error("Erro ao atualizar status do Serviço Social:", error);
            alert(`Erro ao atualizar status: ${error.message}`);
            // Recarregar detalhes para mostrar o estado anterior em caso de falha
            await carregarDetalhesSolicitacao(solicitacaoAtual.id); 
        }
    }
  
    // --- Funções de Ação ---
    async function enviarLinkPais() {
        if (!solicitacaoAtual || !solicitacaoAtual.id) return;
        
        const numeroTelefone = solicitacaoAtual.telefone_responsavel;
        if (!numeroTelefone) {
            alert("Número de telefone do responsável não encontrado.");
            return;
        }

        // Gerar link único para aprovação dos pais (esta lógica pode precisar ir para o backend/Cloud Functions)
        const token = gerarToken(); 
        const linkAprovacao = `${window.location.origin}/pais/aprovacao.html?id=${solicitacaoAtual.id}&token=${token}`;
        
        // Gerar link para o mockup (para demonstração e conformidade legal)
        const linkMockup = `${window.location.origin}/pais/mockup-aprovacao.html?id=${solicitacaoAtual.id}`;
        
        // Perguntar ao usuário qual link enviar
        let linkParaEnviar = linkAprovacao;
        let tipoLink = "funcional";

        const mensagem = `Prezado(a) Sr(a). ${solicitacaoAtual.nome_responsavel || "Responsável"},

O Sport Club Internacional, através do Serviço Social, informa que o(a) atleta ${solicitacaoAtual.nome || ""} solicitou uma autorização para ${solicitacaoAtual.motivo_destino || "sair"}. 

Para sua segurança e para garantir a integridade do processo, solicitamos que acesse o link abaixo para analisar e, se for o caso, aprovar ou reprovar a solicitação:

${linkParaEnviar}

Contamos com sua colaboração para a segurança e bem-estar de nossos atletas.

Atenciosamente,
Serviço Social do Sport Club Internacional`;
        console.log("Mensagem para WhatsApp:", mensagem);
        
        // Registrar evento de auditoria e data de envio do link
        try {
            // Atualizar a solicitação com a data de envio do link para referência futura
            await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, { 
                data_envio_link_pais: firebase.firestore.FieldValue.serverTimestamp(),
                tipo_link_enviado: tipoLink
            });
            
            const resultadoAuditoria = await window.auditoriaService.registrarEnvioLinkPais(
                solicitacaoAtual.id,
                numeroTelefone,
                `WhatsApp (${tipoLink})`
            );
            
            if (resultadoAuditoria.sucesso) {
                alert(`Link de ${tipoLink === 'mockup' ? 'demonstração' : 'aprovação'} gerado e registrado. Abra o WhatsApp para enviar.`);
                const whatsappUrl = `https://wa.me/${numeroTelefone.replace(/\D/g, "" )}?text=${encodeURIComponent(mensagem)}`;
                window.open(whatsappUrl, "_blank");
                
                // Desabilitar o botão após o envio
                if (btnEnviarLink) {
                    btnEnviarLink.disabled = true;
                    btnEnviarLink.textContent = `Link Enviado`;
                }
                
                // Recarregar detalhes para refletir as mudanças
                await carregarDetalhesSolicitacao(solicitacaoAtual.id);
            } else {
                throw new Error(resultadoAuditoria.erro || "Falha ao registrar auditoria.");
            }
        } catch (error) {
            console.error("Erro no processo de envio do link:", error);
            alert(`Erro ao enviar link: ${error.message}`);
        }
    }
  
    async function definirStatusFinal() {
        if (!solicitacaoAtual || !solicitacaoAtual.id) {
            alert("Nenhuma solicitação selecionada.");
            return;
        }
        
        // Verificar se os pais já tomaram uma decisão
        if (!solicitacaoAtual.status_pais) {
            alert("Os pais ainda não tomaram uma decisão. O status final só pode ser definido após a decisão dos pais.");
            return;
        }
        
        // PERGUNTAR AO SERVIÇO SOCIAL A DECISÃO FINAL
        const decisaoServicoSocial = prompt(
            `A decisão dos pais foi: ${solicitacaoAtual.status_pais}.\n\nQual a decisão final do Serviço Social para esta solicitação?\nDigite 'Aprovado' ou 'Reprovado'.`
        );
  
        if (decisaoServicoSocial === null) { // Usuário clicou em Cancelar
            return;
        }
  
        const novoStatusServicoSocial = decisaoServicoSocial.trim().toLowerCase();
  
        if (novoStatusServicoSocial !== 'aprovado' && novoStatusServicoSocial !== 'reprovado') {
            alert("Decisão inválida. Por favor, digite 'Aprovado' ou 'Reprovado'.");
            return;
        }
  
        const statusFinal = (novoStatusServicoSocial === 'aprovado') ? 'Aprovado' : 'Reprovado';
        
        try {
            // Atualizar o status do serviço social e o status final
            const dadosAtualizacao = {
                status_servico_social: statusFinal,
                status_final: statusFinal,
                data_status_final: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, dadosAtualizacao);
            
            if (resultado.sucesso) {
                alert(`Status final definido como ${statusFinal} com sucesso!`);
                
                // Registrar na auditoria
                if (window.auditoriaService) {
                    window.auditoriaService.registrarEvento(
                        "definicao_status_final",
                        solicitacaoAtual.id,
                        { status_final: statusFinal, decisao_servico_social: statusFinal }
                    ).catch(err => console.error("Erro ao registrar auditoria de status final:", err));
                }
                
                // Recarregar dados
                await carregarTodasSolicitacoesDoFirestore();
                await carregarDetalhesSolicitacao(solicitacaoAtual.id);
            } else {
                throw new Error(resultado.erro || "Falha ao definir status final.");
            }
        } catch (error) {
            console.error("Erro ao definir status final:", error);
            alert(`Erro ao definir status final: ${error.message}`);
        }
    }
  
    async function gerarRelatorioPdf() {
        if (!solicitacaoAtual || !solicitacaoAtual.id) return;
        
        // Verificar se os pais já decidiram
        if (!solicitacaoAtual.status_pais) {
            alert("Aguarde a decisão dos pais antes de gerar o relatório final.");
            return;
        }
        
        try {
            const statusFinal = prompt(
                `A decisão dos pais foi: ${solicitacaoAtual.status_pais}.\n\nQual a decisão final do Serviço Social para esta solicitação?\nDigite 'Aprovado' ou 'Reprovado'.`
            );
            
            if (!statusFinal || (statusFinal !== "Aprovado" && statusFinal !== "Reprovado")) {
                alert("Status inválido. Digite 'Aprovado' ou 'Reprovado'.");
                return;
            }
            
            // Atualizar status no Firebase
            const updateData = {
                status_servico_social: statusFinal,
                data_decisao_servico_social: new Date().toISOString(),
                status_final: statusFinal, // Status final da solicitação
                pdf_gerado: true,
                data_geracao_pdf: new Date().toISOString()
            };
            
            await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoAtual.id, updateData);
            
            // Registrar na auditoria
            await window.auditoriaService.registrarEvento("decisao_servico_social", solicitacaoAtual.id, {
                decisao: statusFinal,
                decisao_pais: solicitacaoAtual.status_pais
            });
            
            // Gerar PDF
            const resultado = await window.pdfService.gerarRelatorioPdf(solicitacaoAtual.id);
            if (resultado.sucesso) {
                alert("Relatório PDF gerado com sucesso! O documento contém todas as etapas para validação legal.");
                
                // Atualizar interface
                if (btnGerarPdf) {
                    btnGerarPdf.disabled = true;
                    btnGerarPdf.textContent = "PDF Gerado";
                }
                
                // Recarregar dados
                await carregarTodasSolicitacoesDoFirestore();
            } else {
                throw new Error(resultado.erro || "Falha ao gerar PDF.");
            }
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert(`Erro ao gerar PDF: ${error.message}`);
        }
    }
  
    // --- Inicialização e Eventos ---
  
    // Adicionar listener para o filtro de status do histórico
    if (filtroStatusSelect) {
        filtroStatusSelect.addEventListener("change", renderizarHistoricoValidacoes);
    }
  
    // Carregar os dados iniciais do Firestore
    await carregarTodasSolicitacoesDoFirestore();
  
  });
  

    function verLinkEnviado() {
        if (!solicitacaoAtual || !solicitacaoAtual.id || !solicitacaoAtual.token_aprovacao_pais) {
            alert("Não há link enviado ou token de aprovação para esta solicitação.");
            return;
        }
        const linkAprovacao = `${window.location.origin}/pais/aprovacao.html?id=${solicitacaoAtual.id}&token=${solicitacaoAtual.token_aprovacao_pais}`;
        prompt("Link de Aprovação Enviado:", linkAprovacao);
    }


