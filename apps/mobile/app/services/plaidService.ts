import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'
import { config } from '../../src/config/environment';

const API_BASE_URL = config.apiBaseUrl;

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session-based auth
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API call failed');
    }

    return data.data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export const plaidService = {
  // Check if bank is connected
  async isBankConnected(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    try {
      console.log('Checking bank connection status...');
      const response = await fetch(`${API_BASE_URL}/plaid/is-bank-connected`, {  
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
      
      console.log('Bank connection response status:', response.status);
      console.log('Bank connection response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Bank connection response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Bank connection parsed data:', data);
      } catch (parseError) {
        console.error('Failed to parse bank connection response as JSON:', parseError);
        return false;
      }
      
      const isConnected = data === true || data.connected === true || data.isBankConnected === true;
      console.log('Bank connection result:', isConnected);
      return isConnected;
      } catch (error) {
          console.error('Error checking bank connection:', error);
          return false; // Default to false if error
      }
  },

  // Get connected banks
  async getConnectedBanks(): Promise<{institution_name: string, accounts: any[]} | null> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/accounts`, {  
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        console.log('Connected banks response status:', response.status);
        const data = await response.json();
        console.log('Connected banks response data:', JSON.stringify(data, null, 2));
        console.log('Data type:', typeof data);
        console.log('Is array?', Array.isArray(data));
        console.log('Has institution_name?', data?.institution_name);
        console.log('Has accounts?', data?.accounts);
        console.log('Accounts type:', typeof data?.accounts);
        console.log('Accounts is array?', Array.isArray(data?.accounts));
        
        // Handle different response formats
        if (data && data.institution_name && Array.isArray(data.accounts)) {
          console.log('✅ Response has expected structure - returning data');
          return {
            institution_name: data.institution_name,
            accounts: data.accounts
          };
        } else if (Array.isArray(data) && data.length > 0) {
          console.log('⚠️ Response is array format, adapting...');
          // Fallback: if it's still the old array format, use first account's institution
          return {
            institution_name: data[0]?.institution_name || 'Unknown Bank',
            accounts: data
          };
        } else {
          console.warn('❌ Connected banks response does not have expected structure:', data);
          return null;
        }
      } catch (error) {
          console.error('Error fetching connected banks:', error);
          return null; // Return null instead of throwing
      }
  },

  // Create Plaid Link token
  async createLinkToken(requested_days: number): Promise<{linkToken: string}> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    try {
        const response = await fetch(`${API_BASE_URL}/plaid/link/token/create`, {  
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-device-platform': Platform.OS
            },
            body: JSON.stringify({
              requested_days
            }),
          });
          const data = await response.json();
          return { linkToken: data.linkToken }
        } catch (error) {
            console.error('Error creating link token:', error);
            throw error;
        }
    },

  // Exchange public token for access token
  async exchangePublicToken(publicToken: string): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    await apiCall('/plaid/exchange-public-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ public_token: publicToken }),
    });
  },

  // Get user transactions
  async getTransactions(limit: number = 10, offset: number = 0): Promise<{
    transactions: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Get uncategorized transactions
  async getUncategorizedTransactions(): Promise<{
    transactions: any[];
    count: number;
  }> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions/uncategorized`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch uncategorized transactions');
      }

      return data;
    } catch (error) {
      console.error('Error fetching uncategorized transactions:', error);
      throw error;
    }
  },

  // Get user categories
  async getUserCategories(): Promise<{
    categories: any[];
  }> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }

      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Categorize a transaction
  async categorizeTransaction(transactionId: string, categoryId: string): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId,
          categoryId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to categorize transaction');
      }

      return data;
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      throw error;
    }
  },

  // Uncategorize a transaction (move back to uncategorized)
  async uncategorizeTransaction(transactionId: string): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions/uncategorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to uncategorize transaction');
      }

      return data;
    } catch (error) {
      console.error('Error uncategorizing transaction:', error);
      throw error;
    }
  },

  // Get categorized transactions
  async getCategorizedTransactions(): Promise<{
    transactions: any[];
    count: number;
  }> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions/categorized`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categorized transactions');
      }

      return data;
    } catch (error) {
      console.error('Error fetching categorized transactions:', error);
      throw error;
    }
  },

  // Sync transactions
  async syncTransactions(): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/plaid/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync transactions');
      }

      return data;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  },

  async getUserProgress(): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/user/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user progress');
      }

      return data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  async updateUserCurrency(currency: string): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/user/currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update currency');
      }

      return data;
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  },

  async markWalkthroughCompleted(): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/user/walkthrough-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark walkthrough as completed');
      }

      return data;
    } catch (error) {
      console.error('Error marking walkthrough completed:', error);
      throw error;
    }
  },

  // Category Management
  async getManageableCategories(): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/categories/manage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }

      return data;
    } catch (error) {
      console.error('Error fetching manageable categories:', error);
      throw error;
    }
  },

  async createCategory(name: string, color?: string): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, color }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
      }

      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async updateCategory(categoryId: string, name: string, color?: string): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, color }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category');
      }

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async deleteCategory(categoryId: string): Promise<any> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('Invalid Session. Please log in again.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/plaid/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      return data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
}; 