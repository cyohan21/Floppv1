import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { plaidService } from './services/plaidService';
import { useBankStatus } from './contexts/bankStatusContext';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  currency: string;
  isPending: boolean;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
}

interface TransactionSection {
  title: string;
  data: Transaction[];
}

export default function TransactionsListScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionSections, setTransactionSections] = useState<TransactionSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const router = useRouter();
  const { hasConnectedBanks } = useBankStatus();

  // Helper function to get category color
  const getCategoryColor = (transaction: Transaction): string => {
    // If no category, it's uncategorized - make it gray
    if (!transaction.category || transaction.category.name === 'Uncategorized') {
      return '#9CA3AF'; // Gray color for uncategorized
    }
    
    // Use the category's actual color from database
    return transaction.category.color || '#9CA3AF';
  };

  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const transactionDate = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return transactionDate.toLocaleDateString('en-US', options);
  };

  // Helper function to group transactions by month
  const groupTransactionsByMonth = (transactions: Transaction[]): TransactionSection[] => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    });

    // Convert to sections and sort by date (newest first)
    const sections: TransactionSection[] = Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a)) // Sort months in descending order
      .map(monthKey => {
        // Parse the month key correctly (YYYY-MM format)
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1); // month is 0-based
        const title = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        return {
          title,
          data: grouped[monthKey].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ) // Sort transactions within month by date (newest first)
        };
      });

    return sections;
  };

  const fetchTransactions = async (offset: number = 0, isRefresh: boolean = false) => {
    if (!hasConnectedBanks) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await plaidService.getTransactions(pagination.limit, offset);
      
      if (isRefresh || offset === 0) {
        setTransactions(response.transactions);
        setTransactionSections(groupTransactionsByMonth(response.transactions));
      } else {
        const newTransactions = [...transactions, ...response.transactions];
        setTransactions(newTransactions);
        setTransactionSections(groupTransactionsByMonth(newTransactions));
      }
      
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreTransactions = () => {
    if (pagination.hasMore && !loading) {
      fetchTransactions(pagination.offset + pagination.limit);
    }
  };

  const onRefresh = () => {
    fetchTransactions(0, true);
  };

  useEffect(() => {
    if (hasConnectedBanks) {
      fetchTransactions();
    }
  }, [hasConnectedBanks]);

  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const amount = isIncome ? `+$${item.amount}` : `-$${item.amount}`;
    const categoryColor = getCategoryColor(item);
    const formattedDate = formatTransactionDate(item.date);

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionName}>{item.merchant}</Text>
            <Text style={styles.transactionMeta}>
              {item.category?.name || item.type} • {formattedDate}
              {item.isPending && ' • Pending'}
            </Text>
            <Text style={styles.transactionCurrency}>{item.currency}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? '#4CAF50' : '#333' }]}>
          {amount}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || transactions.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more transactions...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="credit-card" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Transactions Found</Text>
      <Text style={styles.emptyDescription}>
        {!hasConnectedBanks 
          ? 'Connect a bank account to see your transactions'
          : 'Try syncing your transactions from your connected bank account'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Transaction Count */}
      {hasConnectedBanks && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {pagination.total} transaction{pagination.total !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Transactions List */}
      <SectionList
        sections={transactionSections}
        renderItem={renderTransaction}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20, // Added padding to shift container down
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  transactionCurrency: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});