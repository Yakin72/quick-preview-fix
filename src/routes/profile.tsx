import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  useListings, useSavedListings, uploadUserAvatar, useNotifications, useConversations,
  useMessages, sendMessage, markConversationRead, markNotificationRead, type Conversation
} from "@/lib/db-hooks";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Camera, Bookmark, MessageSquare, Bell, LayoutGrid, User as UserIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — E-souq" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ tab: (s.tab as string) || "ads", conversation: s.conversation as string | undefined }),
  component: ProfilePage,
});

function ProfilePage() {
  const { tab, conversation } = Route.useSearch();
  const { user, loading, updateUserProfile } = useAuth();
  const mine = useListings({ ownerUid: user?.uid, approvedOnly: false });
  const saved = useSavedListings(user?.uid);
  const notifications = useNotifications(user?.uid);
  const conversations = useConversations(user?.uid);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedConversation = conversation || conversations[0]?.id;
  const messages = useMessages(selectedConversation);

  useEffect(() => {
    if (user?.uid && selectedConversation) markConversationRead(selectedConversation, user.uid).catch(() => {});
  }, [selectedConversation, user?.uid]);

  if (loading) return <AppShell><div className="mx-auto max-w-2xl px-4 py-16 text-center">...</div></AppShell>;
  if (!user) return <AppShell><div className="mx-auto max-w-md card-elevated p-8 my-16 text-center"><h2 className="text-xl font-bold mb-4">Sign In Required</h2><Link to="/auth"><Button className="btn-hero rounded-xl">Sign In</Button></Link></div></AppShell>;

  const startEdit = () => { setName(user.displayName || ""); setEditing(true); };
  const saveProfile = async () => {
    try { await updateUserProfile({ name }); toast.success("Profile updated"); setEditing(false); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
  };
  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try { const url = await uploadUserAvatar(user.uid, file); await updateUserProfile({ photoURL: url }); toast.success("Avatar updated"); }
    catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const approved = mine?.filter((l) => l.approved) || [];
  const pending = mine?.filter((l) => !l.approved) || [];
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unread?.[user.uid] || 0), 0);

  const tabs = [
    { id: "ads", label: "My Ads", icon: LayoutGrid, count: mine?.length ?? 0 },
    { id: "saved", label: "Saved", icon: Bookmark, count: saved?.length ?? 0 },
    { id: "messages", label: "Messages", icon: MessageSquare, count: unreadMessages },
    { id: "notifications", label: "Notifications", icon: Bell, count: unreadNotifications },
    { id: "profile", label: "Profile", icon: UserIcon, count: 0 },
  ];

  const sendCurrentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;
    await sendMessage(selectedConversation, user.uid, user.displayName || user.email || "User", messageText);
    setMessageText("");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HEADER */}
        <div className="card-elevated p-6 mb-6 flex flex-wrap items-center gap-4">
          <div className="relative">
            <div className="size-20 rounded-2xl btn-hero flex items-center justify-center text-primary-foreground font-black text-3xl overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : (user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition" disabled={uploading}>
              <Camera className="size-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-black">{user.displayName || "User"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Link to="/post"><Button className="btn-hero rounded-xl gap-2"><Plus className="size-4" /> New Ad</Button></Link>
        </div>

        {/* TABS */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <Link key={t.id} to="/profile" search={{ tab: t.id }} className={`px-4 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
              <t.icon className="size-4" /> {t.label} {t.count > 0 && <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </Link>
          ))}
        </div>

        {/* CONTENT */}
        {tab === "ads" && (
          <div className="space-y-8">
            {pending.length > 0 && (
              <section>
                <h2 className="text-lg font-black mb-3">Pending Review ({pending.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pending.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              </section>
            )}
            <section>
              <h2 className="text-lg font-black mb-3">Published ({approved.length})</h2>
              {approved.length === 0 ? (
                <div className="card-elevated p-12 text-center"><div className="text-5xl mb-3">📢</div><p className="text-muted-foreground">You haven't posted any ads yet.</p></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {approved.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "saved" && (
          <section>
            <h2 className="text-lg font-black mb-3">Saved Ads ({saved?.length ?? 0})</h2>
            {!saved || saved.length === 0 ? (
              <div className="card-elevated p-12 text-center"><Bookmark className="size-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No saved ads yet. Tap the bookmark on any ad to save it.</p></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {saved.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </section>
        )}

        {tab === "messages" && (
          <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[560px]">
            <div className="card-elevated overflow-hidden">
              <div className="p-4 border-b border-border font-black flex items-center gap-2"><MessageSquare className="size-4" /> Messages</div>
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No conversations yet.</div>
              ) : conversations.map((c) => <ConversationRow key={c.id} conversation={c} currentUid={user.uid} selected={selectedConversation === c.id} />)}
            </div>
            <div className="card-elevated overflow-hidden flex flex-col">
              {!selectedConversation ? (
                <div className="m-auto text-center text-muted-foreground"><MessageSquare className="size-12 mx-auto mb-3" />Choose a conversation</div>
              ) : (
                <>
                  <div className="p-4 border-b border-border font-bold">{conversations.find((c) => c.id === selectedConversation)?.listingTitle || "Conversation"}</div>
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px] bg-muted/25">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.uid === user.uid ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${m.uid === user.uid ? "btn-hero text-primary-foreground" : "bg-card border border-border"}`}>
                          <div className="font-bold text-[11px] opacity-80 mb-0.5">{m.name}</div>
                          <div>{m.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={sendCurrentMessage} className="p-3 border-t border-border flex gap-2">
                    <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message..." className="h-11" maxLength={800} />
                    <Button type="submit" className="btn-hero rounded-xl" disabled={!messageText.trim()}>Send</Button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b border-border font-black flex items-center gap-2"><Bell className="size-4" /> Notifications</div>
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">You're all caught up!</div>
            ) : notifications.map((n) => (
              <Link
                key={n.id}
                to={n.conversationId ? "/profile" : n.listingId ? "/listing/$id" : "/profile"}
                params={n.listingId ? { id: n.listingId } : undefined as any}
                search={n.conversationId ? { tab: "messages", conversation: n.conversationId } as any : undefined as any}
                onClick={() => user?.uid && markNotificationRead(user.uid, n.id)}
                className={`block p-4 border-b border-border last:border-0 hover:bg-accent/60 transition ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm">{n.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{n.body}</div>
                  </div>
                  {!n.read && <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />}
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === "profile" && (
          <div className="card-elevated p-6 max-w-lg">
            <h2 className="text-lg font-black mb-4">Profile Settings</h2>
            {editing ? (
              <div className="space-y-4">
                <div><Label>Display Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 mt-1" /></div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} className="btn-hero rounded-xl">Save</Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Row label="Name" value={user.displayName || "—"} />
                <Row label="Email" value={user.email || "—"} />
                <Button onClick={startEdit} variant="outline" className="rounded-xl">Edit Profile</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ConversationRow({ conversation, currentUid, selected }: { conversation: Conversation; currentUid: string; selected: boolean }) {
  const otherUid = Object.keys(conversation.members || {}).find((id) => id !== currentUid) || currentUid;
  const unread = conversation.unread?.[currentUid] || 0;
  return (
    <Link
      to="/profile"
      search={{ tab: "messages", conversation: conversation.id } as any}
      className={`block p-4 border-b border-border last:border-0 hover:bg-accent/60 transition ${selected ? "bg-accent" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">{conversation.memberNames?.[otherUid] || "User"}</div>
          <div className="text-xs text-muted-foreground truncate">{conversation.listingTitle || "Profile chat"}</div>
          <div className="text-xs text-muted-foreground truncate mt-1">{conversation.lastMessage || "No messages yet"}</div>
        </div>
        {unread > 0 && <span className="text-[11px] bg-primary text-primary-foreground rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{unread}</span>}
      </div>
    </Link>
  );
}
