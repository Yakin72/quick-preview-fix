import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useListings, useMyRating, useUserProfile, rateUser, startConversation } from "@/lib/db-hooks";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutGrid, MapPin, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/user/$uid")({
  head: () => ({ meta: [{ title: "Seller Profile — E-souq" }] }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { uid } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = useUserProfile(uid);
  const listings = useListings({ ownerUid: uid, approvedOnly: true });
  const myRating = useMyRating(uid, user?.uid);

  if (profile === undefined || listings === null) {
    return <AppShell><div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">Loading...</div></AppShell>;
  }

  const fallbackName = listings[0]?.ownerName || "Seller";
  const name = profile?.name || fallbackName;
  const photo = profile?.photoURL || listings[0]?.ownerPhoto;
  const avg = profile?.ratingCount ? (profile.ratingSum || 0) / profile.ratingCount : 0;

  if (!profile && listings.length === 0) {
    return <AppShell><div className="mx-auto max-w-lg px-4 py-16 text-center"><h1 className="text-2xl font-black mb-3">Profile not found</h1><Link to="/browse" className="text-primary font-bold">Browse ads</Link></div></AppShell>;
  }

  const messageSeller = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (user.uid === uid) return navigate({ to: "/profile", search: { tab: "messages" } as any });
    const conversation = await startConversation({
      fromUid: user.uid,
      fromName: user.displayName || user.email || "User",
      toUid: uid,
      toName: name,
    });
    navigate({ to: "/profile", search: { tab: "messages", conversation } as any });
  };

  const submitRating = async (rating: number) => {
    if (!user) return navigate({ to: "/auth" });
    if (user.uid === uid) return;
    await rateUser(uid, user.uid, rating);
    toast.success("Rating saved");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="card-elevated p-6 mb-8 flex flex-wrap items-center gap-5">
          <div className="size-24 rounded-3xl btn-hero flex items-center justify-center text-primary-foreground font-black text-4xl overflow-hidden">
            {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : name[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-3xl font-black">{name}</h1>
            <div className="flex flex-wrap gap-2 mt-3 text-sm text-muted-foreground">
              {profile?.wilaya && <span className="flex items-center gap-1"><MapPin className="size-4" /> {profile.wilaya}</span>}
              <span className="flex items-center gap-1"><LayoutGrid className="size-4" /> {listings.length} ads</span>
              {profile?.createdAt && <span className="flex items-center gap-1"><Calendar className="size-4" /> Joined {new Date(profile.createdAt).getFullYear()}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-gold">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`size-5 ${avg >= n ? "fill-current" : ""}`} />)}</div>
              <span className="text-sm font-bold">{avg ? avg.toFixed(1) : "No ratings"}</span>
              <span className="text-xs text-muted-foreground">({profile?.ratingCount || 0})</span>
            </div>
          </div>
          <Button onClick={messageSeller} className="btn-hero rounded-xl gap-2"><MessageCircle className="size-4" /> Message</Button>
        </div>

        {user?.uid !== uid && (
          <div className="card-elevated p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-black">Rate this seller</h2>
              <p className="text-sm text-muted-foreground">Your rating helps other buyers.</p>
            </div>
            <div className="flex gap-1 text-gold">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => submitRating(n)} className="p-1 hover:scale-110 transition" aria-label={`Rate ${n} stars`}>
                  <Star className={`size-7 ${myRating >= n ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        <section>
          <h2 className="text-2xl font-black mb-4">Published ads ({listings.length})</h2>
          {listings.length === 0 ? (
            <div className="card-elevated p-12 text-center text-muted-foreground">No published ads yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}