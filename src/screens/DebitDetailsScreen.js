import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { catalogService } from '../services/catalogService';

const DebitDetailsScreen = ({ route, navigation }) => {
  const { debit } = route.params;
  const { theme } = useTheme();
  const { updateDebit, deleteDebit, markAsPaid, togglePause } = useDebits();
  
  const [loading, setLoading] = useState(false);

  // ✅ CORRECTION: Sécurisation des données
  const safeDebit = {
    id: debit?.id || 'unknown',
    companyName: debit?.companyName || debit?.company_name || 'Entreprise inconnue',
    amount: typeof debit?.amount === 'number' ? debit.amount : 0,
    category: debit?.category || 'Autre',
    nextPaymentDate: debit?.nextPaymentDate || debit?.next_payment_date || new Date().toISOString(),
    frequency: debit?.frequency || 'monthly',
    description: debit?.description || '',
    status: debit?.status || 'active',
    is_paused: Boolean(debit?.is_paused)
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  };

  const getFrequencyLabel = (frequency) => {
    const frequencies = {
      once: 'Ponctuel',
      weekly: 'Hebdomadaire',
      biweekly: 'Bi-hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      biannual: 'Semestriel',
      annual: 'Annuel'
    };
    return frequencies[frequency] || frequency;
  };

  const getStatusColor = (status, isPaused) => {
    if (isPaused) return theme.colors.warning;
    switch (status) {
      case 'active': return theme.colors.success;
      case 'paused': return theme.colors.warning;
      case 'completed': return theme.colors.textSecondary;
      default: return theme.colors.text;
    }
  };

  const getStatusLabel = (status, isPaused) => {
    if (isPaused) return 'En pause';
    const statuses = {
      active: 'Actif',
      paused: 'En pause',
      completed: 'Terminé'
    };
    return statuses[status] || status;
  };

  const handleMarkAsPaid = async () => {
    if (safeDebit.is_paused) {
      Alert.alert(
        'Prélèvement en pause',
        'Impossible de marquer comme payé un prélèvement en pause. Veuillez d\'abord le réactiver.'
      );
      return;
    }

    Alert.alert(
      'Marquer comme payé',
      'Voulez-vous marquer ce prélèvement comme payé et programmer le suivant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('🔍 DETAILS - Tentative markAsPaid pour:', safeDebit.id);
              
              const result = await markAsPaid(safeDebit.id);
              console.log('🔍 DETAILS - Résultat markAsPaid:', result);
              
              if (result.success) {
                Alert.alert(
                  'Succès', 
                  'Prélèvement marqué comme payé et prochaine date calculée',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors du marquage');
              }
            } catch (error) {
              console.error(' DETAILS - Erreur markAsPaid:', error);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleTogglePause = async () => {
    const newState = !safeDebit.is_paused;
    const action = newState ? 'mettre en pause' : 'réactiver';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} le prélèvement`,
      `Voulez-vous ${action} ce prélèvement ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            try {
              console.log(' DETAILS - Tentative togglePause pour:', safeDebit.id, 'État actuel:', safeDebit.is_paused);
              
              const result = await togglePause(safeDebit.id);
              console.log(' DETAILS - Résultat togglePause:', result);
              
              if (result.success) {
                const actionText = result.isPaused ? 'mis en pause' : 'réactivé';
                Alert.alert(
                  'Succès', 
                  `Prélèvement ${actionText}`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Erreur', result.error || 'Erreur lors de la modification');
              }
            } catch (error) {
              console.error('🔍 DETAILS - Erreur togglePause:', error);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le prélèvement',
      'Êtes-vous sûr de vouloir supprimer définitivement ce prélèvement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('🔍 DETAILS - Suppression pour:', safeDebit.id);
              
              const result = await deleteDebit(safeDebit.id);
              console.log('🔍 DETAILS - Résultat suppression:', result);
              
              if (result.success) {
                Alert.alert('Succès', 'Prélèvement supprimé', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              console.error('🔍 DETAILS - Erreur suppression:', error);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      padding: 24,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      opacity: safeDebit.is_paused ? 0.8 : 1,
    },
    categoryIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${catalogService.getCategoryColor(safeDebit.category)}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      opacity: safeDebit.is_paused ? 0.6 : 1,
    },
    companyName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: safeDebit.is_paused ? theme.colors.textSecondary : theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    amount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: safeDebit.is_paused ? theme.colors.textSecondary : theme.colors.primary,
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: `${getStatusColor(safeDebit.status, safeDebit.is_paused)}20`,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: getStatusColor(safeDebit.status, safeDebit.is_paused),
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastDetailRow: {
      borderBottomWidth: 0,
    },
    detailIcon: {
      width: 32,
      marginRight: 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    actionsSection: {
      margin: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    primaryAction: {
      backgroundColor: theme.colors.primary,
    },
    secondaryAction: {
      backgroundColor: theme.colors.warning,
    },
    resumeAction: {
      backgroundColor: theme.colors.success,
    },
    dangerAction: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    primaryActionText: {
      color: '#FFFFFF',
    },
    secondaryActionText: {
      color: '#FFFFFF',
    },
    dangerActionText: {
      color: '#FFFFFF',
    },
    disabledButton: {
      backgroundColor: theme.colors.textSecondary,
      opacity: 0.5,
    },
    warningContainer: {
      backgroundColor: `${theme.colors.warning}20`,
      padding: 12,
      margin: 16,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.warning,
    },
    warningText: {
      color: theme.colors.warning,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header avec informations principales */}
      <View style={styles.header}>
        <View style={styles.categoryIcon}>
          <Ionicons
            name={catalogService.getCategoryIcon(safeDebit.category)}
            size={40}
            color={catalogService.getCategoryColor(safeDebit.category)}
          />
        </View>
        <Text style={styles.companyName}>{safeDebit.companyName}</Text>
        <Text style={styles.amount}>{safeDebit.amount.toFixed(2)}€</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {getStatusLabel(safeDebit.status, safeDebit.is_paused)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Alerte si en pause */}
        {safeDebit.is_paused && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
               Ce prélèvement est en pause. Il n'apparaîtra pas dans les calculs de solde.
            </Text>
          </View>
        )}

        {/* Détails du prélèvement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Détails</Text>
          
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar"
              size={20}
              color={theme.colors.primary}
              style={styles.detailIcon}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prochaine date</Text>
              <Text style={styles.detailValue}>
                {safeDebit.is_paused ? 'En pause' : formatDate(safeDebit.nextPaymentDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="repeat"
              size={20}
              color={theme.colors.primary}
              style={styles.detailIcon}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fréquence</Text>
              <Text style={styles.detailValue}>
                {getFrequencyLabel(safeDebit.frequency)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons
              name="pricetag"
              size={20}
              color={theme.colors.primary}
              style={styles.detailIcon}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Catégorie</Text>
              <Text style={styles.detailValue}>{safeDebit.category}</Text>
            </View>
          </View>

          {safeDebit.description && safeDebit.description.length > 0 && (
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <Ionicons
                name="document-text"
                size={20}
                color={theme.colors.primary}
                style={styles.detailIcon}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{safeDebit.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {/* Bouton Marquer comme payé */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryAction,
              (safeDebit.is_paused || loading) && styles.disabledButton
            ]}
            onPress={handleMarkAsPaid}
            disabled={safeDebit.is_paused || loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>
              {loading ? 'Traitement...' : 'Marquer comme payé'}
            </Text>
          </TouchableOpacity>

          {/* Bouton Pause/Reprendre */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              safeDebit.is_paused ? styles.resumeAction : styles.secondaryAction,
              loading && styles.disabledButton
            ]}
            onPress={handleTogglePause}
            disabled={loading}
          >
            <Ionicons 
              name={safeDebit.is_paused ? "play-circle" : "pause-circle"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>
              {loading ? 'Traitement...' : (safeDebit.is_paused ? 'Réactiver' : 'Mettre en pause')}
            </Text>
          </TouchableOpacity>

          {/* Bouton Supprimer */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.dangerAction,
              loading && styles.disabledButton
            ]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.dangerActionText]}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DebitDetailsScreen;