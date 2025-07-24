// src/services/bankingAPI.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class BankingAPIService {
  constructor() {
    this.baseURL = 'http://10.188.83.7:8000'; 
    this.token = null;
  }

  // Headers avec authentification
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Connexion à l'API bancaire
  async connectToBank(email, password) {
    try {
      console.log('🏦 Connexion à MKB Bank API...');
      
      // ← AMÉLIORATION: Timeout pour éviter les blocages
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
        signal: controller.signal, // ← NOUVEAU: Support timeout
      });

      clearTimeout(timeoutId); // ← Nettoyer le timeout
      const data = await response.json();
      
      if (response.ok) {
        this.token = data.access_token;
        await AsyncStorage.setItem('banking_token', this.token);
        
        console.log('✅ Connexion bancaire réussie');
        return { success: true, token: this.token };
      } else {
        console.error('❌ Erreur connexion bancaire:', data.detail);
        return { success: false, error: data.detail };
      }
    } catch (error) {
      console.error('❌ Erreur réseau bancaire:', error);
      
      // ← AMÉLIORATION: Messages d'erreur plus précis
      let errorMessage = 'Erreur de connexion au serveur bancaire';
      if (error.name === 'AbortError') {
        errorMessage = 'Connexion trop lente - Vérifiez votre réseau';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'API bancaire inaccessible - Vérifiez que l\'API est lancée';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Charger le token sauvegardé
  async loadSavedToken() {
    try {
      const token = await AsyncStorage.getItem('banking_token');
      if (token) {
        this.token = token;
        console.log('🔑 Token bancaire chargé depuis le stockage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur chargement token:', error);
      return false;
    }
  }

  // Déconnexion bancaire
  async disconnectBank() {
    this.token = null;
    await AsyncStorage.removeItem('banking_token');
    console.log('🏦 Déconnexion bancaire');
  }

  // ← AMÉLIORATION: Méthode générique pour les appels API avec gestion d'erreurs
  async makeAPICall(endpoint, options = {}) {
    try {
      if (!this.token) {
        throw new Error('Non connecté à la banque');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        // Token expiré, déconnecter
        await this.disconnectBank();
        throw new Error('Session expirée - Reconnectez-vous');
      } else {
        throw new Error(`Erreur API: ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Requête trop lente - Vérifiez votre connexion');
      }
      throw error;
    }
  }

  // Récupérer les comptes bancaires (simplifié)
  async getAccounts() {
    try {
      const accounts = await this.makeAPICall('/accounts');
      console.log('📊 Comptes récupérés:', accounts.length);
      return accounts;
    } catch (error) {
      console.error('❌ Erreur getAccounts:', error);
      throw error;
    }
  }

  // Récupérer le solde du compte principal (CRUCIAL pour Prévipay)
  async getMainAccountBalance() {
    try {
      const accounts = await this.getAccounts();
      const mainAccount = accounts.find(acc => acc.account_type === 'checking');
      
      if (mainAccount) {
        console.log('💰 Solde principal:', mainAccount.balance);
        return {
          balance: mainAccount.balance,
          accountId: mainAccount.id,
          accountName: mainAccount.name,
          lastUpdated: new Date()
        };
      } else {
        throw new Error('Compte principal non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur solde principal:', error);
      throw error;
    }
  }

  // Récupérer les prélèvements à venir (FONCTIONNALITÉ CLÉ)
  async getUpcomingDebits(daysAhead = 30) {
    try {
      const debits = await this.makeAPICall(`/upcoming-debits?days_ahead=${daysAhead}`);
      console.log('📅 Prélèvements récupérés:', debits.length);
      
      // ← AMÉLIORATION: Transformation pour correspondre exactement au format Prévipay
      const transformedDebits = debits.map(debit => ({
        id: `bank_${debit.id}`,
        title: debit.description,
        company: debit.beneficiary,
        amount: Math.abs(debit.amount), // Montant positif
        // ← CORRECTION: Utiliser les bons noms de champs pour Prévipay
        next_payment_date: debit.scheduled_date, // ← Champ attendu par Prévipay
        date: debit.scheduled_date, // ← Aussi disponible sous ce nom
        isRecurring: debit.is_recurring,
        is_recurring: debit.is_recurring, // ← Support des deux formats
        status: 'active', // ← Statut par défaut pour Prévipay
        category: 'Bancaire', // ← Catégorie par défaut
        source: 'bank', // ← Identifier comme provenant de la banque
        is_paused: false, // ← Pas de pause pour les prélèvements bancaires
        accountId: debit.account_id,
        originalData: debit // ← Garder les données originales
      }));
      
      return transformedDebits;
    } catch (error) {
      console.error('❌ Erreur getUpcomingDebits:', error);
      throw error;
    }
  }

  // Récupérer les transactions récentes
  async getRecentTransactions(limit = 20) {
    try {
      const accounts = await this.getAccounts();
      const mainAccount = accounts.find(acc => acc.account_type === 'checking');
      
      if (!mainAccount) {
        throw new Error('Compte principal non trouvé');
      }

      const transactions = await this.makeAPICall(`/accounts/${mainAccount.id}/transactions?limit=${limit}`);
      console.log('📝 Transactions récupérées:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('❌ Erreur getRecentTransactions:', error);
      throw error;
    }
  }

  // ← AMÉLIORATION: Vérifier la connexion à l'API avec timeout
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes
      
      const response = await fetch(`${this.baseURL}/`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      const isConnected = response.ok && data.status === 'ok';
      
      console.log(isConnected ? '✅ API bancaire accessible' : '❌ API bancaire inaccessible');
      return isConnected;
    } catch (error) {
      console.error('❌ Test connexion échoué:', error);
      return false;
    }
  }

  // Vérifier si l'utilisateur est connecté
  isConnected() {
    return !!this.token;
  }

  // ← NOUVELLE MÉTHODE: Obtenir les informations de connexion
  getConnectionInfo() {
    return {
      isConnected: this.isConnected(),
      baseURL: this.baseURL,
      hasToken: !!this.token
    };
  }

  // ← NOUVELLE MÉTHODE: Changer l'URL de base (utile pour debug)
  setBaseURL(newURL) {
    this.baseURL = newURL;
    console.log('🔧 URL API changée:', newURL);
  }

  // ← AMÉLIORATION: Simuler les prélèvements futurs (plus robuste)
  async predictFutureDebits() {
    try {
      const debits = await this.getUpcomingDebits(90);
      
      // Analyser les patterns récurrents
      const recurringDebits = debits.filter(d => d.isRecurring);
      
      if (recurringDebits.length === 0) {
        console.log('🔮 Aucun prélèvement récurrent trouvé pour prédiction');
        return [];
      }
      
      // Prédiction simple basée sur les prélèvements récurrents
      const predictions = recurringDebits.map(debit => {
        const nextMonth = new Date(debit.date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        return {
          ...debit,
          id: `predicted_${debit.id}`,
          next_payment_date: nextMonth.toISOString().split('T')[0],
          date: nextMonth.toISOString().split('T')[0],
          isPredicted: true,
          confidence: 0.8, // 80% de confiance pour les récurrents
          title: `${debit.title} (Prédiction)`,
          category: 'Prédiction'
        };
      });
      
      console.log('🔮 Prédictions générées:', predictions.length);
      return predictions;
    } catch (error) {
      console.error('❌ Erreur prédictions:', error);
      return [];
    }
  }

  // ← NOUVELLE MÉTHODE: Debug info (utile pour le développement)
  getDebugInfo() {
    return {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 10)}...` : null,
      isConnected: this.isConnected(),
      timestamp: new Date().toISOString()
    };
  }
}

// Instance singleton
const bankingAPI = new BankingAPIService();

export default bankingAPI;