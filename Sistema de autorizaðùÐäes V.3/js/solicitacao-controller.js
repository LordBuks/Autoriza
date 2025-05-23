/**
 * Controlador de Solicitações - Sistema de Autorizações Digitais
 * 
 * Este módulo unifica as funcionalidades de solicitação (integrado e não integrado)
 * utilizando o padrão Module e o serviço centralizado de autorizações.
 */

const SolicitacaoController = (function() {
  // Elementos da interface
  let autorizacaoForm;
  let alertMessage;
  
  // Inicialização do controlador
  function inicializar() {
    // Capturar elementos do DOM
    autorizacaoForm = document.getElementById('autorizacao-form');
    alertMessage = document.getElementById('alert-message');
    
    // Verificar se estamos na página correta
    if (!autorizacaoForm) return;
    
    // Configurar eventos
    autorizacaoForm.addEventListener('submit', handleSubmit);
  }
  
  // Função para mostrar alertas
  function mostrarAlerta(mensagem, tipo) {
    if (!alertMessage) return;
    
    alertMessage.textContent = mensagem;
    alertMessage.className = `alert ${tipo}`;
    alertMessage.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertMessage.style.display = 'none';
    },  // Manipulador de envio do formulário (agora assíncrono)
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = {
      // Renomear campos para corresponder ao esperado pelo serviço (se necessário)
      // Exemplo: nome_atleta em vez de nome
      nomeAtleta: document.getElementById("nome").value,
      emailAtleta: document.getElementById("email").value,
      dataNascimento: document.getElementById("data_nascimento").value,
      telefoneAtleta: document.getElementById("telefone").value,
      categoria: document.getElementById("categoria").value,
      data_saida: document.getElementById("data_saida").value, // Manter como string, serviço converterá
      horarioSaida: document.getElementById("horario_saida").value,
      data_retorno: document.getElementById("data_retorno").value, // Manter como string, serviço converterá
      horarioRetorno: document.getElementById("horario_retorno").value,
      motivoDestino: document.getElementById("motivo_destino").value,
      nomeResponsavel: document.getElementById("nome_responsavel").value,
      telefoneResponsavel: document.getElementById("telefone_responsavel").value,
      // Adicionar ID do atleta logado (se aplicável e disponível)
      // idAtleta: localStorage.getItem("user_uid") // Exemplo
    };
    
    // Usar o serviço de autorização para criar a solicitação (agora com await)
    try {
        mostrarAlerta("Enviando solicitação...", "alert-info"); // Feedback visual
        const resultado = await window.AutorizacaoService.criarSolicitacao(formData);
        
        if (resultado.sucesso) {
          // Mostrar mensagem de sucesso
          mostrarAlerta(`Solicitação enviada com sucesso! Seu código de acompanhamento é: ${resultado.solicitacao.id}`, "alert-success");
          
          // Limpar o formulário
          autorizacaoForm.reset();
          
          // Redirecionar após 3 segundos para a página de consulta
          // A página de consulta também precisará ser adaptada para buscar do Firestore
          setTimeout(function() {
            // Assumindo que a página de consulta espera o ID como parâmetro URL
            window.location.href = `../atleta/consultar.html?id=${resultado.solicitacao.id}`; 
          }, 3000);
        } else {
          // Mostrar mensagem de erro vinda do serviço
          mostrarAlerta(resultado.mensagem || "Ocorreu um erro ao enviar a solicitação.", "alert-danger");
        }
    } catch (error) {
        // Capturar erros inesperados na chamada assíncrona
        console.error("Erro ao chamar criarSolicitacao:", error);
        mostrarAlerta("Erro inesperado ao processar a solicitação. Tente novamente mais tarde.", "alert-danger");
    }
  }  return {
    inicializar: inicializar
  };
})();

// Inicializar o controlador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  SolicitacaoController.inicializar();
});