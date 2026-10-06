import { UserProfile } from '../types';
import { FirebaseAuthService, auth } from './firebase';

const AUTH_STORAGE_KEY = 'lightbag_auth_user';

export const AuthService = {
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
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
      console.warn('Error persisting user locally:', err);
    }
  },

  async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const user = await FirebaseAuthService.loginWithEmail(email, pass);
    this.setCurrentUser(user);
    return user;
  },

  async registerWithEmail(
    name: string,
    email: string,
    pass: string,
    studioName?: string
  ): Promise<UserProfile> {
    const user = await FirebaseAuthService.registerWithEmail(email, pass, name, studioName);
    this.setCurrentUser(user);
    return user;
  },

  async loginWithGoogle(): Promise<UserProfile> {
    const user = await FirebaseAuthService.loginWithGoogle();
    this.setCurrentUser(user);
    return user;
  },

  async loginWithApple(): Promise<UserProfile> {
    const user = await FirebaseAuthService.loginWithApple();
    this.setCurrentUser(user);
    return user;
  },

  async sendPasswordReset(email: string): Promise<void> {
    await FirebaseAuthService.sendPasswordReset(email);
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = this.getCurrentUser();
    const uid = current?.id || auth.currentUser?.uid;
    if (!uid) return null;
    const updated = await FirebaseAuthService.updateUserProfile(uid, updates);
    this.setCurrentUser(updated);
    return updated;
  },

  async logout(): Promise<void> {
    await FirebaseAuthService.logout();
    this.setCurrentUser(null);
  },

  async deleteAccountAndData(): Promise<void> {
    const current = this.getCurrentUser();
    const uid = current?.id || auth.currentUser?.uid;
    if (uid) {
      await FirebaseAuthService.deleteAccountAndData(uid);
    }
    this.setCurrentUser(null);
  },
};
