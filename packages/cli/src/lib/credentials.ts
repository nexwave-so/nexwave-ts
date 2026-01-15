// keytar may not be available on all systems
let keytar: typeof import('keytar') | null = null;
try {
  keytar = require('keytar');
} catch {
  // keytar not available, will use file fallback
}
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import crypto from 'crypto';

const SERVICE_NAME = 'nexwave-cli';
const CREDENTIALS_FILE = join(os.homedir(), '.nexwave', 'credentials.json');

// Simple encryption key derived from machine ID
function getEncryptionKey(): Buffer {
  const machineId = os.hostname() + os.platform() + os.arch();
  return crypto.createHash('sha256').update(machineId).digest();
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

interface StoredCredentials {
  endpoint: string;
  apiKey: string;
}

/**
 * Credential storage manager with keytar fallback to encrypted file
 */
export class CredentialManager {
  private useKeytar: boolean;

  constructor() {
    // Check if keytar is available (may fail on some systems)
    this.useKeytar = false;
    try {
      // Test keytar availability - it may not be installed or may fail to load
      if (keytar && typeof keytar.getPassword === 'function') {
        this.useKeytar = true;
      }
    } catch {
      // keytar may not be available (e.g., on some Linux systems without keyring)
      this.useKeytar = false;
    }
  }

  /**
   * Store credentials
   */
  async store(endpoint: string, apiKey: string): Promise<void> {
    if (this.useKeytar && keytar) {
      try {
        await keytar.setPassword(SERVICE_NAME, 'endpoint', endpoint);
        await keytar.setPassword(SERVICE_NAME, 'apiKey', apiKey);
        return;
      } catch (error) {
        // Fallback to file if keytar fails
        console.warn('⚠ Keychain access failed, using encrypted file storage');
        this.useKeytar = false;
      }
    }

    // Fallback to encrypted file
    const credentials: StoredCredentials = { endpoint, apiKey };
    const encrypted = encrypt(JSON.stringify(credentials));
    
    const dir = join(os.homedir(), '.nexwave');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(CREDENTIALS_FILE, encrypted, 'utf8');
  }

  /**
   * Retrieve credentials
   */
  async retrieve(): Promise<{ endpoint: string; apiKey: string } | null> {
    if (this.useKeytar && keytar) {
      try {
        const endpoint = await keytar.getPassword(SERVICE_NAME, 'endpoint');
        const apiKey = await keytar.getPassword(SERVICE_NAME, 'apiKey');
        
        if (endpoint && apiKey) {
          return { endpoint, apiKey };
        }
      } catch (error) {
        // Fallback to file if keytar fails
        this.useKeytar = false;
      }
    }

    // Fallback to encrypted file
    if (existsSync(CREDENTIALS_FILE)) {
      try {
        const encrypted = readFileSync(CREDENTIALS_FILE, 'utf8');
        const decrypted = decrypt(encrypted);
        const credentials: StoredCredentials = JSON.parse(decrypted);
        return credentials;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * Clear stored credentials
   */
  async clear(): Promise<void> {
    if (this.useKeytar && keytar) {
      try {
        await keytar.deletePassword(SERVICE_NAME, 'endpoint');
        await keytar.deletePassword(SERVICE_NAME, 'apiKey');
      } catch (error) {
        // Continue to clear file even if keytar fails
      }
    }

    // Clear file storage
    if (existsSync(CREDENTIALS_FILE)) {
      try {
        writeFileSync(CREDENTIALS_FILE, '', 'utf8');
      } catch (error) {
        // Ignore errors
      }
    }
  }

  /**
   * Check if credentials are stored
   */
  async hasCredentials(): Promise<boolean> {
    const creds = await this.retrieve();
    return creds !== null;
  }
}

// Singleton instance
let credentialManager: CredentialManager | null = null;

/**
 * Get the global credential manager instance
 */
export function getCredentialManager(): CredentialManager {
  if (!credentialManager) {
    credentialManager = new CredentialManager();
  }
  return credentialManager;
}

/**
 * Get credentials from environment variables or stored credentials
 */
export async function getCredentials(): Promise<{ endpoint: string; apiKey: string } | null> {
  // Environment variables take precedence
  const envEndpoint = process.env.NEXWAVE_ENDPOINT;
  const envApiKey = process.env.NEXWAVE_API_KEY;

  if (envEndpoint && envApiKey) {
    return { endpoint: envEndpoint, apiKey: envApiKey };
  }

  // Fall back to stored credentials
  const manager = getCredentialManager();
  return await manager.retrieve();
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('nxw_');
}
