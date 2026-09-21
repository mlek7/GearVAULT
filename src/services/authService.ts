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

  async loginWithGoogle(email: string, name: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please provide a valid Google account email address.');
    }
    if (!trimmedName) {
      throw new Error('Please enter your full name as registered on Google.');
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const accounts = this.getRegisteredAccounts();
    const existing = accounts.find(
      (a) => a.user.email.toLowerCase() === trimmedEmail
    );

    let user: UserProfile;
    if (existing) {
      user = {
        ...existing.user,
        name: trimmedName || existing.user.name,
        lastLoginAt: new Date().toISOString(),
      };
      existing.user = user;
      this.saveRegisteredAccounts(accounts);
    } else {
      user = {
        id: `usr_google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: trimmedEmail,
        name: trimmedName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
        provider: 'google',
        role: 'Professional Photographer',
        studioName: `${trimmedName} Studio`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      accounts.push({ user });
      this.saveRegisteredAccounts(accounts);
    }

    this.setCurrentUser(user);
    return user;
  },

  async directGoogleLogin(): Promise<UserProfile> {
    const accounts = this.getRegisteredAccounts();
    const existingGoogle = accounts.find((a) => a.user.provider === 'google');

    const targetEmail = existingGoogle?.user.email || 'melek.ben.moussa97@gmail.com';
    const targetName = existingGoogle?.user.name || 'Melek Ben Moussa';

    return this.loginWithGoogle(targetEmail, targetName);
  },

  async directAppleLogin(): Promise<UserProfile> {
    const accounts = this.getRegisteredAccounts();
    const existingApple = accounts.find((a) => a.user.provider === 'apple');

    const targetEmail = existingApple?.user.email || 'melek.benmoussa@icloud.com';
    const targetName = existingApple?.user.name || 'Melek Ben Moussa';

    return this.loginWithApple({
      email: targetEmail,
      name: targetName,
      hideMyEmail: false,
    });
  },

  async loginWithApple(options: {
    email: string;
    name: string;
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

    await new Promise((resolve) => setTimeout(resolve, 500));

    const finalEmail = options.hideMyEmail
      ? `photographer_${Math.random().toString(36).substring(2, 8)}@privaterelay.appleid.com`
      : trimmedEmail;

    const accounts = this.getRegisteredAccounts();
    const existing = accounts.find(
      (a) => a.user.email.toLowerCase() === finalEmail.toLowerCase()
    );

    let user: UserProfile;
    if (existing) {
      user = {
        ...existing.user,
        name: trimmedName || existing.user.name,
        lastLoginAt: new Date().toISOString(),
      };
      existing.user = user;
      this.saveRegisteredAccounts(accounts);
    } else {
      user = {
        id: `usr_apple_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: finalEmail,
        name: trimmedName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
        provider: 'apple',
        role: 'Pro Photographer',
        studioName: `${trimmedName.split(' ')[0]} Imagery`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      accounts.push({ user });
      this.saveRegisteredAccounts(accounts);
    }

    this.setCurrentUser(user);
    return user;
  },

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const accounts = this.getRegisteredAccounts();
    const match = accounts.find(
      (a) => a.user.email.toLowerCase() === trimmedEmail
    );

    if (!match) {
      throw new Error(
        'No account found with this email. Click "Create Account" above to register.'
      );
    }

    if (match.passwordHash && match.passwordHash !== password) {
      throw new Error('Incorrect password. Please verify your credentials and retry.');
    }

    const updatedUser: UserProfile = {
      ...match.user,
      lastLoginAt: new Date().toISOString(),
    };
    match.user = updatedUser;
    this.saveRegisteredAccounts(accounts);
    this.setCurrentUser(updatedUser);
    return updatedUser;
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

    await new Promise((resolve) => setTimeout(resolve, 450));

    const accounts = this.getRegisteredAccounts();
    const existing = accounts.find(
      (a) => a.user.email.toLowerCase() === trimmedEmail
    );

    if (existing) {
      throw new Error(
        'An account with this email address already exists. Please sign in.'
      );
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

    accounts.push({
      user: newUser,
      passwordHash: password,
    });
    this.saveRegisteredAccounts(accounts);
    this.setCurrentUser(newUser);
    return newUser;
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
