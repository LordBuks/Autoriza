// Serviço de integração com WhatsApp
class WhatsAppService {
  constructor() {
    // Inicialização do serviço
    console.log('Serviço de WhatsApp inicializado');
  }
  
  // Gerar link para WhatsApp usando a API wa.me
  gerarLinkWhatsApp(telefone, mensagem) {
    // Remover caracteres não numéricos do telefone
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Adicionar código do país (Brasil - 55) se não estiver presente
    const numeroCompleto = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    
    // Codificar a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Retornar o link formatado
    return `https://wa.me/${numeroCompleto}?text=${mensagemCodificada}`;
  }
  
  // Gerar mensagem para confirmação de autorização
  gerarMensagemConfirmacao(dados, linkConfirmacao) {
    return `Olá ${dados.nome_responsavel},\n\n`+
           `O atleta ${dados.nome} solicitou uma autorização de saída do Sport Club Internacional.\n\n`+
           `Detalhes da solicitação:\n`+
           `- Data de Saída: ${this.formatarData(new Date(dados.data_saida))} às ${dados.horario_saida}\n`+
           `- Data de Retorno: ${this.formatarData(new Date(dados.data_retorno))} às ${dados.horario_retorno}\n`+
           `- Motivo/Destino: ${dados.motivo_destino}\n\n`+
           `Para confirmar esta autorização, acesse o link abaixo:\n${linkConfirmacao}\n\n`+
           `Esta confirmação é necessária para garantir a segurança do atleta.\n\n`+
           `Em caso de dúvidas, entre em contato com o Departamento de Serviço Social.\n\n`+
           `Atenciosamente,\nSport Club Internacional`;
  }
  
  // Formatar data para exibição
  formatarData(data) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// Exportar o serviço como um módulo
const whatsAppService = new WhatsAppService();