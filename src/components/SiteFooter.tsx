import { headers } from "next/headers";
import { MapPin, Mail, Phone } from "lucide-react";
import { getOwnerBySlug, getOwners } from "@/lib/store";

export default async function SiteFooter() {
  const h = await headers();
  const pathname = h.get("x-pg-pathname") || "";
  const match = pathname.match(/^\/o\/([^/]+)/);
  const owner = (match ? await getOwnerBySlug(match[1]) : undefined) || (await getOwners())[0];
  const firstBranch = owner?.branches?.[0];
  const mapsLink =
    firstBranch && typeof firstBranch.lat === "number" && typeof firstBranch.lng === "number"
      ? `https://www.google.com/maps/search/?api=1&query=${firstBranch.lat},${firstBranch.lng}`
      : owner?.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(owner.address)}`
        : undefined;

  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-400">
        <p>© {new Date().getFullYear()} {owner?.name || "Ex-Army"}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {owner?.address && mapsLink && (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary-light hover:text-primary-soft"
              aria-label={`Open ${owner.name} on Google Maps`}
            >
              <MapPin size={14} /> {owner.address}
            </a>
          )}
          {owner?.phone && (
            <a
              href={`tel:${owner.phone}`}
              className="flex items-center gap-1.5 text-secondary-light hover:text-white"
            >
              <Phone size={14} /> {owner.phone}
            </a>
          )}
          {owner?.email && (
            <a
              href={`mailto:${owner.email}`}
              className="flex items-center gap-1.5 text-coral hover:text-white"
            >
              <Mail size={14} /> {owner.email}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}