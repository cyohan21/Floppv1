import prisma from '../lib/prisma';
import getUser from '../lib/getUser';
import { getUncategorizedCategory, getIncomeCategory } from '../utils/createDefaultCategories';
import { 
  TransactionsSyncRequest,
  Transaction
} from 'plaid';
import { plaidClient } from '../lib/plaidClient';

export const syncTransactions = async (req: any, res: any) => {
  try {
    let user = req.body?.user;
    if (!user) {
      user = await getUser(req, res);
    }
    if (!user.plaid_access_token) {
      return res.status(400).json({ error: 'No Plaid access token found for user' });
    }

    // Call Plaid's transactions/sync API
    console.log('Calling Plaid transactions/sync for user:', user.id);
    console.log('Using cursor:', user.cursor || 'none (initial sync)');
    
    const requestBody: any = {
      access_token: user.plaid_access_token,
    };
    
    if (user.cursor) {
      requestBody.cursor = user.cursor;
    }
    
    const plaidResponse = await plaidClient.transactionsSync(requestBody);

    const { added, modified, removed, next_cursor } = plaidResponse.data;

    console.log(`Syncing transactions for user ${user.id}:`);
    console.log(`- Adding: ${added?.length || 0} transactions`);
    console.log(`- Modifying: ${modified?.length || 0} transactions`);
    console.log(`- Removing: ${removed?.length || 0} transactions`);
    console.log(`- Next cursor: ${next_cursor}`);

    // Get the categories for this user
    const uncategorizedCategory = await getUncategorizedCategory(user.id);
    const incomeCategory = await getIncomeCategory(user.id);

    // Helper function to transform Plaid transaction to our format
    const transformTransaction = (plaidTx: Transaction, includeCategory = false) => {
      // Determine merchant name: use merchant_name if available, else use name
      const merchant = plaidTx.merchant_name || plaidTx.name;
      
      // Determine type: if amount < 0, it's income (money coming in), else expense
      const type = plaidTx.amount < 0 ? 'income' : 'expense';
      
      // Store absolute amount value
      const amount = Math.abs(plaidTx.amount);
      
      // Parse date (only date part, not datetime)
      const date = new Date(plaidTx.date + 'T00:00:00.000Z'); // Ensure it's treated as UTC date
      
      const baseTransaction = {
        id: plaidTx.transaction_id, // Use Plaid transaction_id as primary key
        userId: user.id,
        date: date,
        merchant: merchant,
        currency: plaidTx.iso_currency_code || plaidTx.unofficial_currency_code || 'USD', // Default to USD if both are null
        type: type,
        isPending: plaidTx.pending,
        amount: amount,
        description: plaidTx.name, // Store original name for reference
      };

      // Add category for new transactions
      if (includeCategory) {
        return {
          ...baseTransaction,
          // Income transactions go to Income category, expenses go to Uncategorized
          categoryId: type === 'income' ? incomeCategory.id : uncategorizedCategory.id,
        };
      }

      return baseTransaction;
    };

    // Process added transactions
    if (added && added.length > 0) {
      const addedTransactions = added.map(tx => transformTransaction(tx, true)); // Include category for new transactions
      
      // Use createMany for bulk insert, ignoring duplicates
      await prisma.transaction.createMany({
        data: addedTransactions,
        skipDuplicates: true, // Skip if transactionId already exists
      });
      
      console.log(`✅ Added ${addedTransactions.length} new transactions to uncategorized`);
    }

    // Process modified transactions
    if (modified && modified.length > 0) {
      for (const plaidTx of modified) {
        const transformedTx = transformTransaction(plaidTx);
        
        // Update existing transaction
        await prisma.transaction.upsert({
          where: {
            id: plaidTx.transaction_id,
          },
          update: {
            date: transformedTx.date,
            merchant: transformedTx.merchant,
            currency: transformedTx.currency,
            type: transformedTx.type,
            isPending: transformedTx.isPending,
            amount: transformedTx.amount,
            description: transformedTx.description,
            updatedAt: new Date(),
          },
          create: transformedTx, // Create if it doesn't exist
        });
      }
      
      console.log(`✅ Updated ${modified.length} transactions`);
    }

    // Process removed transactions
    if (removed && removed.length > 0) {
      const removedIds = removed.map(tx => tx.transaction_id);
      
      await prisma.transaction.deleteMany({
        where: {
          id: {
            in: removedIds,
          },
          userId: user.id, // Ensure we only delete user's own transactions
        },
      });
      
      console.log(`✅ Removed ${removed.length} transactions`);
    }

    // Update user's cursor for next sync
    if (next_cursor) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          cursor: next_cursor,
        },
      });
      
      console.log(`✅ Updated user cursor: ${next_cursor}`);
    }

    // Return summary
    return res.status(200).json({
      success: true,
      summary: {
        added: added?.length || 0,
        modified: modified?.length || 0,
        removed: removed?.length || 0,
      },
      cursor: next_cursor,
      message: 'Transactions synchronized successfully',
    });

  } catch (error) {
    console.error('Error syncing transactions:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to sync transactions'
    });
  }
};