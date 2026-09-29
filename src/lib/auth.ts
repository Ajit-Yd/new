import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { getOwnerById, isEmailTaken, isSlugTaken, saveOwner } from "./store";
import { MAX_IMAGES } from "./media";
import type { Owner } from "./types";

const SECRET = process.env.PGOWNER_SECRET || "pg-owner-site-local-secret-change-me";
const SESSION_COOKIE = "pgowner_session";

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createSlug(name: string): Promise<string> {
  const base = slugifyName(name) || "owner";
  let slug = base;
  let i = 1;
  while (await isSlugTaken(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function signSession(ownerId: string): string {
  const payload = Buffer.from(ownerId, "utf8").toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function getSessionOwnerId(token: string | undefined | null): string | null {
  return verifySession(token);
}

export async function createOwner(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  slug?: string;
}): Promise<{ owner?: Owner; error?: string }> {
  const email = data.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (String(data.password || "").length < 4) {
    return { error: "Password must be at least 4 characters." };
  }
  if (await isEmailTaken(email)) {
    return { error: "An account with this email already exists. Please login." };
  }
  let slug = (data.slug || "").trim();
  if (slug && !/^[a-z0-9][a-z0-9-]{1,49}$/i.test(slug)) {
    return { error: "Link name can contain only letters, numbers and dashes." };
  }
  if (slug && (await isSlugTaken(slug))) {
    return { error: "That link name is already taken. Try another." };
  }
  if (!slug) slug = await createSlug(data.name);

  const owner: Owner = {
    id: generateId("own"),
    name: data.name.trim(),
    email,
    passwordHash: hashPassword(data.password),
    slug,
    phone: data.phone?.trim() || undefined,
    branches: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveOwner(owner);
  return { owner };
}

export async function updateOwnerProfile(
  ownerId: string,
  data: Partial<Pick<Owner, "name" | "email" | "phone" | "whatsapp" | "website" | "tagline" | "about" | "city" | "address" | "logo" | "slug" | "brandName" | "brandColor" | "carousel">>
): Promise<{ owner?: Owner; error?: string }> {
  const existing = await getOwnerById(ownerId);
  if (!existing) return { error: "Not found." };
  if (data.name && !data.name.trim()) return { error: "Name cannot be empty." };

  if (typeof data.email === "string") {
    const email = data.email.trim().toLowerCase();
    if (!email) return { error: "Email cannot be empty." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address." };
    }
    if (await isEmailTaken(email, ownerId)) {
      return { error: "That email is already used by another account." };
    }
    existing.email = email;
  }

  let slug = existing.slug;
  if (data.slug && data.slug !== existing.slug) {
    slug = data.slug.trim();
    if (!/^[a-z0-9][a-z0-9-]{1,49}$/i.test(slug)) {
      return { error: "Link name can contain only letters, numbers and dashes." };
    }
    if (await isSlugTaken(slug, ownerId)) {
      return { error: "That link name is already taken. Try another." };
    }
  }

  existing.name = data.name?.trim() || existing.name;
  existing.slug = slug;
  if (typeof data.phone === "string") existing.phone = data.phone.trim() || undefined;
  if (typeof data.whatsapp === "string") existing.whatsapp = data.whatsapp.trim() || undefined;
  if (typeof data.website === "string") existing.website = data.website.trim() || undefined;
  if (typeof data.tagline === "string") existing.tagline = data.tagline.trim() || undefined;
  if (typeof data.about === "string") existing.about = data.about.trim() || undefined;
  if (typeof data.city === "string") existing.city = data.city.trim() || undefined;
  if (typeof data.address === "string") existing.address = data.address.trim() || undefined;
  if (typeof data.logo === "string") existing.logo = data.logo || undefined;
  if (typeof data.brandName === "string") existing.brandName = data.brandName.trim() || undefined;
  if (typeof data.brandColor === "string") {
    const c = data.brandColor.trim().toLowerCase();
    existing.brandColor = /^#[0-9a-f]{6}$/.test(c) ? c : undefined;
  }
  if (Array.isArray(data.carousel)) {
    existing.carousel = data.carousel
      .map((u) => String(u).trim())
      .filter(Boolean)
      .slice(0, MAX_IMAGES);
  }
  existing.updatedAt = new Date().toISOString();
  await saveOwner(existing);
  return { owner: existing };
}

export { SESSION_COOKIE };

// helper to keep public shape in one place
export function toPublicOwner(owner: Owner) {
  return {
    id: owner.id,
    name: owner.name,
    slug: owner.slug,
    email: owner.email,
    phone: owner.phone,
    whatsapp: owner.whatsapp,
    website: owner.website,
    tagline: owner.tagline,
    about: owner.about,
    city: owner.city,
    address: owner.address,
    logo: owner.logo,
    brandName: owner.brandName,
    brandColor: owner.brandColor,
    carousel: owner.carousel,
    branches: owner.branches,
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt,
  };
}