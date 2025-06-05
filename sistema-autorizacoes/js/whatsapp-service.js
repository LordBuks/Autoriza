// Serviço de integração com WhatsApp
class WhatsAppService {
  constructor() {
    // Inicialização do serviço
    console.log('Serviço de WhatsApp inicializado');
  }
  
  // Gerar link para WhatsApp usando a API wa.me
  gerarLinkWhatsApp(telefone, mensagem) {
    // 1. Remover todos os caracteres não numéricos
    let numeroLimpo = telefone.replace(/\D/g, '');

    // 2. Verificar e formatar para o padrão brasileiro (55 + DDD + número)
    if (numeroLimpo.startsWith('+55') && (numeroLimpo.length === 12 || numeroLimpo.length === 13)) {
      // Número já está no formato correto (55 + DDD + número)
      // Ex: 55119XXXXXXXX ou 5511XXXXXXXX
    } else if (!numeroLimpo.startsWith('+55') && (numeroLimpo.length === 10 || numeroLimpo.length === 11)) {
      // Número não tem 55, mas tem tamanho de DDD + número (10 ou 11 dígitos)
      // Adicionar o 55
      numeroLimpo = `55${numeroLimpo}`;
    } else {
      // Número está em formato inválido ou não é brasileiro
      console.error(`Número de telefone inválido ou não brasileiro fornecido: ${telefone}. Esperado formato brasileiro com DDD (ex: 55119... ou 119...).`);
      // Retornar null para indicar que não foi possível gerar um link válido.
      // A validação no formulário deve ser aprimorada para evitar isso.
      return null;
    }

    // 3. Codificar a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);

    // 4. Retornar o link formatado para a API wa.me (sem o '+')
    return `https://wa.me/${numeroLimpo}?text=${mensagemCodificada}`;
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