import { auth } from '../utils/auth';
import prisma  from '../lib/prisma';
import getUser from '../lib/getUser';
import { createDefaultCategories } from '../utils/createDefaultCategories';
import { syncTransactions } from './syncTransactions';
import { plaidClient } from '../lib/plaidClient';

export const exchangePublicToken = async (req: any, res: any, next: any) => {
  try {
    const { public_token } = req.body;
    
    if (!public_token) {
      return res.status(400).json({ error: 'public_token is required' });
    }

    // Exchange public token for access token
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const { access_token, item_id } = response.data;
    const user = await getUser(req, res);

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        plaid_access_token: access_token,
        plaid_item_id: item_id,
        isBankConnected: true
      }
    });

    // Create default categories for the user
    await createDefaultCategories(user.id);

    console.log("User successfully updated with plaid_access_token and plaid_item_id.");
    
    // Automatically sync transactions after successful bank connection
    console.log('🔄 Automatically syncing transactions for newly connected bank...');
    try {
      // Create a mock request/response object for syncTransactions
      const syncReq = { 
        ...req,
        headers: req.headers // Preserve auth headers
      };
      const syncRes = {
        status: (code: number) => ({ json: (data: any) => console.log(`Sync response (${code}):`, data) }),
        json: (data: any) => console.log('Sync success:', data)
      };
      
      await syncTransactions(syncReq, syncRes);
      console.log('✅ Initial transaction sync completed successfully');
    } catch (syncError) {
      console.error('⚠️ Error during initial transaction sync:', syncError);
      // Don't fail the main connection process if sync fails
      // The user can manually sync later
    }
    
    console.log('Token exchanged successfully:', { access_token, item_id });
    
    res.json({ 
      success: true, 
      message: 'Token exchanged successfully',
      // Don't return access_token to frontend for security
    });
    
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    const errorMsg = new Error("Could not exchange public token: " + error.message);
    (errorMsg as any).status = 500;
    return next(errorMsg);
  }
};
