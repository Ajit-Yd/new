import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Users,
  MapPin,
  Navigation,
  Clock,
  ArrowLeft,
  IndianRupee,
} from "lucide-react";
import { getOwnerBySlug } from "@/lib/store";
import {
  directionsUrl,
  threeDMapSrc,
  branchShortAddress,
  formatINR,
  whatsappLink,
} from "@/lib/directions";
import ImageGallery from "@/components/ImageGallery";
import { AmenityChips } from "@/components/AmenityChips";

type PageProps = {
  params: Promise<{ slug: string; branchId: string }>;
};

const genderBadgeColors: Record<string, string> = {
  male: "bg-secondary/15 text-secondary border border-secondary/30",
  female: "bg-coral/15 text-coral border border-coral/30",
  unisex: "bg-primary/10 text-primary border border-primary/20",
};

function genderLabel(gender: string): string {
  if (gender === "male") return "Boys PG";
  if (gender === "female") return "Girls PG";
  return "Co-ed PG";
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, branchId } = await params;
  const owner = await getOwnerBySlug(slug);
  const branch = owner?.branches.find((b) => b.id === branchId);
  if (!owner || !branch) return { title: "PG not found" };
  return {
    title: `${branch.name} — ${owner.name}`,
    description:
      branch.description ||
      `Photos, videos, rent and directions for ${branch.name} in ${branch.city || ""}.`,
  };
}

export default async function BranchDetailPage({ params }: PageProps) {
  const { slug, branchId } = await params;
  const owner = await getOwnerBySlug(slug);
  if (!owner) notFound();
  const branch = owner.branches.find((b) => b.id === branchId);
  if (!branch) notFound();

  const mapsLink = directionsUrl(branch);
  const embedSrc = threeDMapSrc(branch);
  const fullAddress = branchShortAddress(branch);

  const prices = branch.pricing.map((p) => p.price).filter((n) => Number.isFinite(n) && n > 0);
  const priceMin = prices.length ? Math.min(...prices) : null;
  const waText = `Hi, I want to know more about "${branch.name}" (${branch.city || "your PG"}).`;
  const wa = whatsappLink(branch.whatsapp || branch.phone || owner.whatsapp || owner.phone, waText);
  const callPhone = branch.phone || owner.phone;
  const ownerWa = whatsappLink(owner.whatsapp || owner.phone, waText);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {owner.name}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{branch.name}</h1>
        {branch.gender && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              genderBadgeColors[branch.gender] ?? genderBadgeColors.unisex
            }`}
          >
            {genderLabel(branch.gender)}
          </span>
        )}
        <span className="text-sm text-muted">by {owner.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 lg:row-start-1">
          <ImageGallery images={branch.images} name={branch.name} />

          {branch.highlights && branch.highlights.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Why students love it
              </p>
              <div className="flex flex-wrap gap-2.5">
                {branch.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary-dark"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {branch.videos.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {branch.videos.map((src, i) => (
                <div key={src} className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border">
                  <video src={src} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 text-[11px] font-medium text-white bg-black/60 px-2 py-0.5 rounded">
                    Video {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-surface rounded-xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold">About this PG</h2>

            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin className="w-4 h-4 text-secondary" />
              <span className="line-clamp-2">{fullAddress}</span>
            </div>

            {branch.description && <p className="text-muted leading-relaxed">{branch.description}</p>}

            {branch.amenities.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Facilities
                </p>
                <AmenityChips items={branch.amenities} max={12} />
              </div>
            )}

            {branch.pricing.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Pricing / sharing
                </p>
                <div className="rounded-xl border border-border bg-surface-alt/50 p-3">
                  <ul className="divide-y divide-border">
                    {branch.pricing.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <span className="text-sm">{p.type}</span>
                        <span className="text-sm font-semibold">
                          {formatINR(p.price)}
                          {p.meals ? <span className="font-normal text-muted"> • {p.meals}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 lg:row-start-2">
          <div className="rounded-xl border border-border bg-surface-alt p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted leading-relaxed">{fullAddress}</p>
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all neon-glow"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
            </div>
            <div className="relative mt-4 rounded-xl border border-border overflow-hidden">
              <iframe
                src={embedSrc}
                title={`3D location view for ${branch.name}`}
                className="w-full h-64 md:h-72 border-0 map-frame-dark pointer-events-none"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Get directions to ${branch.name}`}
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-start-3 lg:row-start-1">
          <div className="bg-surface rounded-xl border border-border p-6 lg:sticky lg:top-24">
            {priceMin !== null && (
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-1">
                  <IndianRupee className="w-6 h-6 text-secondary" />
                  <span className="text-3xl font-bold">{priceMin.toLocaleString("en-IN")}</span>
                  <span className="text-base text-muted">/mo</span>
                </div>
                <p className="text-xs mt-0.5 text-sm text-muted">Starting from</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-alt">
                <Users className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-sm">
                  {branch.pricing.length} sharing option{branch.pricing.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-alt">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <span className="text-sm line-clamp-1">
                  {[branch.locality, branch.city].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>

            {(callPhone || wa) && (
              <div className="mt-4 space-y-3">
                {callPhone && (
                  <a
                    href={`tel:${callPhone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-all neon-glow"
                  >
                    <Phone className="w-5 h-5" />
                    Call Owner
                  </a>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary text-white font-semibold hover:opacity-90 transition-all neon-glow-green"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                )}
              </div>
            )}

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Owner</p>
              <p className="mt-1 font-semibold">{owner.name}</p>
              <p className="mt-1 text-xs text-muted">{owner.city || "Your locality"}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <Clock className="w-3.5 h-3.5" />
                Contact via phone or WhatsApp · usually replies within 1 hour
              </p>
              {ownerWa && (
                <a
                  href={ownerWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with owner
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}