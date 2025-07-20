import { executeQuery, executeSelect } from './database';
import * as Crypto from 'expo-crypto';

export const debitService = {
  // Créer un nouveau prélèvement
  async createDebit(debitData) {
    const id = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${debitData.userId}-${debitData.companyName}-${Date.now()}`
    );
    
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO debits (
        id, user_id, company_name, amount, category, frequency, 
        next_payment_date, status, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      debitData.userId,
      debitData.companyName,
      debitData.amount,
      debitData.category || 'Autre',
      debitData.frequency,
      debitData.nextPaymentDate,
      debitData.status || 'active',
      debitData.description || '',
      now,
      now
    ];
    
    await executeQuery(query, params);
    
    return {
      id,
      userId: debitData.userId,
      companyName: debitData.companyName,
      amount: debitData.amount,
      category: debitData.category || 'Autre',
      frequency: debitData.frequency,
      nextPaymentDate: debitData.nextPaymentDate,
      status: debitData.status || 'active',
      description: debitData.description || '',
      createdAt: now,
      updatedAt: now
    };
  },

  // Obtenir tous les prélèvements d'un utilisateur
  async getAllDebits(userId) {
    const query = `
      SELECT * FROM debits 
      WHERE user_id = ? 
      ORDER BY next_payment_date ASC
    `;
    
    const results = await executeSelect(query, [userId]);
    
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name,
      amount: row.amount,
      category: row.category,
      frequency: row.frequency,
      nextPaymentDate: row.next_payment_date,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  // Obtenir un prélèvement par ID
  async getDebitById(id) {
    const query = 'SELECT * FROM debits WHERE id = ?';
    const results = await executeSelect(query, [id]);
    
    if (results.length === 0) {
      throw new Error('Prélèvement non trouvé');
    }
    
    const row = results[0];
    return {
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name,
      amount: row.amount,
      category: row.category,
      frequency: row.frequency,
      nextPaymentDate: row.next_payment_date,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  // Mettre à jour un prélèvement
  async updateDebit(id, updates) {
    const now = new Date().toISOString();
    
    const setClause = [];
    const params = [];
    
    if (updates.companyName !== undefined) {
      setClause.push('company_name = ?');
      params.push(updates.companyName);
    }
    if (updates.amount !== undefined) {
      setClause.push('amount = ?');
      params.push(updates.amount);
    }
    if (updates.category !== undefined) {
      setClause.push('category = ?');
      params.push(updates.category);
    }
    if (updates.frequency !== undefined) {
      setClause.push('frequency = ?');
      params.push(updates.frequency);
    }
    if (updates.nextPaymentDate !== undefined) {
      setClause.push('next_payment_date = ?');
      params.push(updates.nextPaymentDate);
    }
    if (updates.status !== undefined) {
      setClause.push('status = ?');
      params.push(updates.status);
    }
    if (updates.description !== undefined) {
      setClause.push('description = ?');
      params.push(updates.description);
    }
    
    setClause.push('updated_at = ?');
    params.push(now);
    params.push(id);
    
    const query = `UPDATE debits SET ${setClause.join(', ')} WHERE id = ?`;
    
    await executeQuery(query, params);
    
    return await this.getDebitById(id);
  },

  // Supprimer un prélèvement
  async deleteDebit(id) {
    const query = 'DELETE FROM debits WHERE id = ?';
    await executeQuery(query, [id]);
  },

  // Obtenir le solde d'un utilisateur
  async getBalance(userId) {
    const query = 'SELECT balance FROM users WHERE id = ?';
    const results = await executeSelect(query, [userId]);
    
    if (results.length === 0) {
      // Créer l'utilisateur s'il n'existe pas
      await this.createUser(userId);
      return 0;
    }
    
    return results[0].balance || 0;
  },

  // Mettre à jour le solde d'un utilisateur
  async updateBalance(userId, balance) {
    const query = `
      INSERT OR REPLACE INTO users (id, balance, updated_at) 
      VALUES (?, ?, ?)
    `;
    
    await executeQuery(query, [userId, balance, new Date().toISOString()]);
  },

  // Créer un utilisateur
  async createUser(userId, userData = {}) {
    const now = new Date().toISOString();
    const query = `
      INSERT OR IGNORE INTO users (id, email, name, balance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      userId,
      userData.email || '',
      userData.name || '',
      userData.balance || 0,
      now,
      now
    ]);
  },

  // Obtenir les prélèvements par période
  async getDebitsByPeriod(userId, startDate, endDate) {
    const query = `
      SELECT * FROM debits 
      WHERE user_id = ? 
      AND next_payment_date BETWEEN ? AND ?
      AND status = 'active'
      ORDER BY next_payment_date ASC
    `;
    
    const results = await executeSelect(query, [userId, startDate, endDate]);
    
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      companyName: row.company_name,
      amount: row.amount,
      category: row.category,
      frequency: row.frequency,
      nextPaymentDate: row.next_payment_date,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  // Marquer un prélèvement comme payé
  async markAsPaid(debitId) {
    const debit = await this.getDebitById(debitId);
    
    // Ajouter à l'historique
    await this.addToHistory(debit);
    
    // Calculer la prochaine date selon la fréquence
    const nextDate = this.calculateNextPaymentDate(debit.nextPaymentDate, debit.frequency);
    
    // Mettre à jour le prélèvement
    return await this.updateDebit(debitId, {
      nextPaymentDate: nextDate.toISOString().split('T')[0],
      status: 'active'
    });
  },

  // Ajouter à l'historique des paiements
  async addToHistory(debit) {
    const id = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${debit.id}-${debit.nextPaymentDate}-${Date.now()}`
    );
    
    const query = `
      INSERT INTO payment_history (
        id, debit_id, user_id, amount, payment_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = new Date().toISOString();
    
    await executeQuery(query, [
      id,
      debit.id,
      debit.userId,
      debit.amount,
      debit.nextPaymentDate,
      'completed',
      now
    ]);
  },

  // Calculer la prochaine date de paiement
  calculateNextPaymentDate(currentDate, frequency) {
    const date = new Date(currentDate);
    
    switch (frequency) {
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
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      default:
        // Pour 'once' ou autres, pas de récurrence
        return date;
    }
    
    return date;
  },

  // Obtenir les statistiques
  async getStatistics(userId, period = 'month') {
    let startDate, endDate;
    const now = new Date();
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }
    
    const debits = await this.getDebitsByPeriod(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    const totalAmount = debits.reduce((sum, debit) => sum + debit.amount, 0);
    const categories = debits.reduce((acc, debit) => {
      const category = debit.category || 'Autre';
      acc[category] = (acc[category] || 0) + debit.amount;
      return acc;
    }, {});
    
    return {
      totalAmount,
      count: debits.length,
      categories,
      debits
    };
  }
};