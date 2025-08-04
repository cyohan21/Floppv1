import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { plaidService } from '../../../services/plaidService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBankStatus } from '../../../contexts/bankStatusContext';
import { config } from '../../../../src/config/environment';

interface BankAccount {
  account_id: string;
  name: string;
  mask: string;
  type: string;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string;
  };
}

interface BankData {
  institution_name: string;
  accounts: BankAccount[];
}

interface GroupedBank {
  institution_name: string;
  accounts: BankAccount[];
}

export default function ConnectedBanksScreen() {
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { forceRefresh } = useBankStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [lastSyncHour, setLastSyncHour] = useState<number>(0);

  useEffect(() => {
    fetchConnectedBanks();
  }, []);

  const fetchConnectedBanks = async () => {
    try {
      setLoading(true);
      const data = await plaidService.getConnectedBanks();
      setBankData(data);
    } catch (error) {
      console.error('Error fetching connected banks:', error);
      // If we can't fetch banks, assume none are connected
      setBankData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBank = (institutionName: string) => {
    const accountCount = bankData?.accounts.length || 0;
    
    Alert.alert(
      'Disconnect Bank',
      `Are you sure you want to disconnect "${institutionName}"? This will remove access to all ${accountCount} account${accountCount > 1 ? 's' : ''} and transaction data from this bank.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect Bank',
          style: 'destructive',
          onPress: () => disconnectBank(institutionName),
        },
      ]
    );
  };

  const disconnectBank = async (institutionName: string) => {
    try {
      setDisconnecting(institutionName);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch(`${config.apiBaseUrl}/plaid/item/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}), // Remove entire item, no need for account_id
      });

      if (response.ok) {
        Alert.alert('Success', `${institutionName} disconnected successfully`);
        // Force refresh bank status across all screens
        forceRefresh();
        // Refresh the list
        await fetchConnectedBanks();
      } else {
        Alert.alert('Error', 'Failed to disconnect bank account');
      }
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      Alert.alert('Error', 'Network error while disconnecting bank account');
    } finally {
      setDisconnecting(null);
    }
  };

  const checkRateLimit = (): { canSync: boolean; message?: string } => {
    const now = Date.now();
    const currentHour = Math.floor(now / (1000 * 60 * 60));
    
    // Reset hourly count if it's a new hour
    if (currentHour !== lastSyncHour) {
      setSyncCount(0);
      setLastSyncHour(currentHour);
    }
    
    // Check 1 minute rate limit
    const timeSinceLastSync = now - lastSyncTime;
    if (timeSinceLastSync < 60000) { // 1 minute = 60,000ms
      const remainingSeconds = Math.ceil((60000 - timeSinceLastSync) / 1000);
      return { 
        canSync: false, 
        message: `Please wait ${remainingSeconds} seconds before syncing again` 
      };
    }
    
    // Check hourly rate limit
    if (syncCount >= 10) {
      return { 
        canSync: false, 
        message: 'Hourly sync limit reached (10x). Please try again later' 
      };
    }
    
    return { canSync: true };
  };

  const handleSyncTransactions = async () => {
    // Check rate limits first
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.canSync) {
      Alert.alert('Rate Limited', rateLimitCheck.message);
      return;
    }

    try {
      setSyncing(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      // Call the backend to sync transactions from Plaid
      const response = await fetch(`${config.apiBaseUrl}/plaid/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update rate limit tracking
        setLastSyncTime(Date.now());
        setSyncCount(prev => prev + 1);
        
        Alert.alert(
          'Sync Complete!',
          `Transactions synchronized successfully.\n\nAdded: ${result.summary.added}\nModified: ${result.summary.modified}\nRemoved: ${result.summary.removed}`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Sync Failed', errorData.message || 'Failed to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      Alert.alert('Sync Failed', 'Network error while syncing transactions');
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectAnother = () => {
    router.push('/connect-bank' as any);
  };

  const handleBack = () => {
    router.back();
  };

  const formatBalance = (balances: { available: number | null; current: number | null; iso_currency_code: string }) => {
    const amount = balances.available ?? balances.current ?? 0;
    const currency = balances.iso_currency_code || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a12e4" />
        <Text style={styles.loadingText}>Loading connected accounts...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#6a12e4" />
        </TouchableOpacity>
        <Text style={styles.title}>Connected Accounts</Text>
      </View>

      {!bankData || bankData.accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="credit-card" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Connected Accounts</Text>
          <Text style={styles.emptySubtitle}>Connect your bank account to start tracking transactions</Text>
          <TouchableOpacity style={styles.connectButton} onPress={handleConnectAnother}>
            <Text style={styles.connectButtonText}>Connect Bank Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              {bankData.accounts.length} account{bankData.accounts.length > 1 ? 's' : ''} from {bankData.institution_name}
            </Text>
          </View>

          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <View style={styles.bankInfo}>
                <Text style={styles.institutionName}>{bankData.institution_name}</Text>
                <Text style={styles.accountCount}>{bankData.accounts.length} account{bankData.accounts.length > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={() => handleDisconnectBank(bankData.institution_name)}
                disabled={disconnecting === bankData.institution_name}
              >
                {disconnecting === bankData.institution_name ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="link" size={16} color="#fff" />
                    <Text style={styles.disconnectButtonText}>Disconnect Bank</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Show individual accounts */}
            {bankData.accounts.map((account) => (
              <View key={account.account_id} style={styles.accountRow}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountDetails}>
                    {account.type.toUpperCase()} •••• {account.mask}
                  </Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceAmount}>{formatBalance(account.balances)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.syncInfoContainer}>
            <Text style={styles.syncInfoText}>
              💡 Transactions usually sync automatically, but you can manually sync if needed. 
              Rate limited to 1x/min, 10x/hr.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]} 
            onPress={handleSyncTransactions}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="refresh-cw" size={20} color="#fff" />
            )}
            <Text style={styles.syncButtonText}>
              {syncing ? 'Syncing...' : 'Sync Transactions'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#6a12e4',
    fontWeight: '600',
    textAlign: 'center',
  },
  bankCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bankInfo: {
    flex: 1,
  },
  institutionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    color: '#666',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6a12e4',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  disconnectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  accountCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  accountInfo: {
    flex: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6a12e4',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  connectButton: {
    backgroundColor: '#6a12e4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  syncInfoContainer: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6a12e4',
  },
  syncInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});