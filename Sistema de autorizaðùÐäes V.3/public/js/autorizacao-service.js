/**
 * Serviço de Autorização - Sistema de Autorizações Digitais
 * 
 * Este módulo implementa o padrão Module para encapsular a lógica de negócio
 * relacionada às autorizações, unificando funcionalidades similares e
 * proporcionando uma interface consistente para o restante da aplicação.
 */

const AutorizacaoService = (function() {
  // Variáveis privadas
  const STORAGE_KEY = 'solicitacoes';
  
  // Métodos privados
  function gerarId() {
    return 'AUTH-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  function capturarInfoDispositivo() {
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
    const hoje = new Date();
    
    // Verificar se a data de saída é futura
    if (dataSaida < hoje) {
      return {
        valido: false,
        mensagem: 'A data de saída deve ser futura.'
      };
    }
    
    // Verificar se a data de retorno é posterior à data de saída
    if (dataRetorno < dataSaida) {
      return {
        valido: false,
        mensagem: 'A data de retorno deve ser posterior à data de saída.'
      };
    }
    
    return { valido: true };
  }
  
  function formatarData(data) {
    if (!(data instanceof Date)) {
      data = new Date(data);
    }
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // API pública
  return {
    /**
     * Cria uma nova solicitação de autorização
     * @param {Object} dadosFormulario - Dados do formulário de solicitação
     * @returns {Object} Objeto com status da operação e dados da solicitação
     */
    criarSolicitacao: function(dadosFormulario) {
      // Validar datas
      const dataSaida = new Date(dadosFormulario.data_saida);
      const dataRetorno = new Date(dadosFormulario.data_retorno);
      
      const validacao = validarDatas(dataSaida, dataRetorno);
      if (!validacao.valido) {
        return {
          sucesso: false,
          mensagem: validacao.mensagem
        };
      }
      
      // Obter informações do dispositivo
      const deviceInfo = capturarInfoDispositivo();
      
      // Criar objeto de solicitação
      const solicitacao = {
        id: gerarId(),
        ...dadosFormulario,
        data_solicitacao: new Date().toISOString(),
        status_supervisor: 'Pendente',
        status_servico_social: 'Pendente',
        status_final: 'Em Análise',
        dispositivo: deviceInfo
      };
      
      // Recuperar solicitações existentes
      let solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      
      // Adicionar nova solicitação
      solicitacoes.push(solicitacao);
      
      // Salvar no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitacoes));
      
      // Notificar se o serviço de notificação estiver disponível
      if (window.notificacaoService) {
        window.notificacaoService.enviarNotificacaoSupervisor(solicitacao);
      }
      
      return {
        sucesso: true,
        mensagem: 'Solicitação enviada com sucesso!',
        solicitacao: solicitacao
      };
    },
    
    /**
     * Busca uma solicitação pelo ID
     * @param {string} id - ID da solicitação
     * @returns {Object|null} Solicitação encontrada ou null
     */
    buscarSolicitacao: function(id) {
      const solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      return solicitacoes.find(s => s.id === id) || null;
    },
    
    /**
     * Lista todas as solicitações
     * @param {Object} filtros - Filtros opcionais
     * @returns {Array} Lista de solicitações
     */
    listarSolicitacoes: function(filtros = {}) {
      const solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      
      // Aplicar filtros se fornecidos
      if (Object.keys(filtros).length > 0) {
        return solicitacoes.filter(s => {
          for (const [chave, valor] of Object.entries(filtros)) {
            if (s[chave] !== valor) return false;
          }
          return true;
        });
      }
      
      return solicitacoes;
    },
    
    /**
     * Atualiza o status de uma solicitação
     * @param {string} id - ID da solicitação
     * @param {string} perfil - Perfil que está atualizando ('supervisor' ou 'servico_social')
     * @param {string} status - Novo status
     * @param {string} observacao - Observação opcional
     * @returns {Object} Resultado da operação
     */
    atualizarStatus: function(id, perfil, status, observacao = '') {
      const solicitacoes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      const index = solicitacoes.findIndex(s => s.id === id);
      
      if (index === -1) {
        return {
          sucesso: false,
          mensagem: 'Solicitação não encontrada'
        };
      }
      
      const solicitacao = solicitacoes[index];
      
      // Atualizar status de acordo com o perfil
      if (perfil === 'supervisor') {
        solicitacao.status_supervisor = status;
        solicitacao.observacao_supervisor = observacao;
      } else if (perfil === 'servico_social') {
        solicitacao.status_servico_social = status;
        solicitacao.observacao_servico_social = observacao;
      }
      
      // Atualizar status final com base nos status individuais
      if (solicitacao.status_supervisor === 'Reprovado' || solicitacao.status_servico_social === 'Reprovado') {
        solicitacao.status_final = 'Reprovado';
      } else if (solicitacao.status_supervisor === 'Aprovado' && solicitacao.status_servico_social === 'Aprovado') {
        solicitacao.status_final = 'Aprovado';
      } else {
        solicitacao.status_final = 'Em Análise';
      }
      
      // Atualizar data de modificação
      solicitacao.data_modificacao = new Date().toISOString();
      
      // Salvar alterações
      solicitacoes[index] = solicitacao;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitacoes));
      
      // Notificar se o serviço de notificação estiver disponível
      if (window.notificacaoService) {
        if (perfil === 'supervisor') {
          window.notificacaoService.enviarNotificacaoServicoSocial(solicitacao);
        } else if (perfil === 'servico_social') {
          window.notificacaoService.enviarNotificacaoAtleta(solicitacao);
        }
      }
      
      return {
        sucesso: true,
        mensagem: 'Status atualizado com sucesso',
        solicitacao: solicitacao
      };
    },
    
    /**
     * Formata uma data para exibição
     * @param {Date|string} data - Data a ser formatada
     * @returns {string} Data formatada
     */
    formatarData: formatarData
  };
})();

// Exportar para uso global
window.AutorizacaoService = AutorizacaoService;