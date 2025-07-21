import { Platform } from 'react-native';

let db = null;

// Mode simulation forcé pour éviter les erreurs SQLite
const FORCE_SIMULATION = true;

export const initializeDatabase = async () => {
  try {
    console.log('Initialisation base de données - Platform:', Platform.OS);
    
    // Toujours utiliser le mode simulation pour l'instant
    console.log('Mode simulation activé');
    
    // Créer des données par défaut en mémoire
    if (typeof global !== 'undefined') {
      global.previpayData = {
        companies: getDefaultCompanies(),
        debits: [],
        users: []
      };
    }
    
    console.log('Base de données simulée initialisée');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
  }
};

const getDefaultCompanies = () => {
  return [
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
};

export const getDatabase = () => {
  return {
    web: true,
    getCompanies: () => {
      if (typeof global !== 'undefined' && global.previpayData) {
        return global.previpayData.companies;
      }
      return getDefaultCompanies();
    }
  };
};

export const executeQuery = (query, params = []) => {
  return new Promise((resolve) => {
    console.log('Simulation requête SQL:', query);
    resolve({ rowsAffected: 1 });
  });
};

export const executeSelect = (query, params = []) => {
  return new Promise((resolve) => {
    if (query.includes('companies')) {
      const companies = getDefaultCompanies();
      resolve(companies.map(company => ({
        id: company.id,
        name: company.name,
        category: company.category,
        is_popular: company.is_popular
      })));
    } else {
      resolve([]);
    }
  });
};