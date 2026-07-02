import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, SUBCATEGORIES, CATEGORY_FIELDS, WILAYAS, CONDITIONS } from "@/lib/wilayas";
import { createListing, uploadListingImage } from "@/lib/db-hooks";
import { toast } from "sonner";
import { X, Upload, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/post")({
  head: () => ({ meta: [{ title: "Post Ad — ALGZONE" }] }),
  component: PostPage,
});

function PostPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [phone, setPhone] = useState("");
  const [condition, setCondition] = useState("used");
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const communes = useMemo(() => WILAYAS.find((w) => w.name === wilaya)?.communes || [], [wilaya]);
  const subs = SUBCATEGORIES[category] || [];
  const catFields = CATEGORY_FIELDS[category] || [];

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith("image/") && f.size < 5 * 1024 * 1024);
    setFiles((prev) => [...prev, ...arr].slice(0, 8));
  };

  if (loading) return <AppShell><div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">...</div></AppShell>;
  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-16 text-center card-elevated p-8 my-16">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to post an ad.</p>
          <Link to="/auth"><Button className="btn-hero rounded-xl">Sign In</Button></Link>
        </div>
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) return toast.error("Title too short");
    if (!category) return toast.error("Select a category");
    if (!wilaya || !commune) return toast.error("Select wilaya and commune");
    if (!/^0?[567]\d{8}$/.test(phone.trim())) return toast.error("Invalid Algerian phone");
    for (const f of catFields) {
      if (f.required && !attrs[f.key]) return toast.error(`${f.label} is required`);
    }
    setSubmitting(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadListingImage(user.uid, file);
        uploaded.push(url);
      }
      const cleanAttrs: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === "") continue;
        const field = catFields.find((f) => f.key === k);
        cleanAttrs[k] = field?.type === "number" ? Number(v) : v;
      }
      const id = await createListing({
        title: title.trim(),
        description: desc.trim(),
        price: Number(price) || 0,
        category,
        subcategory: subcategory || undefined,
        attrs: Object.keys(cleanAttrs).length ? cleanAttrs : undefined,
        wilaya, commune,
        phone: phone.trim(),
        condition,
        images: uploaded,
        ownerUid: user.uid,
        ownerName: user.displayName || user.email || "User",
        ownerPhoto: user.photoURL || undefined,
      });
      toast.success("Ad submitted — pending admin review");
      navigate({ to: "/listing/$id", params: { id } });
    } catch (err: any) {
      toast.error(err?.message || "Failed to post ad");
    } finally { setSubmitting(false); }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black gradient-text mb-2">Post Your Ad</h1>
          <p className="text-muted-foreground">Fill in the details — will go live after admin review.</p>
        </div>

        <form onSubmit={submit} className="card-elevated p-6 md:p-8 space-y-5">
          <div>
            <Label>Ad Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Renault Symbol 2019 excellent condition" className="h-11 mt-1" required maxLength={120} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(""); setAttrs({}); }}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub-category</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={!subs.length}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder={subs.length ? "Select" : "Pick category first"} /></SelectTrigger>
                <SelectContent>{subs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {catFields.length > 0 && (
            <div className="card p-4 rounded-xl bg-muted/40 border border-border">
              <div className="text-sm font-bold mb-3 text-primary">Category Details</div>
              <div className="grid md:grid-cols-2 gap-3">
                {catFields.map((f) => (
                  <div key={f.key}>
                    <Label>{f.label} {f.required && "*"}</Label>
                    {f.type === "select" ? (
                      <Select value={attrs[f.key] || ""} onValueChange={(v) => setAttrs((a) => ({ ...a, [f.key]: v }))}>
                        <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.type}
                        value={attrs[f.key] || ""}
                        onChange={(e) => setAttrs((a) => ({ ...a, [f.key]: e.target.value }))}
                        className="h-11 mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Wilaya *</Label>
              <Select value={wilaya} onValueChange={(v) => { setWilaya(v); setCommune(""); }}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Select wilaya" /></SelectTrigger>
                <SelectContent className="max-h-72">{WILAYAS.map((w) => <SelectItem key={w.code} value={w.name}>{w.code} — {w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commune *</Label>
              <Select value={commune} onValueChange={setCommune} disabled={!wilaya}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder={wilaya ? "Select" : "Pick wilaya first"} /></SelectTrigger>
                <SelectContent className="max-h-72">{communes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Price (DZD) — 0 for free</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150000" className="h-11 mt-1" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" className="h-11 mt-1" required />
            </div>
          </div>

          <div>
            <Label>Photos (up to 8, max 5MB each)</Label>
            <label className="mt-1 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/50 transition">
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <div className="text-center text-muted-foreground">
                <Upload className="size-8 mx-auto mb-2" />
                <div className="text-sm font-medium">Click to upload or drag & drop</div>
                <div className="text-xs">PNG, JPG, WEBP</div>
              </div>
            </label>
            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                      <X className="size-3" />
                    </button>
                    {i === 0 && <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">MAIN</div>}
                  </div>
                ))}
                {files.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/50">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    <ImagePlus className="size-6 text-muted-foreground" />
                  </label>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} placeholder="Details, condition, year, etc..." className="mt-1" maxLength={2000} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full btn-hero h-12 rounded-xl text-base">
            {submitting ? "Publishing..." : "Publish Ad"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
