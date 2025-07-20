# PréviPay - Gestion Intelligente des Prélèvements

Une application mobile React Native pour gérer, anticiper et être alerté de vos prélèvements bancaires récurrents.

## 🎯 Fonctionnalités

### ✅ Fonctionnalités Implémentées

- **🗃️ Catalogue d'entreprises** : Plus de 30 entreprises populaires classées par catégories
- **➕ Gestion des prélèvements** : Ajout, modification, suppression avec toutes les fréquences
- **🗓️ Calendrier intelligent** : Visualisation mensuelle avec marqueurs de dates
- **🔔 Notifications locales** : Rappels personnalisables (J-1, J, etc.)
- **💼 Suivi de solde** : Calcul du solde prévisionnel avec alertes
- **📊 Dashboard complet** : Statistiques, graphiques, répartition par catégories
- **🌐 Multilingue** : Français et Anglais
- **🌙 Mode sombre** : Thème adaptatif (clair/sombre/système)
- **🔐 Authentification** : Système simple avec chiffrement local
- **💾 Stockage local** : Base SQLite avec synchronisation

### 🎨 Interface Utilisateur

- **Navigation par onglets** : Accueil, Calendrier, Ajout, Paramètres
- **Design moderne** : Interface iOS/Android native avec animations
- **Accessibilité** : Contrastes appropriés, tailles de police adaptatives
- **Responsive** : Adaptation automatique aux différentes tailles d'écran

### 📱 Fonctionnalités Techniques

- **React Native + Expo** : Compatible iOS et Android
- **SQLite** : Base de données locale performante
- **Notifications push** : Expo Notifications avec personnalisation
- **Graphiques** : Charts interactifs (camembert, barres)
- **État global** : Context API pour la gestion des données
- **Internationalisation** : i18next pour le multilingue

## 🚀 Installation et Lancement

### Prérequis

- Node.js 16+
- npm ou yarn
- Expo CLI : `npm install -g expo-cli`
- Expo Go app sur votre téléphone

### Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd previpay

# Installer les dépendances
npm install

# Lancer en mode développement
npm start

# Ou directement sur un platform
npm run android  # Android
npm run ios      # iOS
```

### Configuration

L'application fonctionne directement sans configuration supplémentaire. Les données sont stockées localement.

## 📂 Structure du Projet

```
src/
├── components/           # Composants réutilisables
│   ├── BalanceCard.js   # Carte d'affichage du solde
│   ├── DebitCard.js     # Carte de prélèvement
│   └── QuickStats.js    # Statistiques rapides
├── context/             # Contextes React (état global)
│   ├── AuthContext.js   # Authentification
│   ├── DebitContext.js  # Gestion des prélèvements
│   ├── NotificationContext.js # Notifications
│   └── ThemeContext.js  # Thèmes
├── screens/             # Écrans de l'application
│   ├── HomeScreen.js    # Tableau de bord
│   ├── CalendarScreen.js # Vue calendrier
│   ├── AddDebitScreen.js # Ajout de prélèvement
│   ├── CatalogScreen.js # Catalogue d'entreprises
│   ├── SettingsScreen.js # Paramètres
│   ├── AuthScreen.js    # Connexion/Inscription
│   ├── DebitDetailsScreen.js # Détails d'un prélèvement
│   └── StatisticsScreen.js # Statistiques avancées
├── services/            # Services et logique métier
│   ├── database.js      # Configuration SQLite
│   ├── debitService.js  # CRUD prélèvements
│   ├── catalogService.js # Gestion du catalogue
│   ├── notificationService.js # Paramètres notifications
│   └── i18n.js         # Configuration multilingue
└── App.js              # Point d'entrée principal
```

## 🗄️ Base de Données

### Tables SQLite

- **users** : Informations utilisateurs et solde
- **debits** : Prélèvements avec récurrence
- **companies** : Catalogue d'entreprises
- **notification_settings** : Paramètres de notifications
- **payment_history** : Historique des paiements

### Exemple de données

```javascript
// Prélèvement type
{
  id: "unique-id",
  companyName: "Netflix",
  amount: 15.99,
  category: "Divertissement",
  frequency: "monthly",
  nextPaymentDate: "2024-01-15",
  status: "active"
}
```

## 🔔 Notifications

### Types de notifications

1. **Rappel avant échéance** : X jours avant (configurable)
2. **Notification jour J** : Le jour du prélèvement
3. **Alerte solde faible** : Quand solde < seuil
4. **Rappel quotidien** : Synthèse à 9h (optionnel)

### Configuration

```javascript
// Paramètres par défaut
{
  enabled: true,
  reminderDays: 1,
  dailyReminder: true,
  lowBalanceAlert: true,
  balanceThreshold: 100
}
```

## 📊 Fonctionnalités Avancées

### Calcul du Solde Prévisionnel

L'application calcule automatiquement le solde après prélèvements pour une période donnée :

```javascript
const projectedBalance = currentBalance - upcomingDebits.reduce((sum, debit) => sum + debit.amount, 0);
```

### Gestion des Récurrences

Support complet des fréquences :
- Ponctuel (une fois)
- Hebdomadaire
- Bi-hebdomadaire  
- Mensuel
- Trimestriel
- Semestriel
- Annuel

### Statistiques

- Répartition par catégories (graphique camembert)
- Top catégories (graphique barres)
- Évolution mensuelle/annuelle
- Montants moyens et totaux

## 🔧 Personnalisation

### Ajouter une Catégorie

```javascript
// Dans catalogService.js
const newCategory = {
  name: "Nouvelle Catégorie",
  icon: "icon-name",
  color: "#hexcolor"
};
```

### Modifier les Thèmes

```javascript
// Dans ThemeContext.js
const customTheme = {
  colors: {
    primary: "#votre-couleur",
    // ...autres couleurs
  }
};
```

## 🚧 Fonctionnalités à Développer

### Améliorations Prévues

1. **🔗 Intégration bancaire** : API Plaid/Bridge pour synchronisation automatique
2. **☁️ Synchronisation cloud** : Backup et sync multi-appareils  
3. **📧 Import email/SMS** : Détection automatique des prélèvements
4. **🧠 IA prédictive** : Suggestions basées sur l'historique
5. **📱 Widgets natifs** : Widgets Android/iOS
6. **💸 Gestion budgets** : Planification et alertes budgétaires
7. **🔄 Export données** : PDF, CSV, Excel
8. **👥 Comptes multiples** : Gestion de plusieurs comptes bancaires

### Intégrations Futures

- **Open Banking** : PSD2 pour les banques européennes
- **Agrégateurs** : Bankin', Linxo, Budget Insight
- **Notifications push** : Firebase pour notifications serveur
- **Analytics** : Suivi d'usage et optimisations

## 🐛 Problèmes Connus

1. **Date picker Android** : Nécessite `@react-native-community/datetimepicker`
2. **Notifications iOS** : Permissions à demander explicitement
3. **Charts sur Android** : Parfois lent sur devices bas de gamme

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements  
4. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue GitHub
- Email : support@previpay.com

---

**PréviPay** - Gérez vos prélèvements intelligemment 💳✨