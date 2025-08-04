import prisma from '../lib/prisma';
import getUser from '../lib/getUser';

export const categorizeTransaction = async (req: any, res: any) => {
  try {
    const { transactionId, categoryId } = req.body;
    
    if (!transactionId || !categoryId) {
      return res.status(400).json({ 
        error: 'Both transactionId and categoryId are required' 
      });
    }

    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Verify the transaction belongs to the user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id,
      }
    });

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    // Verify the category belongs to the user
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: user.id,
      }
    });

    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found' 
      });
    }

    // Update the transaction's category
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        categoryId: categoryId,
      },
      include: {
        category: true,
      }
    });

    console.log(`Transaction ${transactionId} moved to category: ${category.name}`);

    return res.status(200).json({
      success: true,
      message: `Transaction categorized as ${category.name}`,
      transaction: updatedTransaction,
    });

  } catch (error) {
    console.error('Error categorizing transaction:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to categorize transaction'
    });
  }
};

export const getUncategorizedTransactions = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Get the uncategorized category
    const uncategorizedCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        isHidden: true,
        name: 'Uncategorized'
      }
    });

    if (!uncategorizedCategory) {
      return res.status(404).json({ 
        error: 'Uncategorized category not found' 
      });
    }

    // Get all expense transactions in the uncategorized category (exclude income)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        categoryId: uncategorizedCategory.id,
        type: 'expense', // Only expense transactions for swipe screen
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      transactions: transactions,
      count: transactions.length,
    });

  } catch (error) {
    console.error('Error fetching uncategorized transactions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch uncategorized transactions'
    });
  }
};

export const getUserCategories = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Get all visible categories for the user (excluding uncategorized and income)
    const categories = await prisma.category.findMany({
      where: {
        userId: user.id,
        isHidden: false, // Only show visible categories
        NOT: {
          name: 'Income' // Exclude Income category from swipe screen
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      categories: categories,
    });

  } catch (error) {
    console.error('Error fetching user categories:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
};

export const uncategorizeTransaction = async (req: any, res: any) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ 
        error: 'transactionId is required' 
      });
    }

    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Get the uncategorized category
    const uncategorizedCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        isHidden: true,
        name: 'Uncategorized'
      }
    });

    if (!uncategorizedCategory) {
      return res.status(404).json({ 
        error: 'Uncategorized category not found' 
      });
    }

    // Verify the transaction belongs to the user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id,
      }
    });

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    // Move transaction back to uncategorized
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        categoryId: uncategorizedCategory.id,
      },
      include: {
        category: true,
      }
    });

    console.log(`Transaction ${transactionId} moved back to uncategorized`);

    return res.status(200).json({
      success: true,
      message: 'Transaction uncategorized successfully',
      transaction: updatedTransaction,
    });

  } catch (error) {
    console.error('Error uncategorizing transaction:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to uncategorize transaction'
    });
  }
};

export const getCategorizedTransactions = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Get categories to exclude (uncategorized and income)
    const [uncategorizedCategory, incomeCategory] = await Promise.all([
      prisma.category.findFirst({
        where: {
          userId: user.id,
          isHidden: true,
          name: 'Uncategorized'
        }
      }),
      prisma.category.findFirst({
        where: {
          userId: user.id,
          name: 'Income'
        }
      })
    ]);

    const excludedCategoryIds = [
      uncategorizedCategory?.id,
      incomeCategory?.id
    ].filter(Boolean) as string[];

    // Get all expense transactions that are NOT in excluded categories (for analytics)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense', // Only expense transactions for analytics
        categoryId: {
          notIn: excludedCategoryIds
        },
        // Exclude transactions with no category at all
        NOT: {
          categoryId: null
        }
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      transactions: transactions,
      count: transactions.length,
    });

  } catch (error) {
    console.error('Error fetching categorized transactions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch categorized transactions'
    });
  }
};