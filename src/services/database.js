import * as SQLite from 'expo-sqlite';

// Créer/Ouvrir la base de données avec gestion d'erreur
let db;
try {
  db = SQLite.openDatabaseSync('previpay.db');
  console.log('Base de données SQLite ouverte avec succès');
} catch (error) {
  console.error('Erreur d\'ouverture de la base:', error);
  // Fallback en cas d'erreur
}

// Configuration de base
const DATABASE_VERSION = 1;

// Initialiser la base de données
export const initializeDatabase = async () => {
  try {
    console.log('Initialisation de la base de données SQLite...');
    
    if (!db) {
      console.error('Base de données non disponible');
      return false;
    }
    
    // Créer les tables si elles n'existent pas
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS debits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT DEFAULT 'Autre',
        frequency TEXT DEFAULT 'monthly',
        next_payment_date DATE NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        is_paid INTEGER DEFAULT 0,
        is_paused INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS payment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        debit_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATE NOT NULL,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debit_id) REFERENCES debits (id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Autre',
        is_popular INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_debits_user_id ON debits(user_id);
      CREATE INDEX IF NOT EXISTS idx_debits_next_payment ON debits(next_payment_date);
      CREATE INDEX IF NOT EXISTS idx_payment_history_debit_id ON payment_history(debit_id);
    `);
    
    console.log('Tables créées avec succès');
    
    // Vérifier si on a des utilisateurs, sinon créer un utilisateur par défaut
    const users = await db.getAllAsync('SELECT * FROM users LIMIT 1');
    if (users.length === 0) {
      await createDefaultUser();
    }
    
    // Vérifier si on a des entreprises, sinon les créer
    const companies = await db.getAllAsync('SELECT * FROM companies LIMIT 1');
    if (companies.length === 0) {
      await createDefaultCompanies();
    }
    
    console.log('Base de données SQLite initialisée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};

// Créer un utilisateur par défaut
const createDefaultUser = async () => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (email, name, balance) VALUES (?, ?, ?)',
      ['ouais@ouais.com', 'Utilisateur', 0]
    );
    console.log('Utilisateur par défaut créé avec l\'ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur par défaut:', error);
    return null;
  }
};

// Créer les entreprises par défaut
const createDefaultCompanies = async () => {
  try {
    const companies = [
      { id: 'orange', name: 'Orange', category: 'Mobile', is_popular: 1 },
      { id: 'sfr', name: 'SFR', category: 'Mobile', is_popular: 1 },
      { id: 'free', name: 'Free', category: 'Mobile', is_popular: 1 },
      { id: 'bouygues', name: 'Bouygues Telecom', category: 'Mobile', is_popular: 1 },
      { id: 'netflix', name: 'Netflix', category: 'Divertissement', is_popular: 1 },
      { id: 'spotify', name: 'Spotify', category: 'Divertissement', is_popular: 1 },
      { id: 'disney-plus', name: 'Disney+', category: 'Divertissement', is_popular: 1 },
      { id: 'bnp-paribas', name: 'BNP Paribas', category: 'Banque', is_popular: 1 },
      { id: 'credit-agricole', name: 'Crédit Agricole', category: 'Banque', is_popular: 1 },
      { id: 'axa', name: 'AXA', category: 'Assurance', is_popular: 1 },
      { id: 'edf', name: 'EDF', category: 'Énergie', is_popular: 1 },
      { id: 'sncf', name: 'SNCF Connect', category: 'Transport', is_popular: 1 }
    ];

    for (const company of companies) {
      await db.runAsync(
        'INSERT OR IGNORE INTO companies (id, name, category, is_popular) VALUES (?, ?, ?, ?)',
        [company.id, company.name, company.category, company.is_popular]
      );
    }
    
    console.log('Entreprises par défaut créées');
  } catch (error) {
    console.error('Erreur lors de la création des entreprises:', error);
  }
};

// Fonctions pour les utilisateurs
export const userService = {
  // Obtenir un utilisateur par email
  async getUserByEmail(email) {
    try {
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  },

  // Créer un nouvel utilisateur
  async createUser(email, name, balance = 0) {
    try {
      const result = await db.runAsync(
        'INSERT INTO users (email, name, balance) VALUES (?, ?, ?)',
        [email, name, balance]
      );
      return { success: true, userId: result.lastInsertRowId };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return { success: false, error: error.message };
    }
  },

  // Mettre à jour le solde
  async updateBalance(userId, newBalance) {
    try {
      await db.runAsync(
        'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, userId]
      );
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      return { success: false, error: error.message };
    }
  }
};

// Fonctions pour les prélèvements
export const debitService = {
  // Obtenir tous les prélèvements d'un utilisateur
  async getAllDebits(userId) {
    try {
      const debits = await db.getAllAsync(
        'SELECT * FROM debits WHERE user_id = ? ORDER BY next_payment_date ASC',
        [userId]
      );
      return debits;
    } catch (error) {
      console.error('Erreur lors de la récupération des prélèvements:', error);
      return [];
    }
  },

  // Créer un nouveau prélèvement  
  async createDebit(debitData) {
    try {
      const {
        companyName,
        amount,
        category,
        frequency,
        nextPaymentDate,
        description,
        userId
      } = debitData;

      const result = await db.runAsync(
        `INSERT INTO debits 
         (user_id, company_name, amount, category, frequency, next_payment_date, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, companyName, amount, category, frequency, nextPaymentDate, description || '']
      );

      const newDebit = await db.getFirstAsync(
        'SELECT * FROM debits WHERE id = ?',
        [result.lastInsertRowId]
      );

      return newDebit;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du prélèvement:', error);
      throw error;
    }
  },

  // Mettre à jour un prélèvement
  async updateDebit(debitId, updates) {
    try {
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(debitId);

      await db.runAsync(
        `UPDATE debits SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      const updatedDebit = await db.getFirstAsync(
        'SELECT * FROM debits WHERE id = ?',
        [debitId]
      );

      return updatedDebit;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  },

  // Obtenir le solde d'un utilisateur
  async getBalance(userId) {
    try {
      const user = await db.getFirstAsync(
        'SELECT balance FROM users WHERE id = ?',
        [userId]
      );
      return user?.balance || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
      return 0;
    }
  },

  // Mettre à jour le solde
  async updateBalance(userId, newBalance) {
    try {
      await db.runAsync(
        'UPDATE users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newBalance, userId]
      );
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      throw error;
    }
  },

  //  CORRECTION: Fonction markAsPaid corrigée
  async markAsPaid(debitId) {
    try {
      console.log(' SERVICE - markAsPaid pour ID:', debitId);
      
      // Vérifier que l'ID existe
      if (!debitId) {
        throw new Error('ID de prélèvement manquant');
      }
      
      // Récupérer le prélèvement actuel
      const currentDebit = await this.getDebitById(debitId);
      if (!currentDebit) {
        throw new Error('Prélèvement non trouvé');
      }
      
      console.log(' SERVICE - Prélèvement trouvé:', currentDebit);
      
      // Vérifier qu'il n'est pas en pause
      if (currentDebit.is_paused) {
        throw new Error('Impossible de marquer comme payé un prélèvement en pause');
      }
      
      // Calculer la prochaine date selon la fréquence
      const nextDate = this.calculateNextPaymentDate(
        new Date(currentDebit.next_payment_date), 
        currentDebit.frequency
      );
      
      console.log(' SERVICE - Prochaine date calculée:', nextDate);
      
      // Ajouter à l'historique des paiements
      await db.runAsync(
        'INSERT INTO payment_history (debit_id, amount, payment_date, status) VALUES (?, ?, ?, ?)',
        [debitId, currentDebit.amount, new Date().toISOString().split('T')[0], 'completed']
      );
      
      // Mettre à jour le prélèvement avec la nouvelle date
      const result = await db.runAsync(
        `UPDATE debits 
         SET next_payment_date = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nextDate.toISOString().split('T')[0], debitId]
      );
      
      console.log('🔍 SERVICE - Résultat update:', result);
      
      if (result.changes > 0) {
        return { success: true };
      } else {
        throw new Error('Aucune ligne mise à jour');
      }
      
    } catch (error) {
      console.error('🔍 SERVICE - Erreur markAsPaid:', error);
      return { success: false, error: error.message };
    }
  },

  //  CORRECTION: Fonction togglePause corrigée
  async togglePause(debitId) {
    try {
      console.log('🔍 SERVICE - togglePause pour ID:', debitId);
      
      if (!debitId) {
        throw new Error('ID de prélèvement manquant');
      }
      
      // Récupérer l'état actuel
      const currentDebit = await this.getDebitById(debitId);
      if (!currentDebit) {
        throw new Error('Prélèvement non trouvé');
      }
      
      const newPauseState = !currentDebit.is_paused;
      console.log('🔍 SERVICE - État actuel:', currentDebit.is_paused, '→ Nouveau:', newPauseState);
      
      // Mettre à jour en base
      const result = await db.runAsync(
        `UPDATE debits 
         SET is_paused = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newPauseState ? 1 : 0, debitId]
      );
      
      console.log('🔍 SERVICE - Résultat toggle:', result);
      
      if (result.changes > 0) {
        return { success: true, isPaused: newPauseState };
      } else {
        throw new Error('Aucune ligne mise à jour');
      }
      
    } catch (error) {
      console.error('🔍 SERVICE - Erreur togglePause:', error);
      return { success: false, error: error.message };
    }
  },

  // Supprimer un prélèvement
  async deleteDebit(debitId) {
    try {
      await db.runAsync('DELETE FROM debits WHERE id = ?', [debitId]);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  // Obtenir un prélèvement par ID
  async getDebitById(debitId) {
    try {
      const debit = await db.getFirstAsync('SELECT * FROM debits WHERE id = ?', [debitId]);
      return debit;
    } catch (error) {
      console.error('Erreur lors de la récupération du prélèvement:', error);
      return null;
    }
  },

  //  CORRECTION: Fonction helper pour calculer la prochaine date
  calculateNextPaymentDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'biannual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'once':
        // Pour les prélèvements ponctuels, marquer comme terminé
        return currentDate; // Garder la même date mais changer le statut
      default:
        console.warn('Fréquence inconnue:', frequency);
        break;
    }
    
    return date;
  },

  //  NOUVEAU: Fonction pour vider tous les prélèvements (pour debug)
  async clearAllDebits(userId) {
    try {
      console.log(' SERVICE - Suppression de tous les prélèvements pour user:', userId);
      
      const result = await db.runAsync('DELETE FROM debits WHERE user_id = ?', [userId]);
      console.log(' SERVICE - Prélèvements supprimés:', result.changes);
      
      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error(' SERVICE - Erreur clearAllDebits:', error);
      throw error;
    }
  },

  // Fonction de debug pour voir tout
  async debugGetAllDebits() {
    try {
      const allDebits = await db.getAllAsync('SELECT * FROM debits ORDER BY id DESC');
      console.log('🔍 DEBUG - Tous les prélèvements en base:', allDebits);
      return allDebits;
    } catch (error) {
      console.error('Erreur debug:', error);
      return [];
    }
  },
};

// Fonctions utilitaires
export const databaseUtils = {
  // Nettoyer la base de données (pour les tests)
  async clearAllData() {
    try {
      await db.execAsync(`
        DELETE FROM payment_history;
        DELETE FROM debits;
        DELETE FROM users;
      `);
      console.log('Base de données nettoyée');
      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return false;
    }
  },

  // Obtenir des statistiques
  async getStats(userId) {
    try {
      const stats = await db.getFirstAsync(`
        SELECT 
          COUNT(*) as total_debits,
          SUM(amount) as total_amount,
          SUM(CASE WHEN is_paused = 1 THEN 1 ELSE 0 END) as paused_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
        FROM debits 
        WHERE user_id = ?
      `, [userId]);

      return stats;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }
};

// Service d'entreprises pour le catalogue
export const companyService = {
  async getAllCompanies() {
    try {
      const companies = await db.getAllAsync('SELECT * FROM companies ORDER BY is_popular DESC, name ASC');
      return companies;
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises:', error);
      return [];
    }
  },

  async getPopularCompanies() {
    try {
      const companies = await db.getAllAsync('SELECT * FROM companies WHERE is_popular = 1 ORDER BY name ASC');
      return companies;
    } catch (error) {
      console.error('Erreur lors de la récupération des entreprises populaires:', error);
      return [];
    }
  },

  async getCategories() {
    try {
      const result = await db.getAllAsync('SELECT DISTINCT category FROM companies WHERE category IS NOT NULL ORDER BY category ASC');
      return result.map(row => row.category);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return ['Mobile', 'Divertissement', 'Banque', 'Assurance', 'Énergie', 'Transport', 'Autre'];
    }
  }
};

export default {
  initializeDatabase,
  userService,
  debitService,
  companyService,
  databaseUtils
};