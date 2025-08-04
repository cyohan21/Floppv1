import prisma from '../lib/prisma';
import getUser from '../lib/getUser';

export const getTransactions = async (req: any, res: any) => {
  try {
    const user = await getUser(req, res);
    
    if (!user) {
      return; // getUser already sent error response
    }

    // Get query parameters for pagination
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    // Fetch transactions ordered by date (most recent first)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        date: 'desc', // Most recent first
      },
      take: limitNum,
      skip: offsetNum,
      include: {
        category: true, // Include category information if available
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: {
        userId: user.id,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: totalCount,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalCount,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to fetch transactions'
    });
  }
};