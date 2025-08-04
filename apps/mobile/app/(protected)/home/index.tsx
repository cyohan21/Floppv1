import { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, Text, StyleSheet, Image, ScrollView, Alert } from 'react-native';
// import TransactionForm  from '../other/transaction-form'; // Update import based on new name
import { useAuth } from '../../contexts/authContext'
import {useRouter} from 'expo-router'
import { Feather } from '@expo/vector-icons';
import  { CircularProgress } from '../../components/protected/home/circularProgress';
import { plaidService } from '../../services/plaidService';
import { useBankStatus } from '../../contexts/bankStatusContext';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import WalkthroughScreen from '../../walkthrough';


interface OnboardingProgress {
  currencySelected: boolean;
  bankConnected: boolean;
  transactionsSwiped: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  currency: string | null;
}

interface AccountBalance {
  account_id: string;
  name: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
}

export default function HomeScreenWithModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughChecked, setWalkthroughChecked] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const router = useRouter();
  const { hasConnectedBanks, loading, refreshBankStatus } = useBankStatus(); // Auto-check on load

  const getBankStatus = () => {
    if (loading) {
      return { text: 'Checking bank status...', color: '#666' };
    }
    if (hasConnectedBanks) {
      return { text: 'Bank connected', color: '#4CAF50' };
    }
    return { text: 'No accounts connected', color: '#ff6b6b' };
  };

  const fetchRecentTransactions = async () => {
    if (!hasConnectedBanks) {
      setTransactions([]);
      return;
    }

    try {
      setTransactionsLoading(true);
      const response = await plaidService.getTransactions(5, 0); // Get 5 most recent transactions
      setTransactions(response.transactions);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchAccountBalances = async () => {
    if (!hasConnectedBanks) {
      setTotalBalance(0);
      return;
    }

    try {
      setBalanceLoading(true);
      const accountData = await plaidService.getConnectedBanks();
      
      if (accountData && accountData.accounts) {
        // Calculate total balance from all accounts
        const total = accountData.accounts.reduce((sum: number, account: AccountBalance) => {
          // Use only available balance as it represents actual spendable money
          const balance = account.balances.available ?? 0;
          return sum + balance;
        }, 0);
        
        setTotalBalance(total);
      } else {
        setTotalBalance(0);
      }
    } catch (error) {
      console.error('Error fetching account balances:', error);
      setTotalBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      setProgressLoading(true);
      const response = await plaidService.getUserProgress();
      setProgress(response.progress);
      console.log('User progress:', response.progress);
    } catch (error) {
      console.error('Error fetching user progress:', error);
      // Fallback progress if API fails
      setProgress({
        currencySelected: false,
        bankConnected: hasConnectedBanks,
        transactionsSwiped: 0,
        completedTasks: hasConnectedBanks ? 1 : 0,
        totalTasks: 3,
        progressPercentage: hasConnectedBanks ? 33 : 0,
        currency: 'USD'
      });
    } finally {
      setProgressLoading(false);
    }
  };

  const checkWalkthroughStatus = async () => {
    try {
      // For now, we'll check if the user has any progress data
      // If they don't have currency set, show walkthrough
      const response = await plaidService.getUserProgress();
      
      // Show walkthrough if currency is not selected (new user)
      if (!response.progress.currencySelected && !walkthroughChecked) {
        setShowWalkthrough(true);
      }
      setWalkthroughChecked(true);
    } catch (error) {
      console.error('Error checking walkthrough status:', error);
      setWalkthroughChecked(true);
    }
  };

  useEffect(() => {
    if (hasConnectedBanks && !loading) {
      fetchRecentTransactions();
      fetchAccountBalances();
    }
  }, [hasConnectedBanks, loading]);

  // Check walkthrough status on first load
  useEffect(() => {
    if (!loading && !walkthroughChecked) {
      checkWalkthroughStatus();
    }
  }, [loading, walkthroughChecked]);

  // Fetch progress when screen comes into focus or when bank status changes
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        fetchUserProgress();
      }
    }, [loading, hasConnectedBanks])
  );

  const handleBankAccountsClick = () => {
    // Navigate based on current status
    if (hasConnectedBanks) {
      router.push('/connected-banks' as any);
    } else {
      router.push('/connect-bank' as any);
    }
  };

  const handleViewAllTransactions = () => {
    router.push('/transactions-list' as any);
  };

  const handleGetStartedClick = () => {
    if (!progress) return;
    
    // Navigate based on what needs to be completed
    if (!progress.currencySelected) {
      setShowCurrencyModal(true);
    } else if (!progress.bankConnected) {
      router.push('/connect-bank' as any);
    } else if (progress.transactionsSwiped < 5) {
      router.push('/swipe' as any);
    } else {
      Alert.alert('Congratulations!', 'You have completed all onboarding tasks!');
    }
  };

  const handleCurrencySelect = async (currency: string) => {
    try {
      setSelectedCurrency(currency);
      await plaidService.updateUserCurrency(currency);
      setShowCurrencyModal(false);
      
      // Refresh progress after currency update
      await fetchUserProgress();
      
      Alert.alert('Success', `Currency updated to ${currency}`);
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', 'Failed to update currency. Please try again.');
    }
  };

  // Helper function to get category color
  const getCategoryColor = (transaction: any): string => {
    // If no category, it's uncategorized - make it gray
    if (!transaction.category || transaction.category.name === 'Uncategorized') {
      return '#9CA3AF'; // Gray color for uncategorized
    }
    
    // Use the category's actual color from database
    return transaction.category.color || '#9CA3AF';
  };

  // Helper function to format balance with currency
  const formatBalance = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const transactionDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (transactionDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days ago`;
    }
  };

  const bankStatus = getBankStatus();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity onPress={handleBankAccountsClick}>
      <Text style={[styles.account, { color: bankStatus.color }]}>
        {bankStatus.text} <Feather name="chevron-down" size={24} color={bankStatus.color} />
      </Text>
      </TouchableOpacity>
      
      {!hasConnectedBanks && !loading && (
        <View style={styles.warningContainer}>
          <Feather name="alert-triangle" size={16} color="#FFA500" />
          <Text style={styles.warningText}>
            Connect your bank account to start tracking transactions
          </Text>
        </View>
      )}
      <View style={styles.totalIncomeContainer}>
        {balanceLoading ? (
          <Text style={styles.totalIncome}>Loading...</Text>
        ) : hasConnectedBanks ? (
          <Text style={styles.totalIncome}>
            {formatBalance(totalBalance, progress?.currency || 'USD')}
          </Text>
        ) : (
          <Text style={styles.totalIncome}>
            {formatBalance(0, progress?.currency || 'USD')}
          </Text>
        )}
        <Text>Currency: {progress?.currency || 'USD'}</Text>
      </View>

      {/* Get started */}
      <TouchableOpacity style={styles.objectivesContainer} onPress={handleGetStartedClick}>
        <Text style={styles.objectivesTitle}>Get Started</Text>
        <Feather name="chevron-right" size={24} style={styles.objectivesIcon} />
        <Text style={styles.objectivesCounter}>
          {progressLoading ? 'Loading...' : progress ? `${progress.completedTasks} of ${progress.totalTasks} complete` : '0 of 3 complete'}
        </Text>
        <View style={{position: 'absolute', left: '5%'}}>
          <CircularProgress 
            progress={progressLoading ? 0 : (progress?.progressPercentage || 0)} 
            size={30} 
          />
        </View>
      </TouchableOpacity>

      {/* Get Started Tasks Details - only show if progress exists and not all tasks completed */}
      {progress && progress.completedTasks < progress.totalTasks && (
        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>Complete these tasks:</Text>
          
          {/* Currency Task */}
          <View style={[styles.taskItem, progress.currencySelected && styles.taskCompleted]}>
            <Feather 
              name={progress.currencySelected ? "check-circle" : "circle"} 
              size={20} 
              color={progress.currencySelected ? "#4CAF50" : "#666"} 
            />
            <Text style={[styles.taskText, progress.currencySelected && styles.taskTextCompleted]}>
              Select a currency
            </Text>
          </View>
          
          {/* Bank Task */}
          <View style={[styles.taskItem, progress.bankConnected && styles.taskCompleted]}>
            <Feather 
              name={progress.bankConnected ? "check-circle" : "circle"} 
              size={20} 
              color={progress.bankConnected ? "#4CAF50" : "#666"} 
            />
            <Text style={[styles.taskText, progress.bankConnected && styles.taskTextCompleted]}>
              Link a bank account
            </Text>
          </View>
          
          {/* Swipe Task */}
          <View style={[styles.taskItem, progress.transactionsSwiped >= 5 && styles.taskCompleted]}>
            <Feather 
              name={progress.transactionsSwiped >= 5 ? "check-circle" : "circle"} 
              size={20} 
              color={progress.transactionsSwiped >= 5 ? "#4CAF50" : "#666"} 
            />
            <Text style={[styles.taskText, progress.transactionsSwiped >= 5 && styles.taskTextCompleted]}>
              Swipe 5 transactions ({progress.transactionsSwiped}/5)
            </Text>
          </View>
        </View>
      )}

      {/* Recent transactions */}
      <View style={styles.transactionsContainer}>
      <Text style={styles.transactionsListTitle}>Transactions</Text>
      <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllTransactions}>
        <Text style={{color: 'white', fontWeight: '500'}}>View All</Text>
      </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsList}>
        {transactionsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : !hasConnectedBanks ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Connect a bank account to see your transactions</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found. Try syncing your transactions.</Text>
          </View>
        ) : (
          transactions.map((transaction, index) => {
            const isIncome = transaction.type === 'income';
            const amount = isIncome ? `+$${transaction.amount}` : `-$${transaction.amount}`;
            const categoryColor = getCategoryColor(transaction);
            const formattedDate = formatTransactionDate(transaction.date);

            return (
              <View key={transaction.id || index} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionName}>{transaction.merchant}</Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category?.name || transaction.type} • {formattedDate}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: isIncome ? '#4CAF50' : '#333' }]}>
                  {amount}
                </Text>
              </View>
            );
          })
        )}
      </View>
      {/* Manual Transactions: currently not in use. */}
      {/* <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity> */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* <TransactionForm onClose={() => setModalVisible(false)} /> */}
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity 
                onPress={() => setShowCurrencyModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.currencyOption, selectedCurrency === 'USD' && styles.selectedCurrencyOption]}
              onPress={() => handleCurrencySelect('USD')}
            >
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencyCode, selectedCurrency === 'USD' && styles.selectedCurrencyText]}>USD</Text>
                <Text style={[styles.currencyName, selectedCurrency === 'USD' && styles.selectedCurrencyText]}>US Dollar</Text>
              </View>
              {selectedCurrency === 'USD' && (
                <Feather name="check-circle" size={24} color="#6a12e4ff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.currencyOption, selectedCurrency === 'CAD' && styles.selectedCurrencyOption]}
              onPress={() => handleCurrencySelect('CAD')}
            >
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencyCode, selectedCurrency === 'CAD' && styles.selectedCurrencyText]}>CAD</Text>
                <Text style={[styles.currencyName, selectedCurrency === 'CAD' && styles.selectedCurrencyText]}>Canadian Dollar</Text>
              </View>
              {selectedCurrency === 'CAD' && (
                <Feather name="check-circle" size={24} color="#6a12e4ff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Walkthrough Modal */}
      {showWalkthrough && (
        <Modal
          visible={showWalkthrough}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <WalkthroughScreen 
            onComplete={() => {
              setShowWalkthrough(false);
              fetchUserProgress(); // Refresh progress after walkthrough
            }}
          />
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: 50,
    },
    account: {
      marginTop: 85,
      fontSize: 25,
      fontWeight: '500',
      color: '#6a12e4ff'
    },
    totalIncomeContainer: {
      marginTop: 60,
      alignItems: 'center',
      paddingRight: 10
    },
    totalIncome: {
      fontSize: 45,
      fontWeight: '600',
    },

    // Objectives
    objectivesContainer: {
      marginTop: 30,
      borderRadius: 20,
      backgroundColor: '#e6e6e6ff',
      alignItems: 'center',
      justifyContent: 'center',
      width: '90%',
      height: 105
    },
    objectivesTitle: {
      paddingBottom: 10,
      paddingRight: 82,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#7621ffff',
      fontSize: 21,
      fontWeight: '600'
    },
    objectivesCounter: {
      paddingRight: 85,
    },
    objectivesIcon: {
      color: '#7621ffff',
      position: 'absolute',
      right: '5%'
    },
    
    // Transactions
    transactionsContainer: {
      marginTop: 50,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    transactionsListTitle: {
      fontSize: 22,
      fontWeight: '500',
      paddingRight: 160
    },
    viewAllButton: {
      backgroundColor: '#6a12e4ff',
      borderRadius: 100,
      width: 78,
      height: 29,
      justifyContent: 'center',
      alignItems: 'center'
    },
    transactionsList: {
      width: '90%',
      marginTop: 20,
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      marginBottom: 8,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    transactionCategory: {
      fontSize: 13,
      color: '#666',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
    },

    // Warning container for no accounts
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF9E6',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 12,
      marginBottom: 8,
      width: '90%',
      borderWidth: 1,
      borderColor: '#FFE4B5',
    },
    warningText: {
      marginLeft: 8,
      fontSize: 14,
      color: '#B8860B',
      flex: 1,
    },

    // Tasks container
    tasksContainer: {
      marginTop: 20,
      width: '90%',
      backgroundColor: '#f8f9fa',
      borderRadius: 16,
      padding: 16,
    },
    tasksTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 12,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingVertical: 8,
    },
    taskCompleted: {
      opacity: 0.7,
    },
    taskText: {
      fontSize: 15,
      color: '#333',
      marginLeft: 12,
      flex: 1,
    },
    taskTextCompleted: {
      color: '#4CAF50',
      textDecorationLine: 'line-through',
    },

    // Currency Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#333',
    },
    closeButton: {
      padding: 5,
    },
    currencyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginBottom: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCurrencyOption: {
      backgroundColor: '#f0f0ff',
      borderColor: '#6a12e4ff',
    },
    currencyInfo: {
      flex: 1,
    },
    currencyCode: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    currencyName: {
      fontSize: 14,
      color: '#666',
    },
    selectedCurrencyText: {
      color: '#6a12e4ff',
    },



  // Manual transactions: not in use currently.
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    backgroundColor: '#6a12e4ff',
    borderRadius: 999, // rounds the element
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 40,
    color: 'white',
    lineHeight: 42 // Custom spacing to ensure text is centered. Will need to change with fontSize.  
  },

  // Loading and empty states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});