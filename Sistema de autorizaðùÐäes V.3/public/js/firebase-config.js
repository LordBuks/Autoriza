// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWP6QblKqmOKFWqDJZEmWR7hhJ-2GEPr4",
  authDomain: "sistema-de-autorizacoes.firebaseapp.com",
  projectId: "sistema-de-autorizacoes",
  storageBucket: "sistema-de-autorizacoes.firebasestorage.app",
  messagingSenderId: "380824234132",
  appId: "1:380824234132:web:5c605aebd6b4b38569ac81",
  measurementId: "G-0HK2KFESG9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializar Firebase
class FirebaseService {
  constructor() {
    // Verificar se o Firebase já foi inicializado
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    
    // Habilitar persistência offline para melhorar a experiência do usuário
    this.db.enablePersistence()
      .catch((err) => {
        console.error('Erro ao habilitar persistência:', err);
      });
  }
  
  // Métodos para autenticação
  async loginComEmailSenha(email, senha) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, senha);
      return { sucesso: true, usuario: userCredential.user };
    } catch (error) {
      console.error('Erro no login:', error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async logout() {
    try {
      await this.auth.signOut();
      return { sucesso: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  // Métodos para Firestore (banco de dados)
  async salvarDocumento(colecao, documento, id = null) {
    try {
      let docRef;
      
      if (id) {
        docRef = this.db.collection(colecao).doc(id);
        await docRef.set(documento, { merge: true });
      } else {
        docRef = await this.db.collection(colecao).add(documento);
      }
      
      return { sucesso: true, id: id || docRef.id };
    } catch (error) {
      console.error(`Erro ao salvar documento em ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async obterDocumento(colecao, id) {
    try {
      const doc = await this.db.collection(colecao).doc(id).get();
      
      if (doc.exists) {
        return { sucesso: true, dados: { id: doc.id, ...doc.data() } };
      } else {
        return { sucesso: false, erro: 'Documento não encontrado' };
      }
    } catch (error) {
      console.error(`Erro ao obter documento de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async obterDocumentos(colecao, filtros = []) {
    try {
      let query = this.db.collection(colecao);
      
      // Aplicar filtros se existirem
      filtros.forEach(filtro => {
        query = query.where(filtro.campo, filtro.operador, filtro.valor);
      });
      
      const snapshot = await query.get();
      const documentos = [];
      
      snapshot.forEach(doc => {
        documentos.push({ id: doc.id, ...doc.data() });
      });
      
      return { sucesso: true, dados: documentos };
    } catch (error) {
      console.error(`Erro ao obter documentos de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async atualizarDocumento(colecao, id, dados) {
    try {
      await this.db.collection(colecao).doc(id).update(dados);
      return { sucesso: true };
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  async excluirDocumento(colecao, id) {
    try {
      await this.db.collection(colecao).doc(id).delete();
      return { sucesso: true };
    } catch (error) {
      console.error(`Erro ao excluir documento de ${colecao}:`, error);
      return { sucesso: false, erro: error.message };
    }
  }
  
  // Método para ouvir mudanças em tempo real
  observarDocumentos(colecao, filtros = [], callback) {
    try {
      let query = this.db.collection(colecao);
      
      // Aplicar filtros se existirem
      filtros.forEach(filtro => {
        query = query.where(filtro.campo, filtro.operador, filtro.valor);
      });
      
      // Retornar o unsubscribe para que possa ser cancelado posteriormente
      return query.onSnapshot(snapshot => {
        const documentos = [];
        snapshot.forEach(doc => {
          documentos.push({ id: doc.id, ...doc.data() });
        });
        callback({ sucesso: true, dados: documentos });
      }, error => {
        console.error(`Erro ao observar documentos em ${colecao}:`, error);
        callback({ sucesso: false, erro: error.message });
      });
    } catch (error) {
      console.error(`Erro ao configurar observador para ${colecao}:`, error);
      callback({ sucesso: false, erro: error.message });
      return () => {}; // Retornar uma função vazia como fallback
    }
  }
}

// Exportar a instância do serviço
window.firebaseService = new FirebaseService();