import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { catalogService } from '../services/catalogService';

const CatalogScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, selectedCategory, companies]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesList, categoriesList] = await Promise.all([
        catalogService.getAllCompanies(),
        catalogService.getCategories(),
      ]);
      
      setCompanies(companiesList);
      setCategories(['all', ...categoriesList]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger le catalogue');
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(company => company.category === selectedCategory);
    }

    // Filtrer par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(term) ||
        company.category.toLowerCase().includes(term)
      );
    }

    // Trier par popularité puis par nom
    filtered.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredCompanies(filtered);
  };

  const selectCompany = (company) => {
    navigation.navigate('AddDebit', { selectedCompany: company });
  };

  const addCustomCompany = () => {
    Alert.prompt(
      'Ajouter une entreprise',
      'Nom de l\'entreprise',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ajouter',
          onPress: (companyName) => {
            if (companyName && companyName.trim()) {
              const customCompany = {
                name: companyName.trim(),
                category: 'Autre',
                isPopular: false,
              };
              selectCompany(customCompany);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getCategoryDisplayName = (category) => {
    if (category === 'all') return 'Toutes';
    return category;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    categoryScrollContainer: {
      paddingVertical: 8,
    },
    categoryContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    categoryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 8,
    },
    categoryButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryButtonText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    categoryButtonTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    companiesList: {
      padding: 16,
    },
    companyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 1,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    companyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    companyCategory: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    popularBadge: {
      backgroundColor: theme.colors.warning,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    popularBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    addCustomButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addCustomButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.loadingText}>Chargement du catalogue...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec recherche */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Rechercher une entreprise..."
            placeholderTextColor={theme.colors.textSecondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres par catégorie */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollContainer}
        >
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {getCategoryDisplayName(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Liste des entreprises */}
      <ScrollView style={styles.content} contentContainerStyle={styles.companiesList}>
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <TouchableOpacity
              key={`${company.id}-${company.name}`}
              style={styles.companyItem}
              onPress={() => selectCompany(company)}
            >
              <View style={styles.companyIcon}>
                <Ionicons
                  name={catalogService.getCategoryIcon(company.category)}
                  size={24}
                  color={catalogService.getCategoryColor(company.category)}
                />
              </View>
              <View style={styles.companyInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.companyName}>{company.name}</Text>
                  {company.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.companyCategory}>{company.category}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="business-outline"
              size={48}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {searchTerm.trim()
                ? `Aucune entreprise trouvée pour "${searchTerm}"`
                : 'Aucune entreprise dans cette catégorie'
              }
            </Text>
            <TouchableOpacity style={styles.addCustomButton} onPress={addCustomCompany}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addCustomButtonText}>
                Ajouter manuellement
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bouton d'ajout manuel en bas */}
        {filteredCompanies.length > 0 && (
          <TouchableOpacity style={styles.addCustomButton} onPress={addCustomCompany}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addCustomButtonText}>
              Ajouter une entreprise manuelle
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

export default CatalogScreen;