import { 
  LinkTokenCreateRequest, 
  Products, 
  DepositoryAccountSubtype, 
  CreditAccountSubtype, 
  CountryCode
} from 'plaid';
import getUser from '../lib/getUser';
import { plaidClient } from '../lib/plaidClient';

export const createLinkToken = async (req: any, res: any, next: any) => {

try {
  const { requested_days } = req.body
  const user = await getUser(req, res);
  const platform = req.headers['x-device-platform'];
  let android_package_name;
  let redirect_uri;
  if (platform === 'ios') {
    redirect_uri = `${process.env.FRONTEND_URL}/plaid`
  }
  else if (platform === 'android') {
    android_package_name = process.env.ANDROID_PACKAGE_NAME || "com.example.myapp"
  }

  const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: user.id
      },
      client_name: process.env.APP_NAME || 'MyApp',
      products: [Products.Transactions],
      transactions: {
        days_requested: requested_days || 30
      },
      country_codes: [CountryCode.Us, CountryCode.Ca],
      language: 'en',
              webhook: `${process.env.BACKEND_URL}/api/plaid/transactions/updates`,
      android_package_name, // Must be removed or blank when using IOS
      redirect_uri,
      account_filters: {
        depository: {
          account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings]
        }
      }
    };
    const response = await plaidClient.linkTokenCreate(request);
    const linkToken = response.data.link_token;
    res.json({ linkToken });
    console.log(`Link Token:` + linkToken)
  } 
    catch (err: any) {
      const error = new Error("Could not create link token: " + err.message);
      (error as any).status = 500;
      return next(error);
    }
  };