import {
  Phone,
  MessageCircle,
  ShieldCheck,
  GraduationCap,
  BedDouble,
  UtensilsCrossed,
  IndianRupee,
} from "lucide-react";
import { getOwners } from "@/lib/store";
import PublishedPhotoCarousel, { type PublishedPhoto } from "@/components/PublishedPhotoCarousel";
import OwnerBranchCard from "@/components/OwnerBranchCard";
import ShareButton from "@/components/ShareButton";
import { formatINR, whatsappLink } from "@/lib/directions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const owners = await getOwners();
  const owner = owners[0];

  const photos: PublishedPhoto[] = owners.flatMap((owner2) =>
    owner2.branches.flatMap((b) =>
      b.images.map((src) => ({
        src,
        branchName: b.name,
        ownerName: owner2.name,
        ownerSlug: owner2.slug,
        branchId: b.id,
      }))
    )
  );

  const carouselSource = owner?.carousel?.length ? owner.carousel : photos.map((p) => p.src);

  const carouselPhotos: PublishedPhoto[] = carouselSource.map((src) => {
    const fb = owner?.branches?.[0];
    return {
      src,
      branchName: fb?.name || owner?.name || "PG",
      ownerName: owner?.name || "",
      ownerSlug: owner?.slug || "",
      branchId: fb?.id || "",
    };
  });

  const branches = owners.flatMap((owner) =>
    owner.branches.map((b) => ({ ownerSlug: owner.slug, branch: b }))
  );

  const allAmenities = owner
    ? [...new Set(owner.branches.flatMap((b) => b.amenities || []))]
    : [];
  const prices = owners
    .flatMap((o) => o.branches.flatMap((b) => (b.pricing || []).map((p) => p.price)))
    .filter((n) => Number.isFinite(n) && n > 0);
  const priceMin = prices.length ? Math.min(...prices) : null;

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-primary-soft/40 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <PublishedPhotoCarousel items={carouselPhotos} />
        </div>
      </section>

      {owner && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">{owner.name}</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Owner
                  </span>
                </div>
                {owner.tagline && <p className="mt-1 font-medium text-accent">{owner.tagline}</p>}
                {owner.about && <p className="mt-2 text-sm text-muted">{owner.about}</p>}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ShareButton />
                {owner.phone && (
                  <a
                    href={`tel:${owner.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-all hover:bg-primary-dark"
                  >
                    <Phone className="h-5 w-5" />
                    Call
                  </a>
                )}
                {whatsappLink(owner.whatsapp || owner.phone, `Hi, I'm interested in ${owner.name}.`) && (
                  <a
                    href={
                      whatsappLink(owner.whatsapp || owner.phone, `Hi, I'm interested in ${owner.name}.`) ??
                      ""
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 font-semibold text-white transition-all hover:opacity-90"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
              <div className="rounded-xl bg-surface-alt p-4 text-center">
                <GraduationCap className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-extrabold leading-none text-foreground">100+</p>
                <p className="mt-1 text-xs font-medium text-muted">Happy Students</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4 text-center">
                <BedDouble className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-extrabold leading-none text-foreground">70</p>
                <p className="mt-1 text-xs font-medium text-muted">Beds</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4 text-center">
                <UtensilsCrossed className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-extrabold leading-none text-foreground">3</p>
                <p className="mt-1 text-xs font-medium text-muted">Meals Daily</p>
              </div>
              <div className="rounded-xl bg-surface-alt p-4 text-center">
                <IndianRupee className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xl font-extrabold leading-none text-foreground">
                  {priceMin !== null ? formatINR(priceMin) : "—"}
                </p>
                <p className="mt-1 text-xs font-medium text-muted">Starting Price</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <span className="chip">
                {owner.branches.length} PG{owner.branches.length === 1 ? "" : "s"}
              </span>
              <span className="chip">{allAmenities.length} amenities</span>
              {allAmenities.slice(0, 5).map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight">Our PG</h2>
          <p className="mt-1 text-sm text-muted">
            Explore our PG listings with photos, video and direct directions.
          </p>
        </div>

        {branches.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted">PGs coming soon — check back later.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map(({ ownerSlug, branch }) => (
              <OwnerBranchCard key={branch.id} ownerSlug={ownerSlug} branch={branch} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}