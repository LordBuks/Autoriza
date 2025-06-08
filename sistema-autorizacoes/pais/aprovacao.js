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
            // Extrair parâmetros da URL
            const urlParams = new URLSearchParams(window.location.search);
            solicitacaoId = urlParams.get('id');
            tokenValidacao = urlParams.get('token');
            
            // Validar parâmetros
            if (!solicitacaoId || !tokenValidacao) {
                throw new Error('Link inválido. Parâmetros de identificação ausentes.');
            }
            
            // Atualizar timestamp atual
            atualizarTimestamp();
            
            // Registrar acesso na auditoria
            await registrarAcessoPagina();
            
            // Carregar dados da solicitação
            await carregarDadosSolicitacao();
            
            // Configurar listeners de eventos
            configurarEventListeners();
            
        } catch (error) {
            console.error('Erro ao inicializar página:', error);
            mostrarErro(error.message || 'Ocorreu um erro ao carregar a página. Por favor, tente novamente.');
        }
    }
    
    /**
     * Atualiza o timestamp exibido na página
     */
    function atualizarTimestamp() {
        const timestampElement = document.getElementById('current-timestamp');
        const agora = new Date();
        
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false
        };
        
        timestampElement.textContent = agora.toLocaleDateString('pt-BR', options).replace(',', ' às');
        
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
            } else {
                console.warn('Serviço de auditoria não disponível');
            }
        } catch (error) {
            console.error('Erro ao registrar acesso na auditoria:', error);
            // Não interromper o fluxo se houver erro na auditoria
        }
    }
    
    /**
     * Carrega os dados da solicitação do Firestore
     */
    async function carregarDadosSolicitacao() {
        try {
            // Buscar documento no Firestore
            const resultado = await window.firebaseService.obterDocumento('solicitacoes', solicitacaoId);
            
            if (!resultado.sucesso || !resultado.dados) {
                throw new Error('Solicitação não encontrada ou já expirada.');
            }
            
            solicitacaoData = resultado.dados;
            
            // Validar token
            if (solicitacaoData.token_aprovacao_pais !== tokenValidacao) {
                throw new Error('Link inválido ou expirado. Por favor, solicite um novo link.');
            }
            
            // Verificar se já foi aprovado/reprovado pelos pais
            if (solicitacaoData.status_pais === 'Aprovado' || solicitacaoData.status_pais === 'Reprovado') {
                throw new Error(`Esta solicitação já foi ${solicitacaoData.status_pais.toLowerCase()} por você anteriormente.`);
            }
            
            // Preencher os dados na página
            preencherDadosSolicitacao(solicitacaoData);
            
            // Esconder loading e mostrar conteúdo
            loadingContainer.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
        } catch (error) {
            console.error('Erro ao carregar dados da solicitação:', error);
            mostrarErro(error.message || 'Não foi possível carregar os dados da solicitação.');
        }
    }
    
    /**
     * Preenche os dados da solicitação nos elementos da página
     */
    function preencherDadosSolicitacao(dados) {
        // Informações de auditoria
        document.getElementById('solicitacao-id').textContent = dados.id || 'N/A';
        document.getElementById('data-geracao').textContent = formatarDataHora(dados.data_envio_link_pais) || 'N/A';
        document.getElementById('nome-responsavel').textContent = dados.nome_responsavel || 'Responsável';
        
        // Saudação personalizada
        document.getElementById('saudacao-responsavel').textContent = dados.nome_responsavel || 'Responsável';
        document.getElementById('nome-atleta-mensagem').textContent = dados.nome || 'o atleta';
        
        // Dados do atleta
        document.getElementById('nome-atleta').textContent = dados.nome || 'N/A';
        document.getElementById('categoria-atleta').textContent = dados.categoria || 'N/A';
        document.getElementById('telefone-atleta').textContent = dados.telefone || 'N/A';
        
        // Detalhes da saída
        document.getElementById('data-hora-saida').textContent = formatarDataHora(dados.data_saida, dados.horario_saida);
        document.getElementById('data-hora-retorno').textContent = formatarDataHora(dados.data_retorno, dados.horario_retorno);
        document.getElementById('motivo-destino').textContent = dados.motivo_destino || 'N/A';
    }
    
    /**
     * Configura os listeners de eventos para os botões
     */
    function configurarEventListeners() {
        btnAprovar.addEventListener('click', () => registrarDecisao('Aprovado'));
        btnReprovar.addEventListener('click', () => registrarDecisao('Reprovado'));
    }
    
    /**
     * Registra a decisão do responsável (aprovação ou reprovação)
     */
    async function registrarDecisao(decisao) {
        try {
            // Desabilitar botões para evitar duplo clique
            btnAprovar.disabled = true;
            btnReprovar.disabled = true;
            
            // Obter observação
            const observacao = observacaoInput.value.trim();
            
            // Preparar dados para atualização
            const dadosAtualizacao = {
                status_pais: decisao,
                observacao_pais: observacao,
                data_decisao_pais: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Se aprovado pelos pais e já aprovado pelo supervisor, atualizar status final
            if (decisao === 'Aprovado' && solicitacaoData.status_supervisor === 'Aprovado') {
                dadosAtualizacao.status_final = 'Aprovado';
            }
            
            // Se reprovado pelos pais, atualizar status final
            if (decisao === 'Reprovado') {
                dadosAtualizacao.status_final = 'Reprovado';
            }
            
            // Atualizar documento no Firestore
            const resultado = await window.firebaseService.atualizarDocumento('solicitacoes', solicitacaoId, dadosAtualizacao);
            
            if (!resultado.sucesso) {
                throw new Error('Erro ao registrar sua decisão. Por favor, tente novamente.');
            }
            
            // Registrar na auditoria
            await window.auditoriaService.registrarDecisaoPais(solicitacaoId, decisao, observacao);
            
            // Mostrar mensagem de sucesso
            mainContent.classList.add('hidden');
            successContainer.classList.remove('hidden');
            successMessage.textContent = `Sua decisão (${decisao}) foi registrada com sucesso. Obrigado por utilizar o Sistema de Autorizações Digitais.`;
            
        } catch (error) {
            console.error('Erro ao registrar decisão:', error);
            mostrarErro(error.message || 'Ocorreu um erro ao registrar sua decisão. Por favor, tente novamente.');
            
            // Reabilitar botões em caso de erro
            btnAprovar.disabled = false;
            btnReprovar.disabled = false;
        }
    }
    
    /**
     * Exibe mensagem de erro e esconde outros containers
     */
    function mostrarErro(mensagem) {
        loadingContainer.classList.add('hidden');
        mainContent.classList.add('hidden');
        successContainer.classList.add('hidden');
        
        errorContainer.classList.remove('hidden');
        errorMessage.textContent = mensagem;
    }
    
    /**
     * Formata data e hora para exibição
     */
    function formatarDataHora(data, hora) {
        if (!data) return 'N/A';
        
        let resultado = '';
        
        // Formatar data
        if (data instanceof Date) {
            resultado = data.toLocaleDateString('pt-BR');
        } else if (data.toDate && typeof data.toDate === 'function') {
            resultado = data.toDate().toLocaleDateString('pt-BR');
        } else if (typeof data === 'string') {
            // Tentar converter string para data
            try {
                const partes = data.split('-');
                if (partes.length === 3) {
                    resultado = `${partes[2]}/${partes[1]}/${partes[0]}`;
                } else {
                    resultado = data;
                }
            } catch (e) {
                resultado = data;
            }
        } else {
            resultado = 'N/A';
        }
        
        // Adicionar hora se disponível
        if (hora) {
            resultado += ` às ${hora}`;
        }
        
        return resultado;
    }
});
