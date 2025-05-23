// Lógica de login e autenticação
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const alertMessage = document.getElementById('alert-message');
  
  // Configurações padrão para cada perfil
  const profileDefaults = {
    atleta: {
      username: 'atleta',
      password: 'atleta123', // Senha única compartilhada para todos os atletas
      redirect: 'templates/atleta/dashboard.html'
    },
    supervisor: {
      username: 'supervisor',
      password: 'supervisor123',
      redirect: 'templates/supervisor/dashboard.html'
    },
    servico_social: {
      username: 'servico',
      password: 'servico123',
      redirect: 'templates/servico_social/dashboard.html'
    },
    monitor: {
      username: 'monitor',
      password: 'monitor123',
      redirect: 'templates/monitor/dashboard.html'
    }
  };
  
  // Inicializar usuários no localStorage se não existirem
  initializeUsers();
  
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const profile = document.getElementById('profile').value;
    
    // Verificar se o perfil foi selecionado
    if (!profile) {
      showAlert('Por favor, selecione seu perfil de acesso.');
      return;
    }
    
    // Obter usuários do localStorage
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (profile === 'atleta') {
      // Para atletas, usar credencial compartilhada conforme solicitado
      if (username === profileDefaults.atleta.username && password === profileDefaults.atleta.password) {
        // Login bem-sucedido para atleta
        // Capturar informações do dispositivo
        const deviceInfo = captureDeviceInfo();
        
        // Salvar sessão com informações do dispositivo
        saveSession(profile, username, deviceInfo);
        
        // Redirecionar para o dashboard do atleta
        redirectToProfile(profileDefaults.atleta.redirect);
      } else {
        showAlert('Credenciais inválidas. Por favor, tente novamente.');
      }
    } else {
      // Para outros perfis, verificar se é primeiro acesso ou login normal
      if (!users[profile] || !users[profile].passwordSet) {
        // Primeiro acesso - verificar credenciais padrão
        if (username === profileDefaults[profile].username && password === profileDefaults[profile].password) {
          // Redirecionar para página de configuração de senha
          localStorage.setItem('temp_profile', profile);
          window.location.href = 'primeiro-acesso.html';
        } else {
          showAlert('Credenciais inválidas. Por favor, tente novamente.');
        }
      } else {
        // Login normal - verificar credenciais personalizadas
        if (username === users[profile].username && password === users[profile].password) {
          // Login bem-sucedido
          saveSession(profile, username);
          redirectToProfile(profileDefaults[profile].redirect);
        } else {
          showAlert('Credenciais inválidas. Por favor, tente novamente.');
        }
      }
    }
  });
  
  // Função para inicializar usuários no localStorage
  function initializeUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    // Verificar se cada perfil já existe
    Object.keys(profileDefaults).forEach(profile => {
      if (!users[profile]) {
        // Inicializar perfil com valores padrão
        users[profile] = {
          username: profileDefaults[profile].username,
          password: profileDefaults[profile].password,
          passwordSet: false, // Indica que a senha ainda não foi personalizada
          lastLogin: null
        };
      }
    });
    
    localStorage.setItem('users', JSON.stringify(users));
  }
  
  // Função para capturar informações do dispositivo
  function captureDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  
  // Função para salvar sessão no localStorage
  function saveSession(profile, username, deviceInfo = null) {
    const session = {
      profile: profile,
      username: username,
      loginTime: new Date().toISOString(),
      deviceInfo: deviceInfo
    };
    
    localStorage.setItem('current_session', JSON.stringify(session));
    
    // Atualizar último login do usuário
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[profile]) {
      users[profile].lastLogin = new Date().toISOString();
      localStorage.setItem('users', JSON.stringify(users));
    }
  }
  
  function showAlert(message) {
    alertMessage.textContent = message;
    alertMessage.style.display = 'block';
    
    // Esconder a mensagem após 5 segundos
    setTimeout(function() {
      alertMessage.style.display = 'none';
    }, 5000);
  }
  
  function redirectToProfile(url) {
    window.location.href = url;
  }
});
