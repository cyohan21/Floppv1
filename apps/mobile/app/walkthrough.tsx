import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { config } from '../src/config/environment';
import { plaidService } from './services/plaidService';
import { useEffect } from 'react';

interface WalkthroughProps {
  onComplete?: () => void;
  isRewatch?: boolean; // If true, user is re-watching from settings
}

export default function WalkthroughScreen({ onComplete, isRewatch = false }: WalkthroughProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currencyLoaded, setCurrencyLoaded] = useState(false);
  const router = useRouter();

  const totalPages = 6;
  const progressPercentage = ((currentPage + 1) / totalPages) * 100;

  // Load user's current currency when walkthrough opens
  useEffect(() => {
    const loadCurrentCurrency = async () => {
      try {
        const response = await plaidService.getUserProgress();
        if (response.progress && response.progress.currency) {
          setSelectedCurrency(response.progress.currency);
        }
        setCurrencyLoaded(true);
      } catch (error) {
        console.error('Error loading current currency for walkthrough:', error);
        setCurrencyLoaded(true);
      }
    };
    
    if (!currencyLoaded) {
      loadCurrentCurrency();
    }
  }, [currencyLoaded]);

  const pages = [
    // Page 1: App Overview
    {
      title: `Welcome to ${config.appName}!`,
      subtitle: "Let's explore your personal finance companion",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.iconGrid}>
            <View style={styles.iconItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                <Feather name="home" size={24} color="#1976d2" />
              </View>
              <Text style={styles.iconLabel}>Home</Text>
              <Text style={styles.iconDesc}>Dashboard & transactions</Text>
            </View>
            
            <View style={styles.iconItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#f3e5f5' }]}>
                <MaterialCommunityIcons name="gesture-swipe" size={24} color="#7b1fa2" />
              </View>
              <Text style={styles.iconLabel}>Swipe</Text>
              <Text style={styles.iconDesc}>Categorize spending</Text>
            </View>
            
            <View style={styles.iconItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#e8f5e8' }]}>
                <Feather name="bar-chart-2" size={24} color="#388e3c" />
              </View>
              <Text style={styles.iconLabel}>Analytics</Text>
              <Text style={styles.iconDesc}>Spending insights</Text>
            </View>
            
            <View style={styles.iconItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                <Feather name="settings" size={24} color="#f57c00" />
              </View>
              <Text style={styles.iconLabel}>Settings</Text>
              <Text style={styles.iconDesc}>Account & preferences</Text>
            </View>
          </View>
          
          <Text style={styles.pageDescription}>
            Navigate between these four main sections using the tabs at the bottom of your screen.
          </Text>
        </View>
      )
    },
    
    // Page 2: Home Page
    {
      title: "Your Financial Hub",
      subtitle: "The Home screen is your control center",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e3f2fd' }]}>
                <Feather name="credit-card" size={20} color="#1976d2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Connect Your Bank</Text>
                <Text style={styles.featureDesc}>Securely link your bank account to start tracking</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#fff3e0' }]}>
                <Feather name="dollar-sign" size={20} color="#f57c00" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Current Balance</Text>
                <Text style={styles.featureDesc}>See your total available funds across all connected accounts</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#f3e5f5' }]}>
                <Feather name="target" size={20} color="#7b1fa2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Get Started Tasks</Text>
                <Text style={styles.featureDesc}>Complete onboarding with guided steps</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e8f5e8' }]}>
                <Feather name="list" size={20} color="#388e3c" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Recent Transactions</Text>
                <Text style={styles.featureDesc}>View your latest spending activity</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.pageDescription}>
            Tap the bank status at the top to connect your account and start tracking your finances automatically.
          </Text>
        </View>
      )
    },
    
    // Page 3: Swipe Screen
    {
      title: "Smart Categorization",
      subtitle: "Organize your spending with simple swipes",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.swipeDemo}>
            <View style={styles.swipeCard}>
              <Text style={styles.swipeCardTitle}>Coffee Shop</Text>
              <Text style={styles.swipeCardAmount}>-$4.50</Text>
              <Text style={styles.swipeCardDate}>Today</Text>
            </View>
            
            <View style={styles.categoryRow}>
              <View style={[styles.categoryChip, { backgroundColor: '#ffebee' }]}>
                <Text style={[styles.categoryText, { color: '#c62828' }]}>Food & Dining</Text>
              </View>
              <View style={[styles.categoryChip, { backgroundColor: '#e8f5e8' }]}>
                <Text style={[styles.categoryText, { color: '#2e7d32' }]}>Entertainment</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.instructionList}>
            <Text style={styles.instructionItem}>• Swipe cards to see transaction details</Text>
            <Text style={styles.instructionItem}>• Tap a category to assign the transaction</Text>
            <Text style={styles.instructionItem}>• Use the undo button to correct mistakes</Text>
            <Text style={styles.instructionItem}>• Only uncategorized expenses appear here</Text>
            <Text style={styles.instructionItem}>• Tap "Manage Categories" to customize your categories</Text>
            <Text style={styles.instructionItem}>• Reorder categories to prioritize your most-used ones</Text>
          </View>
          
          <Text style={styles.pageDescription}>
            Categorizing helps you understand your spending patterns and get better insights. You can customize and reorder categories to match your spending habits.
          </Text>
        </View>
      )
    },
    
    // Page 4: Analytics Screen
    {
      title: "Spending Insights",
      subtitle: "Understand your financial patterns",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.analyticsDemo}>
            <View style={styles.chartContainer}>
              <View style={styles.donutChart}>
                <Text style={styles.chartLabel}>Spending</Text>
                <Text style={styles.chartValue}>$1,250</Text>
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ff4444' }]} />
                  <Text style={styles.legendText}>Food & Dining</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
                  <Text style={styles.legendText}>Transportation</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e3f2fd' }]}>
                <Feather name="pie-chart" size={20} color="#1976d2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Monthly Breakdown</Text>
                <Text style={styles.featureDesc}>See spending by category with donut chart</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#f3e5f5' }]}>
                <Feather name="trending-up" size={20} color="#7b1fa2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Comparison Chart</Text>
                <Text style={styles.featureDesc}>Compare spending across different months</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e8f5e8' }]}>
                <Feather name="clock" size={20} color="#388e3c" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>History</Text>
                <Text style={styles.featureDesc}>View detailed transaction history by category</Text>
              </View>
            </View>
          </View>
        </View>
      )
    },
    
    // Page 5: Settings
    {
      title: "Personalize Your Experience",
      subtitle: "Manage your account and preferences",
      content: (
        <View style={styles.pageContent}>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e3f2fd' }]}>
                <Feather name="user" size={20} color="#1976d2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Profile Settings</Text>
                <Text style={styles.featureDesc}>Update your name, email, and password</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#f3e5f5' }]}>
                <Feather name="dollar-sign" size={20} color="#7b1fa2" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Currency Preference</Text>
                <Text style={styles.featureDesc}>Choose your display currency (USD or CAD)</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#e8f5e8' }]}>
                <Feather name="bell" size={20} color="#388e3c" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Notifications</Text>
                <Text style={styles.featureDesc}>Control how you receive updates</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#fff3e0' }]}>
                <Feather name="help-circle" size={20} color="#f57c00" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Support & Help</Text>
                <Text style={styles.featureDesc}>Get help and contact support</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.pageDescription}>
            You can always return to this walkthrough from the Settings page.
          </Text>
        </View>
      )
    },
    
    // Page 6: Currency Selection
    {
      title: "Choose Your Currency",
      subtitle: "Select your preferred display currency",
      content: (
        <View style={styles.pageContent}>
          <Text style={styles.currencyNote}>
            This setting controls how amounts are displayed in the app. It will not affect the actual currency of your bank transactions.
          </Text>
          
          <View style={styles.currencyOptions}>
            <TouchableOpacity 
              style={[styles.currencyOption, selectedCurrency === 'USD' && styles.selectedCurrencyOption]}
              onPress={() => setSelectedCurrency('USD')}
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
              onPress={() => setSelectedCurrency('CAD')}
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
          
          <Text style={styles.pageDescription}>
            You can change this setting later in the Settings page.
          </Text>
        </View>
      )
    }
  ];

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Always update currency when user completes walkthrough
      await plaidService.updateUserCurrency(selectedCurrency);
      
      if (!isRewatch) {
        // Only mark completion for initial walkthrough
        await plaidService.markWalkthroughCompleted();
      }
      
      if (onComplete) {
        onComplete();
      } else if (isRewatch) {
        router.back();
      } else {
        router.replace('/(protected)/home');
      }
    } catch (error) {
      console.error('Error completing walkthrough:', error);
      Alert.alert('Error', 'Failed to save preferences. You can update them later in Settings.');
      
      if (onComplete) {
        onComplete();
      } else if (isRewatch) {
        router.back();
      } else {
        router.replace('/(protected)/home');
      }
    }
  };

  const handleSkip = () => {
    if (isRewatch) {
      router.back();
    } else {
      handleComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with progress bar */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentPage + 1} of {totalPages}</Text>
        </View>
        
        {!isRewatch && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Page content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{pages[currentPage].title}</Text>
        <Text style={styles.subtitle}>{pages[currentPage].subtitle}</Text>
        {pages[currentPage].content}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handlePrevious}
          style={[styles.navButton, styles.secondaryButton]}
          disabled={currentPage === 0}
        >
          <Text style={[styles.navButtonText, styles.secondaryButtonText, currentPage === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleNext}
          style={[styles.navButton, styles.primaryButton]}
        >
          <Text style={[styles.navButtonText, styles.primaryButtonText]}>
            {currentPage === totalPages - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  progressContainer: {
    flex: 1,
    marginRight: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6a12e4ff',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#6a12e4ff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  pageContent: {
    flex: 1,
  },
  
  // Page 1: Icon grid
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  iconItem: {
    width: '45%',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  iconDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Feature lists
  featureList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#666',
  },
  
  // Page 3: Swipe demo
  swipeDemo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  swipeCard: {
    width: 280,
    height: 160,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  swipeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  swipeCardAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  swipeCardDate: {
    fontSize: 14,
    color: '#666',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  instructionList: {
    marginBottom: 24,
  },
  instructionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  
  // Page 4: Analytics demo
  analyticsDemo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  chartContainer: {
    alignItems: 'center',
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#ff4444',
    borderTopColor: '#4caf50',
    borderRightColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  chartLegend: {
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
  
  // Page 6: Currency selection
  currencyNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  currencyOptions: {
    marginBottom: 32,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
  },
  selectedCurrencyText: {
    color: '#6a12e4ff',
  },
  
  // Common
  pageDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Footer navigation
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#6a12e4ff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#333',
  },
  disabledText: {
    color: '#ccc',
  },
});