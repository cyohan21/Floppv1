import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { plaidService } from '../../../services/plaidService';
import { 
  create, 
  open,
  dismissLink,
  LinkTokenConfiguration, 
  LinkOpenProps,
  LinkSuccess,
  LinkExit,
  LinkIOSPresentationStyle,
  LinkLogLevel
} from 'react-native-plaid-link-sdk';

interface PlaidLinkProps {
  onSuccess: (publicToken: string) => void;
  onError?: (error: any) => void;
}

export const PlaidLinkComponent: React.FC<PlaidLinkProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaidLink = async () => {
    setIsLoading(true);
    
    try {
      // First alert - original connect your bank
      Alert.alert(
        'Connect Your Bank',
        'This is a demo version. Would you like to simulate connecting a bank account?',
        [
          {
            text: 'Connect Demo Bank',
            onPress: () => showTransactionHistoryOptions()
          },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => setIsLoading(false)
          }
        ]
      );
    } catch (error) {
      console.error('Plaid Link initialization error:', error);
      setIsLoading(false);
      onError?.(error);
    }
  };

  const showTransactionHistoryOptions = () => {
    // Second alert to ask for transaction history days
    Alert.alert(
      'Transaction History',
      'How many days of transaction history would you like to sync? (Max 90 days)',
      [
        {
          text: '30 Days',
          onPress: () => proceedWithConnection(30)
        },
        {
          text: '60 Days',
          onPress: () => proceedWithConnection(60)
        },
        {
          text: '90 Days',
          onPress: () => proceedWithConnection(90)
        },
        {
          text: 'Back',
          style: 'destructive',
          onPress: () => handlePlaidLink()
        }
      ]
    );
  };

  const proceedWithConnection = async (requested_days: number) => {
    try {
      const response = await plaidService.createLinkToken(requested_days);
      console.log('Link token created:', response.linkToken);
      
      if (response.linkToken) {
        // Create the token configuration
        const tokenConfiguration: LinkTokenConfiguration = {
          token: response.linkToken,
          noLoadingState: false,
        };
        
        // Preload Link
        create(tokenConfiguration);
        
        // Open Link with proper handlers
        const openProps: LinkOpenProps = {
          onSuccess: (success: LinkSuccess) => {
            console.log('Plaid Success:', success);
            // Pass the publicToken to the parent component
            onSuccess(success.publicToken);
            setIsLoading(false);
          },
          onExit: (linkExit: LinkExit) => {
            console.log('Plaid Exit:', linkExit);
            dismissLink();
            setIsLoading(false);
          },
          iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
          logLevel: LinkLogLevel.ERROR,
        };
        
        open(openProps);
      }
    } catch (error) {
      console.error('Plaid Link error:', error);
      Alert.alert(
        'Connection Failed',
        'Failed to get link token. Please try again.',
        [{ text: 'OK', onPress: () => setIsLoading(false) }]
      );
      onError?.(error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePlaidLink}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Connect Bank Account</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.disclaimerText}>
        Connect your bank account to sync transactions.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerText: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 