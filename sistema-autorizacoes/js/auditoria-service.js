/**
 * Serviço de Auditoria
 * Responsável por registrar e obter eventos de auditoria no Firestore.
 */

const AuditoriaService = (function() {
  const COLLECTION_NAME = 'auditoria';

  if (!window.firebaseService) {
    console.error('Serviço Firebase não encontrado! O AuditoriaService não funcionará.');
  }

  // Função para registrar um evento de auditoria
  async function registrarEvento(tipo, solicitacaoId, dados = {}) {
    if (!window.firebaseService) return { sucesso: false, erro: 'Firebase Service not available' };
    try {
      const evento = {
        tipo: tipo,
        solicitacaoId: solicitacaoId,
        timestamp: new Date().toISOString(),
        usuarioId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'anonimo',
        dados: dados
      };
      await window.firebaseService.salvarDocumento(COLLECTION_NAME, evento);
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao registrar evento de auditoria:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Função para obter o histórico de auditoria de uma solicitação
  async function obterHistoricoAuditoria(solicitacaoId) {
    if (!window.firebaseService) return { sucesso: false, erro: 'Firebase Service not available' };
    try {
      const resultado = await window.firebaseService.obterDocumentos(COLLECTION_NAME, [
        { campo: 'solicitacaoId', operador: '==', valor: solicitacaoId }
      ]);
      if (resultado.sucesso) {
        // Ordenar por timestamp, mais recente primeiro
        resultado.dados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return { sucesso: true, eventos: resultado.dados };
      } else {
        return { sucesso: false, erro: resultado.erro };
      }
    } catch (error) {
      console.error('Erro ao obter histórico de auditoria:', error);
      return { sucesso: false, erro: error.message };
    }
  }

  // Funções específicas de registro de auditoria usadas no pdf-service.js
  async function registrarGeracaoPDF(solicitacaoId, tipoRelatorio) {
    return registrarEvento("geracao_pdf", solicitacaoId, { tipoRelatorio: tipoRelatorio });
  }

  // Nova função para registrar o envio de link aos pais
  async function registrarEnvioLinkPais(solicitacaoId, telefone, link) {
    return registrarEvento("envio_link_pais", solicitacaoId, { telefone: telefone, link: link });
  }

  // Função para registrar o acesso dos pais à página de aprovação
  async function registrarAcessoPais(solicitacaoId, token) {
    return registrarEvento("acesso_pais", solicitacaoId, { token: token });
  }

  // Função para registrar a decisão dos pais (aprovação ou reprovação)
  async function registrarDecisaoPais(solicitacaoId, decisao, observacao) {
    return registrarEvento("decisao_pais", solicitacaoId, { 
      decisao: decisao,
      observacao: observacao
    });
  }

  return {
    registrarEvento: registrarEvento,
    obterHistoricoAuditoria: obterHistoricoAuditoria,
    registrarGeracaoPDF: registrarGeracaoPDF,
    registrarEnvioLinkPais: registrarEnvioLinkPais,
    registrarAcessoPais: registrarAcessoPais,
    registrarDecisaoPais: registrarDecisaoPais
  };
})();

window.auditoriaService = AuditoriaService;

