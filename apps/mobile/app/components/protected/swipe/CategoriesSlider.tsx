import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated';

interface Category {
  name: string;
  color: string;
  globalIndex?: number;
}

interface CategoriesSliderProps {
  visible: boolean;
  categories: Category[];
  filteredCategories: (Category & { globalIndex: number })[];
  searchText: string;
  onSearchChange: (text: string) => void;
  onCategorySelect: (index: number) => void;
  onCategoryLongPress: (index: number) => void;
  onRemoveCategory: (index: number) => void;
  onClose: () => void;
  showAddCategory: boolean;
  newCategoryName: string;
  onNewCategoryNameChange: (text: string) => void;
  onToggleAddCategory: () => void;
  onAddNewCategory: () => void;
  slideY: Animated.SharedValue<number>;
}

export default function CategoriesSlider({
  visible,
  categories,
  filteredCategories,
  searchText,
  onSearchChange,
  onCategorySelect,
  onCategoryLongPress,
  onRemoveCategory,
  onClose,
  showAddCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onToggleAddCategory,
  onAddNewCategory,
  slideY
}: CategoriesSliderProps) {

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1} 
          onPress={onClose}
        >
          <Animated.View style={[styles.container, { transform: [{ translateY: slideY }] }]}>
            <TouchableOpacity 
              style={styles.content}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Text style={styles.title}>Choose Category</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={onToggleAddCategory}
                >
                  <Text style={[
                    styles.addButtonText, 
                    showAddCategory && styles.closeButtonText
                  ]}>
                    {showAddCategory ? '✕' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {showAddCategory && (
                <View style={styles.addCategoryContainer}>
                  <TextInput
                    style={styles.addCategoryInput}
                    placeholder="New category name..."
                    placeholderTextColor="#999"
                    value={newCategoryName}
                    onChangeText={onNewCategoryNameChange}
                    onSubmitEditing={onAddNewCategory}
                    maxLength={10}
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={onAddNewCategory}>
                    <Text style={styles.saveButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={onSearchChange}
              />

              <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category, filteredIndex) => {
                    // Use the globalIndex that was stored when filtering
                    const globalIndex = category.globalIndex ?? filteredIndex;
                    return (
                      <View key={filteredIndex} style={styles.categoryItemWrapper}>
                        <TouchableOpacity 
                          style={[styles.categoryButton, { backgroundColor: category.color }]}
                          onPress={() => onCategorySelect(globalIndex)}
                          onLongPress={() => onCategoryLongPress(globalIndex)}
                          delayLongPress={300}
                          activeOpacity={0.7}
                        >
                        <Text style={styles.categoryName}>{category.name}</Text>
                      </TouchableOpacity>
                                              <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => onRemoveCategory(globalIndex)}
                        >
                          <Text style={styles.removeButtonText}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                    );
                  })
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      {searchText ? `No categories match "${searchText}"` : 'No categories available'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    width: '90%',
    maxHeight: '75%',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#6a12e4ff',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6a12e4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  closeButtonText: {
    marginTop: 0,
  },
  addCategoryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addCategoryInput: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  searchInput: {
    width: '100%',
    height: 48,
    borderColor: '#E5E5E5',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  categoriesList: {
    width: '100%',
    height: 200,
    flexGrow: 0,
  },
  categoryItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  categoryButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    padding: 18,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryName: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  removeButton: {
    marginLeft: 8,
    padding: 5,
  },
  removeButtonText: {
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
}); 