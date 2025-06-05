// Serviço de integração com WhatsApp
class WhatsAppService {
  constructor() {
    // Inicialização do serviço
    console.log('Serviço de WhatsApp inicializado');
  }
  
  // Gerar link para WhatsApp usando a API wa.me
  gerarLinkWhatsApp(telefone, mensagem) {
    // 1. Remover todos os caracteres não numéricos
    let numeroLimpo = telefone.replace(/\D/g, "");

    // 2. Garantir que o número comece com o código do país (55 para Brasil)
    //    Assumimos que todos os números são brasileiros e precisam do prefixo 55.
    if (!numeroLimpo.startsWith("55")) {
      numeroLimpo = `55${numeroLimpo}`;
    }

    // Opcional: Adicionar validação de comprimento para números brasileiros
    // Um número de telefone brasileiro (DDD + número) tem 10 ou 11 dígitos.
    // Com o 55, o total deve ser 12 ou 13 dígitos.
    if (numeroLimpo.length !== 12 && numeroLimpo.length !== 13) {
        console.error(`Número de telefone com formato inesperado após formatação: ${numeroLimpo}. Esperado 12 ou 13 dígitos com prefixo 55.`);
        return null;
    }

    // 3. Codificar a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);

    // 4. Retornar o link formatado para a API wa.me (sem o 
    return `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
  }
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

window.whatsAppService = whatsAppService;

