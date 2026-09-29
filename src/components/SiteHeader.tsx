import { headers } from "next/headers";
import Link from "next/link";
import { getOwnerBySlug, getOwners } from "@/lib/store";

export default async function SiteHeader() {
  const h = await headers();
  const pathname = h.get("x-pg-pathname") || "";
  const match = pathname.match(/^\/o\/([^/]+)/);
  const owner = (match ? getOwnerBySlug(match[1]) : undefined) || getOwners()[0];
  const brand = (owner?.brandName?.trim() || "Ex-Army").trim();
  const raw = (owner?.brandColor || "").trim().toLowerCase();
  const color = /^#[0-9a-f]{6}$/.test(raw) ? raw : "#d97706";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span
            style={{ backgroundColor: color }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-black"
          >
            PG
          </span>
          <span style={{ color }} className="text-lg font-bold tracking-tight">
            {brand}
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-primary hover:text-primary-dark"
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}