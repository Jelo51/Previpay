import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // États pour la date picker améliorée
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

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
      const uniqueCategories = ['Autre', ...new Set(categoriesList.filter(cat => cat !== 'Autre'))];
      setCategories(uniqueCategories);
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

  // Fonction pour formater la date pour le stockage (évite les problèmes de fuseau horaire)
  const formatDateForStorage = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonctions de gestion de date améliorées
  const handleDateModalOpen = () => {
    const currentDate = formData.nextPaymentDate;
    setTempDay(currentDate.getDate());
    setTempMonth(currentDate.getMonth() + 1);
    setTempYear(currentDate.getFullYear());
    setShowDateModal(true);
  };

  const handleDateModalConfirm = () => {
    // Créer une nouvelle date avec validation ET correction de fuseau horaire
    const newDate = new Date(tempYear, tempMonth - 1, tempDay, 12, 0, 0); // Midi pour éviter les problèmes de fuseau
    
    // Vérifier si la date est valide (pas de débordement automatique)
    if (newDate.getDate() === tempDay && 
        newDate.getMonth() === tempMonth - 1 && 
        newDate.getFullYear() === tempYear) {
      handleInputChange('nextPaymentDate', newDate);
      setShowDateModal(false);
    } else {
      Alert.alert('Erreur', 'Date invalide. Veuillez vérifier le jour, mois et année.');
    }
  };

  // Fonction pour obtenir le nombre de jours dans un mois
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Fonction pour ajuster le jour si nécessaire quand le mois change
  const adjustDayForMonth = (day, month, year) => {
    const maxDays = getDaysInMonth(month, year);
    return Math.min(day, maxDays);
  };

  // Fonctions pour les boutons rapides
  const setDateToToday = () => {
    const today = new Date();
    setTempDay(today.getDate());
    setTempMonth(today.getMonth() + 1);
    setTempYear(today.getFullYear());
  };

  const addDaysToDate = (days) => {
    const currentDate = new Date(tempYear, tempMonth - 1, tempDay, 12, 0, 0); // Midi
    currentDate.setDate(currentDate.getDate() + days);
    setTempDay(currentDate.getDate());
    setTempMonth(currentDate.getMonth() + 1);
    setTempYear(currentDate.getFullYear());
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
      nextPaymentDate: formatDateForStorage(formData.nextPaymentDate),
    };
    
    console.log('🔍 Données envoyées:', debitData); // DEBUG
    
    const result = await addDebit(debitData);
    
    console.log('🔍 Résultat ajout:', result); // DEBUG
    
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
    console.log('🔍 Erreur:', error); // DEBUG
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
      width: '90%',
      maxHeight: '80%',
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
    quickButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginHorizontal: 4,
      marginVertical: 4,
    },
    quickButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
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
              onPress={handleDateModalOpen}
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

      {/* Modal de sélection de date - Version corrigée */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDateModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                <Text style={styles.modalTitle}>Choisir une date</Text>
                
                {/* Sélecteurs de date séparés */}
                <View style={{ marginVertical: 20 }}>
                  <Text style={[styles.label, { textAlign: 'center', marginBottom: 15 }]}>
                    Sélectionnez la date
                  </Text>
                  
                  {/* Rangée des sélecteurs */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 15
                  }}>
                    {/* Jour */}
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={[styles.label, { textAlign: 'center' }]}>Jour</Text>
                      <TouchableOpacity 
                        style={[styles.input, { justifyContent: 'center', alignItems: 'center', height: 50 }]}
                        onPress={() => Alert.prompt(
                          'Jour',
                          `Entrez le jour (1-${getDaysInMonth(tempMonth, tempYear)})`,
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'OK',
                              onPress: (text) => {
                                const day = parseInt(text) || tempDay;
                                const maxDays = getDaysInMonth(tempMonth, tempYear);
                                if (day >= 1 && day <= maxDays) {
                                  setTempDay(day);
                                }
                              }
                            }
                          ],
                          'plain-text',
                          tempDay.toString()
                        )}
                      >
                        <Text style={{ fontSize: 18, color: theme.colors.text }}>
                          {tempDay}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Mois */}
                    <View style={{ flex: 1, marginHorizontal: 5 }}>
                      <Text style={[styles.label, { textAlign: 'center' }]}>Mois</Text>
                      <TouchableOpacity 
                        style={[styles.input, { justifyContent: 'center', alignItems: 'center', height: 50 }]}
                        onPress={() => Alert.prompt(
                          'Mois',
                          'Entrez le mois (1-12)',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'OK',
                              onPress: (text) => {
                                const month = parseInt(text) || tempMonth;
                                if (month >= 1 && month <= 12) {
                                  setTempMonth(month);
                                  // Ajuster le jour si nécessaire
                                  const adjustedDay = adjustDayForMonth(tempDay, month, tempYear);
                                  if (adjustedDay !== tempDay) {
                                    setTempDay(adjustedDay);
                                  }
                                }
                              }
                            }
                          ],
                          'plain-text',
                          tempMonth.toString()
                        )}
                      >
                        <Text style={{ fontSize: 18, color: theme.colors.text }}>
                          {tempMonth}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Année */}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.label, { textAlign: 'center' }]}>Année</Text>
                      <TouchableOpacity 
                        style={[styles.input, { justifyContent: 'center', alignItems: 'center', height: 50 }]}
                        onPress={() => Alert.prompt(
                          'Année',
                          'Entrez l\'année (2020-2030)',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'OK',
                              onPress: (text) => {
                                const year = parseInt(text) || tempYear;
                                if (year >= 2020 && year <= 2030) {
                                  setTempYear(year);
                                  // Ajuster le jour si nécessaire (année bissextile)
                                  const adjustedDay = adjustDayForMonth(tempDay, tempMonth, year);
                                  if (adjustedDay !== tempDay) {
                                    setTempDay(adjustedDay);
                                  }
                                }
                              }
                            }
                          ],
                          'plain-text',
                          tempYear.toString()
                        )}
                      >
                        <Text style={{ fontSize: 18, color: theme.colors.text }}>
                          {tempYear}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Boutons +/- pour ajustement rapide */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 15
                  }}>
                    {/* Boutons Jour */}
                    <View style={{ flex: 1, marginRight: 10, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.error, marginRight: 5 }]}
                          onPress={() => {
                            const newDay = Math.max(1, tempDay - 1);
                            setTempDay(newDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.success, marginLeft: 5 }]}
                          onPress={() => {
                            const maxDays = getDaysInMonth(tempMonth, tempYear);
                            const newDay = Math.min(maxDays, tempDay + 1);
                            setTempDay(newDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Boutons Mois */}
                    <View style={{ flex: 1, marginHorizontal: 5, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.error, marginRight: 5 }]}
                          onPress={() => {
                            const newMonth = tempMonth === 1 ? 12 : tempMonth - 1;
                            const newYear = tempMonth === 1 ? tempYear - 1 : tempYear;
                            setTempMonth(newMonth);
                            setTempYear(newYear);
                            const adjustedDay = adjustDayForMonth(tempDay, newMonth, newYear);
                            setTempDay(adjustedDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.success, marginLeft: 5 }]}
                          onPress={() => {
                            const newMonth = tempMonth === 12 ? 1 : tempMonth + 1;
                            const newYear = tempMonth === 12 ? tempYear + 1 : tempYear;
                            setTempMonth(newMonth);
                            setTempYear(newYear);
                            const adjustedDay = adjustDayForMonth(tempDay, newMonth, newYear);
                            setTempDay(adjustedDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Boutons Année */}
                    <View style={{ flex: 1, marginLeft: 10, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.error, marginRight: 5 }]}
                          onPress={() => {
                            const newYear = Math.max(2020, tempYear - 1);
                            setTempYear(newYear);
                            const adjustedDay = adjustDayForMonth(tempDay, tempMonth, newYear);
                            setTempDay(adjustedDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.quickButton, { backgroundColor: theme.colors.success, marginLeft: 5 }]}
                          onPress={() => {
                            const newYear = Math.min(2030, tempYear + 1);
                            setTempYear(newYear);
                            const adjustedDay = adjustDayForMonth(tempDay, tempMonth, newYear);
                            setTempDay(adjustedDay);
                          }}
                        >
                          <Text style={styles.quickButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Affichage de la date formatée */}
                <View style={{
                  backgroundColor: theme.colors.primary + '20',
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 20
                }}>
                  <Text style={{ 
                    textAlign: 'center', 
                    color: theme.colors.primary,
                    fontSize: 18,
                    fontWeight: 'bold'
                  }}>
                    {new Date(tempYear, tempMonth - 1, tempDay).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                
                {/* Bouton rapide */}
                <View style={{
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <TouchableOpacity
                    style={[styles.quickButton, { backgroundColor: theme.colors.warning }]}
                    onPress={setDateToToday}
                  >
                    <Text style={styles.quickButtonText}>Aujourd'hui</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Boutons de validation */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowDateModal(false)}
                  >
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleDateModalConfirm}
                  >
                    <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                      Confirmer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
              {[...new Set(categories)].map((category) => (
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