/**
 * Serviço de Autorização - Sistema de Autorizações Digitais
 * 
 * Este módulo implementa o padrão Module para encapsular a lógica de negócio
 * relacionada às autorizações, interagindo com o Firebase Firestore.
 */

const AutorizacaoService = (function() {
  // Nome da coleção no Firestore
  const COLLECTION_NAME = 'solicitacoes';

  // Verificar se o serviço Firebase está disponível
  if (!window.firebaseService) {
    console.error('Serviço Firebase não encontrado! O AutorizacaoService não funcionará.');
    // Poderia lançar um erro ou retornar um objeto com métodos desabilitados
    // return { /* métodos desabilitados */ }; 
  }

  // Métodos privados (alguns podem ser removidos se não forem mais usados)
  function gerarId() {
    // Este ID pode ser gerado pelo Firestore ou pelo cliente antes de salvar.
    // Mantendo a lógica original por enquanto, mas idealmente o ID é gerado uma vez.
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `AUTH-${timestamp}-${randomPart}`.toUpperCase();
  }

  function capturarInfoDispositivo() {
    // Mantém a captura de informações do dispositivo
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
    hoje.setHours(0, 0, 0, 0); // Comparar apenas a data

    // Verificar se a data de saída é futura
    if (dataSaida < hoje) {
      return {
        valido: false,
        mensagem: 'A data de saída deve ser igual ou posterior a hoje.'
      };
    }

    // Verificar se a data de retorno é posterior ou igual à data de saída
    if (dataRetorno < dataSaida) {
      return {
        valido: false,
        mensagem: 'A data de retorno deve ser posterior ou igual à data de saída.'
      };
    }

    return { valido: true };
  }

  function formatarData(data) {
    if (!data) return '';
    try {
        // Tenta converter para Data se for string (ISO ou timestamp)
        if (!(data instanceof Date)) {
            // Verifica se é um timestamp do Firestore
            if (data && typeof data.toDate === 'function') {
                data = data.toDate();
            } else {
                data = new Date(data);
            }
        }
        // Verifica se a data é válida após a conversão
        if (isNaN(data.getTime())) {
            return 'Data inválida';
        }
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error("Erro ao formatar data:", error, "Data original:", data);
        return 'Erro na data';
    }
}


  // API pública (agora com métodos assíncronos)
  return {
    /**
     * Cria uma nova solicitação de autorização no Firestore.
     * NOTA: A criação agora é feita diretamente em solicitar-integrado.js.
     * Esta função pode ser mantida para outros usos ou removida se obsoleta.
     * @param {Object} dadosFormulario - Dados do formulário de solicitação
     * @returns {Promise<Object>} Promise com status da operação e dados da solicitação
     */
    criarSolicitacao: async function(dadosFormulario) {
      console.warn('AutorizacaoService.criarSolicitacao está sendo chamado. Verificar se é necessário, pois solicitar-integrado.js já salva no Firestore.');
      
      // Validar datas (considerando apenas a data, sem hora)
      const dataSaida = new Date(dadosFormulario.data_saida + 'T00:00:00');
      const dataRetorno = new Date(dadosFormulario.data_retorno + 'T00:00:00');
      
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
        id: gerarId(), // Gerar um novo ID aqui?
        ...dadosFormulario,
        data_solicitacao: new Date().toISOString(),
        status_supervisor: 'Pendente',
        status_servico_social: 'Pendente',
        status_monitor: 'Pendente', // Adicionado status do monitor
        status_final: 'Em Análise',
        dispositivo: deviceInfo
      };

      try {
        await window.firebaseService.salvarDocumento(COLLECTION_NAME, solicitacao.id, solicitacao);
        console.log("Solicitação criada via AutorizacaoService salva no Firestore com ID:", solicitacao.id);
        
        // Notificar se o serviço de notificação estiver disponível
        if (window.notificacaoService) {
          window.notificacaoService.enviarNotificacaoSupervisor(solicitacao);
        }

        return {
          sucesso: true,
          mensagem: 'Solicitação enviada com sucesso!',
          solicitacao: solicitacao
        };
      } catch (error) {
        console.error("Erro ao criar solicitação via AutorizacaoService no Firestore:", error);
        return {
          sucesso: false,
          mensagem: 'Erro ao salvar solicitação no banco de dados. Tente novamente.'
        };
      }
    },

    /**
     * Busca uma solicitação pelo ID no Firestore.
     * @param {string} id - ID da solicitação
     * @returns {Promise<Object|null>} Promise com a solicitação encontrada ou null
     */
    buscarSolicitacao: async function(id) {
      if (!window.firebaseService) return null;
      try {
        const doc = await window.firebaseService.buscarDocumento(COLLECTION_NAME, id);
        return doc;
      } catch (error) {
        console.error(`Erro ao buscar solicitação ${id} no Firestore:`, error);
        return null;
      }
    },

    /**
     * Lista todas as solicitações do Firestore.
     * @param {Object} filtros - Filtros (opcional, pode ser implementado com queries Firestore)
     * @returns {Promise<Array>} Promise com a lista de solicitações
     */
    listarSolicitacoes: async function(filtros = {}) {
        if (!window.firebaseService) return [];
        try {
            // Por enquanto, busca todos e filtra no cliente.
            // Idealmente, usar queries do Firestore se firebaseService permitir.
            let solicitacoes = await window.firebaseService.listarDocumentos(COLLECTION_NAME);

            // Aplicar filtros se fornecidos
            if (Object.keys(filtros).length > 0) {
                solicitacoes = solicitacoes.filter(s => {
                    for (const [chave, valor] of Object.entries(filtros)) {
                        // Adiciona verificação para chaves aninhadas se necessário
                        if (s[chave] !== valor) return false;
                    }
                    return true;
                });
            }
            
            // Ordenar por data de solicitação (mais recente primeiro)
            solicitacoes.sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));

            return solicitacoes;
        } catch (error) {
            console.error("Erro ao listar solicitações do Firestore:", error);
            return [];
        }
    },

    /**
     * Atualiza o status de uma solicitação no Firestore.
     * @param {string} id - ID da solicitação
     * @param {string} perfil - Perfil que está atualizando ('supervisor' ou 'servico_social')
     * @param {string} status - Novo status ('Aprovado' ou 'Reprovado')
     * @param {string} observacao - Observação opcional
     * @returns {Promise<Object>} Promise com o resultado da operação
     */
    atualizarStatus: async function(id, perfil, status, observacao = '') {
      if (!window.firebaseService) {
          return { sucesso: false, mensagem: 'Serviço Firebase não disponível.' };
      }
      try {
        // 1. Buscar a solicitação atual
        const solicitacao = await this.buscarSolicitacao(id);
        if (!solicitacao) {
          return {
            sucesso: false,
            mensagem: 'Solicitação não encontrada'
          };
        }

        // 2. Preparar os dados para atualização
        const dadosAtualizar = {
          data_modificacao: new Date().toISOString()
        };

        if (perfil === 'supervisor') {
          dadosAtualizar.status_supervisor = status;
          dadosAtualizar.observacao_supervisor = observacao;
        } else if (perfil === 'servico_social') {
          dadosAtualizar.status_servico_social = status;
          dadosAtualizar.observacao_servico_social = observacao;
        } else {
             return { sucesso: false, mensagem: 'Perfil inválido para atualização.' };
        }

        // 3. Determinar o status final com base nos status atualizados
        const statusSupervisorAtualizado = (perfil === 'supervisor') ? status : solicitacao.status_supervisor;
        const statusServicoSocialAtualizado = (perfil === 'servico_social') ? status : solicitacao.status_servico_social;

        if (statusSupervisorAtualizado === 'Reprovado' || statusServicoSocialAtualizado === 'Reprovado') {
          dadosAtualizar.status_final = 'Reprovado';
        } else if (statusSupervisorAtualizado === 'Aprovado' && statusServicoSocialAtualizado === 'Aprovado') {
          dadosAtualizar.status_final = 'Aprovado';
        } else {
          dadosAtualizar.status_final = 'Em Análise'; // Se um aprovou e outro está pendente, continua em análise
        }

        // 4. Atualizar o documento no Firestore
        await window.firebaseService.atualizarDocumento(COLLECTION_NAME, id, dadosAtualizar);
        console.log(`Status da solicitação ${id} atualizado no Firestore pelo ${perfil}. Novo status final: ${dadosAtualizar.status_final}`);

        // 5. Obter a solicitação atualizada para notificação (opcional, mas bom para ter dados completos)
        const solicitacaoAtualizada = { ...solicitacao, ...dadosAtualizar };

        // Notificar se o serviço de notificação estiver disponível
        if (window.notificacaoService) {
          if (perfil === 'supervisor' && dadosAtualizar.status_final !== 'Reprovado') {
            // Notifica Serviço Social apenas se não foi reprovado pelo supervisor
            window.notificacaoService.enviarNotificacaoServicoSocial(solicitacaoAtualizada);
          } else if (perfil === 'servico_social') {
            // Notifica Atleta após decisão do Serviço Social
            window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada);
          }
          // Se o supervisor reprovou, talvez notificar o atleta imediatamente?
          if (dadosAtualizar.status_final === 'Reprovado') {
             window.notificacaoService.enviarNotificacaoAtleta(solicitacaoAtualizada); 
          }
        }

        return {
          sucesso: true,
          mensagem: 'Status atualizado com sucesso',
          solicitacao: solicitacaoAtualizada // Retorna a solicitação com os dados atualizados
        };

      } catch (error) {
        console.error(`Erro ao atualizar status da solicitação ${id} no Firestore:`, error);
        return {
          sucesso: false,
          mensagem: 'Erro ao atualizar status no banco de dados. Tente novamente.'
        };
      }
    },

    /**
     * Formata uma data para exibição.
     * @param {Date|string|Object} data - Data a ser formatada (pode ser string ISO, objeto Date ou Timestamp do Firestore)
     * @returns {string} Data formatada (DD/MM/AAAA)
     */
    formatarData: formatarData
  };
})();

// Exportar para uso global (se ainda necessário)
// Se estiver usando módulos ES6, prefira exportar.
window.AutorizacaoService = AutorizacaoService;

