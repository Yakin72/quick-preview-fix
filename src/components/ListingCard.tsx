import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Eye } from "lucide-react";
import type { Listing } from "@/lib/db-hooks";
import { CATEGORIES } from "@/lib/wilayas";

export function ListingCard({ listing }: { listing: Listing }) {
  const cat = CATEGORIES.find((c) => c.id === listing.category);
  const img = listing.images?.[0] || `https://picsum.photos/seed/${listing.id}/600/450`;
  const price = listing.price === 0
    ? "بالمجان"
    : new Intl.NumberFormat("ar-DZ").format(listing.price) + " دج";

  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="card-elevated overflow-hidden group flex flex-col animate-fade-up"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {cat && (
            <span className="px-2 py-1 rounded-lg bg-surface/95 backdrop-blur text-[11px] font-bold flex items-center gap-1">
              <span>{cat.icon}</span> {cat.name}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-white">
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-lg">
            <Heart className="size-3" /> {listing.likes || 0}
          </span>
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-lg">
            <Eye className="size-3" /> {listing.views || 0}
          </span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition">{listing.title}</h3>
        <div className="text-xl font-black gradient-text mb-3">{price}</div>
        <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          <span>{listing.wilaya}{listing.commune ? ` — ${listing.commune}` : ""}</span>
        </div>
      </div>
    </Link>
  );
}
