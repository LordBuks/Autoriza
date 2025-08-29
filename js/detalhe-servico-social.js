// Lógica para a tela de detalhe do serviço social
document.addEventListener("DOMContentLoaded", async function() {
  // Elementos da página
  const btnEnviarWhatsapp = document.getElementById("btn-enviar-whatsapp");
  const btnValidar = document.getElementById("btn-validar");
  const btnReprovar = document.getElementById("btn-reprovar");
  const mensagemWhatsapp = document.getElementById("mensagem-whatsapp");
  const textoWhatsapp = document.getElementById("texto-whatsapp");
  const btnCopiar = document.getElementById("btn-copiar");
  const btnAbrirWhatsapp = document.getElementById("btn-abrir-whatsapp");
  const btnFecharMensagem = document.getElementById("btn-fechar-mensagem");
  const modalObservacao = document.getElementById("modal-observacao");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const btnDefinirStatusFinal = document.getElementById("btn-definir-status-final"); // Novo botão
  const btnGerarRelatorio = document.getElementById("btn-gerar-relatorio"); // Novo botão
  const btnVerLinkEnviado = document.getElementById("btn-ver-link-enviado"); // Novo botão
  const btnReenviarLinkPais = document.getElementById("btn-reenviar-link-pais"); // Novo botão

  // Variáveis de controle
  let solicitacaoAtual = null;
  let acaoAtual = null; // 'validar', 'reprovar' ou 'definir_final'
  const DPO_EMAIL = "dpo@internacional.com.br"; // Email do DPO para a mensagem

  // Obter ID da solicitação da URL
  const urlParams = new URLSearchParams(window.location.search);
  const idSolicitacao = urlParams.get("id");

  if (!idSolicitacao) {
    alert("ID da solicitação não fornecido. Redirecionando para o painel.");
    window.location.href = "dashboard.html";
    return;
  }

  // Carregar dados da solicitação
  carregarSolicitacao(idSolicitacao);

  // Eventos dos botões
  btnEnviarWhatsapp.addEventListener("click", function() {
    prepararMensagemWhatsapp();
    mensagemWhatsapp.style.display = "block";
  });

  if (btnDefinirStatusFinal) {
    btnDefinirStatusFinal.addEventListener("click", function() {
      // Só pode ser clicado se os pais já responderam
      if (solicitacaoAtual && (solicitacaoAtual.status_pais === 'Aprovado' || solicitacaoAtual.status_pais === 'Reprovado')) {
        acaoAtual = 'definir_final';
        document.getElementById('observacao').value = ''; // Limpa observação anterior
        modalObservacao.style.display = 'block';

        // Esconder botões de validar/reprovar e mostrar botões de aprovar/reprovar final
        if (btnValidar) btnValidar.style.display = 'none';
        if (btnReprovar) btnReprovar.style.display = 'none';
        if (btnConfirmar) btnConfirmar.style.display = 'none'; // Esconder o confirmar padrão
        
        // Mostrar botões específicos para Definir Status Final
        const btnAprovarFinal = document.getElementById('btn-aprovar-final');
        const btnReprovarFinal = document.getElementById('btn-reprovar-final');
        if (btnAprovarFinal) btnAprovarFinal.style.display = 'block';
        if (btnReprovarFinal) btnReprovarFinal.style.display = 'block';

      } else {
        alert('O status final só pode ser definido após a resposta dos responsáveis.');
      }
    });
  }

  btnValidar.addEventListener("click", function() {
    acaoAtual = "validar";
    modalObservacao.style.display = "block";
    // Esconder botões de aprovar/reprovar final
    const btnAprovarFinal = document.getElementById('btn-aprovar-final');
    const btnReprovarFinal = document.getElementById('btn-reprovar-final');
    if (btnAprovarFinal) btnAprovarFinal.style.display = 'none';
    if (btnReprovarFinal) btnReprovarFinal.style.display = 'none';
    if (btnConfirmar) btnConfirmar.style.display = 'block'; // Mostrar o confirmar padrão
  });

  btnReprovar.addEventListener("click", function() {
    acaoAtual = "reprovar";
    modalObservacao.style.display = "block";
    // Esconder botões de aprovar/reprovar final
    const btnAprovarFinal = document.getElementById('btn-aprovar-final');
    const btnReprovarFinal = document.getElementById('btn-reprovar-final');
    if (btnAprovarFinal) btnAprovarFinal.style.display = 'none';
    if (btnReprovarFinal) btnReprovarFinal.style.display = 'none';
    if (btnConfirmar) btnConfirmar.style.display = 'block'; // Mostrar o confirmar padrão
  });

  btnConfirmar.addEventListener("click", function() {
    const observacao = document.getElementById("observacao").value;

    if (acaoAtual === "validar") {
      validarAutorizacao(observacao);
    } else if (acaoAtual === "reprovar") {
      reprovarAutorizacao(observacao);
    }

    modalObservacao.style.display = "none";
  });

  btnCancelar.addEventListener("click", function() {
    modalObservacao.style.display = "none";
    // Resetar visibilidade dos botões do modal
    const btnAprovarFinal = document.getElementById('btn-aprovar-final');
    const btnReprovarFinal = document.getElementById('btn-reprovar-final');
    if (btnAprovarFinal) btnAprovarFinal.style.display = 'none';
    if (btnReprovarFinal) btnReprovarFinal.style.display = 'none';
    if (btnValidar) btnValidar.style.display = 'block';
    if (btnReprovar) btnReprovar.style.display = 'block';
    if (btnConfirmar) btnConfirmar.style.display = 'block';
  });

  // Lógica para os novos botões de Aprovar/Reprovar Final
  const btnAprovarFinal = document.getElementById('btn-aprovar-final');
  const btnReprovarFinal = document.getElementById('btn-reprovar-final');

  if (btnAprovarFinal) {
    btnAprovarFinal.addEventListener('click', async function() {
      const observacao = document.getElementById('observacao').value;
      await definirStatusFinal('Aprovado', observacao);
      modalObservacao.style.display = 'none';
    });
  }

  if (btnReprovarFinal) {
    btnReprovarFinal.addEventListener('click', async function() {
      const observacao = document.getElementById('observacao').value;
      if (!observacao.trim()) {
        alert('É necessário fornecer um motivo para a reprovação final.');
        return;
      }
      await definirStatusFinal('Reprovado', observacao);
      modalObservacao.style.display = 'none';
    });
  }

  btnCopiar.addEventListener("click", function() {
    textoWhatsapp.select();
    document.execCommand("copy");
    alert("Mensagem copiada para a área de transferência!");
  });

  btnAbrirWhatsapp.addEventListener("click", function() {
    if (!solicitacaoAtual) return;

    // Formatar número de telefone (remover caracteres não numéricos)
    const telefone = solicitacaoAtual.telefone_responsavel.replace(/\D/g, "");
    console.log("detalhe-servico-social: Telefone antes de enviar para WhatsAppService:", telefone);

    // Codificar a mensagem para URL
    const mensagem = encodeURIComponent(textoWhatsapp.value);

    // Abrir WhatsApp Web com o número e mensagem
    const linkWhatsapp = window.whatsAppService.gerarLinkWhatsApp(telefone, mensagem);
    if (linkWhatsapp) {
      window.open(linkWhatsapp, "_blank");
    } else {
      alert("Não foi possível gerar o link do WhatsApp. Verifique o número de telefone.");
    }
  });

  btnFecharMensagem.addEventListener("click", function() {
    mensagemWhatsapp.style.display = "none";
  });

  // Função para carregar os dados da solicitação
  async function carregarSolicitacao(id) {
    const solicitacao = await window.AutorizacaoService.buscarSolicitacao(id);

    if (!solicitacao) {
      alert("Solicitação não encontrada. Redirecionando para o painel.");
      window.location.href = "dashboard.html";
      return;
    }

    // Armazenar a solicitação atual
    solicitacaoAtual = solicitacao;

    // Preencher os dados na página
    document.getElementById("nome-atleta").textContent = solicitacao.nome;
    document.getElementById("categoria-atleta").textContent = solicitacao.categoria;
    document.getElementById("data-nascimento").textContent = formatarData(new Date(solicitacao.data_nascimento));
    document.getElementById("telefone-atleta").textContent = solicitacao.telefone;

    document.getElementById("data-saida").textContent = formatarData(new Date(solicitacao.data_saida));
    document.getElementById("horario-saida").textContent = solicitacao.horario_saida;
    document.getElementById("data-retorno").textContent = formatarData(new Date(solicitacao.data_retorno));
    document.getElementById("horario-retorno").textContent = solicitacao.horario_retorno;
    document.getElementById("motivo-destino").textContent = solicitacao.motivo_destino;

    document.getElementById("nome-responsavel").textContent = solicitacao.nome_responsavel;
    document.getElementById("telefone-responsavel").textContent = solicitacao.telefone_responsavel;

    const statusSupervisor = document.getElementById("status-supervisor");
    statusSupervisor.textContent = solicitacao.status_supervisor;

    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_supervisor === "Aprovado") {
      statusSupervisor.className = "badge badge-approved";
    } else if (solicitacao.status_supervisor === "Reprovado") {
      statusSupervisor.className = "badge badge-rejected";
    } else {
      statusSupervisor.className = "badge badge-pending";
    }

    document.getElementById("data-aprovacao-supervisor").textContent =
      solicitacao.data_aprovacao_supervisor ?
      formatarData(new Date(solicitacao.data_aprovacao_supervisor)) :
      "N/A";

    const statusAtual = document.getElementById("status-atual");
    statusAtual.textContent = solicitacao.status_servico_social;

    // Ajustar a classe do badge de acordo com o status
    if (solicitacao.status_servico_social === "Aprovado") {
      statusAtual.className = "badge badge-approved";
      // Desabilitar botões se já aprovado
      btnValidar.disabled = true;
      btnReprovar.disabled = true;
      if (btnDefinirStatusFinal) btnDefinirStatusFinal.disabled = true; // Desabilitar se já aprovado pelo SS
    } else if (solicitacao.status_servico_social === "Reprovado") {
      statusAtual.className = "badge badge-rejected";
      // Desabilitar botões se já reprovado
      btnValidar.disabled = true;
      btnReprovar.disabled = true;
      if (btnDefinirStatusFinal) btnDefinirStatusFinal.disabled = true; // Desabilitar se já reprovado pelo SS
    } else {
      statusAtual.className = "badge badge-pending";
      // Habilitar/Desabilitar btnDefinirStatusFinal com base na resposta dos pais
      if (btnDefinirStatusFinal) {
        if (solicitacao.status_pais === 'Aprovado' || solicitacao.status_pais === 'Reprovado') {
          btnDefinirStatusFinal.disabled = false;
        } else {
          btnDefinirStatusFinal.disabled = true;
        }
      }
    }

    // Lógica para o status dos pais
    const statusPaisElement = document.getElementById('status-pais');
    if (statusPaisElement) {
      statusPaisElement.textContent = solicitacao.status_pais || 'Pendente';
      if (solicitacao.status_pais === 'Aprovado') {
        statusPaisElement.className = 'badge badge-approved';
      } else if (solicitacao.status_pais === 'Reprovado') {
        statusPaisElement.className = 'badge badge-rejected';
      } else {
        statusPaisElement.className = 'badge badge-pending';
      }
    }

    // Lógica para o status final
    const statusFinalElement = document.getElementById('status-final');
    if (statusFinalElement) {
      statusFinalElement.textContent = solicitacao.status_final || 'Em Análise';
      if (solicitacao.status_final === 'Aprovado') {
        statusFinalElement.className = 'badge badge-approved';
      } else if (solicitacao.status_final === 'Reprovado') {
        statusFinalElement.className = 'badge badge-rejected';
      } else {
        statusFinalElement.className = 'badge badge-pending';
      }
    }

    // Lógica para o botão 'Ver Link Enviado'
    if (btnVerLinkEnviado) {
      if (solicitacao.link_pais) {
        btnVerLinkEnviado.style.display = 'block';
      } else {
        btnVerLinkEnviado.style.display = 'none';
      }
    }

    // Lógica para o botão 'Reenviar Link aos Pais'
    if (btnReenviarLinkPais) {
      if (solicitacao.status_pais === 'Pendente' && solicitacao.link_pais) {
        btnReenviarLinkPais.style.display = 'block';
      } else {
        btnReenviarLinkPais.style.display = 'none';
      }
    }

    // Lógica para o botão 'Gerar Relatório PDF'
    if (btnGerarRelatorio) {
      btnGerarRelatorio.style.display = 'block'; // Sempre visível, pois pode gerar relatório de auditoria
    }
  }

  // Função para preparar a mensagem de WhatsApp
  function prepararMensagemWhatsapp() {
    if (!solicitacaoAtual) return;

    // Função para formatar data no formato dd/MM/yyyy
    function fmt(dataStr, formato) {
      const data = new Date(dataStr);
      if (formato === "dd/MM/yyyy") {
        return data.toLocaleDateString("pt-BR");
      } else if (formato === "HH:mm") {
        return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      }
      return dataStr;
    }

    // Construir a mensagem conforme o modelo fornecido pelo usuário
    const mensagem = `Prezado(a) ${solicitacaoAtual.nome_responsavel || 'Responsável'},

Informamos que o(a) atleta abaixo solicitou autorização de saída, conforme Lei Pelé (Art. 29) e LGPD (Lei nº 13.709/2018):

🙋🏽 Nome: ${solicitacaoAtual.nome}
📅 Saída: ${fmt(solicitacaoAtual.data_saida, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_saida}
📅 Retorno: ${fmt(solicitacaoAtual.data_retorno, "dd/MM/yyyy")} às ${solicitacaoAtual.horario_retorno}
📍 Destino: ${solicitacaoAtual.motivo_destino}

Para autorizar, responda com a seguinte declaração:
*Eu, ${solicitacaoAtual.nome_responsavel || '[seu nome]'}, autorizo o(a) atleta ${solicitacaoAtual.nome} a sair e retornar ao alojamento conforme informado, em conformidade com a Lei Pelé e LGPD.*

Seus dados serão protegidos conforme nossa política de privacidade. Contato do DPO: ${DPO_EMAIL}.

Atenciosamente,
Serviço Social - Sport Club Internacional`;

    textoWhatsapp.value = mensagem;
  }

  // Função para validar a autorização (Serviço Social)
  async function validarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;

    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        "servico_social",
        "Aprovado",
        observacao
      );

      if (resultado.sucesso) {
        alert("Autorização validada com sucesso!");
        window.location.reload();
      } else {
        alert(`Erro ao validar autorização: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error("Erro ao validar autorização:", error);
      alert("Ocorreu um erro ao validar a autorização. Tente novamente.");
    }
  }

  // Função para reprovar a autorização (Serviço Social)
  async function reprovarAutorizacao(observacao) {
    if (!solicitacaoAtual) return;

    // Verificar se a observação foi fornecida (obrigatória para reprovação)
    if (!observacao.trim()) {
      alert("É necessário fornecer um motivo para a reprovação.");
      return;
    }

    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        "servico_social",
        "Reprovado",
        observacao
      );

      if (resultado.sucesso) {
        alert("Autorização reprovada.");
        window.location.reload();
      } else {
        alert(`Erro ao reprovar autorização: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error("Erro ao reprovar autorização:", error);
      alert("Ocorreu um erro ao reprovar a autorização. Tente novamente.");
    }
  }

  // Nova função para definir o status final (Serviço Social)
  async function definirStatusFinal(status, observacao) {
    if (!solicitacaoAtual) return;

    try {
      const resultado = await window.AutorizacaoService.atualizarStatus(
        solicitacaoAtual.id,
        "servico_social_final", // Um novo perfil para diferenciar a ação
        status,
        observacao
      );

      if (resultado.sucesso) {
        alert(`Status final definido como ${status} com sucesso!`);
        window.location.reload();
      } else {
        alert(`Erro ao definir status final: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error("Erro ao definir status final:", error);
      alert("Ocorreu um erro ao definir o status final. Tente novamente.");
    }
  }

  // Função para gerar hash único para validação legal
  // function gerarHashUnico(dados) {
  //   // Em um sistema real, usaríamos um algoritmo de hash criptográfico
  //   // Aqui, vamos simular um hash baseado nos dados e timestamp
  //   const timestamp = new Date().getTime();
  //   const randomStr = Math.random().toString(36).substring(2, 15);
  //   return `HASH-${timestamp}-${randomStr}-${dados.id}`;
  // }

  // Função para arquivar a autorização
  // function arquivarAutorizacao(dados, tipo) {
  //   // Em um sistema real, salvaríamos em um banco de dados ou sistema de arquivos
  //   // Aqui, vamos simular o arquivamento no localStorage

  //   // Recuperar arquivos existentes ou inicializar objeto vazio
  //   let arquivos = JSON.parse(localStorage.getItem("arquivos")) || {};

  //   // Inicializar a categoria se não existir
  //   if (!arquivos[tipo]) {
  //     arquivos[tipo] = [];
  //   }

  //   // Adicionar data e hora de arquivamento
  //   const dadosArquivados = {
  //     ...dados,
  //     data_arquivamento: new Date().toISOString(),
  //     id_arquivo: `${tipo.toUpperCase()}-${new Date().getTime()}-${dados.id}`
  //   };

  //   // Adicionar ao arquivo
  //   arquivos[tipo].push(dadosArquivados);

  //   // Salvar no localStorage
  //   localStorage.setItem("arquivos", JSON.stringify(arquivos));

  //   console.log(`Autorização ${dados.id} arquivada em ${tipo}`);
  // }

  // Função para formatar data
  function formatarData(data) {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  // Lógica para o botão 'Ver Link Enviado'
  if (btnVerLinkEnviado) {
    btnVerLinkEnviado.addEventListener("click", function() {
      if (!solicitacaoAtual || !solicitacaoAtual.link_pais) {
        alert("Link para os pais não encontrado.");
        return;
      }
      // Exibir o link em um modal ou alerta para cópia
      prompt("Copie o link para os pais:", solicitacaoAtual.link_pais);
    });
  }

  // Lógica para o botão 'Reenviar Link aos Pais'
  if (btnReenviarLinkPais) {
    btnReenviarLinkPais.addEventListener("click", async function() {
      if (!solicitacaoAtual) return;

      // Re-gerar o link (se necessário) e enviar novamente
      // Assumindo que o whatsappService tem uma função para reenviar
      try {
        // Preparar a mensagem de WhatsApp (já existente)
        prepararMensagemWhatsapp();
        const mensagem = textoWhatsapp.value;
        const telefone = solicitacaoAtual.telefone_responsavel.replace(/\D/g, "");

        // TODO: A função `enviarMensagem` no `whatsapp-service.js` precisa ser implementada
        // para realmente enviar a mensagem via WhatsApp API ou similar.
        // Por enquanto, simulamos o sucesso.
        const resultadoEnvio = { sucesso: true }; // Simulação

        // const resultadoEnvio = await window.whatsAppService.enviarMensagem(telefone, mensagem);

        if (resultadoEnvio.sucesso) {
          alert("Link reenviado com sucesso!");
          // Opcional: registrar o reenvio na auditoria
          // await window.auditoriaService.registrarAcao(solicitacaoAtual.id, "Reenvio de Link aos Pais", { link: solicitacaoAtual.link_pais });
        } else {
          alert(`Erro ao reenviar link: ${resultadoEnvio.mensagem}`);
        }
      } catch (error) {
        console.error("Erro ao reenviar link aos pais:", error);
        alert("Ocorreu um erro ao reenviar o link. Tente novamente.");
      }
    });
  }

  // Lógica para o botão 'Gerar Relatório PDF'
  if (btnGerarRelatorio) {
    btnGerarRelatorio.addEventListener("click", async function() {
      if (!solicitacaoAtual) return;
      try {
        // TODO: Implementar a lógica de geração de PDF com base nos dados de auditoria
        // Isso provavelmente envolverá o pdf-service.js e o auditoria-service.js
        alert("Funcionalidade de Gerar Relatório PDF em desenvolvimento.");
      } catch (error) {
        console.error("Erro ao gerar relatório PDF:", error);
        alert("Ocorreu um erro ao gerar o relatório PDF. Tente novamente.");
      }
    });
  }
});


