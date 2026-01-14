
const TOKEN = (import.meta as any).env.VITE_METAAPI_TOKEN;
// Using local Vite proxy to bypass SSL (ERR_CERT_AUTHORITY_INVALID) in development
const PROVISIONING_URL = '/api/metaapi-provisioning';
const CLIENT_URL = '/api/metaapi-client';

const headers = {
  'auth-token': TOKEN,
  'Content-Type': 'application/json'
};

export const metaApiService = {
  async provisionAccount(credentials: { login: string; password: string; server: string; name: string }) {
    try {
      // 1. Check if account already exists
      const accountsResponse = await fetch(`${PROVISIONING_URL}/users/current/accounts`, {
        headers
      });
      const accounts = await accountsResponse.json();
      const existingAccount = accounts.find((a: any) => a.login === credentials.login && a.server === credentials.server);

      if (existingAccount) {
        return existingAccount;
      }

      // 2. Create new account
      const response = await fetch(`${PROVISIONING_URL}/users/current/accounts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: credentials.name,
          type: 'cloud',
          login: credentials.login,
          password: credentials.password,
          server: credentials.server,
          platform: 'mt5',
          application: 'MetaApi',
          magic: 123456 // Optional
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to provision account');
      }

      return await response.json();
    } catch (error) {
      console.error('MetaApi Provision Error:', error);
      throw error;
    }
  },

  async getAccountStatus(accountId: string) {
    const response = await fetch(`${PROVISIONING_URL}/users/current/accounts/${accountId}`, {
      headers
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Account Status Error:', response.status, text);
      throw new Error(`Failed to get account status: ${response.status}`);
    }
    return await response.json();
  },

  async getAccountInfo(accountId: string) {
    try {
      const response = await fetch(`${CLIENT_URL}/users/current/accounts/${accountId}/account-information`, {
        headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        const text = await response.text();
        console.error('Account Info Error:', response.status, text);
        throw new Error(`Failed to fetch account info: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('MetaApi Account Info Error:', error);
      throw error;
    }
  },

  async getHistory(accountId: string) {
    try {
      const response = await fetch(`${CLIENT_URL}/users/current/accounts/${accountId}/history-deals/time/${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}/${new Date().toISOString()}`, {
        headers
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.deals || data; // MetaApi might return {deals: []} or []
    } catch (error) {
      console.error('MetaApi History Error:', error);
      throw error;
    }
  }
};
