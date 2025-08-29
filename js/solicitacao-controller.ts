import { AutorizacaoService } from "./autorizacao-service";

/**
 * Controlador de Solicitações - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de solicitação (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

interface SolicitacaoFormData {
  nome: string;
  email: string;
  data_nascimento: string;
  telefone: string;
  categoria: string;
  data_saida: string;
  horario_saida: string;
  data_retorno: string;
  horario_retorno: string;
  motivo_destino: string;
  nome_responsavel: string;
  telefone_responsavel: string;
  status_geral: string;
  status_pais: string;
  status_servico_social: string;
  status_monitor: string;
}

const SolicitacaoController = (function() {
  // Elementos da interface
  let autorizacaoForm: HTMLFormElement | null;
  let alertMessage: HTMLDivElement | null;
  
  // Inicialização do controlador
  function inicializar(): void {
    // Capturar elementos do DOM
    autorizacaoForm = document.getElementById("autorizacao-form") as HTMLFormElement;
    alertMessage = document.getElementById("alert-message") as HTMLDivElement;
    
    // Verificar se estamos na página correta
    if (!autorizacaoForm) return;
    
    // Configurar eventos
    autorizacaoForm.addEventListener("submit", handleSubmit);
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem: string, tipo: string): void {
    if (!alertMessage) return;
    
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = "block";
    
    // Esconder a mensagem após 8 segundos (aumentei um pouco)
    setTimeout(function() {
      if (alertMessage) {
        alertMessage.style.display = "none";
      }
    }, 8000);
  }
  
  // Manipulador de envio do formulário (CORRIGIDO: adicionado \'async\')
  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData: SolicitacaoFormData = {
      nome: (document.getElementById("nome") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      data_nascimento: (document.getElementById("data_nascimento") as HTMLInputElement).value,
      telefone: (document.getElementById("telefone") as HTMLInputElement).value,
      categoria: (document.getElementById("categoria") as HTMLSelectElement).value,
      data_saida: (document.getElementById("data_saida") as HTMLInputElement).value,
      horario_saida: (document.getElementById("horario_saida") as HTMLInputElement).value,
      data_retorno: (document.getElementById("data_retorno") as HTMLInputElement).value,
      horario_retorno: (document.getElementById("horario_retorno") as HTMLInputElement).value,
      motivo_destino: (document.getElementById("motivo_destino") as HTMLTextAreaElement).value,
      nome_responsavel: (document.getElementById("nome_responsavel") as HTMLInputElement).value,
      telefone_responsavel: (document.getElementById("telefone_responsavel") as HTMLInputElement).value,
      // Novos campos de status
      status_geral: 'pendente_pais',
      status_pais: 'pendente',
      status_servico_social: 'pendente',      status_monitor: 'pendente'
    };

    try {
      // Usar o serviço de autorização para criar a solicitação (CORRIGIDO: await agora funciona)
      const resultado = await AutorizacaoService.criarSolicitacao(formData);
      
      if (resultado.sucesso && resultado.solicitacao && resultado.solicitacao.id) {
        // Mostrar mensagem de sucesso com o código
        mostrarAlerta(`Solicitação enviada com sucesso! Seu código de acompanhamento é: ${resultado.solicitacao.id}. Você receberá atualizações sobre o status por e-mail.`, "alert-success");
        
        // Limpar o formulário
        if (autorizacaoForm) {
          autorizacaoForm.reset();
        }
        
      } else {
        // Mostrar mensagem de erro vinda do serviço
        mostrarAlerta(resultado.mensagem || "Ocorreu um erro ao enviar a solicitação.", "alert-danger");
      }
    } catch (error: any) {
      // Capturar erros da chamada await ou outros erros inesperados
      console.error("Erro ao processar envio do formulário:", error);
      // Mostrar mensagem de erro genérica (CORRIGIDO: usa error.message)
      mostrarAlerta(`Ocorreu um erro inesperado ao processar sua solicitação: ${error.message}. Por favor, tente novamente mais tarde.`, "alert-danger");
    }
  }

  // Inicializar o controlador quando o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", function() {
    SolicitacaoController.inicializar();
  });

  // Retornar o objeto do controlador para uso externo (CORRIGIDO: dentro do IIFE)
  return {
    inicializar: inicializar
  };
})(); // Fim do IIFE

export { SolicitacaoController };


