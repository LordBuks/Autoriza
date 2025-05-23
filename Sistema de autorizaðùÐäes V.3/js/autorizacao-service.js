/**
 * Serviço de Autorização - Sistema de Autorizações Digitais com Firebase
 * 
 * Este módulo implementa o padrão Module para encapsular a lógica de negócio
 * relacionada às autorizações, utilizando o Firebase Firestore como backend.
 */

const AutorizacaoService = (function() {
  // Coleção no Firestore
  const COLECAO_SOLICITACOES = 'solicitacoes';
  
  // Verificar se o Firebase Service está pronto
  if (!window.firebaseService) {
    console.error("Firebase Service não encontrado no AutorizacaoService!");
    // Retornar um objeto com métodos vazios ou que lancem erro para evitar quebras
    return {
        criarSolicitacao: () => Promise.resolve({ sucesso: false, mensagem: 'Erro: Firebase não inicializado.' }),
        buscarSolicitacao: () => Promise.resolve(null),
        listarSolicitacoes: () => Promise.resolve([]),
        atualizarStatus: () => Promise.resolve({ sucesso: false, mensagem: 'Erro: Firebase não inicializado.' }),
        formatarData: (data) => data // Fallback simples
    };
  }
  
  // Métodos privados (alguns podem ser mantidos ou adaptados)
  // function gerarId() { // Firestore gera IDs automaticamente
  //   return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  // }
  
  function capturarInfoDispositivo() {
    // Esta função permanece igual
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  
  function validarDatas(dataSaida, dataRetorno) {
     // Esta função permanece igual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Comparar apenas a data
    
    // Assegurar que são objetos Date válidos
    const dtSaida = dataSaida instanceof Date ? dataSaida : new Date(dataSaida);
    const dtRetorno = dataRetorno instanceof Date ? dataRetorno : new Date(dataRetorno);

    if (isNaN(dtSaida.getTime()) || isNaN(dtRetorno.getTime())) {
        return { valido: false, mensagem: 'Datas inválidas.' };
    }

    dtSaida.setHours(0, 0, 0, 0);
    dtRetorno.setHours(0, 0, 0, 0);

    if (dtSaida < hoje) {
      return {
        valido: false,
        mensagem: 'A data de saída não pode ser anterior a hoje.'
      };
    }
    
    if (dtRetorno < dtSaida) {
      return {
        valido: false,
        mensagem: 'A data de retorno deve ser igual ou posterior à data de saída.'
      };
    }
    
    return { valido: true };
  }
  
  function formatarData(data) {
     // Esta função permanece igual
    if (!data) return '';
    let dateObj;
    if (data instanceof Date) {
        dateObj = data;
    } else if (typeof data === 'string') {
        // Tentar converter string ISO ou similar para Date
        dateObj = new Date(data);
    } else if (data.toDate && typeof data.toDate === 'function') {
        // Converter Timestamp do Firestore para Date
        dateObj = data.toDate();
    } else {
        console.warn('Formato de data não reconhecido:', data);
        return 'Data inválida';
    }

    if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // --- API pública com métodos assíncronos para Firebase --- 
  return {
    /**
     * Cria uma nova solicitação de autorização no Firestore
     * @param {Object} dadosFormulario - Dados do formulário de solicitação
     * @returns {Promise<Object>} Promessa com status da operação e dados da solicitação
     */
    criarSolicitacao: async function(dadosFormulario) {
      // Validar datas
      const validacao = validarDatas(dadosFormulario.data_saida, dadosFormulario.data_retorno);
      if (!validacao.valido) {
        return { sucesso: false, mensagem: validacao.mensagem };
      }
      
      // Obter informações do dispositivo
      const deviceInfo = capturarInfoDispositivo();
      
      // Criar objeto de solicitação para Firestore
      const solicitacao = {
        // id: Firestore gerará automaticamente
        ...dadosFormulario,
        // Converter datas string para objetos Date ou Timestamp para Firestore
        data_saida: new Date(dadosFormulario.data_saida),
        data_retorno: new Date(dadosFormulario.data_retorno),
        data_solicitacao: new Date(), // Usar Timestamp do servidor seria melhor, mas Date() é mais simples aqui
        status_supervisor: 'Pendente',
        status_servico_social: 'Pendente',
        status_final: 'Em Análise',
        dispositivo: deviceInfo,
        // Adicionar campos para filtros, se necessário (ex: idAtleta, categoria)
        // idAtleta: localStorage.getItem('user_uid'), // Exemplo, pegar do local storage ou estado da app
        // nomeAtleta: dadosFormulario.nome_atleta // Já deve estar em dadosFormulario
      };
      
      // Salvar no Firestore
      const resultado = await window.firebaseService.salvarDocumento(COLECAO_SOLICITACOES, solicitacao);
      
      if (resultado.sucesso) {
        // Notificar se o serviço de notificação estiver disponível
        if (window.notificacaoService) {
          // Passar a solicitação com o ID retornado pelo Firestore
          window.notificacaoService.enviarNotificacaoSupervisor({ ...solicitacao, id: resultado.id });
        }
        return {
          sucesso: true,
          mensagem: 'Solicitação enviada com sucesso!',
          solicitacao: { ...solicitacao, id: resultado.id } // Retornar com ID
        };
      } else {
        return {
          sucesso: false,
          mensagem: `Erro ao salvar solicitação: ${resultado.erro}`
        };
      }
    },
    
    /**
     * Busca uma solicitação pelo ID no Firestore
     * @param {string} id - ID da solicitação
     * @returns {Promise<Object|null>} Promessa com a solicitação encontrada ou null
     */
    buscarSolicitacao: async function(id) {
      const resultado = await window.firebaseService.obterDocumento(COLECAO_SOLICITACOES, id);
      if (resultado.sucesso) {
        return resultado.dados; // Retorna { id: ..., ...dados }
      } else {
        console.error(`Erro ao buscar solicitação ${id}:`, resultado.erro);
        return null;
      }
    },
    
    /**
     * Lista solicitações do Firestore com filtros opcionais
     * @param {Array<Object>} filtros - Array de filtros [{ campo, operador, valor }]
     * @returns {Promise<Array>} Promessa com a lista de solicitações
     */
    listarSolicitacoes: async function(filtros = []) {
        // Exemplo de filtro: { campo: 'status_final', operador: '==', valor: 'Em Análise' }
        // Exemplo: { campo: 'idAtleta', operador: '==', valor: 'uidDoAtleta' }
      const resultado = await window.firebaseService.obterDocumentos(COLECAO_SOLICITACOES, filtros);
      if (resultado.sucesso) {
        return resultado.dados; // Retorna array de { id: ..., ...dados }
      } else {
        console.error('Erro ao listar solicitações:', resultado.erro);
        return [];
      }
    },

    /**
     * Lista solicitações do Firestore com filtros opcionais e ordenação
     * @param {Array<Object>} filtros - Array de filtros [{ campo, operador, valor }]
     * @param {Object} ordenacao - Objeto de ordenação { campo, direcao: 'asc' | 'desc' }
     * @returns {Promise<Array>} Promessa com a lista de solicitações
     */
    listarSolicitacoesOrdenadas: async function(filtros = [], ordenacao = null) {
        // Adaptação: A classe FirebaseService precisa suportar ordenação
        // Se não suportar, a ordenação terá que ser feita no cliente após buscar tudo.
        // Vamos assumir que firebaseService.obterDocumentos foi atualizado para aceitar ordenação
        // Ex: ordenacao = { campo: 'data_solicitacao', direcao: 'desc' }
        const resultado = await window.firebaseService.obterDocumentos(COLECAO_SOLICITACOES, filtros, ordenacao);
        if (resultado.sucesso) {
            return resultado.dados;
        } else {
            console.error('Erro ao listar solicitações ordenadas:', resultado.erro);
            return [];
        }
    },
    
    /**
     * Atualiza o status de uma solicitação no Firestore
     * @param {string} id - ID da solicitação
     * @param {string} perfil - Perfil que está atualizando ('supervisor' ou 'servico_social')
     * @param {string} status - Novo status ('Aprovado' ou 'Reprovado')
     * @param {string} observacao - Observação opcional
     * @returns {Promise<Object>} Promessa com o resultado da operação
     */
    atualizarStatus: async function(id, perfil, status, observacao = '') {
      // Buscar a solicitação atual para determinar o status final
      const solicitacaoAtual = await this.buscarSolicitacao(id);
      if (!solicitacaoAtual) {
        return { sucesso: false, mensagem: 'Solicitação não encontrada' };
      }

      const dadosAtualizar = {
          data_modificacao: new Date() // Timestamp da modificação
      };
      let novoStatusFinal = solicitacaoAtual.status_final;

      // Atualizar campos específicos do perfil
      if (perfil === 'supervisor') {
        dadosAtualizar.status_supervisor = status;
        dadosAtualizar.observacao_supervisor = observacao;
        // Determinar status final baseado na ação do supervisor e no estado do serviço social
        if (status === 'Reprovado') {
            novoStatusFinal = 'Reprovado';
        } else if (status === 'Aprovado' && solicitacaoAtual.status_servico_social === 'Aprovado') {
            novoStatusFinal = 'Aprovado';
        } else if (status === 'Aprovado' && solicitacaoAtual.status_servico_social === 'Pendente') {
            novoStatusFinal = 'Aguardando Serviço Social'; // Ou manter 'Em Análise'
        } // Se serviço social já reprovou, mantém reprovado
          else if (solicitacaoAtual.status_servico_social === 'Reprovado') {
             novoStatusFinal = 'Reprovado';
          }

      } else if (perfil === 'servico_social') {
        dadosAtualizar.status_servico_social = status;
        dadosAtualizar.observacao_servico_social = observacao;
         // Determinar status final baseado na ação do serviço social e no estado do supervisor
        if (status === 'Reprovado') {
            novoStatusFinal = 'Reprovado';
        } else if (status === 'Aprovado' && solicitacaoAtual.status_supervisor === 'Aprovado') {
            novoStatusFinal = 'Aprovado';
        } else if (status === 'Aprovado' && solicitacaoAtual.status_supervisor === 'Pendente') {
            novoStatusFinal = 'Aguardando Supervisor'; // Ou manter 'Em Análise'
        } // Se supervisor já reprovou, mantém reprovado
         else if (solicitacaoAtual.status_supervisor === 'Reprovado') {
             novoStatusFinal = 'Reprovado';
         }
      } else {
          return { sucesso: false, mensagem: 'Perfil inválido para atualização.' };
      }

      dadosAtualizar.status_final = novoStatusFinal;

      // Atualizar no Firestore
      const resultado = await window.firebaseService.atualizarDocumento(COLECAO_SOLICITACOES, id, dadosAtualizar);
      
      if (resultado.sucesso) {
        // Notificar se o serviço de notificação estiver disponível
        if (window.notificacaoService) {
          // Buscar a solicitação atualizada para enviar na notificação
          const solicitacaoAtualizada = { ...solicitacaoAtual, ...dadosAtualizar }; 
          if (perfil === 'supervisor' && status === 'Aprovado') {
            window.notificacaoService.enviarNotificacaoServicoSocial(solicitacaoAtualizada);
          } else if (perfil === 'servico_social') { // Notificar atleta na decisão final do SS
            window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada);
          }
        }
        return {
          sucesso: true,
          mensagem: 'Status atualizado com sucesso',
          // Retornar a solicitação com os dados atualizados pode ser útil
          solicitacao: { ...solicitacaoAtual, ...dadosAtualizar } 
        };
      } else {
        return {
          sucesso: false,
          mensagem: `Erro ao atualizar status: ${resultado.erro}`
        };
      }
    },
    
    /**
     * Formata uma data para exibição (mantido para conveniência)
     * @param {Date|string|Timestamp} data - Data a ser formatada
     * @returns {string} Data formatada
     */
    formatarData: formatarData,

    /**
     * Observa mudanças em tempo real nas solicitações (ex: para dashboards)
     * @param {Array<Object>} filtros - Array de filtros [{ campo, operador, valor }]
     * @param {Function} callback - Função a ser chamada com os dados atualizados ou erro
     * @returns {Function} Função para cancelar a observação (unsubscribe)
     */
    observarSolicitacoes: function(filtros = [], callback) {
        if (window.firebaseService && typeof window.firebaseService.observarDocumentos === 'function') {
            return window.firebaseService.observarDocumentos(COLECAO_SOLICITACOES, filtros, callback);
        } else {
            console.error("Método observarDocumentos não disponível no FirebaseService.");
            callback({ sucesso: false, erro: 'Funcionalidade de tempo real não disponível.' });
            return () => {}; // Retorna função vazia para unsubscribe
        }
    }

  };
})();

// Exportar para uso global (se necessário, ou usar import/export em módulos)
window.AutorizacaoService = AutorizacaoService;