import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListings, toggleLike, toggleSaved, startConversation, sendMessage, type Listing } from "@/lib/db-hooks";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Heart, X, Bookmark, MapPin, RotateCcw, Sparkles, MessageCircle, Send } from "lucide-react";
import { CATEGORIES } from "@/lib/wilayas";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/swipe")({
  head: () => ({
    meta: [
      { title: "Swipe — E-souq" },
      { name: "description", content: "Discover ads with a swipe. Right to like, left to skip, up to save." },
    ],
  }),
  component: SwipePage,
});

type Action = "like" | "pass" | "save" | "reply";

function SwipePage() {
  const listings = useListings({ approvedOnly: true });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ id: string; action: Action }[]>([]);
  const [lastAction, setLastAction] = useState<Action | null>(null);
  const [replyFor, setReplyFor] = useState<Listing | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const deck = useMemo(() => listings || [], [listings]);
  const current = deck[index];
  const next = deck[index + 1];

  useEffect(() => { setIndex(0); setHistory([]); }, [deck.length]);

  const openReply = (listing: Listing) => {
    if (!user) {
      toast.message("Sign in to reply", { action: { label: "Sign in", onClick: () => navigate({ to: "/auth" }) } });
      return;
    }
    if (user.uid === listing.ownerUid) {
      toast.message("This is your own ad");
      return;
    }
    setReplyFor(listing);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!user || !replyFor || !replyText.trim() || replySending) return;
    setReplySending(true);
    try {
      const conversationId = await startConversation({
        listingId: replyFor.id,
        listingTitle: replyFor.title,
        fromUid: user.uid,
        fromName: user.displayName || user.email || "User",
        toUid: replyFor.ownerUid,
        toName: replyFor.ownerName || "Seller",
      });
      await sendMessage(conversationId, user.uid, user.displayName || user.email || "User", replyText.trim(), {
        listingId: replyFor.id,
        title: replyFor.title,
        image: replyFor.images?.[0],
        price: replyFor.price,
      });
      toast.success("Reply sent", {
        action: { label: "Open chat", onClick: () => navigate({ to: "/profile", search: { tab: "messages", conversation: conversationId } as any }) },
      });
      setReplyFor(null);
      setReplyText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send");
    } finally {
      setReplySending(false);
    }
  };

  const doAction = async (action: Action) => {
    if (!current) return;
    if (action === "reply") { openReply(current); return; }
    setLastAction(action);
    setHistory((h) => [...h, { id: current.id, action }]);
    setIndex((i) => i + 1);

    if (user && action === "like") {
      try { await toggleLike(current.id, user.uid); } catch {}
      toast.success("أعجبك الإعلان ❤️");
    }
    if (user && action === "save") {
      try { await toggleSaved(current.id, user.uid); } catch {}
      toast.success("تم الحفظ في المفضلة 🔖");
    }
    if (!user && (action === "like" || action === "save")) {
      toast.message("سجّل الدخول لحفظ الإعلانات", {
        action: { label: "دخول", onClick: () => navigate({ to: "/auth" }) },
      });
    }
    setTimeout(() => setLastAction(null), 400);
  };

  const undo = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setHistory((h) => h.slice(0, -1));
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="text-gold" /> اكتشف
            </h1>
            <p className="text-xs text-muted-foreground mt-1">يمين ❤️ · يسار ✕ · فوق 🔖 · تحت 💬 للرد</p>
          </div>
          <button
            onClick={undo}
            disabled={index === 0}
            className="size-10 rounded-full bg-surface border border-border flex items-center justify-center disabled:opacity-40 hover:bg-accent transition"
            aria-label="Undo"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        <div className="relative h-[520px] select-none">
          {!listings && (
            <div className="absolute inset-0 card-elevated animate-pulse" />
          )}

          {listings && !current && (
            <EmptyDeck onRestart={() => { setIndex(0); setHistory([]); }} hasHistory={history.length > 0} />
          )}

          {/* Next card (behind) */}
          {next && (
            <div className="absolute inset-0 scale-95 opacity-70 pointer-events-none">
              <Card listing={next} />
            </div>
          )}

          {/* Current card */}
          <AnimatePresence>
            {current && (
              <SwipeCard
                key={current.id}
                listing={current}
                onAction={doAction}
              />
            )}
          </AnimatePresence>

          {/* Action flash */}
          <AnimatePresence>
            {lastAction && (
              <motion.div
                key={lastAction + index}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1.4 }}
                exit={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center z-30"
              >
                {lastAction === "like" && <Heart className="size-32 text-red-500 fill-red-500 drop-shadow-2xl" />}
                {lastAction === "pass" && <X className="size-32 text-white bg-slate-800/70 rounded-full p-4 drop-shadow-2xl" strokeWidth={3} />}
                {lastAction === "save" && <Bookmark className="size-32 text-gold fill-gold drop-shadow-2xl" />}
                {lastAction === "reply" && <MessageCircle className="size-32 text-primary fill-primary/30 drop-shadow-2xl" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {current && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <ActionBtn color="bg-red-500/10 text-red-500 border-red-500/30" onClick={() => doAction("pass")} label="تخطي">
              <X className="size-6" strokeWidth={3} />
            </ActionBtn>
            <ActionBtn color="bg-primary/10 text-primary border-primary/30" onClick={() => doAction("reply")} label="رد">
              <MessageCircle className="size-6" />
            </ActionBtn>
            <ActionBtn color="bg-gold/10 text-gold border-gold/30" onClick={() => doAction("save")} label="حفظ" big>
              <Bookmark className="size-8" />
            </ActionBtn>
            <ActionBtn color="bg-green-500/10 text-green-500 border-green-500/30" onClick={() => doAction("like")} label="إعجاب">
              <Heart className="size-6 fill-current" />
            </ActionBtn>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">
          {deck.length > 0 && `${Math.min(index, deck.length)} / ${deck.length}`}
        </p>
      </section>

      {/* Reply sheet */}
      <AnimatePresence>
        {replyFor && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !replySending && setReplyFor(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed left-0 right-0 bottom-0 z-50 bg-surface border-t border-border rounded-t-3xl p-5 pb-8 shadow-2xl max-w-md mx-auto"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={replyFor.images?.[0] || `https://picsum.photos/seed/${replyFor.id}/80/80`}
                    alt=""
                    className="size-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Reply to ad</div>
                    <div className="font-bold text-sm truncate">{replyFor.title}</div>
                    <div className="text-xs text-muted-foreground truncate">to {replyFor.ownerName || "Seller"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !replySending && setReplyFor(null)}
                  disabled={replySending}
                  className="size-8 flex items-center justify-center rounded-full hover:bg-accent transition disabled:opacity-40"
                  aria-label="Cancel"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="relative">
                <Textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Hi, is "${replyFor.title}" still available?`}
                  rows={3}
                  maxLength={800}
                  disabled={replySending}
                  className="pr-14"
                />
                <Button
                  type="button"
                  size="icon"
                  className="absolute right-2 bottom-2 rounded-full btn-hero size-10"
                  onClick={sendReply}
                  disabled={!replyText.trim() || replySending}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function ActionBtn({ children, onClick, color, label, big }: any) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`${color} ${big ? "size-16" : "size-14"} rounded-full border-2 backdrop-blur flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform`}
    >
      {children}
    </button>
  );
}

function SwipeCard({ listing, onAction }: { listing: Listing; onAction: (a: Action) => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [20, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -20], [1, 0]);
  const saveOpacity = useTransform(y, [-140, -20], [1, 0]);
  const replyOpacity = useTransform(y, [20, 140], [0, 1]);

  const onDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * 0.5 + Math.abs(velocity.x) * 0.05;
    if (offset.y > 120 || velocity.y > 600) { onAction("reply"); y.set(0); x.set(0); return; }
    if (offset.y < -120 || velocity.y < -600) return onAction("save");
    if (offset.x > 120 || (offset.x > 60 && velocity.x > 400) || (swipe > 200 && offset.x > 0)) return onAction("like");
    if (offset.x < -120 || (offset.x < -60 && velocity.x < -400) || (swipe > 200 && offset.x < 0)) return onAction("pass");
  };

  return (
    <motion.div
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 800 : x.get() < 0 ? -800 : 0, y: y.get() < -50 ? -800 : 0, opacity: 0, transition: { duration: 0.35 } }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing z-20"
      whileTap={{ cursor: "grabbing" }}
    >
      <Card listing={listing}>
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 right-6 rotate-12 border-4 border-green-500 text-green-500 px-4 py-1.5 rounded-xl font-black text-2xl bg-white/90">
          LIKE
        </motion.div>
        <motion.div style={{ opacity: passOpacity }} className="absolute top-6 left-6 -rotate-12 border-4 border-red-500 text-red-500 px-4 py-1.5 rounded-xl font-black text-2xl bg-white/90">
          NOPE
        </motion.div>
        <motion.div style={{ opacity: saveOpacity }} className="absolute top-1/3 left-1/2 -translate-x-1/2 border-4 border-gold text-gold px-4 py-1.5 rounded-xl font-black text-2xl bg-white/90">
          SAVE
        </motion.div>
        <motion.div style={{ opacity: replyOpacity }} className="absolute bottom-24 left-1/2 -translate-x-1/2 border-4 border-primary text-primary px-4 py-1.5 rounded-xl font-black text-2xl bg-white/90 flex items-center gap-2">
          <MessageCircle className="size-6" /> REPLY
        </motion.div>
      </Card>
    </motion.div>
  );
}

function Card({ listing, children }: { listing: Listing; children?: React.ReactNode }) {
  const cat = CATEGORIES.find((c) => c.id === listing.category);
  const img = listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/800/1000`;
  const price = listing.price === 0 ? "بالمجان" : new Intl.NumberFormat("ar-DZ").format(listing.price) + " دج";

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-surface border border-border relative">
      <img src={img} alt={listing.title} className="w-full h-full object-cover pointer-events-none" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {cat && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 text-xs font-bold flex items-center gap-1">
          <span>{cat.icon}</span> {cat.name}
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-5 text-white">
        <div className="text-2xl font-black gradient-text mb-1">{price}</div>
        <h3 className="text-lg font-bold line-clamp-2 mb-2">{listing.title}</h3>
        <div className="flex items-center gap-1 text-xs text-white/85">
          <MapPin className="size-3" />
          <span>{listing.wilaya}{listing.commune ? ` — ${listing.commune}` : ""}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyDeck({ onRestart, hasHistory }: { onRestart: () => void; hasHistory: boolean }) {
  return (
    <div className="absolute inset-0 card-elevated flex flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-xl font-bold mb-2">لا مزيد من الإعلانات</h3>
      <p className="text-sm text-muted-foreground mb-6">شاهدت جميع الإعلانات المتاحة الآن.</p>
      <div className="flex gap-2">
        {hasHistory && (
          <button onClick={onRestart} className="btn-hero rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground">
            من البداية
          </button>
        )}
        <Link to="/browse" className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition">
          تصفح الكل
        </Link>
      </div>
    </div>
  );
}
