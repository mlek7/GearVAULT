import { UserProfile, AuthProvider } from '../types';

const AUTH_STORAGE_KEY = 'shutterhub_auth_user';

export const DEMO_USERS: Record<string, UserProfile> = {
  alex: {
    id: 'usr_google_alex_vance',
    email: 'alex.vance@shutterhub.photo',
    name: 'Alex Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    provider: 'google',
    role: 'Lead Commercial & Wedding Photographer',
    studioName: 'Vance Visuals Studio',
    createdAt: '2024-01-15T09:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
  elena: {
    id: 'usr_apple_elena_rostova',
    email: 'elena.rostova@icloud.com',
    name: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    provider: 'apple',
    role: 'Fashion & Editorial Director',
    studioName: 'Lumina Creative Co.',
    createdAt: '2024-03-10T14:30:00.000Z',
    lastLoginAt: new Date().toISOString(),
  },
};

export const AuthService = {
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
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

  async loginWithGoogle(customEmail?: string, customName?: string): Promise<UserProfile> {
    // Simulate brief network handshake
    await new Promise((resolve) => setTimeout(resolve, 450));

    const email = customEmail || 'alex.vance@shutterhub.photo';
    const name = customName || (email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    
    const user: UserProfile = {
      id: `usr_google_${Date.now()}`,
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'google',
      role: 'Professional Photographer',
      studioName: `${name.split(' ')[0]}'s Studio`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.setCurrentUser(user);
    return user;
  },

  async loginWithApple(options?: { email?: string; name?: string; hideMyEmail?: boolean }): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    const isHidden = options?.hideMyEmail ?? false;
    const email = isHidden
      ? `photographer_${Math.random().toString(36).substring(2, 8)}@privaterelay.appleid.com`
      : options?.email || 'elena.rostova@icloud.com';
    const name = options?.name || 'Elena Rostova';

    const user: UserProfile = {
      id: `usr_apple_${Date.now()}`,
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'apple',
      role: 'Creative Director & Photographer',
      studioName: `${name.split(' ')[0]} Imagery`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.setCurrentUser(user);
    return user;
  },

  async loginWithEmail(email: string, _password: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const existing = this.getCurrentUser();

    const user: UserProfile = {
      id: existing?.id || `usr_email_${Date.now()}`,
      email,
      name: existing?.name || name,
      avatarUrl: existing?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'email',
      role: 'Member Photographer',
      studioName: existing?.studioName || `${name.split(' ')[0]} Photography`,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.setCurrentUser(user);
    return user;
  },

  async registerWithEmail(name: string, email: string, _password: string, studioName?: string): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    const user: UserProfile = {
      id: `usr_email_${Date.now()}`,
      email,
      name,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      provider: 'email',
      role: 'Pro Photographer',
      studioName: studioName || `${name.split(' ')[0]} Studio`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.setCurrentUser(user);
    return user;
  },

  async loginAsDemo(key: 'alex' | 'elena'): Promise<UserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const demo = DEMO_USERS[key];
    const user: UserProfile = {
      ...demo,
      lastLoginAt: new Date().toISOString(),
    };
    this.setCurrentUser(user);
    return user;
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;
    const updated: UserProfile = { ...current, ...updates };
    this.setCurrentUser(updated);
    return updated;
  },
};
