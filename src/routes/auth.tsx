import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAS } from "@/lib/wilayas";
import { toast } from "sonner";
import logoAsset from "@/assets/algzone-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — ALGZONE" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInGoogle, signInFacebook, signInApple } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "in") {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        if (!name || !phone || !wilaya) { toast.error("Please complete all fields"); setLoading(false); return; }
        await signUp(name, email, password, phone, wilaya);
        toast.success("Account created!");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      const msg = err?.code === "auth/invalid-credential" ? "Invalid credentials"
        : err?.code === "auth/email-already-in-use" ? "Email already in use"
        : err?.code === "auth/weak-password" ? "Password too weak (min 6 characters)"
        : err?.code === "auth/operation-not-allowed" ? "This sign-in method is not enabled in Firebase Console"
        : err?.code === "auth/popup-closed-by-user" ? "Popup closed"
        : err?.message || "An error occurred";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const social = async (fn: () => Promise<void>, name: string) => {
    setLoading(true);
    try { await fn(); toast.success(`Signed in with ${name}!`); navigate({ to: "/" }); }
    catch (err: any) {
      const msg = err?.code === "auth/operation-not-allowed" ? `${name} sign-in is not enabled in Firebase Console`
        : err?.code === "auth/popup-closed-by-user" ? "Popup closed"
        : err?.message || `${name} sign-in failed`;
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="card-elevated p-8">
          <div className="text-center mb-6">
            <img src={logoAsset.url} alt="ALGZONE" className="mx-auto mb-3 size-20 object-contain" />
            <h1 className="text-2xl font-black">{mode === "in" ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "in" ? "Sign in to continue" : "Join the ALGZONE community"}
            </p>
          </div>

          <div className="flex bg-muted p-1 rounded-xl mb-6">
            <button type="button" onClick={() => setMode("in")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === "in" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>Log In</button>
            <button type="button" onClick={() => setMode("up")} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === "up" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>Register</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "up" && (
              <>
                <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 mt-1" required /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" className="h-11 mt-1" required /></div>
                <div>
                  <Label>Wilaya</Label>
                  <Select value={wilaya} onValueChange={setWilaya}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Select your wilaya" /></SelectTrigger>
                    <SelectContent className="max-h-72">{WILAYAS.map((w) => <SelectItem key={w.code} value={w.name}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 mt-1" required autoComplete="email" /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 mt-1" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} /></div>
            <Button type="submit" disabled={loading} className="w-full btn-hero h-12 rounded-xl text-base">
              {loading ? "..." : mode === "in" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Button type="button" onClick={() => social(signInGoogle, "Google")} disabled={loading} variant="outline" className="w-full h-11 rounded-xl gap-3">
              <svg className="size-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </Button>
            <Button type="button" onClick={() => social(signInFacebook, "Facebook")} disabled={loading} className="w-full h-11 rounded-xl gap-3 bg-[#1877F2] hover:bg-[#166FE0] text-white">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </Button>
            <Button type="button" onClick={() => social(signInApple, "Apple")} disabled={loading} className="w-full h-11 rounded-xl gap-3 bg-black hover:bg-neutral-800 text-white">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
