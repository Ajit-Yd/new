import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { currentOwner } from "@/lib/session";
import { saveUpload } from "@/lib/store";
import {
  MAX_IMAGE_SIZE,
  MAX_IMAGE_MB,
  MAX_VIDEO_SIZE,
  MAX_VIDEO_MB,
  MAX_VIDEO_SECONDS,
  getImageExtension,
  getVideoExtension,
  getVideoDurationSec,
  isAllowedImageExt,
  isAllowedVideoExt,
} from "@/lib/media";

type MediaKind = "image" | "video";

function randomFilename(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export async function POST(request: NextRequest) {
  const owner = await currentOwner();
  if (!owner) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const rawName = file.name || "";
    const isImage = file.type.indexOf("image") === 0 && isAllowedImageExt(path.extname(rawName));
    const isVideo = file.type.indexOf("video") === 0 && isAllowedVideoExt(path.extname(rawName));

    const kind: MediaKind | "" = isImage ? "image" : isVideo ? "video" : "";
    if (!kind) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, WEBP (images) or MP4, MOV, WEBM (videos)." },
        { status: 415 }
      );
    }

    const maxBytes = kind === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            kind === "image"
              ? `Images must be ${MAX_IMAGE_MB}MB or smaller.`
              : `Videos must be ${MAX_VIDEO_MB}MB or smaller.`,
        },
        { status: 413 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }

    let ext: string | null;
    if (kind === "image") {
      ext = getImageExtension(bytes);
      if (!ext || !isAllowedImageExt(ext)) {
        return NextResponse.json({ error: "Image content is not in an allowed format." }, { status: 415 });
      }
    } else {
      ext = getVideoExtension(bytes);
      if (!ext || !isAllowedVideoExt(ext)) {
        return NextResponse.json({ error: "Video content is not in an allowed format." }, { status: 415 });
      }
      const duration = getVideoDurationSec(bytes);
      if (duration !== null && duration > MAX_VIDEO_SECONDS) {
        return NextResponse.json(
          { error: `Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter.` },
          { status: 422 }
        );
      }
    }

    const filename = randomFilename(ext);
    await saveUpload(filename, bytes);

    return NextResponse.json(
      {
        url: `/api/uploads/${filename}`,
        kind,
        bytes: bytes.byteLength,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}