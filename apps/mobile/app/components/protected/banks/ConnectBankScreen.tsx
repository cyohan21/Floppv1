import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PlaidLinkComponent } from '../plaid/PlaidLink';
import { plaidService } from '../../../services/plaidService';
import { useBankStatus } from '../../../contexts/bankStatusContext';
import { config } from '../../../src/config/environment';

export const ConnectBankScreen: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { forceRefresh } = useBankStatus();

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      setIsConnecting(true);
      const response = await fetch(`${config.apiBaseUrl}/plaid/exchange-public-token`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({public_token: publicToken})
      }) 

      if (response.ok) {
        console.log('Token exchange successful, refreshing bank status...');
        // Force refresh bank status across all screens
        forceRefresh();
        
        Alert.alert(
          'Bank Connected!',
          'Your bank account has been successfully connected and transactions are being synced automatically.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to connected banks screen
                router.replace('/connected-banks' as any);
              }
            }
          ]
        );
      }
      else {
        Alert.alert(`Missing token in response`)
        throw new Error('Missing access token in response.')
      }
      
    } catch (error) {
      console.error('Failed to connect bank:', error);
      Alert.alert(
        'Connection Failed',
        'Failed to connect your bank account. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePlaidError = (error: any) => {
    console.error('Plaid Link error:', error);
    Alert.alert(
      'Connection Error',
      'There was an issue connecting your bank account. Please try again.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Connect Bank</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Feather name="shield" size={48} color="#6a12e4ff" />
          </View>
          <Text style={styles.heroTitle}>Secure Bank Connection</Text>
          <Text style={styles.heroSubtitle}>
            Connect your bank account to automatically track and categorize your transactions
          </Text>
        </View>

        <View style={styles.securitySection}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
          
          <View style={styles.securityItem}>
            <Feather name="lock" size={20} color="#28a745" />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>Bank-level Security</Text>
              <Text style={styles.securitySubtitle}>
                We use 256-bit SSL encryption to protect your data
              </Text>
            </View>
          </View>

          <View style={styles.securityItem}>
            <Feather name="eye-off" size={20} color="#28a745" />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>Read-only Access</Text>
              <Text style={styles.securitySubtitle}>
                We can only view your transactions, never move money
              </Text>
            </View>
          </View>

          <View style={styles.securityItem}>
            <Feather name="user-check" size={20} color="#28a745" />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>Your Data, Your Control</Text>
              <Text style={styles.securitySubtitle}>
                You can disconnect your bank at any time
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.connectSection}>
          <PlaidLinkComponent
            onSuccess={handlePlaidSuccess}
            onError={handlePlaidError}
          />
        </View>

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerText}>
            By connecting your bank account, you agree to our Terms of Service and Privacy Policy.
            We partner with Plaid to securely connect to your bank.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -30,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  securitySection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  securityText: {
    flex: 1,
    marginLeft: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  securitySubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  connectSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -20,
  },
  disclaimerSection: {
    marginBottom: 40,
    marginTop: -10,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    textAlign: 'center',
  },
}); 