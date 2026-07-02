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

export type UserProfile = {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  wilaya?: string;
  photoURL?: string;
  createdAt?: number;
  ratingCount?: number;
  ratingSum?: number;
};

export type Notification = {
  id: string;
  type: "comment" | "message" | "listing";
  title: string;
  body: string;
  listingId?: string;
  conversationId?: string;
  fromUid?: string;
  fromName?: string;
  ts: number;
  read?: boolean;
};

export type Conversation = {
  id: string;
  members: Record<string, true>;
  memberNames: Record<string, string>;
  listingId?: string;
  listingTitle?: string;
  lastMessage?: string;
  lastAt: number;
  unread?: Record<string, number>;
};

export type Message = {
  id: string;
  uid: string;
  name: string;
  text: string;
  ts: number;
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
  const ts = Date.now();
  await set(r, { uid, name, text, ts, likes: 0 });
  const listingSnap = await get(ref(f.db, `listings/${listingId}`));
  const listing = listingSnap.val() as Listing | null;
  if (listing?.ownerUid && listing.ownerUid !== uid) {
    await pushNotification(listing.ownerUid, {
      type: "comment",
      title: "New comment on your ad",
      body: `${name}: ${text}`.slice(0, 180),
      listingId,
      fromUid: uid,
      fromName: name,
      ts,
      read: false,
    });
  }
}

export function useUserProfile(uid: string | undefined) {
  const [data, setData] = useState<UserProfile | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) { setData(null); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      const r = ref(f.db, `users/${uid}`);
      unsub = onValue(r, (snap) => {
        const v = snap.val();
        setData(v ? { uid, ...v } : null);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [uid]);
  return data;
}

export async function rateUser(targetUid: string, fromUid: string, rating: number) {
  const f = await getFirebase();
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  const old = await get(ref(f.db, `ratings/${targetUid}/${fromUid}`));
  await set(ref(f.db, `ratings/${targetUid}/${fromUid}`), clamped);
  await runTransaction(ref(f.db, `users/${targetUid}/ratingSum`), (n) => (n || 0) - (old.val() || 0) + clamped);
  if (!old.exists()) await runTransaction(ref(f.db, `users/${targetUid}/ratingCount`), (n) => (n || 0) + 1);
}

export function useMyRating(targetUid: string | undefined, fromUid: string | undefined) {
  const [rating, setRating] = useState(0);
  useEffect(() => {
    if (!targetUid || !fromUid) { setRating(0); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      unsub = onValue(ref(f.db, `ratings/${targetUid}/${fromUid}`), (snap) => setRating(snap.val() || 0));
    });
    return () => { if (unsub) unsub(); };
  }, [targetUid, fromUid]);
  return rating;
}

async function pushNotification(uid: string, data: Omit<Notification, "id">) {
  const f = await getFirebase();
  await set(push(ref(f.db, `notifications/${uid}`)), data);
}

export function useNotifications(uid: string | undefined) {
  const [data, setData] = useState<Notification[]>([]);
  useEffect(() => {
    if (!uid) { setData([]); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      unsub = onValue(ref(f.db, `notifications/${uid}`), (snap) => {
        const val = snap.val() || {};
        const arr: Notification[] = Object.entries(val).map(([id, v]: any) => ({ id, ...v }));
        arr.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setData(arr);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [uid]);
  return data;
}

export async function markNotificationRead(uid: string, id: string) {
  const f = await getFirebase();
  await update(ref(f.db, `notifications/${uid}/${id}`), { read: true });
}

export async function startConversation(input: {
  listingId?: string;
  listingTitle?: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
}) {
  const f = await getFirebase();
  const pair = [input.fromUid, input.toUid].sort().join("_");
  const id = `${pair}_${input.listingId || "profile"}`;
  const convRef = ref(f.db, `conversations/${id}`);
  const snap = await get(convRef);
  if (!snap.exists()) {
    const payload: Omit<Conversation, "id"> = {
      members: { [input.fromUid]: true, [input.toUid]: true },
      memberNames: { [input.fromUid]: input.fromName, [input.toUid]: input.toName },
      listingId: input.listingId,
      listingTitle: input.listingTitle,
      lastAt: Date.now(),
      unread: { [input.fromUid]: 0, [input.toUid]: 0 },
    };
    await set(convRef, payload);
    await set(ref(f.db, `userConversations/${input.fromUid}/${id}`), true);
    await set(ref(f.db, `userConversations/${input.toUid}/${id}`), true);
  }
  return id;
}

export function useConversations(uid: string | undefined) {
  const [data, setData] = useState<Conversation[]>([]);
  useEffect(() => {
    if (!uid) { setData([]); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      unsub = onValue(ref(f.db, `userConversations/${uid}`), async (snap) => {
        const ids = Object.keys(snap.val() || {});
        const rows = await Promise.all(ids.map(async (id) => {
          const s = await get(ref(f.db, `conversations/${id}`));
          return s.exists() ? { id, ...s.val() } as Conversation : null;
        }));
        setData((rows.filter(Boolean) as Conversation[]).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0)));
      });
    });
    return () => { if (unsub) unsub(); };
  }, [uid]);
  return data;
}

export function useMessages(conversationId: string | undefined) {
  const [data, setData] = useState<Message[]>([]);
  useEffect(() => {
    if (!conversationId) { setData([]); return; }
    let unsub: (() => void) | null = null;
    getFirebase().then((f) => {
      unsub = onValue(ref(f.db, `messages/${conversationId}`), (snap) => {
        const val = snap.val() || {};
        const arr: Message[] = Object.entries(val).map(([id, v]: any) => ({ id, ...v }));
        arr.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        setData(arr);
      });
    });
    return () => { if (unsub) unsub(); };
  }, [conversationId]);
  return data;
}

export async function sendMessage(conversationId: string, uid: string, name: string, text: string) {
  const f = await getFirebase();
  const clean = text.trim();
  if (!clean) return;
  const ts = Date.now();
  await set(push(ref(f.db, `messages/${conversationId}`)), { uid, name, text: clean, ts });
  const convSnap = await get(ref(f.db, `conversations/${conversationId}`));
  const conv = convSnap.val() as Conversation | null;
  if (!conv) return;
  const otherUid = Object.keys(conv.members || {}).find((id) => id !== uid);
  const updates: Record<string, any> = {
    [`conversations/${conversationId}/lastMessage`]: clean,
    [`conversations/${conversationId}/lastAt`]: ts,
    [`userConversations/${uid}/${conversationId}`]: true,
  };
  if (otherUid) {
    updates[`userConversations/${otherUid}/${conversationId}`] = true;
    updates[`conversations/${conversationId}/unread/${otherUid}`] = (conv.unread?.[otherUid] || 0) + 1;
  }
  await update(ref(f.db), updates);
  if (otherUid) {
    await pushNotification(otherUid, {
      type: "message",
      title: "New message",
      body: `${name}: ${clean}`.slice(0, 180),
      conversationId,
      listingId: conv.listingId,
      fromUid: uid,
      fromName: name,
      ts,
      read: false,
    });
  }
}

export async function markConversationRead(conversationId: string, uid: string) {
  const f = await getFirebase();
  await set(ref(f.db, `conversations/${conversationId}/unread/${uid}`), 0);
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

export async function uploadListingImage(_uid: string, file: File): Promise<string> {
  // Store image as base64 data URL (no cloud storage upload)
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export async function uploadUserAvatar(_uid: string, file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
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
