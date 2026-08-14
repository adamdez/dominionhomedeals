import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const LAND_FINDER_COOKIE = "dominion_land_finder";
export const LAND_FINDER_SESSION_SECONDS = 60 * 60 * 24 * 7;

function getAccessPassword(): string | null {
  return process.env.LAND_FINDER_ACCESS_PASSWORD?.trim() || null;
}

function getSessionSecret(): string | null {
  return process.env.LAND_FINDER_SESSION_SECRET?.trim() || getAccessPassword();
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isLandFinderAuthConfigured(): boolean {
  return Boolean(getAccessPassword() && getSessionSecret());
}

export function landFinderPasswordMatches(candidate: string): boolean {
  const password = getAccessPassword();
  if (!password) return false;
  return signaturesMatch(sign(candidate, password), sign(password, password));
}

export function createLandFinderSession(now = Date.now()): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Land Finder authentication is not configured");

  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(now / 1000) + LAND_FINDER_SESSION_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function validateLandFinderSession(value: string | undefined, now = Date.now()): boolean {
  const secret = getSessionSecret();
  if (!value || !secret) return false;

  const [payload, signature, ...extra] = value.split(".");
  if (!payload || !signature || extra.length > 0 || !signaturesMatch(signature, sign(payload, secret))) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof decoded.exp === "number" && decoded.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export async function hasLandFinderSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return validateLandFinderSession(cookieStore.get(LAND_FINDER_COOKIE)?.value);
}
