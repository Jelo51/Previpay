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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { catalogService } from '../services/catalogService';

const DebitDetailsScreen = ({ route, navigation }) => {
  const { debit } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { updateDebit, deleteDebit } = useDebits();
  
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'paused': return theme.colors.warning;
      case 'completed': return theme.colors.textSecondary;
      default: return theme.colors.text;
    }
  };

  const getStatusLabel = (status) => {
    const statuses = {
      active: 'Actif',
      paused: 'En pause',
      completed: 'Terminé'
    };
    return statuses[status] || status;
  };

  const handleMarkAsPaid = async () => {
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
              // Calculer la prochaine date selon la fréquence
              const currentDate = new Date(debit.nextPaymentDate);
              let nextDate = new Date(currentDate);
              
              switch (debit.frequency) {
                case 'monthly':
                  nextDate.setMonth(nextDate.getMonth() + 1);
                  break;
                case 'quarterly':
                  nextDate.setMonth(nextDate.getMonth() + 3);
                  break;
                case 'biannual':
                  nextDate.setMonth(nextDate.getMonth() + 6);
                  break;
                case 'annual':
                  nextDate.setFullYear(nextDate.getFullYear() + 1);
                  break;
                case 'weekly':
                  nextDate.setDate(nextDate.getDate() + 7);
                  break;
                case 'biweekly':
                  nextDate.setDate(nextDate.getDate() + 14);
                  break;
                default:
                  // Pour 'once', on marque comme terminé
                  nextDate = null;
                  break;
              }

              const updates = nextDate 
                ? { 
                    nextPaymentDate: nextDate.toISOString().split('T')[0],
                    status: 'active'
                  }
                : { status: 'completed' };

              const result = await updateDebit(debit.id, updates);
              
              if (result.success) {
                Alert.alert('Succès', 'Prélèvement marqué comme payé', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
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
    const newStatus = debit.status === 'paused' ? 'active' : 'paused';
    const action = newStatus === 'paused' ? 'mettre en pause' : 'réactiver';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} le prélèvement`,
      `Voulez-vous ${action} ce prélèvement ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setLoading(true);
            const result = await updateDebit(debit.id, { status: newStatus });
            setLoading(false);
            
            if (result.success) {
              Alert.alert('Succès', `Prélèvement ${newStatus === 'paused' ? 'mis en pause' : 'réactivé'}`, [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Erreur', result.error);
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
            const result = await deleteDebit(debit.id);
            setLoading(false);
            
            if (result.success) {
              Alert.alert('Succès', 'Prélèvement supprimé', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Erreur', result.error);
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
    },
    categoryIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${catalogService.getCategoryColor(debit.category)}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    companyName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    amount: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: `${getStatusColor(debit.status)}20`,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: getStatusColor(debit.status),
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
    },
  });

  return (
    <View style={styles.container}>
      {/* Header avec informations principales */}
      <View style={styles.header}>
        <View style={styles.categoryIcon}>
          <Ionicons
            name={catalogService.getCategoryIcon(debit.category)}
            size={40}
            color={catalogService.getCategoryColor(debit.category)}
          />
        </View>
        <Text style={styles.companyName}>{debit.companyName}</Text>
        <Text style={styles.amount}>{debit.amount.toFixed(2)}€</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {getStatusLabel(debit.status)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
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
                {formatDate(debit.nextPaymentDate)}
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
                {getFrequencyLabel(debit.frequency)}
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
              <Text style={styles.detailValue}>{debit.category}</Text>
            </View>
          </View>

          {debit.description && (
            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <Ionicons
                name="document-text"
                size={20}
                color={theme.colors.primary}
                style={styles.detailIcon}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{debit.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {debit.status === 'active' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryAction,
                loading && styles.disabledButton
              ]}
              onPress={handleMarkAsPaid}
              disabled={loading}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                Marquer comme payé
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryAction,
              loading && styles.disabledButton
            ]}
            onPress={handleTogglePause}
            disabled={loading}
          >
            <Ionicons 
              name={debit.status === 'paused' ? 'play' : 'pause'} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              {debit.status === 'paused' ? 'Réactiver' : 'Mettre en pause'}
            </Text>
          </TouchableOpacity>

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