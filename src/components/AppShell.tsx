import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, User, LogOut, Shield, Menu, Moon, Sun, Bell, MessageSquare, Home as HomeIcon, LogIn, UserPlus, Bookmark, Store } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/lib/theme";
import { CATEGORIES } from "@/lib/wilayas";
import { useNotifications, useConversations } from "@/lib/db-hooks";
import logoAsset from "@/assets/algzone-logo.png.asset.json";
import storeIconAsset from "@/assets/esouq-store-logo.png.asset.json";
import { useState, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notifications = useNotifications(user?.uid);
  const conversations = useConversations(user?.uid);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = user ? conversations.reduce((s, c) => s + (c.unread?.[user.uid] || 0), 0) : 0;

  const close = () => setOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0" aria-label="Menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[380px] overflow-y-auto p-0">
              <SheetHeader className="p-4 border-b border-border bg-gradient-to-br from-primary/10 to-gold/10">
                <SheetTitle className="flex items-center gap-3">
                  <img src={logoAsset.url} alt="ALGZONE" className="size-12" />
                  <div>
                    <div className="font-black text-lg">ALGZONE</div>
                    <div className="text-[11px] text-muted-foreground font-normal">Electronique | Market</div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-1">
                <button
                  onClick={toggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-accent transition"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    Dark Mode
                  </span>
                  <span className={`w-9 h-5 rounded-full relative transition ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 size-4 bg-white rounded-full transition ${theme === "dark" ? "left-0.5" : "right-0.5"}`} />
                  </span>
                </button>

                <div className="h-px bg-border my-2" />

                <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-1">Account</div>
                {user ? (
                  <>
                    <MenuItem icon={<User className="size-4" />} label="Profile" onClick={() => { close(); navigate({ to: "/profile" }); }} />
                    <MenuItem icon={<Bookmark className="size-4" />} label="Saved Ads" onClick={() => { close(); navigate({ to: "/profile", search: { tab: "saved" } as any }); }} />
                    <MenuItem icon={<MessageSquare className="size-4" />} label="Messages" onClick={() => { close(); navigate({ to: "/profile", search: { tab: "messages" } as any }); }} />
                    <MenuItem icon={<Bell className="size-4" />} label="Notifications" onClick={() => { close(); navigate({ to: "/profile", search: { tab: "notifications" } as any }); }} />
                    {isAdmin && <MenuItem icon={<Shield className="size-4 text-primary" />} label="Admin Dashboard" onClick={() => { close(); navigate({ to: "/admin" }); }} />}
                    <MenuItem icon={<LogOut className="size-4" />} label="Sign Out" onClick={() => { close(); logout(); }} />
                  </>
                ) : (
                  <>
                    <MenuItem icon={<LogIn className="size-4" />} label="Log In" onClick={() => { close(); navigate({ to: "/auth" }); }} />
                    <MenuItem icon={<UserPlus className="size-4" />} label="Register" onClick={() => { close(); navigate({ to: "/auth" }); }} />
                  </>
                )}

                <MenuItem icon={<Plus className="size-4" />} label="Post Announcement" onClick={() => { close(); navigate({ to: "/post" }); }} highlight />

                <div className="h-px bg-border my-2" />

                <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-1">Categories</div>
                <MenuItem icon={<HomeIcon className="size-4" />} label="All Ads" onClick={() => { close(); navigate({ to: "/browse" }); }} />
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { close(); navigate({ to: "/category/$id", params: { id: c.id } }); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent transition text-sm text-right"
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="flex-1 text-right">
                      <span className="block font-medium">{c.name}</span>
                      <span className="block text-[11px] text-muted-foreground">{c.nameAr}</span>
                    </span>
                  </button>
                ))}

                <div className="h-px bg-border my-2" />

                <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-3 py-1">Useful Links</div>
                <MenuItem icon={<img src={storeIconAsset.url} alt="" className="size-5 object-contain" />} label="Create Online Store" />
                <MenuItem label="Advertise on ALGZONE" />
                <MenuItem label="How to advertise?" />
                <MenuItem label="Contact" />
                <MenuItem label="Privacy Policy" />
                <MenuItem label="Terms of Use" />
                <MenuItem label="Conditions of Sales" />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoAsset.url} alt="ALGZONE" className="size-11" />
            <div className="hidden sm:block">
              <div className="font-black text-lg leading-none text-primary">ALGZONE</div>
              <div className="text-[10px] text-muted-foreground">Electronique | Market</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
            <Link to="/" activeOptions={{ exact: true }} className="px-3 py-2 rounded-lg hover:bg-accent transition" activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
              Home
            </Link>
            <Link to="/browse" className="px-3 py-2 rounded-lg hover:bg-accent transition" activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}>
              Browse
            </Link>
            {user && (
              <Link to="/profile" search={{ tab: "messages" } as any} className="relative px-3 py-2 rounded-lg hover:bg-accent transition flex items-center gap-1">
                <MessageSquare className="size-4" /> Messages
                {unreadMessages > 0 && <span className="absolute -top-0.5 right-1 size-2.5 rounded-full bg-red-500 ring-2 ring-surface" />}
              </Link>
            )}
          </nav>

          <div className="flex-1" />

          {user && (
            <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" onClick={() => navigate({ to: "/profile", search: { tab: "notifications" } as any })} aria-label="Notifications">
              <Bell className="size-5" />
              {unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-surface" />}
            </Button>
          )}

          <Link to="/post">
            <Button className="btn-hero gap-2 h-10 rounded-xl px-4">
              <Plus className="size-4" /> <span className="hidden sm:inline">Post Ad</span>
            </Button>
          </Link>

          {user ? (
            <button
              onClick={() => navigate({ to: "/profile" })}
              className="size-10 rounded-full btn-hero flex items-center justify-center text-primary-foreground font-bold overflow-hidden"
              aria-label="Profile"
            >
              {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : (user.displayName || user.email || "?")[0].toUpperCase()}
            </button>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="gap-2 h-10 rounded-xl">
                <User className="size-4" /> <span className="hidden sm:inline">Log In</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />



      <footer className="border-t border-border bg-surface mt-16">
        <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={logoAsset.url} alt="ALGZONE" className="size-10" />
              <div className="font-black">ALGZONE</div>
            </div>
            <p className="text-sm text-muted-foreground">Algeria's #1 classifieds marketplace — buy, sell, connect easily.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-primary">Browse Ads</Link></li>
              <li><Link to="/post" className="hover:text-primary">Post Ad</Link></li>
              <li><Link to="/auth" className="hover:text-primary">Create Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Top Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CATEGORIES.slice(0, 4).map((c) => (
                <li key={c.id}><Link to="/category/$id" params={{ id: c.id }} className="hover:text-primary">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Contact</h4>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} ALGZONE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MenuItem({ icon, label, onClick, highlight }: { icon?: ReactNode; label: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm text-right ${
        highlight ? "btn-hero text-primary-foreground font-bold" : "hover:bg-accent"
      }`}
    >
      {icon}
      <span className="flex-1 text-right">{label}</span>
    </button>
  );
}
