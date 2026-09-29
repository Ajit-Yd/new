import { NextRequest, NextResponse } from "next/server";
import { currentOwner } from "@/lib/session";
import { sanitizeBranchInput } from "@/lib/branchInput";
import { deleteBranch, removeUploadFiles, saveBranch } from "@/lib/store";

type RouteParams = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const existing = owner.branches.find((b) => b.id === id);
  if (!existing) return NextResponse.json({ error: "Branch not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const cleaned = sanitizeBranchInput(body);
  if ("error" in cleaned) {
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  }

  const removed = [...existing.images, ...existing.videos].filter(
    (u) => !(cleaned.images || []).includes(u) && !(cleaned.videos || []).includes(u)
  );
  await removeUploadFiles(removed);

  const branch = {
    ...existing,
    name: cleaned.name,
    gender: cleaned.gender,
    city: cleaned.city,
    locality: cleaned.locality,
    address: cleaned.address,
    description: cleaned.description,
    amenities: cleaned.amenities,
    highlights: cleaned.highlights,
    pricing: cleaned.pricing,
    images: cleaned.images,
    videos: cleaned.videos,
    lat: cleaned.lat,
    lng: cleaned.lng,
    mapsUrl: cleaned.mapsUrl,
    whatsapp: cleaned.whatsapp || owner.whatsapp,
    phone: cleaned.phone || owner.phone,
    updatedAt: new Date().toISOString(),
  };

  const saved = await saveBranch(owner.id, branch);
  if (!saved) return NextResponse.json({ error: "Owner not found." }, { status: 404 });
  return NextResponse.json({ branch: saved }, { status: 200 });
}

export async function DELETE(_request: NextRequest, { params }: { params: RouteParams }) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const ok = await deleteBranch(owner.id, id);
  if (!ok) return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 200 });
}