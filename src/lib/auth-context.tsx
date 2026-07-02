import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type User,
  type AuthProvider as FBAuthProvider,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { getFirebase } from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone: string, wilaya: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInFacebook: () => Promise<void>;
  signInApple: () => Promise<void>;
  updateUserProfile: (data: { name?: string; photoURL?: string; phone?: string; wilaya?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    let unsub: (() => void) | null = null;
    getFirebase()
      .then((f) => {
        setAdminEmail(f.adminEmail);
        unsub = onAuthStateChanged(f.auth, (u) => {
          setUser(u);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
    return () => { if (unsub) unsub(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const f = await getFirebase();
    await signInWithEmailAndPassword(f.auth, email, password);
  };

  const signUp = async (name: string, email: string, password: string, phone: string, wilaya: string) => {
    const f = await getFirebase();
    const cred = await createUserWithEmailAndPassword(f.auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await set(ref(f.db, `users/${cred.user.uid}`), { name, email, phone, wilaya, createdAt: Date.now() });
  };

  const withProvider = async (provider: FBAuthProvider) => {
    const f = await getFirebase();
    const cred = await signInWithPopup(f.auth, provider);
    const u = cred.user;
    const uref = ref(f.db, `users/${u.uid}`);
    const snap = await get(uref);
    if (!snap.exists()) {
      await set(uref, { name: u.displayName || "", email: u.email || "", phone: "", wilaya: "", photoURL: u.photoURL || "", createdAt: Date.now() });
    }
  };

  const signInGoogle = () => withProvider(new GoogleAuthProvider());
  const signInFacebook = () => withProvider(new FacebookAuthProvider());
  const signInApple = () => withProvider(new OAuthProvider("apple.com"));

  const updateUserProfile = async (data: { name?: string; photoURL?: string; phone?: string; wilaya?: string }) => {
    const f = await getFirebase();
    if (!f.auth.currentUser) throw new Error("Not authenticated");
    const patch: any = {};
    if (data.name !== undefined) patch.displayName = data.name;
    if (data.photoURL !== undefined) patch.photoURL = data.photoURL;
    if (Object.keys(patch).length) await updateProfile(f.auth.currentUser, patch);
    const dbPatch: any = {};
    if (data.name !== undefined) dbPatch.name = data.name;
    if (data.photoURL !== undefined) dbPatch.photoURL = data.photoURL;
    if (data.phone !== undefined) dbPatch.phone = data.phone;
    if (data.wilaya !== undefined) dbPatch.wilaya = data.wilaya;
    if (Object.keys(dbPatch).length) await update(ref(f.db, `users/${f.auth.currentUser.uid}`), dbPatch);
    setUser({ ...f.auth.currentUser });
  };

  const logout = async () => {
    const f = await getFirebase();
    await signOut(f.auth);
  };

  const isAdmin = !!user && !!adminEmail && user.email?.toLowerCase() === adminEmail;

  return (
    <Ctx.Provider value={{ user, loading, isAdmin, signIn, signUp, signInGoogle, signInFacebook, signInApple, updateUserProfile, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
