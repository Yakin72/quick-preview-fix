import { useEffect, useState } from "react";
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
  runTransaction,
} from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebase } from "./firebase";

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  attrs?: Record<string, string | number>;
  wilaya: string;
  commune: string;
  phone: string;
  condition: string;
  images: string[];
  ownerUid: string;
  ownerName: string;
  ownerPhoto?: string;
  createdAt: number;
  approved: boolean;
  views: number;
  likes: number;
};

export type Comment = {
  id: string;
  uid: string;
  name: string;
  text: string;
  ts: number;
  likes?: number;
};

export function useListings(opts?: { category?: string; approvedOnly?: boolean; ownerUid?: string }) {
  const [data, setData] = useState<Listing[] | null>(null);
  const approvedOnly = opts?.approvedOnly ?? true;
  const category = opts?.category;
  const ownerUid = opts?.ownerUid;

  useEffect(() => {
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, "listings");
      unsub = onValue(r, (snap) => {
        const val = snap.val() || {};
        let arr: Listing[] = Object.entries(val).map(([id, v]: any) => ({ id, ...v }));
        if (approvedOnly) arr = arr.filter((l) => l.approved);
        if (category) arr = arr.filter((l) => l.category === category);
        if (ownerUid) arr = arr.filter((l) => l.ownerUid === ownerUid);
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setData(arr);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [category, approvedOnly, ownerUid]);

  return data;
}

export function useListing(id: string | undefined) {
  const [data, setData] = useState<Listing | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `listings/${id}`);
      unsub = onValue(r, (snap) => {
        const v = snap.val();
        setData(v ? { id, ...v } : null);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [id]);
  return data;
}

export function useComments(listingId: string | undefined) {
  const [data, setData] = useState<Comment[]>([]);
  useEffect(() => {
    if (!listingId) return;
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `comments/${listingId}`);
      unsub = onValue(r, (snap) => {
        const val = snap.val() || {};
        const arr: Comment[] = Object.entries(val).map(([id, v]: any) => ({ id, ...v }));
        arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setData(arr);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [listingId]);
  return data;
}

export async function addComment(listingId: string, uid: string, name: string, text: string) {
  const f = await getFirebase();
  const r = push(ref(f.db, `comments/${listingId}`));
  await set(r, { uid, name, text, ts: Date.now(), likes: 0 });
}

export async function deleteComment(listingId: string, commentId: string) {
  const f = await getFirebase();
  await remove(ref(f.db, `comments/${listingId}/${commentId}`));
}

export async function toggleLike(listingId: string, uid: string) {
  const f = await getFirebase();
  const likeRef = ref(f.db, `likes/${listingId}/${uid}`);
  const snap = await get(likeRef);
  const liked = snap.exists();
  if (liked) await remove(likeRef);
  else await set(likeRef, true);
  await runTransaction(ref(f.db, `listings/${listingId}/likes`), (n) => Math.max(0, (n || 0) + (liked ? -1 : 1)));
  return !liked;
}

export function useLiked(listingId: string | undefined, uid: string | undefined) {
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    if (!listingId || !uid) { setLiked(false); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `likes/${listingId}/${uid}`);
      unsub = onValue(r, (snap) => setLiked(snap.exists()));
    });
    return () => { if (unsub) unsub(); };
  }, [listingId, uid]);
  return liked;
}

// SAVED / BOOKMARKS
export async function toggleSaved(listingId: string, uid: string) {
  const f = await getFirebase();
  const r = ref(f.db, `saved/${uid}/${listingId}`);
  const snap = await get(r);
  if (snap.exists()) { await remove(r); return false; }
  await set(r, Date.now()); return true;
}

export function useIsSaved(listingId: string | undefined, uid: string | undefined) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!listingId || !uid) { setSaved(false); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `saved/${uid}/${listingId}`);
      unsub = onValue(r, (snap) => setSaved(snap.exists()));
    });
    return () => { if (unsub) unsub(); };
  }, [listingId, uid]);
  return saved;
}

export function useSavedListings(uid: string | undefined) {
  const [data, setData] = useState<Listing[] | null>(null);
  useEffect(() => {
    if (!uid) { setData([]); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `saved/${uid}`);
      unsub = onValue(r, async (snap) => {
        const ids = Object.keys(snap.val() || {});
        const results = await Promise.all(ids.map(async (id) => {
          const s = await get(ref(f.db, `listings/${id}`));
          return s.exists() ? { id, ...s.val() } as Listing : null;
        }));
        setData(results.filter(Boolean) as Listing[]);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [uid]);
  return data;
}

export async function incrementViews(listingId: string) {
  const f = await getFirebase();
  await runTransaction(ref(f.db, `listings/${listingId}/views`), (n) => (n || 0) + 1);
}

export async function uploadListingImage(uid: string, file: File): Promise<string> {
  const f = await getFirebase();
  const path = `listings/${uid}/${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
  const r = sRef(f.storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export async function uploadUserAvatar(uid: string, file: File): Promise<string> {
  const f = await getFirebase();
  const path = `avatars/${uid}/${Date.now()}_${file.name}`;
  const r = sRef(f.storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export async function createListing(data: Omit<Listing, "id" | "createdAt" | "approved" | "views" | "likes">) {
  const f = await getFirebase();
  const r = push(ref(f.db, "listings"));
  const payload = { ...data, createdAt: Date.now(), approved: false, views: 0, likes: 0 };
  await set(r, payload);
  return r.key as string;
}

export async function approveListing(id: string, approved: boolean) {
  const f = await getFirebase();
  await update(ref(f.db, `listings/${id}`), { approved });
}

export async function deleteListing(id: string) {
  const f = await getFirebase();
  await remove(ref(f.db, `listings/${id}`));
  await remove(ref(f.db, `comments/${id}`));
  await remove(ref(f.db, `likes/${id}`));
}
