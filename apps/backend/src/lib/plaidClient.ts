import { 
  Configuration, 
  PlaidApi, 
  PlaidEnvironments,
} from 'plaid';

// Create the configuration once
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // .sandbox for dev, .production for launch.
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

// Create and export a single instance of the Plaid client
export const plaidClient = new PlaidApi(configuration);

// Also export as default for backward compatibility
export default plaidClient;
