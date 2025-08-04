import prisma from '../lib/prisma';
import getUser from '../lib/getUser';

const CATEGORY_COLORS = [
  '#ff4444', '#ff8800', '#ffcc00', '#88dd44', '#44dd88', 
  '#44dddd', '#4488dd', '#8844dd', '#dd44dd', '#dd4488',
  '#ff6b6b', '#ffa500', '#32cd32', '#1e90ff', '#9932cc',
  '#ff1493', '#00ced1', '#ff6347', '#adff2f', '#ba55d3'
];

const MAX_CATEGORIES = 20; // Excluding system categories

export const getUserCategories = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        isHidden: false, // Don't include system categories like uncategorized
        NOT: {
          name: 'Income' // Also exclude Income from manageable categories
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      categories,
      maxCategories: MAX_CATEGORIES,
      currentCount: categories.length
    });

  } catch (error) {
    console.error('Error fetching user categories:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
};

export const createCategory = async (req: any, res: any) => {
  try {
    const { name, color } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Category name must be 50 characters or less' });
    }

    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Check if user has reached category limit
    const existingCategories = await prisma.category.count({
      where: {
        userId: user.id,
        isHidden: false
      }
    });

    if (existingCategories >= MAX_CATEGORIES) {
      return res.status(400).json({ 
        error: 'Category limit reached',
        message: `You can only have up to ${MAX_CATEGORIES} categories`
      });
    }

    // Check if category name already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
      }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }

    // Use provided color or assign next available color
    const categoryColor = color || CATEGORY_COLORS[existingCategories % CATEGORY_COLORS.length];

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        color: categoryColor,
        userId: user.id,
        isHidden: false
      }
    });

    console.log(`User ${user.id} created category: ${newCategory.name}`);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create category'
    });
  }
};

export const updateCategory = async (req: any, res: any) => {
  try {
    const { categoryId } = req.params;
    const { name, color } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Category name must be 50 characters or less' });
    }

    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: user.id,
        isHidden: false // Don't allow editing system categories
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: 'Category not found or cannot be edited'
      });
    }

    // Check if new name conflicts with existing category (excluding current one)
    const nameConflict = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: name.trim(),
        id: { not: categoryId }
      }
    });

    if (nameConflict) {
      return res.status(400).json({ 
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        ...(color && { color: color })
      }
    });

    console.log(`User ${user.id} updated category ${categoryId}: ${updatedCategory.name}`);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update category'
    });
  }
};

export const deleteCategory = async (req: any, res: any) => {
  try {
    const { categoryId } = req.params;
    
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: user.id,
        isHidden: false // Don't allow deleting system categories
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: 'Category not found or cannot be deleted'
      });
    }

    // Get uncategorized category to move transactions to
    const uncategorizedCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        isHidden: true,
        name: 'Uncategorized'
      }
    });

    if (!uncategorizedCategory) {
      return res.status(500).json({ 
        error: 'System error',
        message: 'Uncategorized category not found'
      });
    }

    // Move all transactions from this category to uncategorized
    await prisma.transaction.updateMany({
      where: {
        categoryId: categoryId,
        userId: user.id
      },
      data: {
        categoryId: uncategorizedCategory.id
      }
    });

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId }
    });

    console.log(`User ${user.id} deleted category ${categoryId}: ${existingCategory.name}`);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully. All transactions moved to uncategorized.'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete category'
    });
  }
};