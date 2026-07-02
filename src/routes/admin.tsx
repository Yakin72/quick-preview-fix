import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useListings, approveListing, deleteListing } from "@/lib/db-hooks";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";
import { Check, X, Eye, Shield } from "lucide-react";
import { CATEGORIES } from "@/lib/wilayas";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — سوق دي زد" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const all = useListings({ approvedOnly: false });
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return <AppShell><div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">التحقق من الصلاحيات...</div></AppShell>;
  }

  const pending = all?.filter((l) => !l.approved) || [];
  const approved = all?.filter((l) => l.approved) || [];

  const approve = async (id: string) => { await approveListing(id, true); toast.success("تمت الموافقة"); };
  const unapprove = async (id: string) => { await approveListing(id, false); toast.success("تم إلغاء النشر"); };
  const del = async (id: string) => {
    if (!confirm("حذف نهائي؟")) return;
    await deleteListing(id);
    toast.success("تم الحذف");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-2xl btn-hero flex items-center justify-center text-primary-foreground">
            <Shield className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black">لوحة الإدارة</h1>
            <p className="text-sm text-muted-foreground">مراجعة الإعلانات والموافقة عليها</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="إجمالي الإعلانات" value={all?.length ?? 0} />
          <StatCard label="بانتظار المراجعة" value={pending.length} highlight />
          <StatCard label="منشورة" value={approved.length} />
          <StatCard label="مشاهدات كلية" value={all?.reduce((s, l) => s + (l.views || 0), 0) ?? 0} />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-black mb-4">بانتظار المراجعة ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="card-elevated p-8 text-center text-muted-foreground">لا يوجد إعلانات بانتظار المراجعة.</div>
          ) : (
            <div className="space-y-3">
              {pending.map((l) => (
                <AdminRow key={l.id} l={l} onApprove={approve} onDelete={del} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-black mb-4">الإعلانات المنشورة ({approved.length})</h2>
          <div className="space-y-3">
            {approved.map((l) => (
              <AdminRow key={l.id} l={l} onApprove={unapprove} onDelete={del} approved />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card-elevated p-4 ${highlight ? "border-gold border-2" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-3xl font-black mt-1 ${highlight ? "text-gold" : "gradient-text"}`}>{value}</div>
    </div>
  );
}

function AdminRow({ l, onApprove, onDelete, approved }: any) {
  const cat = CATEGORIES.find((c) => c.id === l.category);
  const img = l.images?.[0] || `https://picsum.photos/seed/${l.id}/200/150`;
  return (
    <div className="card-elevated p-4 flex items-center gap-4">
      <img src={img} alt="" className="size-20 rounded-xl object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{l.title}</div>
        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
          {cat && <span>{cat.icon} {cat.name}</span>}
          <span>•</span>
          <span>{l.wilaya}</span>
          <span>•</span>
          <span>{l.ownerName}</span>
        </div>
        <div className="text-sm font-bold gradient-text mt-1">
          {l.price === 0 ? "بالمجان" : new Intl.NumberFormat("ar-DZ").format(l.price) + " دج"}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link to="/listing/$id" params={{ id: l.id }}>
          <Button variant="outline" size="icon" title="عرض"><Eye className="size-4" /></Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          className={approved ? "text-gold border-gold" : "text-success border-success"}
          onClick={() => onApprove(l.id)}
          title={approved ? "إلغاء النشر" : "موافقة"}
        >
          {approved ? <X className="size-4" /> : <Check className="size-4" />}
        </Button>
        <Button variant="outline" size="icon" className="text-destructive border-destructive" onClick={() => onDelete(l.id)} title="حذف">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
