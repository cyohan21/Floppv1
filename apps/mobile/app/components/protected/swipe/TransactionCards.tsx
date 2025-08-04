import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  date: string;
}

interface TransactionCardsProps {
  transactions: Transaction[];
  currentIndex: number;
  panGesture: any;
  currentCardAnimatedStyle: any;
}

export default function TransactionCards({
  transactions,
  currentIndex,
  panGesture,
  currentCardAnimatedStyle
}: TransactionCardsProps) {
  const maxCards = 2;

  if (currentIndex >= transactions.length) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>All Done! 🎉</Text>
        <Text style={styles.completedMessage}>
          You've successfully categorized all transactions
        </Text>
      </View>
    );
  }

  const visibleTransactions = transactions.slice(currentIndex, currentIndex + maxCards);

  return (
    <>
      {visibleTransactions.map((transaction, index) => {
        const isTopCard = index === 0;
        const cardKey = `card-${transaction.id}-${currentIndex}-${index}`;

        const baseStyle = {
          zIndex: maxCards - index,
          transform: [
            { scale: 1 },
            { translateY: 0 },
          ],
        };

        const cardOpacity = isTopCard ? 1 : 0.9;
        const animatedStyles = isTopCard ? [styles.card, baseStyle, currentCardAnimatedStyle] : [styles.card, baseStyle];

        const content = (
          <Animated.View key={cardKey} style={[animatedStyles, { opacity: cardOpacity }]}>
            <View style={styles.cardContent}>
              <Text style={styles.merchantName}>{transaction.merchant}</Text>
              <Text style={styles.transactionAmount}>${Math.abs(transaction.amount).toFixed(2)}</Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </Animated.View>
        );

        return isTopCard ? (
          <GestureDetector key={`gesture-${cardKey}`} gesture={panGesture}>
            {content}
          </GestureDetector>
        ) : (
          content
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: '24%',
    width: 250,
    height: 350,
    backgroundColor: '#6a12e4ff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  transactionDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  completedContainer: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '40%',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 20,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  completedMessage: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
}); 