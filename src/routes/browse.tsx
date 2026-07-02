import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { useListings } from "@/lib/db-hooks";
import { CATEGORIES, WILAYAS } from "@/lib/wilayas";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

type Search = { q?: string; cat?: string; wilaya?: string };

export const Route = createFileRoute("/browse")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
    wilaya: typeof s.wilaya === "string" ? s.wilaya : undefined,
  }),
  head: () => ({ meta: [{ title: "تصفح الإعلانات — سوق دي زد" }] }),
  component: Browse,
});

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const listings = useListings({ approvedOnly: true });
  const [q, setQ] = useState(search.q || "");

  const filtered = useMemo(() => {
    if (!listings) return null;
    return listings.filter((l) => {
      if (search.cat && l.category !== search.cat) return false;
      if (search.wilaya && l.wilaya !== search.wilaya) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!l.title?.toLowerCase().includes(s) && !l.description?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [listings, search, q]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-black mb-6">تصفح الإعلانات</h1>

        <div className="card-elevated p-4 mb-6 grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث..."
              className="pr-10 h-11"
            />
          </div>
          <Select value={search.cat || "__all"} onValueChange={(v) => navigate({ search: (p: Search) => ({ ...p, cat: v === "__all" ? undefined : v }) })}>
            <SelectTrigger className="h-11"><SelectValue placeholder="كل الفئات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">كل الفئات</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.wilaya || "__all"} onValueChange={(v) => navigate({ search: (p: Search) => ({ ...p, wilaya: v === "__all" ? undefined : v }) })}>
            <SelectTrigger className="h-11"><SelectValue placeholder="كل الولايات" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__all">كل الولايات</SelectItem>
              {WILAYAS.map((w) => <SelectItem key={w.code} value={w.name}>{w.code} — {w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered === null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-elevated aspect-[4/3] animate-pulse bg-muted" />
            ))}
          </div>
        )}

        {filtered && filtered.length === 0 && (
          <div className="card-elevated p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-xl font-bold">لا توجد نتائج</h3>
            <p className="text-muted-foreground mt-2">جرّب تعديل معايير البحث.</p>
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <>
            <div className="text-sm text-muted-foreground mb-3">{filtered.length} إعلان</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
