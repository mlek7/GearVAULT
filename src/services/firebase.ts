import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  GearItem,
  Shoot,
  PackingItem,
  MoodboardItem,
  AppSettings,
  AuthProvider,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL: Required for multi-database instances)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Skill Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Initial Boot (Skill Requirement)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Map Firebase User to Lightbag UserProfile
export function mapFirebaseUser(
  fbUser: FirebaseUser,
  extra?: { studioName?: string; name?: string }
): UserProfile {
  let provider: AuthProvider = 'email';
  const providerId = fbUser.providerData[0]?.providerId || '';
  if (providerId.includes('google')) provider = 'google';
  else if (providerId.includes('apple')) provider = 'apple';

  const name =
    extra?.name ||
    fbUser.displayName ||
    fbUser.email?.split('@')[0] ||
    'Photographer';

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    name,
    avatarUrl: fbUser.photoURL || undefined,
    provider,
    role: 'Member Photographer',
    studioName: extra?.studioName || `${name.split(' ')[0]} Studios`,
    createdAt: fbUser.metadata.creationTime,
    lastLoginAt: fbUser.metadata.lastSignInTime,
    emailVerified: fbUser.emailVerified,
  };
}

// =========================================================================
// AUTHENTICATION SERVICE (Firebase Auth)
// =========================================================================

