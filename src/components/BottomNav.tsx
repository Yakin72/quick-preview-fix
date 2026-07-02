import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Search, PlusCircle, Heart } from "lucide-react";

type Item = { to: string; icon: any; label: string; exact?: boolean; primary?: boolean; search?: any };
const items: Item[] = [
  { to: "/", icon: Home, label: "Home", exact: true },
  { to: "/browse", icon: LayoutGrid, label: "Categories" },
  { to: "/browse", icon: Search, label: "Search" },
  { to: "/post", icon: PlusCircle, label: "Post", primary: true },
  { to: "/swipe", icon: Heart, label: "Swipe" },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
      aria-label="Bottom navigation"
    >
      <ul className="grid grid-cols-5 h-16">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact
            ? pathname === it.to
            : pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <li key={it.label} className="flex">
              <Link
                to={it.to as any}
                search={it.search}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition ${
                  it.primary
                    ? "text-primary"
                    : active
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.primary ? (
                  <span className="size-11 -mt-6 rounded-full btn-hero flex items-center justify-center shadow-xl ring-4 ring-background">
                    <Icon className="size-6 text-primary-foreground" />
                  </span>
                ) : (
                  <Icon className={`size-5 ${active ? "scale-110" : ""} transition-transform`} />
                )}
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
