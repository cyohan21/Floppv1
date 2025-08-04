import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Category {
  name: string;
  color: string;
}

interface CategoryButtonsProps {
  categories: Category[];
  onCategorySelect: (index: number) => void;
  onCategoryLongPress: (index: number) => void;
  onMorePress: () => void;
}

export default function CategoryButtons({
  categories,
  onCategorySelect,
  onCategoryLongPress,
  onMorePress
}: CategoryButtonsProps) {
  // Calculate if we have one row (less than 5 categories including More button)
  const totalButtons = categories.length + 1; // +1 for More button
  const isOneRow = totalButtons < 5;
  
  return (
    <View style={[styles.container, isOneRow && styles.oneRowContainer]}>
      {categories.map((category, index) => (
        <TouchableOpacity 
          key={index} 
          style={[styles.categoryButton, { backgroundColor: category.color }]}
          onPress={() => onCategorySelect(index)}
          onLongPress={() => onCategoryLongPress(index)}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
      ))}
      
      {/* More button */}
      <TouchableOpacity 
        style={[styles.categoryButton, { backgroundColor: '#666666' }]}
        onPress={onMorePress}
      >
        <Text style={styles.categoryName}>More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    flexWrap: 'wrap',
    bottom: '3%',
    width: '95%',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    gap: 10,
  },
  oneRowContainer: {
    bottom: '8%', // Move higher when only one row
    justifyContent: 'center', // Center the buttons when fewer categories
  },
  categoryButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22%', // 4 per row with spacing
    height: 60,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 13,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 