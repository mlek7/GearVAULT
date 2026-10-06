import fs from 'fs';
import path from 'path';
import { sanitizeVaultData, sanitizeAllVaultFilesOnDisk } from './demoCleanup';

export interface ServerUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'apple' | 'github';
  role?: string;
  studioName?: string;
  createdAt: string;
  lastLoginAt: string;
  githubUsername?: string;
  githubToken?: string;
  githubGistId?: string;
  githubLastSyncAt?: string;
}

export interface ServerAccountRecord {
  user: ServerUserProfile;
  passwordHash?: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const VAULTS_DIR = path.join(DATA_DIR, 'vaults');

function ensureDataDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VAULTS_DIR)) {
    fs.mkdirSync(VAULTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    // Initialize with empty array
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  // Sanitize any existing vaults on startup
  sanitizeAllVaultFilesOnDisk(VAULTS_DIR);
}

export const AccountDb = {
  getAccounts(): ServerAccountRecord[] {
    try {
      ensureDataDirectories();
      const content = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      if (!content.trim()) return [];
      return JSON.parse(content) as ServerAccountRecord[];
    } catch (err) {
      console.error('Error reading accounts database:', err);
      return [];
    }
  },

  saveAccounts(accounts: ServerAccountRecord[]): void {
    try {
      ensureDataDirectories();
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing accounts database:', err);
    }
  },

  findAccountByEmail(email: string): ServerAccountRecord | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    return accounts.find((a) => a.user.email.toLowerCase() === cleanEmail);
  },

  registerAccount(params: {
    email: string;
    name: string;
    password?: string;
    provider?: 'email' | 'google' | 'apple' | 'github';
    studioName?: string;
    role?: string;
    avatarUrl?: string;
  }): ServerUserProfile {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Valid email address is required.');
    }
    if (!cleanName) {
      throw new Error('Full name is required.');
    }

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.user.email.toLowerCase() === cleanEmail);

    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const provider = params.provider || 'email';
    const now = new Date().toISOString();
    const user: ServerUserProfile = {
      id: `usr_${provider}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: cleanName,
      avatarUrl:
        params.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      provider,
      role: params.role || 'Member Photographer',
      studioName: params.studioName || `${cleanName.split(' ')[0]} Photography`,
      createdAt: now,
      lastLoginAt: now,
    };

    accounts.push({
      user,
      passwordHash: params.password,
      updatedAt: now,
    });

    this.saveAccounts(accounts);
    return user;
  },

  loginAccount(email: string, password?: string): ServerUserProfile {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.user.email.toLowerCase() === cleanEmail);

    if (!account) {
      throw new Error('No account found with this email on the server. Please check your spelling or register a new account.');
    }

    if (account.passwordHash) {
      if (!password) {
        throw new Error('Password is required to sign in to this account.');
      }
      if (account.passwordHash !== password) {
        throw new Error('Incorrect password. Please verify your credentials.');
      }
    }

    // Update lastLoginAt
    account.user.lastLoginAt = new Date().toISOString();
    account.updatedAt = new Date().toISOString();
    this.saveAccounts(accounts);

    return account.user;
  },

  upsertSocialAccount(params: {
    email: string;
    name: string;
    provider: 'google' | 'apple' | 'github';
    password?: string;
    avatarUrl?: string;
    studioName?: string;
    githubUsername?: string;
    githubToken?: string;
  }): ServerUserProfile {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.name.trim();

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.user.email.toLowerCase() === cleanEmail);

    const now = new Date().toISOString();

    if (existing) {
      // If password protection was configured, verify it
      if (existing.passwordHash && params.password && existing.passwordHash !== params.password) {
        throw new Error(`Incorrect password for this ${params.provider} account.`);
      }

      existing.user.name = cleanName || existing.user.name;
      existing.user.lastLoginAt = now;
      if (params.password && !existing.passwordHash) {
        existing.passwordHash = params.password;
      }
      if (params.githubUsername) existing.user.githubUsername = params.githubUsername;
      if (params.githubToken) existing.user.githubToken = params.githubToken;
      if (params.avatarUrl) existing.user.avatarUrl = params.avatarUrl;

      existing.updatedAt = now;
      this.saveAccounts(accounts);
      return existing.user;
    }

    const user: ServerUserProfile = {
      id: `usr_${params.provider}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: cleanName,
      avatarUrl:
        params.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      provider: params.provider,
      role: 'Pro Photographer',
      studioName: params.studioName || `${cleanName.split(' ')[0]} Imagery`,
      createdAt: now,
      lastLoginAt: now,
      githubUsername: params.githubUsername,
      githubToken: params.githubToken,
    };

    accounts.push({
      user,
      passwordHash: params.password,
      updatedAt: now,
    });

    this.saveAccounts(accounts);
    return user;
  },

  mergeLocalAccounts(incomingAccounts: { user: ServerUserProfile; passwordHash?: string }[]): number {
    if (!Array.isArray(incomingAccounts) || incomingAccounts.length === 0) return 0;
    const accounts = this.getAccounts();
    let mergedCount = 0;

    for (const incoming of incomingAccounts) {
      if (!incoming.user || !incoming.user.email) continue;
      const cleanEmail = incoming.user.email.trim().toLowerCase();
      const existing = accounts.find((a) => a.user.email.toLowerCase() === cleanEmail);

      if (!existing) {
        accounts.push({
          user: incoming.user,
          passwordHash: incoming.passwordHash,
          updatedAt: new Date().toISOString(),
        });
        mergedCount++;
      } else {
        // Update passwordHash if server didn't have one
        if (!existing.passwordHash && incoming.passwordHash) {
          existing.passwordHash = incoming.passwordHash;
        }
      }
    }

    if (mergedCount > 0) {
      this.saveAccounts(accounts);
    }
    return mergedCount;
  },

  // Cross-device Vault Sync (Shoots & Gear)
  saveVault(userIdOrEmail: string, vaultData: any): void {
    ensureDataDirectories();
    const safeKey = encodeURIComponent(userIdOrEmail.toLowerCase().trim());
    const filePath = path.join(VAULTS_DIR, `${safeKey}.json`);
    const cleaned = sanitizeVaultData(vaultData);
    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
  },

  getVault(userIdOrEmail: string): any | null {
    try {
      ensureDataDirectories();
      const safeKey = encodeURIComponent(userIdOrEmail.toLowerCase().trim());
      const filePath = path.join(VAULTS_DIR, `${safeKey}.json`);
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      return sanitizeVaultData(parsed);
    } catch {
      return null;
    }
  },
};
