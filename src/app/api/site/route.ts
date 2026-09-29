import { NextResponse } from "next/server";
import { getOwners } from "@/lib/store";

export async function GET() {
  const owners = await getOwners();
  const owner = owners[0];
  if (!owner) return NextResponse.json({ error: "No site yet." }, { status: 404 });
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