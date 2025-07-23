import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useDebits } from '../context/DebitContext';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme, themePreference, setThemePreference } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { 
    notificationSettings, 
    updateNotificationSettings, 
    sendTestNotification 
  } = useNotifications();
  const { updateBalance } = useDebits();
  
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [tempBalance, setTempBalance] = useState('');

  const themes = [
    { value: 'light', label: 'Clair', icon: 'sunny' },
    { value: 'dark', label: 'Sombre', icon: 'moon' },
    { value: 'system', label: 'Système', icon: 'phone-portrait' },
  ];

  const handleThemeChange = (themeValue) => {
    setThemePreference(themeValue);
    setShowThemeModal(false);
  };

  const handleNotificationToggle = async (setting, value) => {
    const result = await updateNotificationSettings({ [setting]: value });
    if (!result.success) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const handleBalanceUpdate = async () => {
    const newBalance = parseFloat(tempBalance);
    if (isNaN(newBalance)) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    const result = await updateBalance(newBalance);
    if (result.success) {
      setShowBalanceModal(false);
      setTempBalance('');
      Alert.alert('Succès', 'Solde mis à jour');
    } else {
      Alert.alert('Erreur', result.error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      width: 32,
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    settingValue: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    profileSection: {
      alignItems: 'center',
      padding: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    optionItemSelected: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
      borderRadius: 8,
      marginHorizontal: 4,
    },
    cancelButton: {
      backgroundColor: theme.colors.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    modalButtonText: {
      fontWeight: '600',
    },
    cancelButtonText: {
      color: theme.colors.text,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      marginBottom: 16,
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
  });

  return (
    <ScrollView style={styles.container}>
      {/* Profil utilisateur */}
      <View style={[styles.section, { marginTop: 0 }]}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Solde */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💰 Solde</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingItem, styles.lastSettingItem]}
          onPress={() => {
            setTempBalance('');
            setShowBalanceModal(true);
          }}
        >
          <Ionicons
            name="wallet"
            size={24}
            color={theme.colors.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Mettre à jour le solde</Text>
            <Text style={styles.settingSubtitle}>
              Modifier votre solde bancaire actuel
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        </View>
        
        <View style={styles.settingItem}>
          <Ionicons
            name="notifications"
            size={24}
            color={theme.colors.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications activées</Text>
            <Text style={styles.settingSubtitle}>
              Recevoir des alertes pour les prélèvements
            </Text>
          </View>
          <Switch
            value={notificationSettings?.enabled}
            onValueChange={(value) => handleNotificationToggle('enabled', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <Ionicons
            name="time"
            size={24}
            color={theme.colors.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Rappel quotidien</Text>
            <Text style={styles.settingSubtitle}>
              Notification quotidienne à 9h
            </Text>
          </View>
          <Switch
            value={notificationSettings?.dailyReminder}
            onValueChange={(value) => handleNotificationToggle('dailyReminder', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingItem}>
          <Ionicons
            name="warning"
            size={24}
            color={theme.colors.warning}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Alerte solde faible</Text>
            <Text style={styles.settingSubtitle}>
              Avertir quand le solde devient critique
            </Text>
          </View>
          <Switch
            value={notificationSettings?.lowBalanceAlert}
            onValueChange={(value) => handleNotificationToggle('lowBalanceAlert', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <TouchableOpacity
          style={[styles.settingItem, styles.lastSettingItem]}
          onPress={sendTestNotification}
        >
          <Ionicons
            name="send"
            size={24}
            color={theme.colors.success}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Test de notification</Text>
            <Text style={styles.settingSubtitle}>
              Envoyer une notification de test
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Apparence */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎨 Apparence</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.settingItem, styles.lastSettingItem]}
          onPress={() => setShowThemeModal(true)}
        >
          <Ionicons
            name={theme.isDark ? 'moon' : 'sunny'}
            size={24}
            color={theme.colors.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Thème</Text>
            <Text style={styles.settingValue}>
              {themes.find(t => t.value === themePreference)?.label}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Compte */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👤 Compte</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.settingItem, styles.lastSettingItem]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out"
            size={24}
            color={theme.colors.error}
            style={styles.settingIcon}
          />
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.error }]}>
              Déconnexion
            </Text>
            <Text style={styles.settingSubtitle}>
              Se déconnecter de l'application
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal thème */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir le thème</Text>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.value}
                style={[
                  styles.optionItem,
                  themePreference === themeOption.value && styles.optionItemSelected,
                ]}
                onPress={() => handleThemeChange(themeOption.value)}
              >
                <Ionicons
                  name={themeOption.icon}
                  size={20}
                  color={theme.colors.primary}
                  style={styles.optionIcon}
                />
                <Text style={styles.optionText}>{themeOption.label}</Text>
                {themePreference === themeOption.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal solde */}
      <Modal
        visible={showBalanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour le solde</Text>
            <TextInput
              style={styles.input}
              value={tempBalance}
              onChangeText={setTempBalance}
              placeholder="Nouveau solde (€)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBalanceModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleBalanceUpdate}
              >
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                  Sauvegarder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default SettingsScreen;