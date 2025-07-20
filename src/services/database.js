import * as SQLite from 'expo-sqlite';

let db = null;

export const initializeDatabase = async () => {
  try {
    db = SQLite.openDatabase('previpay.db');
    
    // Créer les tables
    await createTables();
    
    console.log('Base de données initialisée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Table des utilisateurs
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            balance REAL DEFAULT 0,
            created_at TEXT,
            updated_at TEXT
          );
        `);

        // Table des prélèvements
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS debits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            company_name TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            frequency TEXT NOT NULL,
            next_payment_date TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            description TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
        `);

        // Table des entreprises du catalogue
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            logo_url TEXT,
            website TEXT,
            is_popular BOOLEAN DEFAULT 0
          );
        `);

        // Table des paramètres de notifications
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS notification_settings (
            user_id TEXT PRIMARY KEY,
            enabled BOOLEAN DEFAULT 1,
            reminder_days INTEGER DEFAULT 1,
            daily_reminder BOOLEAN DEFAULT 1,
            low_balance_alert BOOLEAN DEFAULT 1,
            balance_threshold REAL DEFAULT 100,
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
        `);

        // Table de l'historique des paiements
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS payment_history (
            id TEXT PRIMARY KEY,
            debit_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            created_at TEXT,
            FOREIGN KEY (debit_id) REFERENCES debits (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
          );
        `);
      },
      (error) => {
        console.error('Erreur lors de la création des tables:', error);
        reject(error);
      },
      () => {
        console.log('Tables créées avec succès');
        insertDefaultCompanies();
        resolve();
      }
    );
  });
};

const insertDefaultCompanies = () => {
  const companies = [
    // Télécommunications
    { id: 'orange', name: 'Orange', category: 'Mobile', is_popular: 1 },
    { id: 'sfr', name: 'SFR', category: 'Mobile', is_popular: 1 },
    { id: 'free', name: 'Free', category: 'Mobile', is_popular: 1 },
    { id: 'bouygues', name: 'Bouygues Telecom', category: 'Mobile', is_popular: 1 },
    
    // Streaming & Divertissement
    { id: 'netflix', name: 'Netflix', category: 'Divertissement', is_popular: 1 },
    { id: 'amazon-prime', name: 'Amazon Prime Video', category: 'Divertissement', is_popular: 1 },
    { id: 'disney-plus', name: 'Disney+', category: 'Divertissement', is_popular: 1 },
    { id: 'spotify', name: 'Spotify', category: 'Divertissement', is_popular: 1 },
    { id: 'deezer', name: 'Deezer', category: 'Divertissement', is_popular: 1 },
    { id: 'youtube-premium', name: 'YouTube Premium', category: 'Divertissement', is_popular: 0 },
    
    // Banques
    { id: 'bnp-paribas', name: 'BNP Paribas', category: 'Banque', is_popular: 1 },
    { id: 'credit-agricole', name: 'Crédit Agricole', category: 'Banque', is_popular: 1 },
    { id: 'societe-generale', name: 'Société Générale', category: 'Banque', is_popular: 1 },
    { id: 'lcl', name: 'LCL', category: 'Banque', is_popular: 1 },
    { id: 'credit-mutuel', name: 'Crédit Mutuel', category: 'Banque', is_popular: 1 },
    
    // Assurances
    { id: 'axa', name: 'AXA', category: 'Assurance', is_popular: 1 },
    { id: 'generali', name: 'Generali', category: 'Assurance', is_popular: 1 },
    { id: 'allianz', name: 'Allianz', category: 'Assurance', is_popular: 1 },
    { id: 'macif', name: 'MACIF', category: 'Assurance', is_popular: 1 },
    { id: 'maaf', name: 'MAAF', category: 'Assurance', is_popular: 1 },
    
    // Énergie
    { id: 'edf', name: 'EDF', category: 'Énergie', is_popular: 1 },
    { id: 'engie', name: 'Engie', category: 'Énergie', is_popular: 1 },
    { id: 'total-energies', name: 'TotalEnergies', category: 'Énergie', is_popular: 1 },
    
    // Transport
    { id: 'sncf', name: 'SNCF Connect', category: 'Transport', is_popular: 1 },
    { id: 'ratp', name: 'Navigo (RATP)', category: 'Transport', is_popular: 1 },
    
    // Crédit/Financement
    { id: 'cofidis', name: 'Cofidis', category: 'Crédit', is_popular: 1 },
    { id: 'younited', name: 'Younited Credit', category: 'Crédit', is_popular: 1 },
    { id: 'klarna', name: 'Klarna', category: 'Crédit', is_popular: 1 },
  ];

  db.transaction((tx) => {
    companies.forEach((company) => {
      tx.executeSql(
        'INSERT OR IGNORE INTO companies (id, name, category, is_popular) VALUES (?, ?, ?, ?)',
        [company.id, company.name, company.category, company.is_popular]
      );
    });
  });
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

// Fonction utilitaire pour exécuter des requêtes
export const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          console.error('Erreur SQL:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Fonction utilitaire pour obtenir tous les résultats
export const executeSelect = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, result) => {
          const rows = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows);
        },
        (_, error) => {
          console.error('Erreur SQL:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};