export const FirebaseAuthService = {
  // Listen to auth changes
  onAuthChange(callback: (user: UserProfile | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
        return;
      }

      // Check if user has an existing profile doc in Firestore
      const userDocPath = `users/${fbUser.uid}`;
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          const mapped: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || data.email || '',
            name: data.name || fbUser.displayName || 'Photographer',
            avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
            provider: (data.provider as AuthProvider) || 'email',
            role: data.role || 'Member Photographer',
            studioName: data.studioName || '',
            createdAt: data.createdAt || fbUser.metadata.creationTime,
            lastLoginAt: fbUser.metadata.lastSignInTime,
            emailVerified: fbUser.emailVerified,
          };
          callback(mapped);
          return;
        }
      } catch (err) {
        // If doc fetch fails (e.g. offline), fallback to mapped auth info
        console.warn('Could not read user profile doc:', err);
      }

      callback(mapFirebaseUser(fbUser));
    });
  },

  // Email / Password Login
  async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const snap = await getDoc(doc(db, 'users', cred.user.uid)).catch(() => null);
    if (snap && snap.exists()) {
      const data = snap.data();
      return {
        id: cred.user.uid,
        email: cred.user.email || '',
        name: data.name || cred.user.displayName || 'Photographer',
        avatarUrl: data.avatarUrl || cred.user.photoURL || undefined,
        provider: 'email',
        role: data.role || 'Member Photographer',
        studioName: data.studioName || '',
        createdAt: data.createdAt || cred.user.metadata.creationTime,
        lastLoginAt: cred.user.metadata.lastSignInTime,
        emailVerified: cred.user.emailVerified,
      };
    }
    return mapFirebaseUser(cred.user);
  },

  // Email / Password Sign Up
  async registerWithEmail(
    email: string,
    pass: string,
    name: string,
    studioName?: string
  ): Promise<UserProfile> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);

    // Update display name
    await updateProfile(cred.user, { displayName: name.trim() });

    // Send verification email
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Verification email could not be sent immediately:', e);
    }

    const profile = mapFirebaseUser(cred.user, { name: name.trim(), studioName: studioName?.trim() });

    // Save profile to users/{uid}
    const docPath = `users/${cred.user.uid}`;
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        email: cred.user.email,
        name: profile.name,
        studioName: profile.studioName,
        avatarUrl: profile.avatarUrl || '',
        provider: 'email',
        role: 'Member Photographer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }

    return profile;
  },

  // Password Reset
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  },

  // Google Sign-In (Native on iOS/Android, Popup on Web)
  async loginWithGoogle(): Promise<UserProfile> {
    let cred: UserCredential;

    if (Capacitor.isNativePlatform()) {
      // Native Google Sign-In via @capacitor-firebase/authentication
      // NOTE for Mac/Xcode/Android Studio:
      // - iOS requires GoogleService-Info.plist and the REVERSED_CLIENT_ID URL scheme in Info.plist.
      // - Android requires google-services.json and SHA-1/SHA-256 fingerprint registered in Firebase Console.
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token returned.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      cred = await signInWithCredential(auth, credential);
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      cred = await signInWithPopup(auth, provider);
    }

    const userDocPath = `users/${cred.user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        // New user: initialize doc with clean profile
        const profile = mapFirebaseUser(cred.user);
        await setDoc(doc(db, 'users', cred.user.uid), {
          id: cred.user.uid,
          email: cred.user.email,
          name: profile.name,
          studioName: profile.studioName,
          avatarUrl: cred.user.photoURL || '',
          provider: 'google',
          role: 'Member Photographer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return profile;
      } else {
        const data = snap.data();
        return {
          id: cred.user.uid,
          email: cred.user.email || data.email,
          name: data.name || cred.user.displayName || 'Photographer',
          avatarUrl: data.avatarUrl || cred.user.photoURL || undefined,
          provider: 'google',
          role: data.role || 'Member Photographer',
          studioName: data.studioName || '',
          createdAt: data.createdAt,
          lastLoginAt: cred.user.metadata.lastSignInTime,
          emailVerified: cred.user.emailVerified,
        };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }
  },

  // Apple Sign-In (Native on iOS/Android, Popup on Web)
  async loginWithApple(): Promise<UserProfile> {
    let cred: UserCredential;

    if (Capacitor.isNativePlatform()) {
      // Native Sign in with Apple via @capacitor-firebase/authentication
      // NOTE for Mac/Xcode:
      // - Requires "Sign in with Apple" Capability enabled in Xcode Target Signing & Capabilities.
      // - Requires Apple Services ID and private key configured in Firebase Authentication console.
      const result = await FirebaseAuthentication.signInWithApple({
        scopes: ['name', 'email'],
      });
      const idToken = result.credential?.idToken;
      const rawNonce = result.credential?.nonce;
      if (!idToken) {
        throw new Error('Apple Sign-In failed: No identity token returned.');
      }
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken,
        rawNonce,
      });
      cred = await signInWithCredential(auth, credential);
    } else {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      cred = await signInWithPopup(auth, provider);
    }

    const userDocPath = `users/${cred.user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) {
        const profile = mapFirebaseUser(cred.user);
        await setDoc(doc(db, 'users', cred.user.uid), {
          id: cred.user.uid,
          email: cred.user.email,
          name: profile.name,
          studioName: profile.studioName,
          avatarUrl: cred.user.photoURL || '',
          provider: 'apple',
          role: 'Member Photographer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return profile;
      } else {
        const data = snap.data();
        return {
          id: cred.user.uid,
          email: cred.user.email || data.email,
          name: data.name || cred.user.displayName || 'Photographer',
          avatarUrl: data.avatarUrl || cred.user.photoURL || undefined,
          provider: 'apple',
          role: data.role || 'Member Photographer',
          studioName: data.studioName || '',
          createdAt: data.createdAt,
          lastLoginAt: cred.user.metadata.lastSignInTime,
          emailVerified: cred.user.emailVerified,
        };
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }
  },

  // Sign out (handles native plugin & Firebase JS auth)
  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut().catch(() => {});
    }
    await signOut(auth);
  },

  // Update profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const userDocPath = `users/${uid}`;
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, userDocPath);
    }

    if (auth.currentUser && (updates.name || updates.avatarUrl)) {
      await updateProfile(auth.currentUser, {
        displayName: updates.name,
        photoURL: updates.avatarUrl,
      }).catch(() => {});
    }

    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data() || {};
    return {
      id: uid,
      email: data.email || auth.currentUser?.email || '',
      name: data.name || auth.currentUser?.displayName || 'Photographer',
      avatarUrl: data.avatarUrl || auth.currentUser?.photoURL || undefined,
      provider: data.provider || 'email',
      role: data.role || 'Member Photographer',
      studioName: data.studioName || '',
      createdAt: data.createdAt,
      lastLoginAt: auth.currentUser?.metadata.lastSignInTime,
    };
  },

  // Delete Account & All Data (Apple guideline 5.1.1(v) & Google Play)
  async deleteAccountAndData(uid: string): Promise<void> {
    // 1. Delete all subcollections
    const subcollections = ['gear', 'shoots', 'packing', 'moodboards'];
    for (const sub of subcollections) {
      const subPath = `users/${uid}/${sub}`;
      try {
        const snap = await getDocs(collection(db, 'users', uid, sub));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, subPath);
      }
    }

    // 2. Delete root user document
    const rootPath = `users/${uid}`;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, rootPath);
    }

    // 3. Delete Firebase Auth user
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.deleteUser().catch(() => {});
    }
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
  },
};

