import { NextResponse } from "next/server";
import { getOwnerBySlug } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const owner = await getOwnerBySlug(slug);
  if (!owner) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    name: owner.name,
    slug: owner.slug,
    phone: owner.phone,
    whatsapp: owner.whatsapp,
    email: owner.email,
    address: owner.address,
    city: owner.city,
  });
}