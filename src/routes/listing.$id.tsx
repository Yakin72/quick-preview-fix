import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  useListing, useComments, addComment, deleteComment, toggleLike, useLiked,
  incrementViews, deleteListing, toggleSaved, useIsSaved, useListings, startConversation, sendMessage
} from "@/lib/db-hooks";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useMemo, useState } from "react";
import {
  Heart, MapPin, Phone, Eye, Trash2, MessageCircle, Share2, Clock, Calendar,
  Bookmark, ChevronDown, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/wilayas";
import { ListingCard } from "@/components/ListingCard";

export const Route = createFileRoute("/listing/$id")({ component: ListingPage });

function ListingPage() {
  const { id } = Route.useParams();
  const listing = useListing(id);
  const comments = useComments(id);
  const { user, isAdmin } = useAuth();
  const liked = useLiked(id, user?.uid);
  const saved = useIsSaved(id, user?.uid);
  const [text, setText] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [swapText, setSwapText] = useState("");
  const [swapSending, setSwapSending] = useState(false);
  const navigate = useNavigate();
  const all = useListings({ approvedOnly: true, category: listing?.category });

  useEffect(() => { if (id) incrementViews(id).catch(() => {}); }, [id]);

  const similar = useMemo(
    () => (all || []).filter((l) => l.id !== id).slice(0, 8),
    [all, id]
  );

  if (listing === undefined) return <AppShell><div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">Loading...</div></AppShell>;
  if (listing === null) return <AppShell><div className="mx-auto max-w-6xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Ad not found</h1><Link to="/" className="text-primary hover:underline mt-4 inline-block">Back to home</Link></div></AppShell>;

  const cat = CATEGORIES.find((c) => c.id === listing.category);
  const images = listing.images?.length ? listing.images : [`https://picsum.photos/seed/${listing.id}/800/600`];
  const price = listing.price === 0 ? "FREE" : new Intl.NumberFormat("en-DZ").format(listing.price) + " DZD";
  const shortDesc = listing.description || "";
  const isLongDesc = shortDesc.length > 400;

  const handleLike = async () => { if (!user) return navigate({ to: "/auth" }); await toggleLike(listing.id, user.uid); };
  const handleMessage = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (user.uid === listing.ownerUid) return navigate({ to: "/profile", search: { tab: "messages" } as any });
    const conversation = await startConversation({
      listingId: listing.id,
      listingTitle: listing.title,
      fromUid: user.uid,
      fromName: user.displayName || user.email || "User",
      toUid: listing.ownerUid,
      toName: listing.ownerName || "Seller",
    });
    navigate({ to: "/profile", search: { tab: "messages", conversation } as any });
  };
  const handleSave = async () => {
    if (!user) return navigate({ to: "/auth" });
    const s = await toggleSaved(listing.id, user.uid);
    toast.success(s ? "Saved to your bookmarks" : "Removed from bookmarks");
  };
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    if (!text.trim()) return;
    await addComment(listing.id, user.uid, user.displayName || user.email || "User", text.trim());
    setText(""); toast.success("Comment added");
  };
  const handleDelete = async () => {
    if (!confirm("Delete this ad permanently?")) return;
    await deleteListing(listing.id); toast.success("Deleted"); navigate({ to: "/" });
  };

  const canManage = isAdmin || user?.uid === listing.ownerUid;
  const canSwap = !!user && user.uid !== listing.ownerUid;

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!swapText.trim() || swapSending) return;
    setSwapSending(true);
    try {
      const conversationId = await startConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        fromUid: user.uid,
        fromName: user.displayName || user.email || "User",
        toUid: listing.ownerUid,
        toName: listing.ownerName || "Seller",
      });
      await sendMessage(conversationId, user.uid, user.displayName || user.email || "User", swapText.trim());
      setSwapText("");
      toast.success("Reply sent to the seller", {
        action: { label: "Open chat", onClick: () => navigate({ to: "/profile", search: { tab: "messages", conversation: conversationId } as any }) },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send");
    } finally {
      setSwapSending(false);
    }
  };

  const fullDate = new Date(listing.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const cleanPhone = listing.phone.replace(/^0/, "213");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>›</span>
          {cat && <><Link to="/category/$id" params={{ id: cat.id }} className="hover:text-primary">{cat.name}</Link><span>›</span></>}
          {listing.subcategory && <><span className="text-foreground/70">{listing.subcategory}</span><span>›</span></>}
          <span className="truncate text-foreground font-medium">{listing.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: IMAGES + INFO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated overflow-hidden">
              <div className="aspect-[4/3] bg-muted relative">
                <img src={images[imgIdx]} alt={listing.title} className="w-full h-full object-cover" />
                {!listing.approved && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-gold text-gold-foreground text-xs font-bold">Pending Review</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {images.map((src, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} className={`shrink-0 size-16 rounded-lg overflow-hidden border-2 transition ${i === imgIdx ? "border-primary" : "border-transparent opacity-70"}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  {listing.subcategory && (
                    <div className="text-xs uppercase tracking-wider text-primary font-bold mb-1">{cat?.name} • {listing.subcategory}</div>
                  )}
                  <h1 className="text-2xl md:text-3xl font-black">{listing.title}</h1>
                </div>
                {canManage && (
                  <Button variant="outline" size="icon" onClick={handleDelete} className="text-destructive shrink-0"><Trash2 className="size-4" /></Button>
                )}
              </div>
              <div className="text-3xl font-black gradient-text mb-4">{price}</div>

              {/* META CHIPS */}
              <div className="flex flex-wrap gap-2 text-xs mb-4">
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><Hash className="size-3" /> ID: {listing.id.slice(0, 10).toUpperCase()}</span>
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><Calendar className="size-3" /> {fullDate}</span>
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><Clock className="size-3" /> {timeAgo(listing.createdAt)}</span>
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><Eye className="size-3" /> {listing.views || 0} views</span>
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><Heart className="size-3" /> {listing.likes || 0} likes</span>
                <span className="px-3 py-1.5 rounded-full bg-muted flex items-center gap-1.5"><MapPin className="size-3" /> {listing.wilaya}{listing.commune && ` — ${listing.commune}`}</span>
              </div>

              {/* CATEGORY-SPECIFIC ATTRS TABLE */}
              {listing.attrs && Object.keys(listing.attrs).length > 0 && (
                <div className="mb-5 grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  {Object.entries(listing.attrs).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div>
                      <div className="text-sm font-bold">{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="font-bold mb-2">Description</h2>
              <p className="text-foreground/85 whitespace-pre-wrap leading-relaxed">
                {isLongDesc && !descExpanded ? shortDesc.slice(0, 400) + "..." : shortDesc || "No description."}
              </p>
              {isLongDesc && (
                <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={() => setDescExpanded((v) => !v)}>
                  {descExpanded ? "Show less" : "Show more"} <ChevronDown className={`size-4 transition ${descExpanded ? "rotate-180" : ""}`} />
                </Button>
              )}
            </div>

            {/* COMMENTS */}
            <div className="card-elevated p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MessageCircle className="size-5" /> Comments ({comments.length})
              </h2>

              <form onSubmit={handleComment} className="mb-6 space-y-2">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={user ? "Write a comment..." : "Sign in to comment"} disabled={!user} rows={3} maxLength={500} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!user || !text.trim()} className="btn-hero rounded-xl">Send</Button>
                </div>
              </form>

              <div className="space-y-4">
                {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Be the first to comment!</p>}
                {displayedComments.map((c) => (
                  <div key={c.id} className="flex gap-3 animate-fade-up">
                    <div className="size-10 rounded-full btn-hero flex items-center justify-center text-primary-foreground font-bold shrink-0">
                      {c.name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{timeAgo(c.ts)}</span>
                        </div>
                        {(isAdmin || user?.uid === c.uid) && (
                          <button onClick={() => deleteComment(listing.id, c.id)} className="text-destructive/70 hover:text-destructive"><Trash2 className="size-3.5" /></button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/85 bg-muted/50 rounded-xl p-3">{c.text}</p>
                    </div>
                  </div>
                ))}
                {comments.length > 3 && (
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAllComments((v) => !v)}>
                    {showAllComments ? "Show top comments only" : `Show all ${comments.length} comments`}
                  </Button>
                )}
              </div>
            </div>

            {/* SWAP: inline reply to the ad */}
            {user?.uid !== listing.ownerUid && (
              <div className="card-elevated p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-9 rounded-xl btn-hero flex items-center justify-center text-primary-foreground">
                    <MessageCircle className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-black">Reply to this ad</h2>
                    <p className="text-xs text-muted-foreground">Your message goes straight to {listing.ownerName || "the seller"} as a chat.</p>
                  </div>
                </div>
                <form onSubmit={handleSwap} className="space-y-2">
                  <Textarea
                    value={swapText}
                    onChange={(e) => setSwapText(e.target.value)}
                    placeholder={user ? `Hi, is "${listing.title}" still available?` : "Sign in to send a reply"}
                    disabled={!canSwap || swapSending}
                    rows={3}
                    maxLength={800}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">Sends privately in E-souq messages.</span>
                    <Button type="submit" disabled={!canSwap || !swapText.trim() || swapSending} className="btn-hero rounded-xl gap-2">
                      <MessageCircle className="size-4" /> {swapSending ? "Sending..." : "Send reply"}
                    </Button>
                  </div>
                </form>
              </div>
            )}


            {similar.length > 0 && (
              <div>
                <h2 className="text-xl font-black mb-4">Similar Ads</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {similar.slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: SELLER + ACTIONS */}
          <div className="space-y-4">
            <div className="card-elevated p-6 sticky top-20">
              <Link to="/user/$uid" params={{ uid: listing.ownerUid }} className="flex items-center gap-3 mb-4 rounded-xl hover:bg-accent/60 transition p-1 -m-1">
                <div className="size-12 rounded-full btn-hero flex items-center justify-center text-primary-foreground font-bold overflow-hidden">
                  {listing.ownerPhoto ? <img src={listing.ownerPhoto} alt="" className="w-full h-full object-cover" /> : (listing.ownerName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{listing.ownerName || "Seller"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {listing.wilaya}</div>
                </div>
              </Link>

              {/* CONTACT BUTTONS — brand colors */}
              <div className="space-y-2">
                {showPhone ? (
                  <a href={`tel:${listing.phone}`} className="block">
                    <Button className="w-full h-12 rounded-xl gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                      <Phone className="size-5" /> {listing.phone}
                    </Button>
                  </a>
                ) : (
                  <Button onClick={() => setShowPhone(true)} className="w-full h-12 rounded-xl gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                    <Phone className="size-5" /> Show Phone
                  </Button>
                )}

                <a href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, about your ad: ${listing.title}`)}`} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-11 rounded-xl gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white">
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </Button>
                </a>

                <a href={`viber://chat?number=%2B${cleanPhone}`} className="block">
                  <Button className="w-full h-11 rounded-xl gap-2 bg-[#7360F2] hover:bg-[#5F4CD8] text-white">
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4.011C9.473.05 5.333.362 3.02 2.488 1.303 4.199.7 6.706.63 9.814c-.06 3.098-.13 8.909 5.47 10.492v2.404s-.038.972.6 1.17c.777.242 1.227-.5 1.968-1.299l1.35-1.522c3.828.32 6.775-.418 7.11-.527.775-.252 5.166-.813 5.879-6.643.735-6.01-.36-9.808-2.32-11.522L20.68 2.36c-.717-.653-2.573-1.746-6.088-1.746-.35 0-.717-.006-1.088-.006A25.85 25.85 0 0011.4.01zm.03 1.687c.34 0 .69.007 1.07.017 3.14 0 4.62.926 5.238 1.472l1.008.912c1.658 1.44 2.548 4.79 1.926 9.816-.6 4.868-4.16 5.208-4.816 5.42-.28.088-2.858.72-6.099.51 0 0-2.414 2.913-3.166 3.66-.117.118-.256.166-.348.14-.128-.03-.164-.183-.163-.408l.02-3.994c-4.734-1.32-4.459-6.267-4.41-8.859.06-2.59.55-4.72 1.994-6.16 1.958-1.782 5.475-2.049 7.11-2.05zm.336 2.372c-.183 0-.322.107-.322.335 0 .175.14.328.322.328 2.643 0 4.72 1.905 4.71 4.585 0 .175.13.328.313.328.183 0 .323-.153.323-.328.008-2.98-2.33-5.259-5.346-5.248zm-4.35.925a.514.514 0 00-.318.078l-.674.87c-.184.223-.223.474-.11.735.113.263 1.008 2.084 1.887 3.28.879 1.195 2.087 2.4 2.958 2.855.87.456 1.16.408 1.395.117l.87-.677c.213-.176.348-.478.269-.752-.086-.276-.68-1.5-1.056-1.977-.376-.478-.878-.575-1.107-.343l-.6.6c-.276.246-.62.223-.788.153-.412-.176-1.294-1.058-1.7-1.583-.408-.523-.723-1.075-.723-1.323 0-.246.323-.408.483-.484.16-.076.343-.184.213-.406-.129-.222-.83-1.106-1.006-1.226a.487.487 0 00-.293-.117z"/></svg>
                    Viber
                  </Button>
                </a>

                <Button onClick={handleMessage} variant="outline" className="w-full h-11 rounded-xl gap-2">
                  <MessageCircle className="size-4" /> Message in E-souq
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <Button onClick={handleLike} variant="outline" className={`h-11 rounded-xl gap-1 flex-col text-xs ${liked ? "border-destructive text-destructive" : ""}`}>
                  <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
                  {listing.likes || 0} Likes
                </Button>
                <Button onClick={handleSave} variant="outline" className={`h-11 rounded-xl gap-1 flex-col text-xs ${saved ? "border-gold text-gold" : ""}`}>
                  <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} />
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" className="h-11 rounded-xl gap-1 flex-col text-xs"
                  onClick={() => {
                    navigator.share?.({ title: listing.title, url: location.href }).catch(() => {
                      navigator.clipboard.writeText(location.href); toast.success("Link copied");
                    });
                  }}>
                  <Share2 className="size-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
