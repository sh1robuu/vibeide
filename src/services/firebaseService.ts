import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useStore } from '../store/useStore';

// --- Authentication ---

export const setAuthPersistence = async (rememberMe: boolean) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch (error) {
    console.error("Error setting persistence", error);
  }
};

export const loginWithGoogle = async (rememberMe: boolean = true) => {
  try {
    await setAuthPersistence(rememberMe);
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string, rememberMe: boolean = true) => {
  try {
    await setAuthPersistence(rememberMe);
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error) {
    console.error("Error registering with email", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string, rememberMe: boolean = true) => {
  try {
    await setAuthPersistence(rememberMe);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error logging in with email", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const updateUserProfile = async (name: string, photoURL?: string) => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { 
        displayName: name,
        ...(photoURL ? { photoURL } : {})
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating profile", error);
    throw error;
  }
};

// --- Database (Workspace Sync) ---

export const saveWorkspace = async (userId: string, files: Record<string, string>, folders: string[]) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      workspace: {
        files,
        folders,
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
  } catch (error) {
    console.error("Error saving workspace", error);
    throw error; // Throw to handle in UI
  }
};

export const loadWorkspace = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.workspace || null;
    }
    return null;
  } catch (error) {
    console.error("Error loading workspace", error);
    return null;
  }
};

// --- Feedback ---

export const submitFeedback = async (userId: string | undefined, name: string, email: string, type: string, message: string) => {
  try {
    await addDoc(collection(db, 'feedback'), {
      userId: userId || 'anonymous',
      name,
      email,
      type,
      message,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error submitting feedback", error);
    throw error;
  }
};

// Listen to auth changes and sync store
export const initFirebaseAuth = () => {
  return onAuthStateChanged(auth, async (user) => {
    const store = useStore.getState();
    
    if (user) {
      store.setIsAuthenticated(true);
      store.setUser({
        name: user.displayName || 'User',
        email: user.email || '',
        avatar: user.photoURL || undefined,
        uid: user.uid
      });

      // Load user's workspace
      const workspace = await loadWorkspace(user.uid);
      if (workspace) {
        if (workspace.files) {
          // Update files one by one or create a bulk update action
          Object.entries(workspace.files).forEach(([name, content]) => {
            store.updateFile(name, content as string);
          });
        }
        if (workspace.folders) {
          workspace.folders.forEach((folder: string) => {
            if (!store.folders.includes(folder)) {
              store.addFolder(folder);
            }
          });
        }
      }
    } else {
      store.setIsAuthenticated(false);
      store.setUser(null);
    }
  });
};
