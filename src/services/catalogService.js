import { companyService } from './database';

export const catalogService = {
  // Obtenir toutes les entreprises du catalogue
  async getAllCompanies() {
    try {
      const results = await companyService.getAllCompanies();
      
      return results.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        logoUrl: row.logo_url || null,
        website: row.website || null,
        isPopular: Boolean(row.is_popular)
      }));
    } catch (error) {
      console.error('Erreur getAllCompanies:', error);
      return this.getFallbackCompanies();
    }
  },

  // Obtenir les entreprises du catalogue (alias pour compatibilité)
  async getCompanies() {
    return await this.getAllCompanies();
  },

  // Obtenir les entreprises par catégorie
  async getCompaniesByCategory(category) {
    try {
      const allCompanies = await companyService.getAllCompanies();
      const filtered = allCompanies.filter(company => company.category === category);
      
      return filtered.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        logoUrl: row.logo_url || null,
        website: row.website || null,
        isPopular: Boolean(row.is_popular)
      }));
    } catch (error) {
      console.error('Erreur getCompaniesByCategory:', error);
      return [];
    }
  },

  // Obtenir les entreprises populaires
  async getPopularCompanies() {
    try {
      const results = await companyService.getPopularCompanies();
      
      return results.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        logoUrl: row.logo_url || null,
        website: row.website || null,
        isPopular: Boolean(row.is_popular)
      }));
    } catch (error) {
      console.error('Erreur getPopularCompanies:', error);
      return this.getFallbackCompanies().filter(c => c.isPopular);
    }
  },

  // Rechercher des entreprises
  async searchCompanies(searchTerm) {
    try {
      const allCompanies = await companyService.getAllCompanies();
      const searchPattern = searchTerm.toLowerCase();
      
      const filtered = allCompanies.filter(company =>
        company.name.toLowerCase().includes(searchPattern) ||
        company.category.toLowerCase().includes(searchPattern)
      );
      
      return filtered.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        logoUrl: row.logo_url || null,
        website: row.website || null,
        isPopular: Boolean(row.is_popular)
      }));
    } catch (error) {
      console.error('Erreur searchCompanies:', error);
      return [];
    }
  },

  // Obtenir toutes les catégories
  async getCategories() {
    try {
      return await companyService.getCategories();
    } catch (error) {
      console.error('Erreur getCategories:', error);
      return ['Mobile', 'Divertissement', 'Banque', 'Assurance', 'Énergie', 'Transport', 'Crédit', 'Autre'];
    }
  },

  // Obtenir les entreprises groupées par catégorie
  async getCompaniesGroupedByCategory() {
    try {
      const companies = await this.getAllCompanies();
      
      return companies.reduce((acc, company) => {
        const category = company.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(company);
        return acc;
      }, {});
    } catch (error) {
      console.error('Erreur getCompaniesGroupedByCategory:', error);
      return {};
    }
  },

  // Données de fallback en cas de problème
  getFallbackCompanies() {
    return [
      { id: 'orange', name: 'Orange', category: 'Mobile', isPopular: true },
      { id: 'sfr', name: 'SFR', category: 'Mobile', isPopular: true },
      { id: 'free', name: 'Free', category: 'Mobile', isPopular: true },
      { id: 'bouygues', name: 'Bouygues Telecom', category: 'Mobile', isPopular: true },
      { id: 'netflix', name: 'Netflix', category: 'Divertissement', isPopular: true },
      { id: 'spotify', name: 'Spotify', category: 'Divertissement', isPopular: true },
      { id: 'disney-plus', name: 'Disney+', category: 'Divertissement', isPopular: true },
      { id: 'bnp-paribas', name: 'BNP Paribas', category: 'Banque', isPopular: true },
      { id: 'credit-agricole', name: 'Crédit Agricole', category: 'Banque', isPopular: true },
      { id: 'axa', name: 'AXA', category: 'Assurance', isPopular: true },
      { id: 'edf', name: 'EDF', category: 'Énergie', isPopular: true },
      { id: 'sncf', name: 'SNCF Connect', category: 'Transport', isPopular: true }
    ];
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