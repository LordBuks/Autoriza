/**
 * Serviço de Geração de PDF
 * Responsável por gerar relatórios em PDF para solicitações
 */
window.pdfService = (function() {
    // Configurações do PDF
    const CONFIG = {
        formato: 'a4',
        orientacao: 'portrait',
        margens: {
            superior: 15,
            inferior: 15,
            esquerda: 15,
            direita: 15
        },
        cabecalho: {
            altura: 20,
            texto: 'Sistema de Autorizações - Relatório'
        },
        rodape: {
            altura: 10,
            texto: 'Documento gerado eletronicamente - Página '
        }
    };
    
    // Cores utilizadas no PDF
    const CORES = {
        primaria: '#3498db',
        secundaria: '#2c3e50',
        sucesso: '#2ecc71',
        alerta: '#e74c3c',
        texto: '#333333',
        fundo: '#f9f9f9',
        borda: '#dddddd'
    };
    
    // Função auxiliar para formatar data
    function formatarData(data) {
        if (!data) return 'N/A';
        
        if (data.toDate) {
            data = data.toDate();
        } else if (typeof data === 'string') {
            data = new Date(data);
        }
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Função para obter dados da solicitação do Firebase
    async function obterDadosSolicitacao(solicitacaoId) {
        try {
            // Obtém documento da solicitação
            const docRef = await firebase.firestore()
                .collection('solicitacoes')
                .doc(solicitacaoId)
                .get();
            
            if (!docRef.exists) {
                throw new Error('Solicitação não encontrada');
            }
            
            const solicitacao = {
                id: docRef.id,
                ...docRef.data()
            };
            
            // Obtém histórico de auditoria
            const historicoAuditoria = await window.auditoriaService.obterHistoricoAuditoria(solicitacaoId);
            
            return {
                solicitacao: solicitacao,
                auditoria: historicoAuditoria.sucesso ? historicoAuditoria.eventos : []
            };
        } catch (erro) {
            console.error('Erro ao obter dados para PDF:', erro);
            throw erro;
        }
    }
    
    // Função para criar cabeçalho do PDF
    function criarCabecalhoPDF(doc) {
        doc.setFillColor(CORES.primaria);
        doc.rect(0, 0, doc.internal.pageSize.width, CONFIG.cabecalho.altura, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(12);
        doc.text(
            CONFIG.cabecalho.texto,
            doc.internal.pageSize.width / 2,
            10,
            { align: 'center' }
        );
        
        // Adiciona data de geração
        const dataGeracao = new Date().toLocaleDateString('pt-BR');
        doc.setFontSize(8);
        doc.text(
            `Gerado em: ${dataGeracao}`,
            doc.internal.pageSize.width - CONFIG.margens.direita,
            10,
            { align: 'right' }
        );
    }
    
    // Função para criar rodapé do PDF
    function criarRodapePDF(doc, numeroPagina) {
        const totalPaginas = doc.internal.getNumberOfPages();
        
        doc.setPage(numeroPagina);
        doc.setFillColor(CORES.secundaria);
        doc.rect(
            0,
            doc.internal.pageSize.height - CONFIG.rodape.altura,
            doc.internal.pageSize.width,
            CONFIG.rodape.altura,
            'F'
        );
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(8);
        doc.text(
            `${CONFIG.rodape.texto} ${numeroPagina} de ${totalPaginas}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 4,
            { align: 'center' }
        );
    }
    
    // Função para adicionar informações da solicitação ao PDF
    function adicionarInformacoesSolicitacao(doc, dados) {
        const solicitacao = dados.solicitacao;
        let posicaoY = CONFIG.cabecalho.altura + 15;
        
        // Título do relatório
        doc.setFontSize(16);
        doc.setTextColor(CORES.secundaria);
        doc.text(
            `Relatório de Solicitação #${solicitacao.id.substring(0, 8)}`,
            doc.internal.pageSize.width / 2,
            posicaoY,
            { align: 'center' }
        );
        posicaoY += 15;
        
        // Informações do atleta
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('Informações do Atleta', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(CORES.texto);
        
        const infoAtleta = [
            { label: 'Nome:', valor: solicitacao.nome || 'N/A' },
            { label: 'Categoria:', valor: solicitacao.categoria || 'N/A' },
            { label: 'Email:', valor: solicitacao.email || 'N/A' },
            { label: 'Telefone:', valor: solicitacao.telefone || 'N/A' },
            { label: 'Data da Solicitação:', valor: formatarData(solicitacao.dataCriacao) }
        ];
        
        infoAtleta.forEach(item => {
            doc.text(`${item.label} ${item.valor}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 7;
        });
        
        posicaoY += 10;
        
        // Status da solicitação
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('Status da Solicitação', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(CORES.texto);
        
        // Determina a cor do status
        let corStatus = CORES.texto;
        if (solicitacao.status === 'Aprovado' || solicitacao.status === 'Autorizado') {
            corStatus = CORES.sucesso;
        } else if (solicitacao.status === 'Reprovado' || solicitacao.status === 'Não Autorizado') {
            corStatus = CORES.alerta;
        }
        
        doc.setTextColor(corStatus);
        doc.setFontSize(12);
        doc.text(`Status Atual: ${solicitacao.status || 'Pendente'}`, CONFIG.margens.esquerda, posicaoY);
        posicaoY += 7;
        
        if (solicitacao.observacao) {
            doc.setTextColor(CORES.texto);
            doc.setFontSize(10);
            doc.text(`Observação: ${solicitacao.observacao}`, CONFIG.margens.esquerda, posicaoY);
            posicaoY += 7;
        }
        
        return posicaoY + 10;
    }
    
    // Função para adicionar histórico de auditoria ao PDF
    function adicionarHistoricoAuditoria(doc, dados, posicaoYInicial) {
        let posicaoY = posicaoYInicial;
        
        // Título da seção
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('Histórico de Auditoria', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 10;
        
        // Verifica se há eventos de auditoria
        if (!dados.auditoria || dados.auditoria.length === 0) {
            doc.setFontSize(10);
            doc.setTextColor(CORES.texto);
            doc.text('Nenhum evento de auditoria registrado.', CONFIG.margens.esquerda, posicaoY);
            return posicaoY + 10;
        }
        
        // Cabeçalho da tabela
        const colunas = ['Data/Hora', 'Evento', 'Usuário', 'Detalhes'];
        const larguraColunas = [40, 40, 40, 60];
        
        // Calcula largura total e posição inicial
        const larguraTotal = larguraColunas.reduce((a, b) => a + b, 0);
        let posicaoX = CONFIG.margens.esquerda;
        
        // Desenha cabeçalho da tabela
        doc.setFillColor(CORES.secundaria);
        doc.rect(posicaoX, posicaoY, larguraTotal, 8, 'F');
        
        doc.setTextColor('#ffffff');
        doc.setFontSize(9);
        
        colunas.forEach((coluna, index) => {
            doc.text(coluna, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[index];
        });
        
        posicaoY += 8;
        
        // Desenha linhas da tabela
        doc.setTextColor(CORES.texto);
        doc.setFontSize(8);
        
        let corLinha = true;
        
        dados.auditoria.forEach((evento, index) => {
            // Verifica se precisa adicionar nova página
            if (posicaoY > doc.internal.pageSize.height - CONFIG.margens.inferior - 20) {
                doc.addPage();
                criarCabecalhoPDF(doc);
                posicaoY = CONFIG.cabecalho.altura + 15;
                
                // Redesenha cabeçalho da tabela na nova página
                posicaoX = CONFIG.margens.esquerda;
                doc.setFillColor(CORES.secundaria);
                doc.rect(posicaoX, posicaoY, larguraTotal, 8, 'F');
                
                doc.setTextColor('#ffffff');
                doc.setFontSize(9);
                
                colunas.forEach((coluna, index) => {
                    doc.text(coluna, posicaoX + 3, posicaoY + 5);
                    posicaoX += larguraColunas[index];
                });
                
                posicaoY += 8;
                doc.setTextColor(CORES.texto);
                doc.setFontSize(8);
            }
            
            // Alterna cor de fundo das linhas
            if (corLinha) {
                doc.setFillColor(CORES.fundo);
            } else {
                doc.setFillColor('#ffffff');
            }
            corLinha = !corLinha;
            
            doc.rect(CONFIG.margens.esquerda, posicaoY, larguraTotal, 8, 'F');
            
            // Adiciona dados nas colunas
            posicaoX = CONFIG.margens.esquerda;
            
            // Data/Hora
            doc.text(formatarData(evento.timestamp), posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[0];
            
            // Tipo de Evento
            let tipoEvento = evento.tipo.replace(/_/g, ' ');
            tipoEvento = tipoEvento.charAt(0).toUpperCase() + tipoEvento.slice(1);
            doc.text(tipoEvento, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[1];
            
            // Usuário
            const usuario = evento.usuarioId === 'anonimo' ? 'Anônimo' : evento.usuarioId.substring(0, 8);
            doc.text(usuario, posicaoX + 3, posicaoY + 5);
            posicaoX += larguraColunas[2];
            
            // Detalhes
            let detalhes = '';
            if (evento.dados) {
                if (evento.dados.decisao) {
                    detalhes = `Decisão: ${evento.dados.decisao}`;
                } else if (evento.dados.status) {
                    detalhes = `Status: ${evento.dados.status}`;
                } else if (evento.dados.nome) {
                    detalhes = `Atleta: ${evento.dados.nome}`;
                } else if (evento.dados.canal) {
                    detalhes = `Canal: ${evento.dados.canal}`;
                }
            }
            doc.text(detalhes || 'N/A', posicaoX + 3, posicaoY + 5);
            
            posicaoY += 8;
        });
        
        // Adiciona borda à tabela
        doc.setDrawColor(CORES.borda);
        doc.rect(
            CONFIG.margens.esquerda,
            posicaoYInicial + 10,
            larguraTotal,
            posicaoY - (posicaoYInicial + 10),
            'S'
        );
        
        return posicaoY + 10;
    }
    
    // Função para adicionar seção de assinaturas ao PDF
    function adicionarSecaoAssinaturas(doc, posicaoYInicial) {
        let posicaoY = posicaoYInicial;
        
        // Verifica se precisa adicionar nova página
        if (posicaoY > doc.internal.pageSize.height - CONFIG.margens.inferior - 60) {
            doc.addPage();
            criarCabecalhoPDF(doc);
            posicaoY = CONFIG.cabecalho.altura + 15;
        }
        
        // Título da seção
        doc.setFontSize(14);
        doc.setTextColor(CORES.primaria);
        doc.text('Assinaturas', CONFIG.margens.esquerda, posicaoY);
        posicaoY += 20;
        
        // Linha para assinatura do responsável
        const larguraLinha = 70;
        const espacoEntreLinhas = 80;
        
        doc.setDrawColor(CORES.texto);
        
        // Primeira assinatura
        doc.line(
            CONFIG.margens.esquerda,
            posicaoY,
            CONFIG.margens.esquerda + larguraLinha,
            posicaoY
        );
        
        doc.setFontSize(10);
        doc.text(
            'Responsável pelo Atleta',
            CONFIG.margens.esquerda + larguraLinha / 2,
            posicaoY + 5,
            { align: 'center' }
        );
        
        // Segunda assinatura
        doc.line(
            CONFIG.margens.esquerda + espacoEntreLinhas,
            posicaoY,
            CONFIG.margens.esquerda + espacoEntreLinhas + larguraLinha,
            posicaoY
        );
        
        doc.text(
            'Serviço Social',
            CONFIG.margens.esquerda + espacoEntreLinhas + larguraLinha / 2,
            posicaoY + 5,
            { align: 'center' }
        );
        
        return posicaoY + 20;
    }
    
    // Função para gerar o PDF completo
    async function gerarPDF(solicitacaoId) {
        try {
            // Obtém dados da solicitação
            const dados = await obterDadosSolicitacao(solicitacaoId);
            
            // Registra evento de auditoria
            await window.auditoriaService.registrarGeracaoPDF(solicitacaoId, 'relatorio_completo');
            
            // Cria documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: CONFIG.orientacao,
                unit: 'mm',
                format: CONFIG.formato
            });
            
            // Adiciona cabeçalho
            criarCabecalhoPDF(doc);
            
            // Adiciona informações da solicitação
            let posicaoY = adicionarInformacoesSolicitacao(doc, dados);
            
            // Adiciona histórico de auditoria
            posicaoY = adicionarHistoricoAuditoria(doc, dados, posicaoY);
            
            // Adiciona seção de assinaturas
            adicionarSecaoAssinaturas(doc, posicaoY);
            
            // Adiciona rodapé em todas as páginas
            const totalPaginas = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPaginas; i++) {
                criarRodapePDF(doc, i);
            }
            
            // Gera nome do arquivo
            const nomeArquivo = `autorizacao_${solicitacaoId.substring(0, 8)}_${new Date().getTime()}.pdf`;
            
            // Salva o PDF
            doc.save(nomeArquivo);
            
            return { sucesso: true, nomeArquivo: nomeArquivo };
        } catch (erro) {
            console.error('Erro ao gerar PDF:', erro);
            return { sucesso: false, erro: erro.message };
        }
    }
    
    // API pública do serviço
    return {
        gerarRelatorioPdf: gerarPDF
    };
})();
