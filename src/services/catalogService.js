import { executeQuery, executeSelect } from './database';

export const catalogService = {
  // Obtenir toutes les entreprises du catalogue
  async getAllCompanies() {
    const query = 'SELECT * FROM companies ORDER BY category, name';
    const results = await executeSelect(query);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      logoUrl: row.logo_url,
      website: row.website,
      isPopular: Boolean(row.is_popular)
    }));
  },

  // Obtenir les entreprises par catégorie
  async getCompaniesByCategory(category) {
    const query = 'SELECT * FROM companies WHERE category = ? ORDER BY name';
    const results = await executeSelect(query, [category]);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      logoUrl: row.logo_url,
      website: row.website,
      isPopular: Boolean(row.is_popular)
    }));
  },

  // Obtenir les entreprises populaires
  async getPopularCompanies() {
    const query = 'SELECT * FROM companies WHERE is_popular = 1 ORDER BY category, name';
    const results = await executeSelect(query);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      logoUrl: row.logo_url,
      website: row.website,
      isPopular: Boolean(row.is_popular)
    }));
  },

  // Rechercher des entreprises
  async searchCompanies(searchTerm) {
    const query = `
      SELECT * FROM companies 
      WHERE name LIKE ? OR category LIKE ?
      ORDER BY is_popular DESC, name
    `;
    const searchPattern = `%${searchTerm}%`;
    const results = await executeSelect(query, [searchPattern, searchPattern]);
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      logoUrl: row.logo_url,
      website: row.website,
      isPopular: Boolean(row.is_popular)
    }));
  },

  // Obtenir toutes les catégories
  async getCategories() {
    const query = 'SELECT DISTINCT category FROM companies ORDER BY category';
    const results = await executeSelect(query);
    
    return results.map(row => row.category);
  },

  // Obtenir les entreprises groupées par catégorie
  async getCompaniesGroupedByCategory() {
    const companies = await this.getAllCompanies();
    
    return companies.reduce((acc, company) => {
      const category = company.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(company);
      return acc;
    }, {});
  },

  // Ajouter une nouvelle entreprise
  async addCompany(companyData) {
    const query = `
      INSERT INTO companies (id, name, category, logo_url, website, is_popular)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const id = companyData.id || companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    await executeQuery(query, [
      id,
      companyData.name,
      companyData.category,
      companyData.logoUrl || null,
      companyData.website || null,
      companyData.isPopular ? 1 : 0
    ]);
    
    return {
      id,
      name: companyData.name,
      category: companyData.category,
      logoUrl: companyData.logoUrl,
      website: companyData.website,
      isPopular: Boolean(companyData.isPopular)
    };
  },

  // Suggestions d'entreprises basées sur la catégorie
  getSuggestedCompanies(category) {
    const suggestions = {
      'Mobile': [
        { name: 'Orange', category: 'Mobile' },
        { name: 'SFR', category: 'Mobile' },
        { name: 'Free', category: 'Mobile' },
        { name: 'Bouygues Telecom', category: 'Mobile' }
      ],
      'Divertissement': [
        { name: 'Netflix', category: 'Divertissement' },
        { name: 'Amazon Prime Video', category: 'Divertissement' },
        { name: 'Disney+', category: 'Divertissement' },
        { name: 'Spotify', category: 'Divertissement' },
        { name: 'Deezer', category: 'Divertissement' }
      ],
      'Banque': [
        { name: 'BNP Paribas', category: 'Banque' },
        { name: 'Crédit Agricole', category: 'Banque' },
        { name: 'Société Générale', category: 'Banque' },
        { name: 'LCL', category: 'Banque' }
      ],
      'Assurance': [
        { name: 'AXA', category: 'Assurance' },
        { name: 'Generali', category: 'Assurance' },
        { name: 'Allianz', category: 'Assurance' },
        { name: 'MACIF', category: 'Assurance' },
        { name: 'MAAF', category: 'Assurance' }
      ],
      'Énergie': [
        { name: 'EDF', category: 'Énergie' },
        { name: 'Engie', category: 'Énergie' },
        { name: 'TotalEnergies', category: 'Énergie' }
      ],
      'Transport': [
        { name: 'SNCF Connect', category: 'Transport' },
        { name: 'Navigo (RATP)', category: 'Transport' }
      ],
      'Crédit': [
        { name: 'Cofidis', category: 'Crédit' },
        { name: 'Younited Credit', category: 'Crédit' },
        { name: 'Klarna', category: 'Crédit' }
      ]
    };

    return suggestions[category] || [];
  },

  // Obtenir les icônes par catégorie
  getCategoryIcon(category) {
    const icons = {
      'Mobile': 'phone-portrait-outline',
      'Divertissement': 'play-circle-outline',
      'Banque': 'card-outline',
      'Assurance': 'shield-checkmark-outline',
      'Énergie': 'flash-outline',
      'Transport': 'car-outline',
      'Crédit': 'cash-outline',
      'Autre': 'ellipsis-horizontal-outline'
    };

    return icons[category] || icons['Autre'];
  },

  // Obtenir la couleur par catégorie
  getCategoryColor(category) {
    const colors = {
      'Mobile': '#007AFF',
      'Divertissement': '#FF3B30',
      'Banque': '#34C759',
      'Assurance': '#FF9500',
      'Énergie': '#FFCC00',
      'Transport': '#5856D6',
      'Crédit': '#AF52DE',
      'Autre': '#8E8E93'
    };

    return colors[category] || colors['Autre'];
  }
};