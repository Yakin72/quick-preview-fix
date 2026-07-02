import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ListingCard } from "@/components/ListingCard";
import { useListings } from "@/lib/db-hooks";
import { CATEGORIES } from "@/lib/wilayas";

export const Route = createFileRoute("/category/$id")({
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.id === params.id);
    return { meta: [{ title: `${cat?.name || "فئة"} — سوق دي زد` }] };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { id } = Route.useParams();
  const cat = CATEGORIES.find((c) => c.id === id);
  const listings = useListings({ category: id, approvedOnly: true });

  if (!cat) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">الفئة غير موجودة</h1>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">العودة للرئيسية</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 py-14 text-white text-center">
          <div className="text-6xl mb-3 animate-float inline-block">{cat.icon}</div>
          <h1 className="text-4xl font-black">{cat.name}</h1>
          <p className="mt-2 text-white/80">{listings?.length ?? "..."} إعلان في هذه الفئة</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {!listings && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-elevated aspect-[4/3] animate-pulse bg-muted" />
            ))}
          </div>
        )}
        {listings && listings.length === 0 && (
          <div className="card-elevated p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-xl font-bold">لا يوجد إعلانات في هذه الفئة</h3>
            <Link to="/post" className="inline-block mt-4 btn-hero rounded-xl px-5 py-2.5 text-sm font-medium">
              كن أول من يضيف إعلاناً
            </Link>
          </div>
        )}
        {listings && listings.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
