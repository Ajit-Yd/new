import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Branch, Owner } from "./types";

async function db(): Promise<D1Like> {
  return (await getCloudflareContext({ async: true })).env.DB;
}

async function media(): Promise<R2BucketLike> {
  return (await getCloudflareContext({ async: true })).env.MEDIA;
}

export async function getOwners(): Promise<Owner[]> {
  const { results } = await (await db()).prepare("SELECT json FROM owners ORDER BY rowid").all<{
    json: string;
  }>();
  return results.map((row) => JSON.parse(row.json) as Owner);
}

export async function getOwnerById(id: string): Promise<Owner | undefined> {
  return selectOne("SELECT json FROM owners WHERE id = ?", id);
}

export async function getOwnerByEmail(email: string): Promise<Owner | undefined> {
  return selectOne("SELECT json FROM owners WHERE email = ?", email.trim().toLowerCase());
}

export async function getOwnerBySlug(slug: string): Promise<Owner | undefined> {
  return selectOne("SELECT json FROM owners WHERE slug = ?", slug.trim().toLowerCase());
}

async function selectOne(sql: string, value: string): Promise<Owner | undefined> {
  const row = await (await db()).prepare(sql).bind(value).first<{ json: string }>();
  return row ? (JSON.parse(row.json) as Owner) : undefined;
}

export async function isSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const owner = await getOwnerBySlug(slug);
  return !!owner && owner.id !== exceptId;
}

export async function isEmailTaken(email: string, exceptId?: string): Promise<boolean> {
  const owner = await getOwnerByEmail(email);
  return !!owner && owner.id !== exceptId;
}

export async function saveOwner(owner: Owner): Promise<Owner> {
  await (await db())
    .prepare(
      `INSERT INTO owners (id, email, slug, json) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, slug = excluded.slug, json = excluded.json`
    )
    .bind(owner.id, owner.email.toLowerCase(), owner.slug.toLowerCase(), JSON.stringify(owner))
    .run();
  return owner;
}

export async function deleteOwnerById(id: string): Promise<boolean> {
  const target = await getOwnerById(id);
  if (!target) return false;
  await (await db()).prepare("DELETE FROM owners WHERE id = ?").bind(id).run();
  await removeUploadFiles(target.branches.flatMap((b) => [...b.images, ...b.videos]));
  return true;
}

export async function saveBranch(ownerId: string, branch: Branch): Promise<Branch | undefined> {
  const owner = await getOwnerById(ownerId);
  if (!owner) return undefined;
  const idx = owner.branches.findIndex((b) => b.id === branch.id);
  if (idx >= 0) owner.branches[idx] = branch;
  else owner.branches.push(branch);
  owner.updatedAt = new Date().toISOString();
  await saveOwner(owner);
  return branch;
}

export async function deleteBranch(ownerId: string, branchId: string): Promise<boolean> {
  const owner = await getOwnerById(ownerId);
  if (!owner) return false;
  const target = owner.branches.find((b) => b.id === branchId);
  if (!target) return false;
  owner.branches = owner.branches.filter((b) => b.id !== branchId);
  owner.updatedAt = new Date().toISOString();
  await saveOwner(owner);
  await removeUploadFiles([...target.images, ...target.videos]);
  return true;
}

export async function saveUpload(filename: string, buffer: Uint8Array): Promise<void> {
  await (await media()).put(basename(filename), buffer, {
    httpMetadata: { contentType: guessMime(filename) },
  });
}

export async function loadUpload(filename: string): Promise<Uint8Array | null> {
  const object = await (await media()).get(basename(filename));
  if (!object) return null;
  return new Uint8Array(await object.arrayBuffer());
}

export async function removeUpload(filename: string): Promise<void> {
  await (await media()).delete(basename(filename));
}

export async function removeUploadFiles(urls: string[]): Promise<void> {
  for (const url of urls) {
    if (!url) continue;
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    if (filename) await removeUpload(filename);
  }
}

function basename(filename: string): string {
  return filename.replace(/^.*[\\/]/, "");
}

function guessMime(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
  };
  return map[ext] || "application/octet-stream";
}
