import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Traductions françaises
const fr = {
  common: {
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    amount: 'Montant',
    date: 'Date',
    category: 'Catégorie',
    description: 'Description',
    status: 'Statut',
    search: 'Rechercher',
    filter: 'Filtrer',
    settings: 'Paramètres'
  },
  navigation: {
    home: 'Accueil',
    calendar: 'Calendrier',
    add: 'Ajouter',
    settings: 'Paramètres'
  },
  auth: {
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    loginButton: 'Se connecter',
    registerButton: 'S\'inscrire',
    alreadyHaveAccount: 'Déjà un compte ?',
    noAccount: 'Pas de compte ?'
  },
  debits: {
    title: 'Prélèvements',
    addDebit: 'Ajouter un prélèvement',
    editDebit: 'Modifier le prélèvement',
    companyName: 'Nom de l\'entreprise',
    nextPaymentDate: 'Prochaine date de prélèvement',
    frequency: 'Fréquence',
    markAsPaid: 'Marquer comme payé',
    pause: 'Mettre en pause',
    resume: 'Reprendre',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce prélèvement ?',
    frequencies: {
      once: 'Ponctuel',
      weekly: 'Hebdomadaire',
      biweekly: 'Bi-hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      biannual: 'Semestriel',
      annual: 'Annuel'
    },
    status: {
      active: 'Actif',
      paused: 'En pause',
      completed: 'Terminé'
    }
  },
  categories: {
    Mobile: 'Mobile',
    Divertissement: 'Divertissement',
    Banque: 'Banque',
    Assurance: 'Assurance',
    Énergie: 'Énergie',
    Transport: 'Transport',
    Crédit: 'Crédit',
    Autre: 'Autre'
  },
  dashboard: {
    title: 'Tableau de bord',
    currentBalance: 'Solde actuel',
    projectedBalance: 'Solde prévisionnel',
    thisMonth: 'Ce mois-ci',
    nextDebits: 'Prochains prélèvements',
    totalAmount: 'Montant total',
    noDebits: 'Aucun prélèvement ce mois',
    addFirstDebit: 'Ajouter votre premier prélèvement'
  },
  calendar: {
    title: 'Calendrier',
    noDebitsToday: 'Aucun prélèvement aujourd\'hui',
    noDebitsMonth: 'Aucun prélèvement ce mois-ci'
  },
  notifications: {
    title: 'Notifications',
    enabled: 'Notifications activées',
    reminderDays: 'Rappel avant (jours)',
    dailyReminder: 'Rappel quotidien',
    lowBalanceAlert: 'Alerte solde faible',
    balanceThreshold: 'Seuil d\'alerte (€)',
    testNotification: 'Tester les notifications'
  },
  statistics: {
    title: 'Statistiques',
    totalThisMonth: 'Total ce mois',
    byCategory: 'Par catégorie',
    evolution: 'Évolution',
    noData: 'Aucune donnée disponible'
  }
};

// Traductions anglaises
const en = {
  common: {
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    amount: 'Amount',
    date: 'Date',
    category: 'Category',
    description: 'Description',
    status: 'Status',
    search: 'Search',
    filter: 'Filter',
    settings: 'Settings'
  },
  navigation: {
    home: 'Home',
    calendar: 'Calendar',
    add: 'Add',
    settings: 'Settings'
  },
  auth: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: 'Don\'t have an account?'
  },
  debits: {
    title: 'Direct Debits',
    addDebit: 'Add Direct Debit',
    editDebit: 'Edit Direct Debit',
    companyName: 'Company Name',
    nextPaymentDate: 'Next Payment Date',
    frequency: 'Frequency',
    markAsPaid: 'Mark as Paid',
    pause: 'Pause',
    resume: 'Resume',
    deleteConfirm: 'Are you sure you want to delete this direct debit?',
    frequencies: {
      once: 'One-time',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      biannual: 'Bi-annual',
      annual: 'Annual'
    },
    status: {
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed'
    }
  },
  categories: {
    Mobile: 'Mobile',
    Divertissement: 'Entertainment',
    Banque: 'Banking',
    Assurance: 'Insurance',
    Énergie: 'Energy',
    Transport: 'Transport',
    Crédit: 'Credit',
    Autre: 'Other'
  },
  dashboard: {
    title: 'Dashboard',
    currentBalance: 'Current Balance',
    projectedBalance: 'Projected Balance',
    thisMonth: 'This Month',
    nextDebits: 'Upcoming Debits',
    totalAmount: 'Total Amount',
    noDebits: 'No debits this month',
    addFirstDebit: 'Add your first direct debit'
  },
  calendar: {
    title: 'Calendar',
    noDebitsToday: 'No debits today',
    noDebitsMonth: 'No debits this month'
  },
  notifications: {
    title: 'Notifications',
    enabled: 'Notifications Enabled',
    reminderDays: 'Reminder Before (days)',
    dailyReminder: 'Daily Reminder',
    lowBalanceAlert: 'Low Balance Alert',
    balanceThreshold: 'Alert Threshold (€)',
    testNotification: 'Test Notifications'
  },
  statistics: {
    title: 'Statistics',
    totalThisMonth: 'Total This Month',
    byCategory: 'By Category',
    evolution: 'Evolution',
    noData: 'No data available'
  }
};

const resources = {
  fr: { translation: fr },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.locale.split('-')[0] || 'fr', // Langue par défaut basée sur l'appareil
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;