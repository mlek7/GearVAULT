import { UserProfile, AuthProvider } from '../types';

const AUTH_STORAGE_KEY = 'shutterhub_auth_user';
const USERS_REGISTRY_KEY = 'shutterhub_registered_accounts';

export interface RegisteredAccount {
  user: UserProfile;
  passwordHash?: string;
}

export const AuthService = {
  getRegisteredAccounts(): RegisteredAccount[] {
    try {
      const raw = localStorage.getItem(USERS_REGISTRY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as RegisteredAccount[];
    } catch {
      return [];
    }
  },

  saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
    try {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.warn('Error saving registered accounts:', err);
    }
  },

  cacheAccountLocally(user: UserProfile, password?: string): void {
    const accounts = this.getRegisteredAccounts();
    const cleanEmail = user.email.toLowerCase();
    const idx = accounts.findIndex((a) => a.user.email.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      accounts[idx].user = user;
      if (password) accounts[idx].passwordHash = password;
    } else {
      accounts.push({ user, passwordHash: password });
    }
    this.saveRegisteredAccounts(accounts);
  },

  async syncLocalAccountsToServer(): Promise<void> {
    try {
      const accounts = this.getRegisteredAccounts();
      if (accounts.length === 0) return;

      await fetch('/api/auth/sync-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });
    } catch (err) {
      console.warn('Silent local account sync warning:', err);
    }
  },

  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as UserProfile;
      // Purge any legacy default or demo profiles
      if (
        user.email === 'alex.vance@shutterhub.photo' ||
        user.email === 'elena.rostova@icloud.com' ||
        user.id?.includes('alex_vance') ||
        user.id?.includes('elena_rostova')
      ) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      return user;
    } catch (err) {
      console.warn('Error reading authenticated user:', err);
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null): void {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Error writing authenticated user:', err);
    }
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated: UserProfile = { ...current, ...updates };
    if (Object.keys(updates).length > 0) {
      (updated as any).profileUpdatedAt = new Date().toISOString();
    }
    this.setCurrentUser(updated);
    this.cacheAccountLocally(updated);

    try {
      const { githubToken, ...safeUser } = updated as any;
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          email: updated.email,
          name: updated.name,
          studioName: updated.studioName ?? '',
          // Send an empty string when the photo is removed so the server clears it too
          avatarUrl: updated.avatarUrl ?? '',
          profileUpdatedAt: (updated as any).profileUpdatedAt,
          user: safeUser,
        }),
      });
    } catch (err) {
      console.warn('Error syncing profile updates to server:', err);
    }

    return updated;
  },

  // Pull the latest profile (name, studio, photo) from the server so changes made
  // on another device show up here. If this device has the newer copy, push it back.
  async refreshFromServer(): Promise<UserProfile | null> {
    const current = this.getCurrentUser();
    if (!current?.email) return null;
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(current.email)}`);
      if (res.status === 404) {
        await this.updateUserProfile({});
        return null;
      }
      if (!res.ok) return null;
      const data = await res.json();
      const serverUser = data?.user;
      if (!serverUser) return null;
      const localStamp = Date.parse((current as any).profileUpdatedAt || '') || 0;
      const serverStamp = Date.parse(data.profileUpdatedAt || '') || 0;
      if (localStamp > serverStamp) {
        await this.updateUserProfile({});
        return null;
      }
      const merged: UserProfile = {
        ...current,
        name: serverUser.name || current.name,
        studioName: serverUser.studioName ?? current.studioName,
        avatarUrl: serverUser.avatarUrl || undefined,
      };
      (merged as any).profileUpdatedAt = data.profileUpdatedAt || (current as any).profileUpdatedAt;
      this.setCurrentUser(merged);
      this.cacheAccountLocally(merged);
      return merged;
    } catch (err) {
      console.warn('Profile refresh failed:', err);
      return null;
    }
  },

  async loginWithGoogle(
    email: string,
    name: string,
    password?: string
  ): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please provide a valid Google account email address.');
    }
    if (!trimmedName) {
      throw new Error('Please enter your full name as registered on Google.');
    }

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      const user: UserProfile = data.user;
      this.cacheAccountLocally(user, password);
      this.setCurrentUser(user);
      return user;
    } catch (err: any) {
      if (err.message && (err.message.includes('password') || err.message.includes('Incorrect'))) {
        throw err;
      }
      // Offline fallback
      const accounts = this.getRegisteredAccounts();
      const existing = accounts.find((a) => a.user.email.toLowerCase() === trimmedEmail);
      if (existing) {
        if (password && existing.passwordHash && existing.passwordHash !== password) {
          throw new Error('Incorrect password for this Google account.');
        }
        this.setCurrentUser(existing.user);
        return existing.user;
      }
      throw err;
    }
  },

  async loginWithGitHub(token: string, directUserData?: any): Promise<UserProfile> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Please provide a valid GitHub token.');
    }

    let ghUser = directUserData;
    if (!ghUser || !ghUser.login) {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cleanToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify GitHub token with the official GitHub API.');
      }
      ghUser = await response.json();
    }

    const accounts = this.getRegisteredAccounts();
    const emailCandidate = (ghUser.email || `${ghUser.login}@users.noreply.github.com`).toLowerCase();
    const displayName = ghUser.name?.trim() || ghUser.login;

    const existing = accounts.find(
      (a) =>
        a.user.provider === 'github' &&
        (a.user.githubUsername === ghUser.login || a.user.email === emailCandidate)
    );

    let user: UserProfile;
    if (existing) {
      user = {
        ...existing.user,
        name: displayName,
        avatarUrl: ghUser.avatar_url || existing.user.avatarUrl,
        githubUsername: ghUser.login,
        githubToken: cleanToken,
        lastLoginAt: new Date().toISOString(),
      };
      existing.user = user;
      this.saveRegisteredAccounts(accounts);
    } else {
      user = {
        id: `usr_gh_${ghUser.id || Date.now()}`,
        email: emailCandidate,
        name: displayName,
        avatarUrl: ghUser.avatar_url || `https://github.com/${ghUser.login}.png`,
        provider: 'github',
        role: 'Verified GitHub Photographer',
        studioName: `${displayName}'s Studio`,
        githubUsername: ghUser.login,
        githubToken: cleanToken,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      accounts.push({ user });
      this.saveRegisteredAccounts(accounts);
    }

    // Save token in GitHub storage key too
    try {
      localStorage.setItem('shutterhub_github_token', cleanToken);
    } catch {}

    this.setCurrentUser(user);
    return user;
  },

  linkGitHubToken(token: string, username: string): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated: UserProfile = {
      ...current,
      githubUsername: username,
      githubToken: token.trim(),
    };
    this.updateProfile(updated);
    try {
      localStorage.setItem('shutterhub_github_token', token.trim());
    } catch {}
    return updated;
  },

  unlinkGitHub(): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated: UserProfile = {
      ...current,
      githubUsername: undefined,
      githubToken: undefined,
      githubSync: undefined,
    };
    this.updateProfile(updated);
    try {
      localStorage.removeItem('shutterhub_github_token');
      localStorage.removeItem('shutterhub_github_gist_id');
      localStorage.removeItem('shutterhub_github_last_sync');
    } catch {}
    return updated;
  },

  async loginWithApple(options: {
    email: string;
    name: string;
    password?: string;
    hideMyEmail?: boolean;
  }): Promise<UserProfile> {
    const trimmedEmail = options.email.trim().toLowerCase();
    const trimmedName = options.name.trim();

    if (!trimmedEmail) {
      throw new Error('Please enter a valid Apple ID.');
    }
    if (!trimmedName) {
      throw new Error('Please enter your name for your Apple ID.');
    }

    try {
      const res = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName,
          password: options.password || undefined,
          hideMyEmail: options.hideMyEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Apple ID authentication failed.');
      }

      const user: UserProfile = data.user;
      this.cacheAccountLocally(user, options.password);
      this.setCurrentUser(user);
      return user;
    } catch (err: any) {
      if (err.message && (err.message.includes('password') || err.message.includes('Incorrect'))) {
        throw err;
      }
      // Offline fallback
      const accounts = this.getRegisteredAccounts();
      const existing = accounts.find((a) => a.user.email.toLowerCase() === trimmedEmail);
      if (existing) {
        if (options.password && existing.passwordHash && existing.passwordHash !== options.password) {
          throw new Error('Incorrect password for this Apple ID.');
        }
        this.setCurrentUser(existing.user);
        return existing.user;
      }
      throw err;
    }
  },

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      const user: UserProfile = data.user;
      this.cacheAccountLocally(user, password);
      this.setCurrentUser(user);
      return user;
    } catch (err: any) {
      if (err.message && (err.message.includes('password') || err.message.includes('No account found') || err.message.includes('credentials'))) {
        throw err;
      }
      // Offline fallback
      const accounts = this.getRegisteredAccounts();
      const match = accounts.find((a) => a.user.email.toLowerCase() === trimmedEmail);
      if (!match) {
        throw new Error('No account found with this email on this server or device. Click "Create Account" above to register.');
      }
      if (match.passwordHash && match.passwordHash !== password) {
        throw new Error('Incorrect password. Please verify your credentials and retry.');
      }
      const updatedUser: UserProfile = {
        ...match.user,
        lastLoginAt: new Date().toISOString(),
      };
      this.setCurrentUser(updatedUser);
      return updatedUser;
    }
  },

  async registerWithEmail(
    name: string,
    email: string,
    password: string,
    studioName?: string
  ): Promise<UserProfile> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      throw new Error('Please enter your full name.');
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
          studioName: studioName?.trim(),
          provider: 'email',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      const newUser: UserProfile = data.user;
      this.cacheAccountLocally(newUser, password);
      this.setCurrentUser(newUser);
      return newUser;
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('required') || err.message.includes('characters'))) {
        throw err;
      }
      // Offline fallback
      const accounts = this.getRegisteredAccounts();
      const existing = accounts.find((a) => a.user.email.toLowerCase() === trimmedEmail);
      if (existing) {
        throw new Error('An account with this email address already exists. Please sign in.');
      }

      const newUser: UserProfile = {
        id: `usr_email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: trimmedEmail,
        name: trimmedName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
        provider: 'email',
        role: 'Member Photographer',
        studioName: studioName?.trim() || `${trimmedName.split(' ')[0]} Photography`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      this.cacheAccountLocally(newUser, password);
      this.setCurrentUser(newUser);
      return newUser;
    }
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated: UserProfile = { ...current, ...updates };
    this.setCurrentUser(updated);

    const accounts = this.getRegisteredAccounts();
    const idx = accounts.findIndex((a) => a.user.id === current.id);
    if (idx !== -1) {
      accounts[idx].user = updated;
      this.saveRegisteredAccounts(accounts);
    }
    return updated;
  },
};
