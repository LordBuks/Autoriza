// Lógica de login e autenticação com Firebase Authentication
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const alertMessage = document.getElementById("alert-message");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const profileSelect = document.getElementById("profile");

  // Verificar se o Firebase Service está disponível
  if (!window.firebaseService) {
    console.error("Firebase Service não encontrado! A autenticação não funcionará.");
    showAlert("Erro crítico: Serviço de autenticação indisponível.");
    // Desabilitar o formulário para evitar tentativas inúteis
    if(loginForm) {
        loginForm.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
    }
    return; // Interromper a execução se o Firebase não estiver carregado
  }

  // Mapeamento de perfis para redirecionamento
  const profileRedirects = {
    atleta: "templates/atleta/dashboard.html",
    supervisor: "templates/supervisor/dashboard.html",
    servico_social: "templates/monitor/dashboard.html",
    monitor: "templates/monitor/dashboard.html",
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      hideAlert(); // Esconder alertas anteriores

      const email = usernameInput.value; // Assumindo que o campo username é usado para o email
      const password = passwordInput.value;
      const profile = profileSelect.value;

      // Validações básicas
      if (!email || !password || !profile) {
        showAlert("Por favor, preencha todos os campos: Usuário (Email), Senha e Perfil.");
        return;
      }

      // Mostrar indicador de carregamento (opcional)
      showAlert("Autenticando...", "alert-info");

      try {
        // Tentar login com Firebase Auth
        const resultadoLogin = await window.firebaseService.loginComEmailSenha(email, password);

        if (resultadoLogin.sucesso && resultadoLogin.usuario) {
          // Login bem-sucedido no Firebase Auth
          const user = resultadoLogin.usuario;

          // **Passo Adicional: Verificar o perfil do usuário no Firestore**
          // É crucial verificar se o perfil selecionado no formulário corresponde
          // ao perfil armazenado no Firestore para este usuário autenticado.
          const perfilFirestore = await verificarPerfilUsuario(user.uid);

          if (perfilFirestore === profile) {
            // Perfil corresponde! Login autorizado.
            hideAlert(); // Limpar mensagem de "Autenticando..."
            console.log(`Login bem-sucedido para ${email} com perfil ${profile}`);

            // Salvar informações da sessão (opcional, mas útil)
            saveSession(profile, email, user.uid);

            // Redirecionar para o dashboard correspondente
            redirectToProfile(profileRedirects[profile]);

          } else if (perfilFirestore) {
            // Usuário autenticado, mas perfil selecionado não corresponde ao do banco
            console.warn(`Usuário ${email} autenticado, mas selecionou perfil incorreto (${profile}). Perfil real: ${perfilFirestore}`);
            showAlert(`Autenticação bem-sucedida, mas o perfil selecionado (${profile}) não corresponde ao seu perfil registrado (${perfilFirestore}). Faça login com o perfil correto.`);
            // Deslogar o usuário para evitar confusão?
            // await window.firebaseService.logout();
          } else {
            // Usuário autenticado, mas não foi possível verificar o perfil no Firestore
            console.error(`Usuário ${email} autenticado, mas não foi encontrado registro na coleção 'usuarios' ou houve erro ao buscar.`);
            showAlert("Usuário autenticado, mas houve um problema ao verificar seu perfil. Contate o suporte.");
            // Deslogar?
            // await window.firebaseService.logout();
          }

        } else {
          // Falha no login do Firebase Auth
          console.error("Falha na autenticação Firebase:", resultadoLogin.erro);
          let mensagemErro = "Credenciais inválidas. Verifique seu email e senha.";
          // Personalizar mensagem para erros comuns, se necessário
          if (resultadoLogin.erro && resultadoLogin.erro.includes("auth/user-not-found")) {
              mensagemErro = "Usuário não encontrado.";
          } else if (resultadoLogin.erro && resultadoLogin.erro.includes("auth/wrong-password")) {
              mensagemErro = "Senha incorreta.";
          }
          showAlert(mensagemErro);
        }
      } catch (error) {
        // Erro inesperado durante o processo
        console.error("Erro inesperado durante o login:", error);
        showAlert("Ocorreu um erro inesperado durante a autenticação. Tente novamente.");
      }
    });
  }

  // Função para verificar o perfil do usuário no Firestore
  async function verificarPerfilUsuario(uid) {
    try {
      const resultadoDoc = await window.firebaseService.obterDocumento("usuarios", uid);
      if (resultadoDoc.sucesso && resultadoDoc.dados && resultadoDoc.dados.profile) {
        return resultadoDoc.dados.profile; // Retorna o perfil (ex: 'atleta', 'supervisor')
      } else {
        console.warn(`Documento do usuário ${uid} não encontrado na coleção 'usuarios' ou sem campo 'profile'.`);
        return null; // Usuário não encontrado ou sem perfil definido
      }
    } catch (error) {
      console.error(`Erro ao buscar perfil do usuário ${uid} no Firestore:`, error);
      return null; // Erro ao buscar
    }
  }

  // Função para salvar informações da sessão no localStorage (simplificado)
  function saveSession(profile, email, uid) {
    const session = {
      profile: profile,
      email: email,
      uid: uid,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem("current_session", JSON.stringify(session));
    // Você pode querer usar sessionStorage se preferir que a sessão expire ao fechar o navegador
  }

  // Função para mostrar alertas
  function showAlert(message, type = "alert-danger") {
    if (alertMessage) {
      alertMessage.textContent = message;
      alertMessage.className = "alert"; // Reset classes
      alertMessage.classList.add(type);
      alertMessage.style.display = "block";
    } else {
        // Fallback se o elemento de alerta não existir
        alert(message);
    }
  }

  // Função para esconder alertas
  function hideAlert() {
      if(alertMessage) {
          alertMessage.style.display = "none";
      }
  }

  // Função para redirecionar
  function redirectToProfile(url) {
    if (url) {
      window.location.href = url;
    } else {
      console.error("URL de redirecionamento não definida para este perfil.");
      showAlert("Login bem-sucedido, mas não foi possível redirecionar.");
    }
  }
});

