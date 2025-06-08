// Serviço de integração com WhatsApp
class WhatsAppService {
  constructor() {
    // Inicialização do serviço
    console.log('Serviço de WhatsApp inicializado');
  }
  
  // Gerar link para WhatsApp usando a API wa.me  gerarLinkWhatsApp(telefone, mensagem) {
    let numeroLimpo = telefone.replace(/\D/g, ""); // Remove non-digits
    console.log("WhatsAppService: Número limpo inicial:", numeroLimpo);

    // Case 1: Number is already in Brazilian format (55 + DDD + Number)
    if (numeroLimpo.startsWith("55") && (numeroLimpo.length === 12 || numeroLimpo.length === 13)) {
      console.log("WhatsAppService: Número já formatado corretamente.");
      // Already correctly formatted
    } 
    // Case 2: Number is DDD + Number (10 or 11 digits), needs '55' prefix
    else if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
      numeroLimpo = `55${numeroLimpo}`;
      console.log("WhatsAppService: Adicionado prefixo 55. Número:", numeroLimpo);
    }
    // Case 3: Number is longer than 11 digits and doesn't start with '55'.
    // This implies an incorrect country code prefix that needs to be replaced.
    else if (numeroLimpo.length > 11 && !numeroLimpo.startsWith("55")) {
        // Assume the first 2 digits are an incorrect country code and remove them.
        // Then prepend '55'.
        const numeroSemPrefixoIncorreto = numeroLimpo.substring(2);
        numeroLimpo = `55${numeroSemPrefixoIncorreto}`;
        console.log("WhatsAppService: Removido prefixo incorreto e adicionado 55. Número:", numeroLimpo);
    }
    // Case 4: Any other unexpected format
    else {
        console.error(`WhatsAppService: Número de telefone com formato inesperado: ${telefone}. Não foi possível formatar para WhatsApp.`);
        return null;
    }

    // Final validation of length after formatting
    if (numeroLimpo.length !== 12 && numeroLimpo.length !== 13) {
        console.error(`WhatsAppService: Número de telefone com formato inválido após processamento: ${numeroLimpo}. Esperado 12 ou 13 dígitos com prefixo 55.`);
        return null;
    }

    const mensagemCodificada = encodeURIComponent(mensagem);
    return `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
  } }
  
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

window.whatsAppService = whatsAppService;

