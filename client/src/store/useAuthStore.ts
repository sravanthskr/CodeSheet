import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail,
  deleteUser as firebaseDeleteUser,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateUserProgress: (problemId: string, action: 'solve' | 'star' | 'unsolved' | 'unstar') => Promise<void>;
  updateUserNote: (problemId: string, note: string) => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Make user admin if they use the admin email or name contains "admin"
      const isAdmin = email.toLowerCase().includes('admin') || name.toLowerCase().includes('admin');
      const userData: User = {
        uid: userCredential.user.uid,
        name,
        email,
        role: isAdmin ? 'admin' : 'user',
        solvedProblems: [],
        starredProblems: [],
        notes: {}
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateUserProgress: async (problemId: string, action: 'solve' | 'star' | 'unsolved' | 'unstar') => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      let updates: any = {};

      switch (action) {
        case 'solve':
          if (!user.solvedProblems.includes(problemId)) {
            updates.solvedProblems = [...user.solvedProblems, problemId];
          }
          break;
        case 'unsolved':
          updates.solvedProblems = user.solvedProblems.filter(id => id !== problemId);
          break;
        case 'star':
          if (!user.starredProblems.includes(problemId)) {
            updates.starredProblems = [...user.starredProblems, problemId];
          }
          break;
        case 'unstar':
          updates.starredProblems = user.starredProblems.filter(id => id !== problemId);
          break;
      }

      await updateDoc(userRef, updates);
      set({ 
        user: { 
          ...user, 
          ...updates 
        } 
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateUserNote: async (problemId: string, note: string) => {
    const { user } = get();
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedNotes = { ...user.notes, [problemId]: note };

      await updateDoc(userRef, { notes: updatedNotes });
      set({ 
        user: { 
          ...user, 
          notes: updatedNotes 
        } 
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Ensure arrays are initialized
            if (!userData.solvedProblems) userData.solvedProblems = [];
            if (!userData.starredProblems) userData.starredProblems = [];
            if (!userData.notes) userData.notes = {};
            set({ user: userData, isLoading: false });
          } else {
            // Handle Google sign-in user creation
            // Make first user admin for demo purposes
            const isFirstUser = firebaseUser.email === 'admin@example.com' || firebaseUser.uid === 'first-admin';
            const userData: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email!,
              role: isFirstUser ? 'admin' : 'user',
              solvedProblems: [],
              starredProblems: [],
              notes: {}
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            set({ user: userData, isLoading: false });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    });

    // Handle redirect result for Google sign-in
    getRedirectResult(auth).catch((error) => {
      set({ error: error.message, isLoading: false });
    });

    return unsubscribe;
  },

  updateUser: async (userData: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    try {
      const updatedUser = { ...user, ...userData };
      await updateDoc(doc(db, 'users', user.uid), userData);
      set({ user: updatedUser });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  clearError: () => set({ error: null }),

    deleteAccount: async () => {
    const currentUser = get().user;
    const firebaseUser = auth.currentUser;

    if (!currentUser || !firebaseUser) {
      throw new Error('No user logged in');
    }

    try {
      set({ error: null });

      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete Firebase Authentication account
      await firebaseDeleteUser(firebaseUser);

      // Clear local state
      set({ user: null });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));