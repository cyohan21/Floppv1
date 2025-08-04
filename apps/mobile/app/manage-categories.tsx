import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { plaidService } from './services/plaidService';

interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface CategoryData {
  success: boolean;
  categories: Category[];
  maxCategories: number;
  currentCount: number;
}

export default function ManageCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCategories, setMaxCategories] = useState(20);
  const [currentCount, setCurrentCount] = useState(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ff4444');
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();

  const COLORS = [
    '#ff4444', '#ff8800', '#ffcc00', '#88dd44', '#44dd88', 
    '#44dddd', '#4488dd', '#8844dd', '#dd44dd', '#dd4488',
    '#ff6b6b', '#ffa500', '#32cd32', '#1e90ff', '#9932cc',
    '#ff1493', '#00ced1', '#ff6347', '#adff2f', '#ba55d3'
  ];

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response: CategoryData = await plaidService.getManageableCategories();
      
      // Get stored category order from AsyncStorage
      const storedOrder = await getCategoryOrder();
      const orderedCategories = applyCategoryOrder(response.categories, storedOrder);
      
      setCategories(orderedCategories);
      setMaxCategories(response.maxCategories);
      setCurrentCount(response.currentCount);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Get stored category order from AsyncStorage
  const getCategoryOrder = async (): Promise<string[]> => {
    try {
      const stored = await AsyncStorage.getItem('categoryOrder');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading category order:', error);
      return [];
    }
  };

  // Save category order to AsyncStorage
  const saveCategoryOrder = async (categoryIds: string[]) => {
    try {
      await AsyncStorage.setItem('categoryOrder', JSON.stringify(categoryIds));
    } catch (error) {
      console.error('Error saving category order:', error);
    }
  };

  // Apply stored order to categories, putting unordered ones at the end
  const applyCategoryOrder = (categories: Category[], order: string[]): Category[] => {
    if (order.length === 0) return categories;

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const orderedCategories: Category[] = [];
    const unorderedCategories: Category[] = [];

    // Add categories in stored order
    order.forEach(id => {
      const category = categoryMap.get(id);
      if (category) {
        orderedCategories.push(category);
        categoryMap.delete(id);
      }
    });

    // Add any remaining categories that weren't in the stored order
    categoryMap.forEach(category => {
      unorderedCategories.push(category);
    });

    return [...orderedCategories, ...unorderedCategories];
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setCategoryName('');
    setSelectedColor('#ff4444');
    setEditingCategory(null);
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      setSubmitting(true);
      await plaidService.createCategory(categoryName.trim(), selectedColor);
      Alert.alert('Success', 'Category created successfully');
      setShowCreateModal(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Error creating category:', error);
      Alert.alert('Error', error.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !editingCategory) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      setSubmitting(true);
      await plaidService.updateCategory(editingCategory.id, categoryName.trim(), selectedColor);
      Alert.alert('Success', 'Category updated successfully');
      setShowEditModal(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      console.error('Error updating category:', error);
      Alert.alert('Error', error.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? All transactions in this category will be moved to uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await plaidService.deleteCategory(category.id);
              Alert.alert('Success', 'Category deleted successfully');
              loadCategories();
            } catch (error: any) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedColor(category.color);
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleMoveUp = async (category: Category) => {
    const currentIndex = categories.findIndex(cat => cat.id === category.id);
    
    if (currentIndex <= 0) return; // Already at top or not found
    
    const newCategories = [...categories];
    
    // Swap with previous item
    [newCategories[currentIndex - 1], newCategories[currentIndex]] = 
    [newCategories[currentIndex], newCategories[currentIndex - 1]];
    
    setCategories(newCategories);
    
    // Save new order to AsyncStorage
    const categoryIds = newCategories.map(cat => cat.id);
    await saveCategoryOrder(categoryIds);
  };

  const handleMoveDown = async (category: Category) => {
    const currentIndex = categories.findIndex(cat => cat.id === category.id);
    
    if (currentIndex >= categories.length - 1 || currentIndex === -1) return; // Already at bottom or not found
    
    const newCategories = [...categories];
    
    // Swap with next item
    [newCategories[currentIndex], newCategories[currentIndex + 1]] = 
    [newCategories[currentIndex + 1], newCategories[currentIndex]];
    
    setCategories(newCategories);
    
    // Save new order to AsyncStorage
    const categoryIds = newCategories.map(cat => cat.id);
    await saveCategoryOrder(categoryIds);
  };

  const renderColorPicker = () => (
    <View style={styles.colorPicker}>
      <Text style={styles.colorPickerTitle}>Choose Color:</Text>
      <View style={styles.colorGrid}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color ? styles.selectedColorOption : null
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color ? (
              <Feather name="check" size={16} color="white" />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategoryModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Category' : 'Create Category'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                isEdit ? setShowEditModal(false) : setShowCreateModal(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter category name"
              value={categoryName}
              onChangeText={setCategoryName}
              maxLength={50}
              autoFocus
            />
            
            {renderColorPicker()}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  isEdit ? setShowEditModal(false) : setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={isEdit ? handleEditCategory : handleCreateCategory}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEdit ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a12e4ff" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Categories</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>{currentCount || 0} of {maxCategories || 20} categories</Text>
        {currentCount >= maxCategories ? (
          <Text style={styles.limitText}>Category limit reached</Text>
        ) : null}
      </View>

      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySubtitle}>Create your first category to start organizing transactions</Text>
          </View>
        ) : (
          categories.map((category, index) => (
            <View key={category.id || `category-${index}`} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: category.color || '#6a12e4ff' }]} />
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameContainer}>
                    <Text style={styles.categoryName}>{category.name || 'Untitled Category'}</Text>
                    {index < 7 ? (
                      <View style={styles.mainIndicator}>
                        <Feather name="star" size={14} color="#6a12e4ff" />
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={[styles.actionButton, index === 0 ? styles.disabledButton : null]}
                  onPress={() => handleMoveUp(category)}
                  disabled={index === 0}
                >
                  <Feather name="chevron-up" size={18} color={index === 0 ? "#ccc" : "#6a12e4ff"} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, index === categories.length - 1 ? styles.disabledButton : null]}
                  onPress={() => handleMoveDown(category)}
                  disabled={index === categories.length - 1}
                >
                  <Feather name="chevron-down" size={18} color={index === categories.length - 1 ? "#ccc" : "#6a12e4ff"} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(category)}
                >
                  <Feather name="edit-2" size={18} color="#6a12e4ff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteCategory(category)}
                >
                  <Feather name="trash-2" size={18} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createButton, currentCount >= maxCategories ? styles.createButtonDisabled : null]}
        onPress={openCreateModal}
        disabled={currentCount >= maxCategories}
      >
        <Feather name="plus" size={24} color="white" />
        <Text style={styles.createButtonText}>Create Category</Text>
      </TouchableOpacity>

      {renderCategoryModal(false)}
      {renderCategoryModal(true)}
    </View>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  countText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  limitText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  mainIndicator: {
    marginLeft: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6a12e4ff',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  colorPicker: {
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#6a12e4ff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 