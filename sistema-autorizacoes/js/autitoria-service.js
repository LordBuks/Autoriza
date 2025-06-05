/**
 * Serviço de Auditoria
 * Responsável por registrar eventos de auditoria no sistema
 */
window.auditoriaService = (function() {
    // Coleção do Firebase para eventos de auditoria
    const COLECAO_AUDITORIA = 'eventos_auditoria';
    
    // Função auxiliar para obter informações do dispositivo
    function obterInfoDispositivo() {
        return {
            navegador: navigator.userAgent,
            plataforma: navigator.platform,
            dataHora: new Date().toISOString(),
            resolucao: `${window.screen.width}x${window.screen.height}`
        };
    }
    
    // Função auxiliar para gerar hash de verificação
    function gerarHashVerificacao(dados) {
        // Utiliza a biblioteca sha256 para gerar um hash dos dados
        return sha256(JSON.stringify(dados));
    }
    
    // Função para registrar evento genérico
    async function registrarEvento(tipo, solicitacaoId, dados, metadados = {}) {
        try {
            // Obtém informações do dispositivo
            const dispositivoInfo = obterInfoDispositivo();
            
            // Prepara o objeto de evento
            const evento = {
                tipo: tipo,
                solicitacaoId: solicitacaoId,
                dados: dados,
                metadados: metadados,
                dispositivo: dispositivoInfo,
                usuarioId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'anonimo',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                hashVerificacao: gerarHashVerificacao({
                    tipo, 
                    solicitacaoId, 
                    dados, 
                    dispositivo: dispositivoInfo
                })
            };
            
            // Salva o evento na coleção de auditoria
            await firebase.firestore().collection(COLECAO_AUDITORIA).add(evento);
            
            console.log(`Evento de auditoria registrado: ${tipo}`);
            return { sucesso: true, eventoId: evento.hashVerificacao };
        } catch (erro) {
            console.error('Erro ao registrar evento de auditoria:', erro);
            return { sucesso: false, erro: erro.message };
        }
    }
    
    // API pública do serviço
    return {
        // Registra submissão de solicitação por atleta
        registrarSubmissaoAtleta: function(solicitacaoId, dadosAtleta, dispositivoInfo) {
            return registrarEvento('submissao_atleta', solicitacaoId, dadosAtleta, {
                origem: 'formulario_solicitacao',
                dispositivo: dispositivoInfo
            });
        },
        
        // Registra decisão do supervisor
        registrarDecisaoSupervisor: function(solicitacaoId, decisao, observacao) {
            return registrarEvento('decisao_supervisor', solicitacaoId, {
                decisao: decisao,
                observacao: observacao
            });
        },
        
        // Registra envio de link aos pais
        registrarEnvioLinkPais: function(solicitacaoId, numeroTelefone, canal) {
            return registrarEvento('envio_link_pais', solicitacaoId, {
                numeroTelefone: numeroTelefone,
                canal: canal
            });
        },
        
        // Registra acesso dos pais à página de aprovação
        registrarAcessoPais: function(solicitacaoId, token) {
            return registrarEvento('acesso_pais', solicitacaoId, {
                token: token,
                url: window.location.href
            });
        },
        
        // Registra decisão dos pais
        registrarDecisaoPais: function(solicitacaoId, decisao, observacao) {
            return registrarEvento('decisao_pais', solicitacaoId, {
                decisao: decisao,
                observacao: observacao
            });
        },
        
        // Registra status final da solicitação
        registrarStatusFinal: function(solicitacaoId, status, observacao) {
            return registrarEvento('status_final', solicitacaoId, {
                status: status,
                observacao: observacao
            });
        },
        
        // Registra geração de PDF
        registrarGeracaoPDF: function(solicitacaoId, tipoRelatorio) {
            return registrarEvento('geracao_pdf', solicitacaoId, {
                tipoRelatorio: tipoRelatorio
            });
        },
        
        // Obtém histórico de auditoria para uma solicitação
        obterHistoricoAuditoria: async function(solicitacaoId) {
            try {
                const snapshot = await firebase.firestore()
                    .collection(COLECAO_AUDITORIA)
                    .where('solicitacaoId', '==', solicitacaoId)
                    .orderBy('timestamp', 'asc')
                    .get();
                
                return {
                    sucesso: true,
                    eventos: snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                };
            } catch (erro) {
                console.error('Erro ao obter histórico de auditoria:', erro);
                return { sucesso: false, erro: erro.message };
            }
        }
    };
})();
