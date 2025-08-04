import prisma from '../lib/prisma';
import getUser from '../lib/getUser';

interface OnboardingProgress {
  currencySelected: boolean;
  bankConnected: boolean;
  transactionsSwiped: number;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  currency: string | null;
}

export const getUserProgress = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    // Check if currency is selected (not null)
    const currencySelected = user.currency !== null;

    // Check if bank is connected
    const bankConnected = user.isBankConnected;

    // Count categorized transactions (excluding uncategorized and income)
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

    const transactionsSwiped = await prisma.transaction.count({
      where: {
        userId: user.id,
        type: 'expense', // Only expense transactions count as "swiped"
        categoryId: {
          notIn: excludedCategoryIds
        },
        // Exclude transactions with no category at all
        NOT: {
          categoryId: null
        }
      }
    });

    // Calculate progress
    const completedTasks = [currencySelected, bankConnected, transactionsSwiped >= 5]
      .filter(Boolean).length;
    const totalTasks = 3;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

    const progress: OnboardingProgress = {
      currencySelected,
      bankConnected,
      transactionsSwiped,
      completedTasks,
      totalTasks,
      progressPercentage,
      currency: user.currency
    };

    console.log(`User ${user.id} progress:`, progress);

    return res.status(200).json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch user progress'
    });
  }
};

export const updateUserCurrency = async (req: any, res: any) => {
  try {
    const { currency } = req.body;
    
    if (!currency || !['USD', 'CAD'].includes(currency)) {
      return res.status(400).json({ error: 'Valid currency (USD or CAD) is required' });
    }

    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { currency }
    });

    console.log(`User ${user.id} currency updated to:`, currency);

    return res.status(200).json({
      success: true,
      message: 'Currency updated successfully',
      currency: updatedUser.currency
    });

  } catch (error) {
    console.error('Error updating user currency:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update currency'
    });
  }
};

export const markWalkthroughCompleted = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    if (!user) {
      return; // getUser already sent error response
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { walkthroughCompleted: true }
    });

    console.log(`User ${user.id} walkthrough completed`);

    return res.status(200).json({
      success: true,
      message: 'Walkthrough completion recorded'
    });

  } catch (error) {
    console.error('Error marking walkthrough completed:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to record walkthrough completion'
    });
  }
};