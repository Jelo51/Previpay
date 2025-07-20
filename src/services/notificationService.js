import { executeQuery, executeSelect } from './database';

export const notificationService = {
  // Obtenir les paramètres de notification d'un utilisateur
  async getNotificationSettings(userId) {
    const query = 'SELECT * FROM notification_settings WHERE user_id = ?';
    const results = await executeSelect(query, [userId]);
    
    if (results.length === 0) {
      return null;
    }
    
    const row = results[0];
    return {
      enabled: Boolean(row.enabled),
      reminderDays: row.reminder_days,
      dailyReminder: Boolean(row.daily_reminder),
      lowBalanceAlert: Boolean(row.low_balance_alert),
      balanceThreshold: row.balance_threshold
    };
  },

  // Sauvegarder les paramètres de notification
  async saveNotificationSettings(userId, settings) {
    const query = `
      INSERT OR REPLACE INTO notification_settings 
      (user_id, enabled, reminder_days, daily_reminder, low_balance_alert, balance_threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [
      userId,
      settings.enabled ? 1 : 0,
      settings.reminderDays,
      settings.dailyReminder ? 1 : 0,
      settings.lowBalanceAlert ? 1 : 0,
      settings.balanceThreshold
    ]);
  },

  // Créer les paramètres par défaut pour un nouvel utilisateur
  async createDefaultSettings(userId) {
    const defaultSettings = {
      enabled: true,
      reminderDays: 1,
      dailyReminder: true,
      lowBalanceAlert: true,
      balanceThreshold: 100
    };
    
    await this.saveNotificationSettings(userId, defaultSettings);
    return defaultSettings;
  }
};