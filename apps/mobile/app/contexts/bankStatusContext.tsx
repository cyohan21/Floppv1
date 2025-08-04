import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { plaidService } from '../services/plaidService';

interface BankStatusContextType {
  hasConnectedBanks: boolean;
  loading: boolean;
  refreshBankStatus: () => Promise<void>;
  forceRefresh: () => void;
}

const BankStatusContext = createContext<BankStatusContextType | undefined>(undefined);

interface BankStatusProviderProps {
  children: ReactNode;
}

export function BankStatusProvider({ children }: BankStatusProviderProps) {
  const [hasConnectedBanks, setHasConnectedBanks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const checkBankStatus = async () => {
    try {
      setLoading(true);
      const isConnected = await plaidService.isBankConnected();
      setHasConnectedBanks(isConnected);
    } catch (error) {
      console.error('Error checking bank status:', error);
      setHasConnectedBanks(false);
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    checkBankStatus();
  }, [refreshTrigger]);

  return (
    <BankStatusContext.Provider
      value={{
        hasConnectedBanks,
        loading,
        refreshBankStatus: checkBankStatus,
        forceRefresh,
      }}
    >
      {children}
    </BankStatusContext.Provider>
  );
}

export function useBankStatus() {
  const context = useContext(BankStatusContext);
  if (context === undefined) {
    throw new Error('useBankStatus must be used within a BankStatusProvider');
  }
  return context;
}