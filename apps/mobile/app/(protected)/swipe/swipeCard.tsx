import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  useWindowDimensions,
  Modal 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { plaidService } from '../../services/plaidService';
import { PageBlocker } from '../../components/protected/PageBlocker';
import { useBankStatus } from '../../contexts/bankStatusContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { config } from '../../../src/config/environment';
const router = useRouter();

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  currency: string;
  isPending: boolean;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

export default function SwipeCardScreen() {
  const { hasConnectedBanks, loading: bankLoading } = useBankStatus();
  const { width } = useWindowDimensions();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [additionalCategories, setAdditionalCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categorizing, setCategorizing] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Load data on mount
  useEffect(() => {
    if (hasConnectedBanks) {
      loadData();
    }
  }, [hasConnectedBanks]);

  // Reload data when screen comes into focus (e.g., returning from manage categories)
  useFocusEffect(
    useCallback(() => {
      if (hasConnectedBanks) {
        loadData();
      }
    }, [hasConnectedBanks])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, categoriesData] = await Promise.all([
        plaidService.getUncategorizedTransactions(),
        plaidService.getManageableCategories(),
      ]);

      
      // Apply client-side ordering to categories
      const storedOrder = await getCategoryOrder();
      const orderedCategories = applyCategoryOrder(categoriesData.categories || [], storedOrder);
      
      // Split into main (top 7) and additional categories
      const mainCategories = orderedCategories.slice(0, 7);
      const additionalCategories = orderedCategories.slice(7);
      
      setTransactions(transactionsData.transactions || []);
      setCategories(mainCategories);
      setAdditionalCategories(additionalCategories);
    } catch (error) {
      console.error('Error loading swipe data:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Get stored category order from AsyncStorage
  const getCategoryOrder = async (): Promise<string[]> => {
    try {
      const stored = await AsyncStorage.getItem('categoryOrder');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading category order:', error);
      return [];
    }
  };

  // Apply stored order to categories, putting unordered ones at the end
  const applyCategoryOrder = (categories: Category[], order: string[]): Category[] => {
    if (order.length === 0) return categories;

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const orderedCategories: Category[] = [];
    const unorderedCategories: Category[] = [];

    // Add categories in stored order
    order.forEach(id => {
      const category = categoryMap.get(id);
      if (category) {
        orderedCategories.push(category);
        categoryMap.delete(id);
      }
    });

    // Add any remaining categories that weren't in the stored order
    categoryMap.forEach(category => {
      unorderedCategories.push(category);
    });

    return [...orderedCategories, ...unorderedCategories];
  };

  const handleCategorize = async (categoryId: string) => {
    if (currentIndex >= transactions.length) return;
    
    const transaction = transactions[currentIndex];
    
    try {
      setCategorizing(true);
      await plaidService.categorizeTransaction(transaction.id, categoryId);
      
      // Move to next transaction
      setCurrentIndex(prev => prev + 1);
      
      // Reset card position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      Alert.alert('Error', 'Failed to categorize transaction');
    } finally {
      setCategorizing(false);
    }
  };

  const handleSwipeComplete = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    
    // Reset card position
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
  };

  const handleUndo = async () => {
    if (currentIndex > 0) {
      try {
        // Get the previous transaction that was just categorized
        const previousTransaction = transactions[currentIndex - 1];
        
        if (previousTransaction) {
          
          // Move the transaction back to uncategorized
          await plaidService.uncategorizeTransaction(previousTransaction.id);
          
          // Go back to the previous transaction
          setCurrentIndex(prev => prev - 1);
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          scale.value = withSpring(1);
          
          console.log('Successfully uncategorized transaction');
        }
      } catch (error) {
        console.error('Error undoing categorization:', error);
        Alert.alert('Error', 'Failed to undo categorization');
        
        // Still allow visual undo even if API fails
        setCurrentIndex(prev => prev - 1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    }
  };

  // Pan gesture - allows movement but no swipe-to-complete
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // Scale down slightly when dragging
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      scale.value = Math.max(0.95, 1 - distance / 1000);
    })
    .onEnd((event) => {
      // Always return to center - no swipe completion
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${translateX.value / 20}deg` },
      ],
    };
  });

  const formatAmount = (amount: number | undefined, type: string) => {
    // Handle undefined/null amounts gracefully
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.warn('Invalid amount received:', amount);
      return '$0.00';
    }
    
    const symbol = type === 'income' ? '+' : '-';
    return `${symbol}$${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show page blocker if no bank accounts are connected
  if (!bankLoading && !hasConnectedBanks) {
    return (
      <PageBlocker
        title="Connect Your Bank"
        message={`You need to connect a bank account to start categorizing your transactions. Connect your account to get started with ${config.appName}!`}
      />
    );
  }

  // Show loading while checking bank status or loading data
  if (bankLoading || loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6a12e4" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  // No transactions available
  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Swipe</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Transactions to Categorize</Text>
          <Text style={styles.emptyMessage}>
            All your transactions have been categorized! 
            If you haven't synced transactions yet, try syncing them first from the Banks screen.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // All transactions categorized
  if (currentIndex >= transactions.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Swipe</Text>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>🎉 All Done!</Text>
          <Text style={styles.completedMessage}>
            You've categorized all your transactions! 
            New transactions will appear here automatically.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentTransaction = transactions[currentIndex];

  // Add safety check for current transaction
  if (!currentTransaction) {
    console.warn('No current transaction found at index:', currentIndex);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Swipe</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Transaction Data</Text>
          <Text style={styles.emptyMessage}>
            Unable to load transaction data. Please try refreshing.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadData}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swipe</Text>
      <Text style={styles.subtitle}>Tap a category below to categorize</Text>
      
      {/* Manage Categories Button */}
      <TouchableOpacity 
        style={styles.manageCategoriesButton}
        onPress={() => router.push('/manage-categories' as any)}
      >
        <Text style={styles.manageCategoriesButtonText}>Manage Categories</Text>
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{transactions.length}
        </Text>
      </View>

      {/* Transaction Card */}
      <View style={styles.cardContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            <Text style={styles.cardMerchant}>{currentTransaction.merchant || 'Unknown Merchant'}</Text>
            <Text style={[
              styles.cardAmount,
              { color: currentTransaction.type === 'income' ? '#4CAF50' : '#333' }
            ]}>
              {formatAmount(currentTransaction.amount, currentTransaction.type || 'expense')}
            </Text>
            <Text style={styles.cardDate}>{formatDate(currentTransaction.date)}</Text>
            <Text style={styles.cardCurrency}>{currentTransaction.currency || 'USD'}</Text>
            {currentTransaction.isPending && (
              <Text style={styles.pendingBadge}>Pending</Text>
            )}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Undo Button */}
      {currentIndex > 0 && (
        <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
          <Text style={styles.undoButtonText}>↶ Undo</Text>
        </TouchableOpacity>
      )}

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              { backgroundColor: category.color || '#6a12e4' }
            ]}
            onPress={() => handleCategorize(category.id)}
            disabled={categorizing}
          >
            {categorizing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.categoryButtonText}>{category.name}</Text>
            )}
          </TouchableOpacity>
        ))}
        
        {/* More button if there are additional categories */}
        {additionalCategories.length > 0 && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMoreCategories(true)}
            disabled={categorizing}
          >
            <Text style={styles.moreButtonText}>More...</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* More Categories Modal */}
      <Modal
        visible={showMoreCategories}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMoreCategories(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>More Categories</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMoreCategories(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {additionalCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.modalCategoryButton}
                onPress={() => {
                  handleCategorize(category.id);
                  setShowMoreCategories(false);
                }}
                disabled={categorizing}
              >
                <View style={[styles.modalCategoryDot, { backgroundColor: category.color || '#6a12e4' }]} />
                <Text style={styles.modalCategoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 35,
    fontWeight: '700',
    color: '#6a12e4',
    marginTop: 100,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  manageCategoriesButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#6a12e4ff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  manageCategoriesButtonText: {
    fontSize: 16,
    color: '#6a12e4ff',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    backgroundColor: '#6a12e4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: 350,
    height: 250,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  cardMerchant: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  cardCurrency: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  pendingBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  undoButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
  },
  undoButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  categoriesContainer: {
    maxHeight: 80,
    marginBottom: 30,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: -40
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
  },
  completedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#6a12e4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 15
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  moreButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  moreButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#6a12e4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCategoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  modalCategoryText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});