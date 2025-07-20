import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useDebits } from '../context/DebitContext';
import { useNotifications } from '../context/NotificationContext';
import { catalogService } from '../services/catalogService';

const AddDebitScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addDebit } = useDebits();
  const { scheduleDebitNotification } = useNotifications();
  
  // État du formulaire
  const [formData, setFormData] = useState({
    companyName: '',
    amount: '',
    category: 'Autre',
    frequency: 'monthly',
    nextPaymentDate: new Date(),
    description: '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Si une entreprise est sélectionnée depuis le catalogue
  useEffect(() => {
    if (route.params?.selectedCompany) {
      const company = route.params.selectedCompany;
      setFormData(prev => ({
        ...prev,
        companyName: company.name,
        category: company.category || 'Autre',
      }));
    }
  }, [route.params]);

  // Charger les catégories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesList = await catalogService.getCategories();
      setCategories(['Autre', ...categoriesList]);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const frequencies = [
    { value: 'once', label: t('debits.frequencies.once') },
    { value: 'weekly', label: t('debits.frequencies.weekly') },
    { value: 'biweekly', label: t('debits.frequencies.biweekly') },
    { value: 'monthly', label: t('debits.frequencies.monthly') },
    { value: 'quarterly', label: t('debits.frequencies.quarterly') },
    { value: 'biannual', label: t('debits.frequencies.biannual') },
    { value: 'annual', label: t('debits.frequencies.annual') },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('nextPaymentDate', selectedDate);
    }
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'entreprise est requis');
      return false;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Le montant doit être un nombre positif');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const debitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        nextPaymentDate: formData.nextPaymentDate.toISOString().split('T')[0],
      };
      
      const result = await addDebit(debitData);
      
      if (result.success) {
        // Programmer la notification
        await scheduleDebitNotification(result.debit);
        
        Alert.alert(
          'Succès',
          'Prélèvement ajouté avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const openCatalog = () => {
    navigation.navigate('Catalog');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    pickerButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
    },
    pickerButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    catalogButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    catalogButtonText: {
      color: theme.colors.primary,
      fontWeight: '500',
      marginLeft: 8,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      margin: 16,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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
    optionButton: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      fontSize: 16,
      color: theme.colors.text,
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
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de base</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('debits.companyName')} *</Text>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={(value) => handleInputChange('companyName', value)}
              placeholder="Netflix, Orange, EDF..."
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity style={styles.catalogButton} onPress={openCatalog}>
              <Ionicons name="business-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.catalogButtonText}>
                Choisir depuis le catalogue
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.amount')} (€) *</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(value) => handleInputChange('amount', value)}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.category')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {t(`categories.${formData.category}`) || formData.category}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Récurrence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récurrence</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('debits.frequency')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowFrequencyPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {frequencies.find(f => f.value === formData.frequency)?.label}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('debits.nextPaymentDate')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {formData.nextPaymentDate.toLocaleDateString('fr-FR')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description optionnelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails optionnels</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('common.description')}</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Notes sur ce prélèvement..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bouton de soumission */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          loading && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Ajout en cours...' : t('debits.addDebit')}
        </Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.nextPaymentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Modal Catégorie */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une catégorie</Text>
            <ScrollView>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.optionButton}
                  onPress={() => {
                    handleInputChange('category', category);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>
                    {t(`categories.${category}`) || category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCategoryPicker(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Fréquence */}
      <Modal
        visible={showFrequencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFrequencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir la fréquence</Text>
            <ScrollView>
              {frequencies.map((frequency) => (
                <TouchableOpacity
                  key={frequency.value}
                  style={styles.optionButton}
                  onPress={() => {
                    handleInputChange('frequency', frequency.value);
                    setShowFrequencyPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{frequency.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFrequencyPicker(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddDebitScreen;