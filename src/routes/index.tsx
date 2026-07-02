import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/wilayas";
import { useListings } from "@/lib/db-hooks";
import { Search, Sparkles, TrendingUp, Shield, Flame } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import heroBg from "@/assets/maqam-echahid.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALGZONE — Algeria's #1 Classifieds Marketplace" },
      { name: "description", content: "Buy & sell across all 58 wilayas: cars, real estate, phones, electronics, jobs and more on ALGZONE." },
    ],
  }),
  component: Home,
});

function Home() {
  const listings = useListings({ approvedOnly: true });
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const featured = listings?.slice(0, 5) || [];
  const recent = listings?.slice(5) || [];

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg.url})` }}
        />
        {/* subtle green tint overlay */}
        <div className="absolute inset-0 bg-[rgba(6,78,59,0.35)] backdrop-blur-[2px]" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,78,59,0.15) 0%, rgba(0,0,0,0.45) 100%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur mb-6 animate-fade-up">
            <Sparkles className="size-4" /> <span className="text-sm font-medium">Live updates • Real-time listings</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-black mb-4 animate-fade-up leading-tight drop-shadow-lg">
            Everything you need, <span className="text-gold">in one place</span>
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto mb-8 animate-fade-up drop-shadow">
            Buy & sell across all 58 Algerian wilayas — cars, real estate, phones, jobs and more.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/browse", search: { q } as any }); }}
            className="max-w-2xl mx-auto flex gap-2 bg-white rounded-2xl p-2 shadow-2xl animate-fade-up"
          >
            <Search className="size-5 text-muted-foreground self-center mr-2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cars, apartments, phones..."
              className="flex-1 border-0 focus-visible:ring-0 text-foreground text-base bg-transparent"
            />
            <Button type="submit" className="btn-gold rounded-xl px-6">Search</Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-white/80 flex-wrap">
            <div className="flex items-center gap-2"><Shield className="size-4" /> Verified ads</div>
            <div className="flex items-center gap-2"><TrendingUp className="size-4" /> Real-time</div>
            <div className="flex items-center gap-2"><Sparkles className="size-4" /> 100% Free</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES — horizontal scroll */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-3xl font-black">Browse by Category</h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">Swipe to explore all categories</p>
          </div>
        </div>
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-2 snap-x snap-mandatory">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                to="/category/$id"
                params={{ id: cat.id }}
                className="group card-elevated border border-border/60 bg-card p-3 flex flex-col items-center gap-2 text-center animate-fade-up shrink-0 w-28 md:w-36 snap-start rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="size-16 md:size-20 flex items-center justify-center relative">
                  {/* glow on hover */}
                  <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                    style={{ background: `radial-gradient(circle, ${cat.color} 0%, transparent 70%)` }}
                  />
                  <img
                    src={cat.img}
                    alt={cat.name}
                    loading="lazy"
                    className="relative size-full object-contain transition-transform duration-500 ease-out group-hover:scale-125"
                  />
                </div>
                <div className="text-xs md:text-sm font-bold line-clamp-1 w-full">{cat.name}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1 w-full">{cat.nameAr}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED — horizontal scroll, 5 items */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-3xl font-black flex items-center gap-2">
                <Flame className="text-gold" /> Hot Ads
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-1">Swipe to see more</p>
            </div>
            <Link to="/browse" className="text-sm font-bold text-primary hover:underline shrink-0">View all →</Link>
          </div>
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 pb-2 snap-x snap-mandatory">
              {featured.map((l) => (
                <div key={l.id} className="w-64 md:w-72 shrink-0 snap-start">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECENT — grid, appears on scroll */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-3xl font-black flex items-center gap-2">
                <Sparkles className="text-primary" /> Latest Ads
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm mt-1">Fresh listings from the community</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recent.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* SKELETON / EMPTY */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {listings === null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-elevated overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {listings !== null && listings.length === 0 && (
          <div className="card-elevated p-12 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold mb-2">No ads yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to post an ad on ALGZONE!</p>
            <Link to="/post"><Button className="btn-hero rounded-xl">Post the first ad</Button></Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
