import { NextRequest, NextResponse } from "next/server";
import { currentOwner } from "@/lib/session";
import { sanitizeBranchInput } from "@/lib/branchInput";
import { generateId } from "@/lib/auth";
import { saveBranch } from "@/lib/store";
import type { Branch } from "@/lib/types";

export async function GET() {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ branches: owner.branches }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const cleaned = sanitizeBranchInput(body);
  if ("error" in cleaned) {
    return NextResponse.json({ error: cleaned.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const branch: Branch = {
    id: generateId("br"),
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
    createdAt: now,
    updatedAt: now,
  };

  const saved = await saveBranch(owner.id, branch);
  if (!saved) return NextResponse.json({ error: "Owner not found." }, { status: 404 });
  return NextResponse.json({ branch: saved }, { status: 201 });
}