// =========================================================================
// FIRESTORE VAULT DATA SERVICE (users/{uid} and subcollections)
// =========================================================================

export const FirestoreVaultService = {
  // Real-time synchronization listeners for a user's vault
  subscribeToVault(
    uid: string,
    callbacks: {
      onGear: (gear: GearItem[]) => void;
      onShoots: (shoots: Shoot[]) => void;
      onPacking: (packing: PackingItem[]) => void;
      onMoodboards: (moodboards: MoodboardItem[]) => void;
      onSettings: (settings: Partial<AppSettings>) => void;
    }
  ): () => void {
    const unsubs: Unsubscribe[] = [];

    // Listen to user root doc for settings
    const userDocPath = `users/${uid}`;
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.settings) {
              callbacks.onSettings(data.settings);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, userDocPath)
      )
    );

    // Listen to gear subcollection
    const gearPath = `users/${uid}/gear`;
    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'gear'),
        (snap) => {
          const items: GearItem[] = [];
          snap.forEach((d) => items.push(d.data() as GearItem));
          callbacks.onGear(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, gearPath)
      )
    );

    // Listen to shoots subcollection
    const shootsPath = `users/${uid}/shoots`;
    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'shoots'),
        (snap) => {
          const items: Shoot[] = [];
          snap.forEach((d) => items.push(d.data() as Shoot));
          callbacks.onShoots(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, shootsPath)
      )
    );

    // Listen to packing subcollection
    const packingPath = `users/${uid}/packing`;
    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'packing'),
        (snap) => {
          const items: PackingItem[] = [];
          snap.forEach((d) => items.push(d.data() as PackingItem));
          callbacks.onPacking(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, packingPath)
      )
    );

    // Listen to moodboards subcollection
    const moodboardsPath = `users/${uid}/moodboards`;
    unsubs.push(
      onSnapshot(
        collection(db, 'users', uid, 'moodboards'),
        (snap) => {
          const items: MoodboardItem[] = [];
          snap.forEach((d) => items.push(d.data() as MoodboardItem));
          callbacks.onMoodboards(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, moodboardsPath)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  },

  // Save or update Gear Item
  async saveGear(uid: string, item: GearItem): Promise<void> {
    const path = `users/${uid}/gear/${item.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'gear', item.id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete Gear Item
  async deleteGear(uid: string, itemId: string): Promise<void> {
    const path = `users/${uid}/gear/${itemId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'gear', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save or update Shoot
  async saveShoot(uid: string, shoot: Shoot): Promise<void> {
    const path = `users/${uid}/shoots/${shoot.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'shoots', shoot.id), shoot);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete Shoot
  async deleteShoot(uid: string, shootId: string): Promise<void> {
    const path = `users/${uid}/shoots/${shootId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'shoots', shootId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save or update Packing Item
  async savePackingItem(uid: string, item: PackingItem): Promise<void> {
    const path = `users/${uid}/packing/${item.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'packing', item.id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Save batch packing items
  async savePackingItems(uid: string, items: PackingItem[]): Promise<void> {
    const path = `users/${uid}/packing`;
    try {
      const batch = writeBatch(db);
      for (const item of items) {
        batch.set(doc(db, 'users', uid, 'packing', item.id), item);
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete Packing Item
  async deletePackingItem(uid: string, itemId: string): Promise<void> {
    const path = `users/${uid}/packing/${itemId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'packing', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save or update Moodboard Item
  async saveMoodboardItem(uid: string, item: MoodboardItem): Promise<void> {
    const path = `users/${uid}/moodboards/${item.id}`;
    try {
      await setDoc(doc(db, 'users', uid, 'moodboards', item.id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Delete Moodboard Item
  async deleteMoodboardItem(uid: string, itemId: string): Promise<void> {
    const path = `users/${uid}/moodboards/${itemId}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'moodboards', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Save App Settings in user document
  async saveSettings(uid: string, settings: AppSettings): Promise<void> {
    const path = `users/${uid}`;
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          settings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Clear all vault data (gear, shoots, packing, moodboards) but keep user account
  async resetVaultData(uid: string): Promise<void> {
    const subcollections = ['gear', 'shoots', 'packing', 'moodboards'];
    for (const sub of subcollections) {
      const path = `users/${uid}/${sub}`;
      try {
        const snap = await getDocs(collection(db, 'users', uid, sub));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  },
};
