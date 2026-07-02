import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

let cached: Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Database;
  storage: FirebaseStorage;
  adminEmail: string;
}> | null = null;

export function getFirebase() {
  if (cached) return cached;
  cached = (async () => {
    const res = await fetch("/api/public/firebase-config");
    const cfg = await res.json();
    const adminEmail = (cfg.adminEmail || "").toLowerCase();
    delete cfg.adminEmail;
    const app = getApps().length ? getApp() : initializeApp(cfg);
    return {
      app,
      auth: getAuth(app),
      db: getDatabase(app),
      storage: getStorage(app),
      adminEmail,
    };
  })().catch((e) => {
    cached = null;
    throw e;
  });
  return cached;
}
