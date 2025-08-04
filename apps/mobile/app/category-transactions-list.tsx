import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { plaidService } from './services/plaidService';
import { useBankStatus } from './contexts/bankStatusContext';
import { PageBlocker } from './components/protected/PageBlocker';
import { router } from 'expo-router';

interface Transaction {
  id: string;
  amount: number;
  merchant: string;  // Changed from merchant_name to merchant
  date: string;
  type: 'income' | 'expense';
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

interface CategorySection {
  title: string;
  total: number;
  color: string;
  data: Transaction[];
}

interface CategoryOverview {
  id: string;
  name: string;
  total: number;
  color: string;
  transactionCount: number;
}

interface CategoryFilter {
  id: string;
  name: string;
  color: string;
}

interface YearOption {
  year: number;
  transactionCount: number;
}

export default function CategoryTransactionsListScreen() {
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [categoryOverview, setCategoryOverview] = useState<CategoryOverview[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryFilter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null);
  const [availableYears, setAvailableYears] = useState<YearOption[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'overview' | 'category'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { hasConnectedBanks, loading: bankLoading } = useBankStatus();

  const filterTransactionsByYear = (transactions: Transaction[], year: number): Transaction[] => {
    return transactions.filter(transaction => {
      const transactionYear = new Date(transaction.date).getFullYear();
      return transactionYear === year;
    });
  };

  const getAvailableYears = (transactions: Transaction[]): YearOption[] => {
    const yearCounts: Record<number, number> = {};
    
    transactions.forEach(transaction => {
      const year = new Date(transaction.date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    return Object.entries(yearCounts)
      .map(([year, count]) => ({
        year: parseInt(year),
        transactionCount: count,
      }))
      .sort((a, b) => b.year - a.year); // Most recent year first
  };

  const groupTransactionsByCategory = (transactions: Transaction[]): CategorySection[] => {
    // Filter by selected year first
    const yearFilteredTransactions = filterTransactionsByYear(transactions, selectedYear);
    
    // Group transactions by category
    const categoryGroups: Record<string, { transactions: Transaction[]; total: number; color: string }> = {};

    yearFilteredTransactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryColor = transaction.category?.color || '#9E9E9E';
      
      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = {
          transactions: [],
          total: 0,
          color: categoryColor,
        };
      }
      
      categoryGroups[categoryName].transactions.push(transaction);
      categoryGroups[categoryName].total += parseFloat(transaction.amount.toString());
    });

    // Convert to sections and sort by total amount (highest to lowest)
    const sections = Object.entries(categoryGroups)
      .map(([categoryName, group]) => ({
        title: categoryName,
        total: group.total,
        color: group.color,
        data: group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .sort((a, b) => b.total - a.total);

    return sections;
  };

  const createCategoryOverview = (transactions: Transaction[], categories: CategoryFilter[]): CategoryOverview[] => {
    // Filter by selected year first
    const yearFilteredTransactions = filterTransactionsByYear(transactions, selectedYear);
    
    // Group by category and calculate totals
    const categoryTotals: Record<string, { total: number; count: number; color: string }> = {};

    yearFilteredTransactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const categoryColor = transaction.category?.color || '#9E9E9E';
      
      if (!categoryTotals[categoryName]) {
        categoryTotals[categoryName] = {
          total: 0,
          count: 0,
          color: categoryColor,
        };
      }
      
      categoryTotals[categoryName].total += parseFloat(transaction.amount.toString());
      categoryTotals[categoryName].count += 1;
    });

    // Convert to overview format and sort by total (highest to lowest)
    const overview = Object.entries(categoryTotals)
      .map(([categoryName, data]) => {
        const category = categories.find(c => c.name === categoryName);
        return {
          id: category?.id || categoryName,
          name: categoryName,
          total: data.total,
          color: data.color,
          transactionCount: data.count,
        };
      })
      .sort((a, b) => b.total - a.total);

    return overview;
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const [transactionsResponse, categoriesResponse] = await Promise.all([
        plaidService.getCategorizedTransactions(),
        plaidService.getUserCategories(),
      ]);
      
      console.log('Category transactions response:', transactionsResponse.transactions?.slice(0, 3));
      
      const transactions = transactionsResponse.transactions || [];
      const categories = categoriesResponse.categories || [];
      
      // Set categories for filter
      setAllCategories(categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || '#9E9E9E',
      })));
      
      // Get available years and set default year if needed
      const years = getAvailableYears(transactions);
      setAvailableYears(years);
      
      // Set default year to most recent year with data if current selection has no data
      if (years.length > 0) {
        const hasDataForSelectedYear = years.some(y => y.year === selectedYear);
        if (!hasDataForSelectedYear) {
          setSelectedYear(years[0].year); // Set to most recent year
          return; // Return early, useEffect will trigger reload
        }
      }
      
      // Create overview
      const overview = createCategoryOverview(transactions, categories);
      setCategoryOverview(overview);
      
      // Group transactions by category for detailed view
      const groupedSections = groupTransactionsByCategory(transactions);
      setCategorySections(groupedSections);
      
    } catch (error) {
      console.error('Error loading categorized transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTransactions();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCategorySelect = (category: CategoryFilter | null) => {
    // If clicking the same category, go back to overview
    if (selectedCategory && category && selectedCategory.id === category.id) {
      setSelectedCategory(null);
      setViewMode('overview');
    } else {
      setSelectedCategory(category);
      if (category) {
        setViewMode('category');
      } else {
        setViewMode('overview');
      }
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // Reset to overview when changing year
    setSelectedCategory(null);
    setViewMode('overview');
  };

  const getFilteredSections = (): CategorySection[] => {
    if (!selectedCategory) {
      return categorySections;
    }
    
    return categorySections.filter(section => section.title === selectedCategory.name);
  };

  useEffect(() => {
    if (hasConnectedBanks) {
      loadTransactions();
    }
  }, [hasConnectedBanks]);

  // Reload data when selected year changes
  useEffect(() => {
    if (hasConnectedBanks && availableYears.length > 0) {
      // Just reload transactions with new year filter
      loadTransactions();
    }
  }, [selectedYear]);

  const formatAmount = (amount: number, type: string) => {
    const symbol = type === 'income' ? '+' : '-';
    return `${symbol}$${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.merchantName}>
          {item.merchant || 'Unknown Merchant'}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
      ]}>
        {formatAmount(item.amount, item.type)}
      </Text>
    </View>
  );

  const renderOverviewItem = ({ item }: { item: CategoryOverview }) => (
    <TouchableOpacity 
      style={[styles.overviewItem, { borderLeftColor: item.color }]}
      onPress={() => handleCategorySelect({ id: item.id, name: item.name, color: item.color })}
    >
      <View style={styles.overviewInfo}>
        <View style={styles.overviewHeader}>
          <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
          <Text style={styles.overviewCategoryName}>{item.name}</Text>
        </View>
        <Text style={styles.overviewTransactionCount}>
          {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.overviewAmountContainer}>
        <Text style={styles.overviewAmount}>${item.total.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: CategorySection }) => (
    <View style={[styles.sectionHeader, { borderLeftColor: section.color }]}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryDot, { backgroundColor: section.color }]} />
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
      <Text style={styles.categoryTotal}>
        ${section.total.toFixed(2)}
      </Text>
    </View>
  );

  if (bankLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasConnectedBanks) {
    return (
      <PageBlocker 
        title="Bank Account Required"
        message="Connect your bank account to view transactions by category"
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewMode === 'overview' ? `${selectedYear} Overview` : `${selectedCategory?.name} (${selectedYear})`}
        </Text>
      </View>

      {/* Year Filter and Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          data={availableYears}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.year.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.yearChip, 
                selectedYear === item.year && styles.yearChipSelected
              ]}
              onPress={() => handleYearSelect(item.year)}
            >
              <Text style={[
                styles.yearChipText,
                selectedYear === item.year && styles.yearChipTextSelected
              ]}>
                {item.year}
              </Text>
              <Text style={[
                styles.yearChipCount,
                selectedYear === item.year && styles.yearChipCountSelected
              ]}>
                {item.transactionCount}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.yearList}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        />
        
        {viewMode === 'category' && selectedCategory && (
          <TouchableOpacity 
            style={[styles.categoryButton, { borderColor: selectedCategory.color }]}
            onPress={() => handleCategorySelect(selectedCategory)}
          >
            <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]} />
            <Text style={[styles.categoryButtonText, { color: selectedCategory.color }]}>
              {selectedCategory.name}
            </Text>
            <Ionicons name="close" size={18} color={selectedCategory.color} />
          </TouchableOpacity>
        )}
      </View>

      {categorySections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>No categorized transactions found</Text>
          <Text style={styles.emptySubtext}>
            Start categorizing your transactions in the Swipe screen
          </Text>
        </View>
      ) : (
        <>
          {viewMode === 'overview' ? (
            // Overview mode - show category summaries
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#6366F1']}
                  tintColor="#6366F1"
                />
              }
            >
              {categoryOverview.map((item) => (
                <View key={item.id}>
                  {renderOverviewItem({ item })}
                </View>
              ))}
            </ScrollView>
          ) : (
            // Category mode - show detailed transactions
            <SectionList
              sections={getFilteredSections()}
              renderItem={renderTransaction}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#6366F1']}
                  tintColor="#6366F1"
                />
              }
            />
          )}
        </>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 4,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },

  overviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  overviewCategoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  overviewTransactionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  overviewAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  yearList: {
    paddingHorizontal: 16,
  },
  yearChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 70,
  },
  yearChipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  yearChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  yearChipTextSelected: {
    color: '#FFFFFF',
  },
  yearChipCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  yearChipCountSelected: {
    color: '#E0E7FF',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});