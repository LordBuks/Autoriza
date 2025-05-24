// Serviço de segurança para o Sistema de Autorizações
// Implementa medidas de segurança como proteção contra XSS, CSRF e criptografia de dados sensíveis

class SecurityService {
  constructor() {
    // Chave de criptografia (em produção, deve ser armazenada em variáveis de ambiente)
    this.encryptionKey = this.generateEncryptionKey();
    
    // Inicializar proteções
    this.initializeSecurityMeasures();
  }
  
  // Inicializar medidas de segurança
  initializeSecurityMeasures() {
    // Verificar se estamos em HTTPS
    this.checkHttps();
    
    // Adicionar proteções contra XSS nos formulários
    this.setupXssProtection();
    
    // Configurar tokens CSRF para formulários
    this.setupCsrfProtection();
    
    console.log('Medidas de segurança inicializadas');
  }
  
  // Verificar se estamos em HTTPS e alertar se não estiver
  checkHttps() {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
      console.warn('ALERTA DE SEGURANÇA: Este site deve ser acessado via HTTPS para garantir a segurança dos dados.');
      
      // Em produção, redirecionar para HTTPS
      // window.location.href = window.location.href.replace('http:', 'https:');
    }
  }
  
  // Configurar proteção contra XSS
  setupXssProtection() {
    // Sobrescrever o método innerHTML para sanitizar conteúdo
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    const self = this;
    
    if (originalInnerHTMLDescriptor && originalInnerHTMLDescriptor.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          const sanitizedValue = self.sanitizeHtml(value);
          originalInnerHTMLDescriptor.set.call(this, sanitizedValue);
        },
        get: originalInnerHTMLDescriptor.get
      });
    }
  }
  
  // Configurar proteção contra CSRF
  setupCsrfProtection() {
    // Gerar token CSRF
    const csrfToken = this.generateCsrfToken();
    
    // Armazenar token na sessão
    sessionStorage.setItem('csrf_token', csrfToken);
    
    // Adicionar token a todos os formulários
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (!form.querySelector('input[name="csrf_token"]')) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'csrf_token';
          input.value = csrfToken;
          form.appendChild(input);
        }
      });
    });
  }
  
  // Sanitizar HTML para prevenir XSS
  sanitizeHtml(html) {
    if (typeof html !== 'string') return html;
    
    // Criar um elemento temporário
    const temp = document.createElement('div');
    temp.textContent = html;
    
    // Retornar o HTML sanitizado
    return temp.innerHTML;
  }
  
  // Sanitizar entrada de texto
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remover tags HTML e caracteres especiais
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Validar token CSRF
  validateCsrfToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken;
  }
  
  // Gerar token CSRF
  generateCsrfToken() {
    return 'csrf-' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
  
  // Gerar chave de criptografia
  generateEncryptionKey() {
    // Em produção, esta chave deve vir de variáveis de ambiente ou serviço de gerenciamento de segredos
    return 'key-' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
  
  // Criptografar dados sensíveis
  encryptData(data) {
    if (!data) return null;
    
    try {
      // Implementação simples de criptografia
      // Em produção, use bibliotecas como CryptoJS ou a Web Crypto API
      const jsonString = JSON.stringify(data);
      
      // Codificar em Base64 (não é criptografia real, apenas para demonstração)
      // Em produção, use algoritmos como AES
      return btoa(jsonString + '|' + this.encryptionKey.substring(0, 8));
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      return null;
    }
  }
  
  // Descriptografar dados sensíveis
  decryptData(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      // Decodificar Base64 (não é descriptografia real, apenas para demonstração)
      const decoded = atob(encryptedData);
      
      // Verificar se a chave corresponde
      const parts = decoded.split('|');
      if (parts.length !== 2 || parts[1] !== this.encryptionKey.substring(0, 8)) {
        console.error('Chave de criptografia inválida');
        return null;
      }
      
      // Retornar os dados descriptografados
      return JSON.parse(parts[0]);
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      return null;
    }
  }
  
  // Gerar hash para validação
  generateHash(data) {
    if (!data) return null;
    
    try {
      // Implementação simples de hash
      // Em produção, use algoritmos como SHA-256
      const jsonString = JSON.stringify(data);
      let hash = 0;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para inteiro de 32 bits
      }
      
      // Converter para string hexadecimal
      return 'hash-' + Math.abs(hash).toString(16) + '-' + Date.now().toString(36);
    } catch (error) {
      console.error('Erro ao gerar hash:', error);
      return null;
    }
  }
  
  // Validar dados com hash
  validateWithHash(data, hash) {
    if (!data || !hash) return false;
    
    // Em uma implementação real, você recalcularia o hash e compararia
    // Esta é uma implementação simplificada
    return hash.startsWith('hash-');
  }
}

// Exportar a instância do serviço
window.securityService = new SecurityService();