import { auth } from '../utils/auth';
import prisma from '../lib/prisma';
import getUser from '../lib/getUser';
import { plaidClient } from '../lib/plaidClient';
  
  export const getAccounts = async (req: any, res: any) => {
    try {
        const user = await getUser(req, res); // Checks if user is authenticated, error handling is done in getUser
        
        if (!user) {
            return; // getUser already sent error response
        }
        
        const access_token = user.plaid_access_token

        if (!access_token) {
            return res.status(400).json({ error: 'Access token not found' });
        }

        const response = await plaidClient.accountsGet({
            access_token: access_token
        });

        if (response.status !== 200) {
            return res.status(400).json({ error: 'Failed to remove item' });
        }
        return res.status(200).json({
            institution_name: response.data.item.institution_name,
            accounts: response.data.accounts
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
  }