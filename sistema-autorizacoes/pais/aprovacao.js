/**
 * Script para a página de aprovação de saída pelos pais/responsáveis
 * Sistema de Autorizações Digitais - SC Internacional.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const loadingContainer = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const mainContent = document.getElementById('main-content');
    const successContainer = document.getElementById('success-container');
    const successMessage = document.getElementById('success-message');
    
    // Botões de ação
    const btnAprovar = document.getElementById('btn-aprovar');
    const btnReprovar = document.getElementById('btn-reprovar');
    
    // Campos de texto
    const observacaoInput = document.getElementById('observacao');
    
    // Variáveis globais
    let solicitacaoId = null;
    let tokenValidacao = null;
    let solicitacaoData = null;
    
    // Inicializar a página
    inicializarPagina();
    
    /**
     * Inicializa a página, extrai parâmetros da URL e carrega dados
     */
    async function inicializarPagina() {
        try {
            console.log('Inicializando página de aprovação...');
            
            // Extrair parâmetros da URL
            const urlParams = new URLSearchParams(window.location.search);
            solicitacaoId = urlParams.get('id');
            tokenValidacao = urlParams.get('token');
            
            console.log("Parâmetros da URL:", { solicitacaoId, tokenValidacao });
            
            // Atualizar timestamp atual
            atualizarTimestamp();
            
            // Verificar se temos parâmetros válidos
            if (!solicitacaoId || !tokenValidacao) {
                console.log("Parâmetros ausentes, usando dados mockup para demonstração");
                // Usar dados mockup para demonstração
                if (window.carregarDadosMockup) {
                    window.carregarDadosMockup();
                    configurarEventListeners();
                    return;
                } else {
                    throw new Error("Link inválido. Parâmetros de identificação ausentes.");
                }
            }
            
            // Aguardar Firebase estar disponível
            await aguardarFirebase();
            
            // Registrar acesso na auditoria
            await registrarAcessoPagina();
            
            // Tentar carregar dados do Firebase
            await carregarDadosSolicitacao();
            
            // Configurar listeners de eventos
            configurarEventListeners();
            
        } catch (error) {
            console.error("Erro ao inicializar página:", error);
            
            // Se houver erro e temos dados mockup, usar eles
            if (window.carregarDadosMockup && (!solicitacaoId || !tokenValidacao)) {
                console.log("Usando dados mockup devido a erro na inicialização");
                window.carregarDadosMockup();
                configurarEventListeners();
            } else {
                mostrarErro(error.message || "Ocorreu um erro ao carregar a página. Por favor, tente novamente.");
            }
        }
    }
    
    /**
     * Aguarda o Firebase estar disponível
     */
    async function aguardarFirebase() {
        return new Promise((resolve, reject) => {
            let tentativas = 0;
            const maxTentativas = 10;
            
            const verificarFirebase = () => {
                tentativas++;
                
                if (window.firebaseService && typeof firebase !== 'undefined') {
                    console.log('Firebase disponível');
                    resolve();
                } else if (tentativas >= maxTentativas) {
                    console.warn('Firebase não disponível após múltiplas tentativas');
                    reject(new Error('Firebase não disponível'));
                } else {
                    console.log(`Aguardando Firebase... tentativa ${tentativas}`);
                    setTimeout(verificarFirebase, 500);
                }
            };
            
            verificarFirebase();
        });
    }
    
    /**
     * Atualiza o timestamp exibido na página
     */
    function atualizarTimestamp() {
        const timestampElement = document.getElementById("current-timestamp");
        if (!timestampElement) return;
        
        const agora = new Date();
        
        const options = { 
            day: "2-digit", 
            month: "2-digit", 
            year: "numeric", 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit",
            hour12: false
        };
        
        timestampElement.textContent = agora.toLocaleDateString("pt-BR", options).replace(",", " às");
        
        // Atualizar a cada minuto
        setTimeout(atualizarTimestamp, 60000);
    }
    
    /**
     * Registra o acesso à página na auditoria
     */
    async function registrarAcessoPagina() {
        try {
            if (window.auditoriaService) {
                await window.auditoriaService.registrarAcessoPais(solicitacaoId, tokenValidacao);
                console.log('Acesso registrado na auditoria');
            } else {
                console.warn("Serviço de auditoria não disponível");
            }
        } catch (error) {
            console.error("Erro ao registrar acesso na auditoria:", error);
            // Não interromper o fluxo se houver erro na auditoria
        }
    }
    
    /**
     * Carrega os dados da solicitação do Firestore
     */
    async function carregarDadosSolicitacao() {
        try {
            console.log('Carregando dados da solicitação...');
            
            if (!window.firebaseService) {
                throw new Error('Serviço Firebase não disponível');
            }
            
            // Buscar documento no Firestore
            const resultado = await window.firebaseService.obterDocumento("solicitacoes", solicitacaoId);
            
            if (!resultado.sucesso || !resultado.dados) {
                throw new Error("Solicitação não encontrada ou já expirada.");
            }
            
            solicitacaoData = resultado.dados;
            
            console.log("Solicitação ID:", solicitacaoId);
            console.log("Token da URL:", tokenValidacao);
            console.log("Token do Firestore:", solicitacaoData.token_aprovacao_pais);

            // Validar token
            if (solicitacaoData.token_aprovacao_pais !== tokenValidacao) {
                throw new Error("Link inválido ou expirado. Por favor, solicite um novo link.");
            }
            
            // Verificar se já foi aprovado/reprovado pelos pais
            if (solicitacaoData.status_pais === "Aprovado" || solicitacaoData.status_pais === "Reprovado") {
                throw new Error(`Esta solicitação já foi ${solicitacaoData.status_pais.toLowerCase()} por você anteriormente.`);
            }
            
            // Preencher os dados na página
            preencherDadosSolicitacao(solicitacaoData);
            
            // Esconder loading e mostrar conteúdo
            loadingContainer.classList.add("hidden");
            mainContent.classList.remove("hidden");
            
            console.log('Dados carregados com sucesso');
            
        } catch (error) {
            console.error("Erro ao carregar dados da solicitação:", error);
            mostrarErro(error.message || "Não foi possível carregar os dados da solicitação.");
        }
    }
    
    /**
     * Preenche os dados da solicitação nos elementos da página
     */
    function preencherDadosSolicitacao(dados) {
        try {
            // Informações de auditoria
            document.getElementById("solicitacao-id").textContent = dados.id || "N/A";
            document.getElementById("data-geracao").textContent = formatarDataHora(dados.data_envio_link_pais) || "N/A";
            document.getElementById("nome-responsavel").textContent = dados.nome_responsavel || "Responsável";
            
            // Saudação personalizada
            document.getElementById("saudacao-responsavel").textContent = dados.nome_responsavel || "Responsável";
            document.getElementById("nome-atleta-mensagem").textContent = dados.nome || "o atleta";
            
            // Dados do atleta
            document.getElementById("nome-atleta").textContent = dados.nome || "N/A";
            document.getElementById("categoria-atleta").textContent = dados.categoria || "N/A";
            document.getElementById("telefone-atleta").textContent = dados.telefone || "N/A";
            
            // Detalhes da saída
            document.getElementById("data-hora-saida").textContent = formatarDataHora(dados.data_saida, dados.horario_saida);
            document.getElementById("data-hora-retorno").textContent = formatarDataHora(dados.data_retorno, dados.horario_retorno);
            document.getElementById("motivo-destino").textContent = dados.motivo_destino || "N/A";
            
            console.log('Dados preenchidos na página');
        } catch (error) {
            console.error('Erro ao preencher dados na página:', error);
        }
    }
    
    /**
     * Configura os listeners de eventos para os botões
     */
    function configurarEventListeners() {
        if (btnAprovar) {
            btnAprovar.addEventListener("click", () => registrarDecisao("Aprovado"));
        }
        if (btnReprovar) {
            btnReprovar.addEventListener("click", () => registrarDecisao("Reprovado"));
        }
        console.log('Event listeners configurados');
    }
    
    /**
     * Registra a decisão do responsável (aprovação ou reprovação)
     */
    async function registrarDecisao(decisao) {
        try {
            console.log('Registrando decisão:', decisao);
            
            // Desabilitar botões para evitar duplo clique
            btnAprovar.disabled = true;
            btnReprovar.disabled = true;
            
            const observacao = observacaoInput.value.trim();
            
            if (!window.firebaseService) {
                throw new Error('Serviço Firebase não disponível');
            }
            
            // Dados para atualização
            const dadosAtualizacao = {
                status_pais: decisao,
                observacao_pais: observacao,
                data_decisao_pais: firebase.firestore.FieldValue.serverTimestamp(),
                ip_decisao_pais: await obterIP(),
                user_agent_pais: navigator.userAgent
            };
            
            // Atualizar documento no Firestore
            const resultado = await window.firebaseService.atualizarDocumento("solicitacoes", solicitacaoId, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error(resultado.erro || 'Erro ao salvar decisão');
            }
            
            // Registrar na auditoria
            if (window.auditoriaService) {
                await window.auditoriaService.registrarDecisaoPais(solicitacaoId, decisao, observacao);
            }
            
            // Mostrar mensagem de sucesso
            mostrarSucesso(`Solicitação ${decisao.toLowerCase()} com sucesso! Obrigado por utilizar o Sistema de Autorizações Digitais.`);
            
            console.log('Decisão registrada com sucesso');
            
        } catch (error) {
            console.error("Erro ao registrar decisão:", error);
            
            // Reabilitar botões em caso de erro
            btnAprovar.disabled = false;
            btnReprovar.disabled = false;
            
            mostrarErro(error.message || "Ocorreu um erro ao registrar sua decisão. Por favor, tente novamente.");
        }
    }
    
    /**
     * Obtém o IP do usuário
     */
    async function obterIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Não foi possível obter IP:', error);
            return 'unknown';
        }
    }
    
    /**
     * Mostra mensagem de erro
     */
    function mostrarErro(mensagem) {
        loadingContainer.classList.add("hidden");
        mainContent.classList.add("hidden");
        successContainer.classList.add("hidden");
        
        errorMessage.textContent = mensagem;
        errorContainer.classList.remove("hidden");
    }
    
    /**
     * Mostra mensagem de sucesso
     */
    function mostrarSucesso(mensagem) {
        loadingContainer.classList.add("hidden");
        mainContent.classList.add("hidden");
        errorContainer.classList.add("hidden");
        
        successMessage.textContent = mensagem;
        successContainer.classList.remove("hidden");
    }
    
    /**
     * Formata data e hora para exibição
     */
    function formatarDataHora(data, hora = null) {
        if (window.formatarDataHora) {
            return window.formatarDataHora(data, hora);
        }
        
        // Fallback se a função global não estiver disponível
        if (!data) return "N/A";
        
        try {
            let dataObj;
            
            if (data && typeof data.toDate === 'function') {
                dataObj = data.toDate();
            } else if (data instanceof Date) {
                dataObj = data;
            } else if (typeof data === 'string') {
                dataObj = new Date(data);
            } else {
                return "N/A";
            }
            
            const opcoes = { 
                day: "2-digit", 
                month: "2-digit", 
                year: "numeric"
            };
            
            let resultado = dataObj.toLocaleDateString("pt-BR", opcoes);
            
            if (hora) {
                resultado += ` às ${hora}`;
            } else {
                const opcoesHora = { 
                    hour: "2-digit", 
                    minute: "2-digit",
                    hour12: false
                };
                resultado += ` às ${dataObj.toLocaleTimeString("pt-BR", opcoesHora)}`;
            }
            
            return resultado;
        } catch (error) {
            console.error('Erro ao formatar data/hora:', error);
            return "N/A";
        }
    }
    
    console.log('Script de aprovação carregado');
});

