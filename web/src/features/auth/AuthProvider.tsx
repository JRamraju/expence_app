import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from "firebase/auth";
import { auth, googleProvider } from "services/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
  // 1. Added reauthenticate to the interface
  reauthenticate: (password: string) => Promise<void>; 
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signup: async (email, password) => {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    loginGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    logout: async () => {
      await signOut(auth);
    },
    forgotPassword: async (email) => {
      await sendPasswordResetEmail(auth, email);
    },
    changePassword: async (oldPass, newPass) => {
      if (!auth.currentUser?.email) return;
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPass);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);
    },
    // 2. Implemented the reauthenticate function
    reauthenticate: async (password: string) => {
      if (!auth.currentUser?.email) throw new Error("No active user found.");
      
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
    }
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}