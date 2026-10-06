import {
  GearItem,
  Shoot,
  PackingItem,
  MoodboardItem,
  AppSettings,
  VaultBackupPayload,
  UserProfile,
} from '../types';
import { StorageService } from './storage';

const GITHUB_TOKEN_KEY = 'shutterhub_github_token';
const GITHUB_GIST_ID_KEY = 'shutterhub_github_gist_id';
const GITHUB_LAST_SYNC_KEY = 'shutterhub_github_last_sync';
const GITHUB_AUTO_SYNC_KEY = 'shutterhub_github_auto_sync';
const GIST_FILENAME = 'photo-gear-vault-data.json';
const GIST_DESCRIPTION = 'Photo Gear Vault & Shoot Manager - Vault Data Sync (Private Backup)';

export interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  email: string | null;
  bio: string | null;
  public_repos: number;
}

export interface GitHubSyncResult {
  success: boolean;
  gistId?: string;
  gistUrl?: string;
  rawUrl?: string;
  syncedAt: string;
  itemCounts?: {
    gear: number;
    shoots: number;
    packing: number;
    moodboards: number;
  };
  error?: string;
}

export const GitHubService = {
  getToken(): string | null {
    try {
      return localStorage.getItem(GITHUB_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
      } else {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
      }
    } catch (err) {
      console.warn('Error saving GitHub token:', err);
    }
  },

  getStoredGistId(): string | null {
    try {
      return localStorage.getItem(GITHUB_GIST_ID_KEY);
    } catch {
      return null;
    }
  },

  setStoredGistId(gistId: string | null): void {
    try {
      if (gistId) {
        localStorage.setItem(GITHUB_GIST_ID_KEY, gistId);
      } else {
        localStorage.removeItem(GITHUB_GIST_ID_KEY);
      }
    } catch (err) {
      console.warn('Error saving Gist ID:', err);
    }
  },

  getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(GITHUB_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  },

  setLastSyncTime(isoTime: string): void {
    try {
      localStorage.setItem(GITHUB_LAST_SYNC_KEY, isoTime);
    } catch (err) {
      console.warn('Error saving last sync time:', err);
    }
  },

  isAutoSyncEnabled(): boolean {
    try {
      const val = localStorage.getItem(GITHUB_AUTO_SYNC_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  setAutoSyncEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(GITHUB_AUTO_SYNC_KEY, String(enabled));
    } catch (err) {
      console.warn('Error saving auto sync pref:', err);
    }
  },

  getSyncMetadata(): { lastSyncedAt: string | null; gistId: string | null; gistHtmlUrl: string | null } {
    const gistId = this.getStoredGistId();
    return {
      lastSyncedAt: this.getLastSyncTime(),
      gistId,
      gistHtmlUrl: gistId ? `https://gist.github.com/${gistId}` : null,
    };
  },

  async pushToGist(
    user?: UserProfile | null,
    customPayload?: VaultBackupPayload
  ): Promise<GitHubSyncResult> {
    const token = this.getToken();
    if (!token) throw new Error('No GitHub token found. Please connect your GitHub account.');
    return this.pushVaultToGitHub(token, user, customPayload);
  },

  async pullFromGist(targetGistId?: string) {
    const token = this.getToken();
    if (!token) throw new Error('No GitHub token found. Please connect your GitHub account.');
    return this.pullVaultFromGitHub(token, targetGistId);
  },

  clearGitHubSession(): void {
    try {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
      localStorage.removeItem(GITHUB_GIST_ID_KEY);
      localStorage.removeItem(GITHUB_LAST_SYNC_KEY);
    } catch (err) {
      console.warn('Error clearing GitHub session:', err);
    }
  },

  async verifyTokenAndFetchUser(token: string): Promise<GitHubUserResponse> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Please provide a valid GitHub token.');
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cleanToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub token or expired credentials. Please check your Personal Access Token or re-authenticate.');
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded or token lacks necessary permissions (needs read:user and gist scopes).');
      }
      const errText = await response.text();
      throw new Error(`GitHub verification failed: ${response.statusText} (${errText.slice(0, 100)})`);
    }

    const userData: GitHubUserResponse = await response.json();
    return userData;
  },

  async findExistingGist(token: string): Promise<{ id: string; html_url: string; raw_url?: string; content?: string } | null> {
    const cleanToken = token.trim();
    const storedGistId = this.getStoredGistId();

    // If we have a stored Gist ID, test it first
    if (storedGistId) {
      try {
        const resp = await fetch(`https://api.github.com/gists/${storedGistId}`, {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${cleanToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });
        if (resp.ok) {
          const gist = await resp.json();
          const targetFile = gist.files?.[GIST_FILENAME];
          if (targetFile) {
            return {
              id: gist.id,
              html_url: gist.html_url,
              raw_url: targetFile.raw_url,
              content: targetFile.content,
            };
          }
        }
      } catch (err) {
        console.warn('Error checking stored Gist ID:', err);
      }
    }

    // Query user's recent gists to locate the backup
    try {
      const resp = await fetch('https://api.github.com/gists?per_page=50', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cleanToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!resp.ok) return null;

      const gists = await resp.json();
      if (!Array.isArray(gists)) return null;

      const matched = gists.find(
        (g: any) =>
          g.files?.[GIST_FILENAME] ||
          (g.description && g.description.includes('Photo Gear Vault'))
      );

      if (matched) {
        const fileKey = matched.files?.[GIST_FILENAME] ? GIST_FILENAME : Object.keys(matched.files || {})[0];
        const fileObj = matched.files?.[fileKey];
        return {
          id: matched.id,
          html_url: matched.html_url,
          raw_url: fileObj?.raw_url,
          content: fileObj?.content,
        };
      }
    } catch (err) {
      console.warn('Error scanning GitHub gists:', err);
    }

    return null;
  },

  buildCurrentPayload(user?: UserProfile | null): VaultBackupPayload {
    const gear = StorageService.getGear();
    const shoots = StorageService.getShoots();
    const packing = StorageService.getPacking();
    const moodboards = StorageService.getMoodboards();
    const settings = StorageService.getSettings();

    return {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      photographer: {
        name: user?.name || settings.photographerName || 'Vault Photographer',
        studioName: user?.studioName || settings.studioName,
        email: user?.email || '',
        githubUsername: user?.githubUsername,
      },
      gear,
      shoots,
      packing,
      moodboards,
      settings,
    };
  },

  async pushVaultToGitHub(
    token: string,
    user?: UserProfile | null,
    customPayload?: VaultBackupPayload
  ): Promise<GitHubSyncResult> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, syncedAt: new Date().toISOString(), error: 'Missing GitHub token.' };
    }

    const payload = customPayload || this.buildCurrentPayload(user);
    const existing = await this.findExistingGist(cleanToken);

    const gistFiles = {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
      'README.md': {
        content: `# Photo Gear Vault Backup\n\nAutomatically synchronized from Photo Gear Vault & Shoot Manager.\n\n- **Photographer**: ${payload.photographer.name}\n- **Studio**: ${payload.photographer.studioName || 'N/A'}\n- **Last Synced**: ${payload.exportedAt}\n- **Equipment Count**: ${payload.gear.length}\n- **Scheduled Shoots**: ${payload.shoots.length}\n- **Packing Checklist Items**: ${payload.packing.length}\n`,
      },
    };

    let resultGist: any;

    if (existing?.id) {
      // Update existing Gist
      const resp = await fetch(`https://api.github.com/gists/${existing.id}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cleanToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: GIST_DESCRIPTION,
          files: gistFiles,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to update GitHub Gist: ${resp.statusText} (${errorText.slice(0, 100)})`);
      }

      resultGist = await resp.json();
    } else {
      // Create new private Gist
      const resp = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cleanToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: GIST_DESCRIPTION,
          public: false,
          files: gistFiles,
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to create GitHub Gist: ${resp.statusText} (${errorText.slice(0, 100)})`);
      }

      resultGist = await resp.json();
    }

    const now = new Date().toISOString();
    this.setStoredGistId(resultGist.id);
    this.setLastSyncTime(now);

    return {
      success: true,
      gistId: resultGist.id,
      gistUrl: resultGist.html_url,
      rawUrl: resultGist.files?.[GIST_FILENAME]?.raw_url,
      syncedAt: now,
      itemCounts: {
        gear: payload.gear.length,
        shoots: payload.shoots.length,
        packing: payload.packing.length,
        moodboards: payload.moodboards.length,
      },
    };
  },

  async pullVaultFromGitHub(
    token: string,
    targetGistId?: string
  ): Promise<{
    success: boolean;
    data?: VaultBackupPayload;
    gistUrl?: string;
    syncedAt: string;
    error?: string;
  }> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, syncedAt: new Date().toISOString(), error: 'Missing GitHub token.' };
    }

    let gistId = targetGistId || this.getStoredGistId();
    let gistUrl: string | undefined;

    if (!gistId) {
      const existing = await this.findExistingGist(cleanToken);
      if (!existing) {
        return {
          success: false,
          syncedAt: new Date().toISOString(),
          error: 'No Photo Gear Vault backup found on this GitHub account yet. Click "Sync to GitHub" to create one.',
        };
      }
      gistId = existing.id;
      gistUrl = existing.html_url;
    }

    const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cleanToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch Gist from GitHub: ${resp.statusText}`);
    }

    const gistData = await resp.json();
    gistUrl = gistData.html_url;
    const file = gistData.files?.[GIST_FILENAME];

    if (!file || !file.content) {
      throw new Error(`Gist was found, but '${GIST_FILENAME}' is empty or missing.`);
    }

    let parsedPayload: VaultBackupPayload;
    try {
      parsedPayload = JSON.parse(file.content);
    } catch {
      throw new Error('The backup data on GitHub contains corrupted or non-JSON data.');
    }

    // Apply to local StorageService
    if (parsedPayload.gear && Array.isArray(parsedPayload.gear)) {
      StorageService.saveGear(parsedPayload.gear);
    }
    if (parsedPayload.shoots && Array.isArray(parsedPayload.shoots)) {
      StorageService.saveShoots(parsedPayload.shoots);
    }
    if (parsedPayload.packing && Array.isArray(parsedPayload.packing)) {
      StorageService.savePacking(parsedPayload.packing);
    }
    if (parsedPayload.moodboards && Array.isArray(parsedPayload.moodboards)) {
      StorageService.saveMoodboards(parsedPayload.moodboards);
    }
    if (parsedPayload.settings) {
      StorageService.saveSettings(parsedPayload.settings);
    }

    const now = new Date().toISOString();
    this.setStoredGistId(gistId);
    this.setLastSyncTime(now);

    return {
      success: true,
      data: parsedPayload,
      gistUrl,
      syncedAt: now,
    };
  },
};
