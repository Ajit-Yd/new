import { cookies } from "next/headers";
import { getSessionOwnerId } from "./auth";
import { getOwnerById } from "./store";
import type { Owner } from "./types";

export async function currentOwner(): Promise<Owner | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const ownerId = getSessionOwnerId(token);
  if (!ownerId) return null;
  return (await getOwnerById(ownerId)) || null;
}

export async function authenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getSessionOwnerId(token) !== null;
}

export const SESSION_COOKIE = "pgowner_session";
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};