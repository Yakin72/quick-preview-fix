import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/wilayas";
import { useListings } from "@/lib/db-hooks";
import { Search, Sparkles, TrendingUp, Shield } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import heroBg from "@/assets/hero-bg-3d.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E-souq — Algeria's #1 Classifieds Marketplace" },
      { name: "description", content: "Buy & sell across all 58 wilayas: cars, real estate, phones, electronics, jobs and more on E-souq." },
    ],
  }),
  component: Home,
});

function Home() {
  const listings = useListings({ approvedOnly: true });
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const featured = listings?.slice(0, 8) || [];
  const recent = listings?.slice(0, 12) || [];

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg.url})` }}
        />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.9 0.15 82 / 0.5), transparent 50%), radial-gradient(circle at 80% 60%, oklch(0.7 0.2 155 / 0.4), transparent 50%)"
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur mb-6 animate-fade-up">
            <Sparkles className="size-4" /> <span className="text-sm font-medium">Live updates • Real-time listings</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 animate-fade-up leading-tight">
            Everything you need, <span className="text-gold">in one place</span>
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-8 animate-fade-up">
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

          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2"><Shield className="size-4" /> Verified ads</div>
            <div className="flex items-center gap-2"><TrendingUp className="size-4" /> Real-time</div>
            <div className="flex items-center gap-2"><Sparkles className="size-4" /> 100% Free</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find exactly what you're looking for</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to="/category/$id"
              params={{ id: cat.id }}
              className="group card-elevated p-4 flex flex-col items-center gap-3 text-center animate-fade-up hover:-translate-y-1 transition-transform"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div
                className="size-20 rounded-2xl flex items-center justify-center overflow-hidden relative"
                style={{
                  background: `radial-gradient(circle at 30% 20%, color-mix(in oklab, ${cat.color} 30%, transparent), color-mix(in oklab, ${cat.color} 8%, transparent))`,
                  boxShadow: `0 10px 30px -12px color-mix(in oklab, ${cat.color} 45%, transparent)`,
                }}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  loading="lazy"
                  className="size-16 object-contain drop-shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500"
                />
              </div>
              <div className="text-sm font-bold line-clamp-1">{cat.name}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{cat.nameAr}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2">
                <Sparkles className="text-gold" /> Featured Ads
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Latest approved listings</p>
            </div>
            <Link to="/browse" className="text-sm font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {/* RECENT / EMPTY */}
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
            <p className="text-muted-foreground mb-6">Be the first to post an ad on E-souq!</p>
            <Link to="/post"><Button className="btn-hero rounded-xl">Post the first ad</Button></Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
