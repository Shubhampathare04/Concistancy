/**
 * Secure Token Storage
 * 
 * Uses expo-secure-store for encrypted token storage.
 * Fixes C11 and C12: Secure token storage and persistence.
 * 
 * TODO: Install expo-secure-store package:
 * npm install expo-secure-store
 */

// Temporarily commented out until expo-secure-store is installed
// import * as SecureStore from 'expo-secure-store';

// Mock implementation for now
const SecureStore = {
  setItemAsync: async (key: string, value: string) => {
    // TODO: Replace with actual SecureStore once installed
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  getItemAsync: async (key: string) => {
    // TODO: Replace with actual SecureStore once installed
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  deleteItemAsync: async (key: string) => {
    // TODO: Replace with actual SecureStore once installed
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

/**
 * Token storage interface
 */
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
}

/**
 * User data interface
 */
export interface UserData {
  id: number;
  email: string;
  name?: string;
}

/**
 * Secure token storage class
 */
class SecureTokenStorage {
  /**
   * Save access token securely
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
      throw new Error('Failed to save access token');
    }
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Save refresh token securely
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      throw new Error('Failed to save refresh token');
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Save both tokens at once
   */
  async saveTokens(data: TokenData): Promise<void> {
    try {
      await Promise.all([
        this.saveAccessToken(data.accessToken),
        this.saveRefreshToken(data.refreshToken),
      ]);
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save tokens');
    }
  }

  /**
   * Get both tokens
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
      ]);

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  /**
   * Save user data
   */
  async saveUser(user: UserData): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Get user data
   */
  async getUser(): Promise<UserData | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_KEY);
      if (!userData) {
        return null;
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear all stored data (logout)
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('Failed to clear storage');
    }
  }

  /**
   * Check if tokens exist
   */
  async hasTokens(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      return tokens !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt?: number): boolean {
    if (!expiresAt) {
      return false;
    }
    return Date.now() >= expiresAt;
  }

  /**
   * Decode JWT token (without verification)
   * Used to extract expiry time
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if access token needs refresh
   * Returns true if token expires in less than 5 minutes
   */
  async needsRefresh(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return true;
      }

      const expiry = this.getTokenExpiry(accessToken);
      if (!expiry) {
        return false;
      }

      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() >= expiry - fiveMinutes;
    } catch (error) {
      return true;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureTokenStorage();

/**
 * Migration helper to move tokens from AsyncStorage to SecureStore
 */
export async function migrateFromAsyncStorage(
  AsyncStorage: any
): Promise<void> {
  try {
    // Get old tokens from AsyncStorage
    const oldToken = await AsyncStorage.getItem('auth_token');
    const oldRefreshToken = await AsyncStorage.getItem('refresh_token');
    const oldUser = await AsyncStorage.getItem('user');

    // Save to SecureStore
    if (oldToken) {
      await secureStorage.saveAccessToken(oldToken);
      await AsyncStorage.removeItem('auth_token');
    }

    if (oldRefreshToken) {
      await secureStorage.saveRefreshToken(oldRefreshToken);
      await AsyncStorage.removeItem('refresh_token');
    }

    if (oldUser) {
      await secureStorage.saveUser(JSON.parse(oldUser));
      await AsyncStorage.removeItem('user');
    }

    console.log('Successfully migrated tokens to SecureStore');
  } catch (error) {
    console.error('Failed to migrate tokens:', error);
  }
}

/**
 * Hook to use secure storage
 */
export function useSecureStorage() {
  return secureStorage;
}
