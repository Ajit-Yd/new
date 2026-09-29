import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { isAllowedImageExt, isAllowedVideoExt } from "@/lib/media";
import { loadUpload, removeUpload } from "@/lib/store";
import { currentOwner } from "@/lib/session";

type RouteParams = Promise<{ filename: string }>;

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

export async function GET(_request: NextRequest, { params }: { params: RouteParams }) {
  const { filename } = await params;
  const safe = path.basename(filename);
  if (safe !== filename) return new NextResponse("Not found", { status: 404 });

  const ext = path.extname(safe).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime || (!isAllowedImageExt(ext) && !isAllowedVideoExt(ext))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = await loadUpload(safe);
  if (!buf) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { filename } = await params;
  const safe = path.basename(filename);
  if (safe !== filename) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const ext = path.extname(safe).toLowerCase();
  if (!isAllowedImageExt(ext) && !isAllowedVideoExt(ext)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await removeUpload(safe);
  return NextResponse.json({ ok: true }, { status: 200 });
}