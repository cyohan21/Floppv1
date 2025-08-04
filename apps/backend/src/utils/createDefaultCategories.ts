import prisma  from '../lib/prisma';

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#FF6B6B', isHidden: false },
  { name: 'Shopping', color: '#4ECDC4', isHidden: false },
  { name: 'Transportation', color: '#45B7D1', isHidden: false },
  { name: 'Entertainment', color: '#FFA726', isHidden: false },
  { name: 'Bills & Utilities', color: '#AB47BC', isHidden: false },
  { name: 'Healthcare', color: '#66BB6A', isHidden: false },
  { name: 'Income', color: '#26A69A', isHidden: false },
  { name: 'Uncategorized', color: '#9E9E9E', isHidden: true },
];

export async function createDefaultCategories(userId: string) {
  try {
    // Check if user already has categories
    const existingCategories = await prisma.category.findMany({
      where: { userId }
    });

    if (existingCategories.length > 0) {
      console.log(`User ${userId} already has categories, skipping creation`);
      return existingCategories;
    }

    // Create all default categories for the user
    const createdCategories = await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(category => ({
        ...category,
        userId
      }))
    });

    console.log(`Created ${createdCategories.count} default categories for user ${userId}`);

    // Return the created categories
    const categories = await prisma.category.findMany({
      where: { userId }
    });

    return categories;
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
}

export async function getUncategorizedCategory(userId: string) {
  try {
    const uncategorizedCategory = await prisma.category.findFirst({
      where: {
        userId,
        isHidden: true,
        name: 'Uncategorized'
      }
    });

    if (!uncategorizedCategory) {
      throw new Error('Uncategorized category not found for user');
    }

    return uncategorizedCategory;
  } catch (error) {
    console.error('Error finding uncategorized category:', error);
    throw error;
  }
}

export async function getIncomeCategory(userId: string) {
  try {
    const incomeCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: 'Income'
      }
    });

    if (!incomeCategory) {
      throw new Error('Income category not found for user');
    }

    return incomeCategory;
  } catch (error) {
    console.error('Error finding income category:', error);
    throw error;
  }
}