// Lógica de login e autenticação com Firebase
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const alertMessage = document.getElementById("alert-message");

  // Mapeamento de perfis para redirecionamento e e-mails (se necessário)
  const profileConfig = {
    atleta: {
      // Para atletas, o login é genérico. Usaremos um e-mail/senha fixo no Auth.
      // IMPORTANTE: Criar este usuário no Firebase Auth Console: atleta@dominio.com / senha_atleta_fixa
      email: "atleta@inter.com", // E-mail fixo para login de atleta
      redirect: "templates/atleta/dashboard.html",
    },
    supervisor: {
      // Assumindo que o username no form é o prefixo do email. Ex: 'supervisor' -> supervisor@dominio.com
      // A senha será a digitada pelo usuário.
      redirect: "templates/supervisor/dashboard.html",
    },
    servico_social: {
      redirect: "templates/servico_social/dashboard.html",
    },
    monitor: {
      redirect: "templates/monitor/dashboard.html",
    },
  };

  // Verificar se o Firebase Service está pronto
  if (!window.firebaseService) {
    console.error("Firebase Service não encontrado!");
    showAlert("Erro crítico na inicialização. Recarregue a página.");
    return; // Impede a adição do listener
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideAlert(); // Esconder alerta anterior

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const profile = document.getElementById("profile").value;

    if (!profile) {
      showAlert("Por favor, selecione seu perfil de acesso.");
      return;
    }

    let email;
    if (profile === "atleta") {
      // Login especial para atleta com credencial fixa
      if (username !== "atleta") {
         // Poderia validar o username aqui se necessário, mas o requisito é login genérico
         console.warn("Username digitado para atleta ignorado, usando credencial fixa.");
      }
      email = profileConfig.atleta.email;
      // A senha usada será a digitada no campo senha, comparada com a senha fixa no Auth
    } else {
      // Para outros perfis, construir e-mail a partir do username
      // ASSUMINDO que o e-mail no Firebase Auth é username@dominio.com
      // É crucial que os usuários sejam criados no Firebase Auth com este padrão de e-mail.
      email = `${username}@inter.com`;
    }

    // Tentar login com Firebase Auth
    const loginResult = await window.firebaseService.loginComEmailSenha(
      email,
      password
    );

    if (loginResult.sucesso) {
      const user = loginResult.usuario;
      console.log("Login bem-sucedido para:", user.email, "UID:", user.uid);

      // Salvar perfil selecionado no localStorage para uso posterior nas telas
      localStorage.setItem("user_profile", profile);
      localStorage.setItem("user_uid", user.uid);
      localStorage.setItem("user_email", user.email);

      // Se for atleta, redirecionar direto (não precisa checar Firestore para passwordSet)
      if (profile === "atleta") {
        redirectToProfile(profileConfig.atleta.redirect);
        return;
      }

      // Para outros perfis, verificar no Firestore se a senha já foi definida
      const userDoc = await window.firebaseService.obterDocumento(
        "usuarios",
        user.uid
      );

      if (userDoc.sucesso && userDoc.dados) {
        const userData = userDoc.dados;
        // Verificar se o perfil no documento corresponde ao selecionado no login
        if (userData.profile !== profile) {
            console.error(`Discrepância de perfil: Login como ${profile}, mas Firestore indica ${userData.profile} para UID ${user.uid}`);
            showAlert("Erro: Seu perfil de acesso não corresponde ao registrado. Contate o suporte.");
            await window.firebaseService.logout(); // Deslogar por segurança
            localStorage.clear(); // Limpar localStorage
            return;
        }

        if (userData.passwordSet) {
          // Senha já definida, redirecionar para o dashboard correspondente
          console.log("Usuário já definiu a senha. Redirecionando para dashboard...");
          redirectToProfile(profileConfig[profile].redirect);
        } else {
          // Primeiro acesso (senha padrão funcionou, mas não foi alterada)
          console.log("Primeiro acesso detectado. Redirecionando para definir senha...");
          // Usar localStorage como flag temporária para a próxima página
          localStorage.setItem("temp_profile", profile); // Indica que veio do login
          window.location.href = "primeiro-acesso.html";
        }
      } else {
        // Erro ao buscar documento no Firestore ou documento não encontrado
        console.error(
          "Erro ao buscar dados do usuário no Firestore ou usuário não cadastrado:",
          userDoc.erro || "Documento não encontrado"
        );
        showAlert(
          "Login realizado, mas não foi possível verificar seu perfil. Contate o suporte."
        );
        // Manter logado ou deslogar? Decidir regra de negócio.
        // Por segurança, vamos deslogar:
        await window.firebaseService.logout();
        localStorage.clear();
      }
    } else {
      // Falha no login (Firebase Auth)
      console.error("Falha no login:", loginResult.erro);
      let friendlyMessage = "Credenciais inválidas. Verifique seu usuário e senha.";
      if (loginResult.erro.includes("auth/user-not-found")) {
          friendlyMessage = "Usuário não encontrado. Verifique o nome de usuário ou contate o suporte.";
      } else if (loginResult.erro.includes("auth/wrong-password")) {
          friendlyMessage = "Senha incorreta. Tente novamente.";
      } else if (loginResult.erro.includes("auth/invalid-email")) {
          friendlyMessage = "Formato de e-mail inválido (gerado a partir do usuário). Contate o suporte.";
      }
      // Adicionar mais tratamentos de erro conforme necessário

      showAlert(friendlyMessage);
    }
  });

  function showAlert(message) {
    alertMessage.textContent = message;
    alertMessage.style.display = "block";
  }

  function hideAlert() {
      alertMessage.style.display = "none";
  }

  function redirectToProfile(url) {
    window.location.href = url;
  }

  // Remover funções antigas que usavam localStorage para usuários
  // initializeUsers();
  // captureDeviceInfo();
  // saveSession();
});
