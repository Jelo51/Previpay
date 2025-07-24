import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDebits } from '../context/DebitContext'; // ← NOUVEAU: Import du context
import { useTheme } from '../context/ThemeContext';

const BalanceCard = ({ currentBalance, projectedBalance, onUpdateBalance }) => {
  const { theme } = useTheme();
  
  // ← NOUVEAU: Récupérer les données bancaires depuis le context
  const { 
    realBalance, 
    isBankConnected, 
    syncWithBankingAPI, 
    syncStatus,
    calculateBalanceAfterDebits,
    getUrgentDebits,
    connectToBank,
    bankConnectionError
  } = useDebits();

  // ← NOUVEAU: Calculer les données de prévision avec données réelles
  const balanceProjection = calculateBalanceAfterDebits();
  const urgentDebits = getUrgentDebits();

  // ← NOUVEAU: Déterminer quel solde afficher (réel vs local)
  const displayBalance = realBalance ? realBalance.balance : currentBalance;
  const displayProjected = balanceProjection ? balanceProjection.balanceAfter : projectedBalance;
  
  const isProjectedNegative = displayProjected < 0;
  const projectedDifference = displayProjected - displayBalance;

  // ← NOUVEAU: Fonction pour actualiser le solde bancaire
  const handleRefreshBalance = async () => {
    if (!isBankConnected) {
      Alert.alert(
        'Compte non connecté',
        'Connectez votre compte MKB Bank dans les paramètres pour voir votre solde réel.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Connecter', onPress: handleConnectBank }
        ]
      );
      return;
    }

    try {
      await syncWithBankingAPI();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de synchroniser avec votre banque');
    }
  };

  // ← MODIFIÉ: Fonction pour connecter directement la banque
  const handleConnectBank = () => {
    Alert.alert(
      'Connexion MKB Bank',
      'Se connecter avec les identifiants de test ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Connecter', 
          onPress: async () => {
            try {
              console.log('🏦 Tentative de connexion MKB Bank...');
              
              // Afficher un loading
              Alert.alert('Connexion...', 'Connexion à MKB Bank en cours...');
              
              const result = await connectToBank({
                email: 'client@cic.fr',
                password: 'password123'
              });
              
              if (result.success) {
                Alert.alert(
                  'Succès ! 🎉', 
                  'Connexion bancaire réussie !\nVotre solde réel va apparaître dans quelques instants.'
                );
              } else {
                console.error('❌ Erreur connexion:', result.error);
                Alert.alert(
                  'Erreur de connexion', 
                  `Impossible de se connecter à MKB Bank:\n\n${result.error}\n\nVérifiez que l'API est lancée et accessible.`
                );
              }
            } catch (error) {
              console.error('❌ Erreur connexion:', error);
              Alert.alert(
                'Erreur réseau', 
                'Impossible de se connecter à la banque.\n\nVérifiez votre connexion réseau et que l\'API MKB Bank est accessible.'
              );
            }
          }
        }
      ]
    );
  };

  // ← NOUVEAU: Obtenir la couleur du statut de connexion
  const getConnectionStatusColor = () => {
    if (!isBankConnected) return theme.colors.warning;
    switch (syncStatus) {
      case 'syncing': return theme.colors.primary;
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  // ← NOUVEAU: Obtenir le texte du statut
  const getConnectionStatusText = () => {
    if (!isBankConnected) return 'Non connecté';
    switch (syncStatus) {
      case 'syncing': return 'Synchronisation...';
      case 'success': return `Mis à jour ${realBalance?.lastUpdated ? 'à l\'instant' : ''}`;
      case 'error': return 'Erreur de synchronisation';
      default: return 'Connecté';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      elevation: 3,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    // ← NOUVEAU: Styles pour le header bancaire
    bankHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bankLogo: {
      marginRight: 8,
    },
    refreshButton: {
      padding: 4,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    balanceLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    balanceAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    // ← NOUVEAU: Style pour solde réel
    realBalanceAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.success,
    },
    projectedAmount: {
      fontSize: 18,
      fontWeight: '600',
      color: isProjectedNegative ? theme.colors.error : theme.colors.success,
    },
    differenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isProjectedNegative 
        ? `${theme.colors.error}15` 
        : `${theme.colors.success}15`,
    },
    differenceText: {
      fontSize: 14,
      fontWeight: '500',
      color: isProjectedNegative ? theme.colors.error : theme.colors.success,
      marginLeft: 4,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    // ← NOUVEAU: Styles pour les alertes
    urgentSection: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: `${theme.colors.warning}15`,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.warning,
    },
    urgentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    urgentTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.warning,
      marginLeft: 6,
    },
    urgentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    urgentDebitName: {
      fontSize: 12,
      color: theme.colors.text,
      flex: 1,
    },
    urgentDebitAmount: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.error,
    },
    // ← NOUVEAU: Style pour compte non connecté
    disconnectedContainer: {
      alignItems: 'center',
      padding: 16,
    },
    disconnectedIcon: {
      marginBottom: 8,
    },
    disconnectedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    disconnectedSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    connectButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    connectButtonText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  // ← NOUVEAU: Affichage si pas connecté à la banque
  if (!isBankConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.bankHeader}>
            <Ionicons name="business" size={20} color={theme.colors.primary} style={styles.bankLogo} />
            <Text style={styles.title}>Mon solde</Text>
          </View>
          <Ionicons name="link-outline" size={20} color={theme.colors.textSecondary} />
        </View>
        
        <View style={styles.disconnectedContainer}>
          <Ionicons 
            name="warning-outline" 
            size={32} 
            color={theme.colors.warning} 
            style={styles.disconnectedIcon} 
          />
          <Text style={styles.disconnectedTitle}>Compte non connecté</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connectez votre compte MKB Bank pour voir votre solde réel et vos prélèvements automatiques
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={handleConnectBank}>
            <Text style={styles.connectButtonText}>Connecter ma banque</Text>
          </TouchableOpacity>
        </View>

        {/* Affichage du solde local en fallback */}
        <View style={styles.divider} />
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Solde local (estimé)</Text>
          <Text style={styles.balanceAmount}>
            {currentBalance ? currentBalance.toFixed(2) : '0.00'}€
          </Text>
        </View>
      </View>
    );
  }

  // ← AFFICHAGE PRINCIPAL avec données bancaires
  return (
    <View style={styles.container}>
      {/* Header avec logo MKB Bank */}
      <View style={styles.header}>
        <View style={styles.bankHeader}>
          <Ionicons name="business" size={20} color={theme.colors.primary} style={styles.bankLogo} />
          <Text style={styles.title}>MKB Bank</Text>
        </View>
        <TouchableOpacity 
          onPress={handleRefreshBalance}
          disabled={syncStatus === 'syncing'}
          style={styles.refreshButton}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={syncStatus === 'syncing' ? theme.colors.textSecondary : theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Statut de connexion */}
      <View style={styles.connectionStatus}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: getConnectionStatusColor() }
        ]} />
        <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
          {getConnectionStatusText()}
        </Text>
      </View>

      {/* Solde réel */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>Solde réel</Text>
        <Text style={styles.realBalanceAmount}>
          {displayBalance ? displayBalance.toFixed(2) : '0.00'}€
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Solde prévisionnel */}
      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>
          Après prélèvements ({balanceProjection?.upcomingDebitsCount || 0})
        </Text>
        <Text style={styles.projectedAmount}>
          {displayProjected ? displayProjected.toFixed(2) : '0.00'}€
        </Text>
      </View>

      {/* Différence */}
      <View style={styles.differenceContainer}>
        <Ionicons
          name={projectedDifference >= 0 ? "trending-up" : "trending-down"}
          size={16}
          color={isProjectedNegative ? theme.colors.error : theme.colors.success}
        />
        <Text style={styles.differenceText}>
          {projectedDifference >= 0 ? '+' : ''}
          {projectedDifference ? projectedDifference.toFixed(2) : '0.00'}€ après prélèvements
        </Text>
      </View>

      {/* Alertes prélèvements urgents */}
      {urgentDebits && urgentDebits.length > 0 && (
        <View style={styles.urgentSection}>
          <View style={styles.urgentHeader}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.warning} />
            <Text style={styles.urgentTitle}>
              {urgentDebits.length} prélèvement{urgentDebits.length > 1 ? 's' : ''} urgent{urgentDebits.length > 1 ? 's' : ''}
            </Text>
          </View>
          
          {urgentDebits.slice(0, 2).map((debit, index) => (
            <View key={debit.id} style={styles.urgentItem}>
              <Text style={styles.urgentDebitName}>
                {debit.title || debit.description}
              </Text>
              <Text style={styles.urgentDebitAmount}>
                -{debit.amount ? debit.amount.toFixed(2) : '0.00'}€
              </Text>
            </View>
          ))}
          
          {urgentDebits.length > 2 && (
            <Text style={[styles.urgentDebitName, { fontStyle: 'italic', textAlign: 'center' }]}>
              +{urgentDebits.length - 2} autre{urgentDebits.length - 2 > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {/* Erreur de connexion bancaire */}
      {bankConnectionError && (
        <View style={[styles.urgentSection, { backgroundColor: `${theme.colors.error}15` }]}>
          <View style={styles.urgentHeader}>
            <Ionicons name="warning" size={16} color={theme.colors.error} />
            <Text style={[styles.urgentTitle, { color: theme.colors.error }]}>
              Erreur bancaire
            </Text>
          </View>
          <Text style={[styles.urgentDebitName, { color: theme.colors.error }]}>
            {bankConnectionError}
          </Text>
        </View>
      )}
    </View>
  );
};

export default BalanceCard;