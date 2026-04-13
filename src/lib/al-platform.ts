export type AlBusinessId = "dominion" | "wrenchready";

export type AlManagerStatus = "healthy" | "warning" | "blocked";

export interface AlPlatformContextInput {
  host?: string | null;
  origin?: string | null;
  proto?: string | null;
}

export interface AlManagerSummary {
  managerId: string;
  businessId: AlBusinessId;
  title: string;
  headline: string;
  status: AlManagerStatus;
  topRisks: string[];
  nextActions: string[];
  escalateToCeo: boolean;
  escalateToAl: boolean;
}

export interface AlAttentionSummary {
  headline: string;
  count: number;
}

export interface AlBoardroomSummary {
  headline: string;
}

export interface AlBusinessModuleContract {
  businessId: AlBusinessId;
  businessLabel: string;
  ceoId: string;
  scorecardSummary: string;
  managerSet: string[];
  attentionBuilder?: (input?: AlPlatformContextInput) => Promise<AlAttentionSummary>;
  boardroomSummaryBuilder?: (input?: AlPlatformContextInput) => Promise<AlBoardroomSummary>;
  operatorHomePath: string;
}

const BORELAND_ROOT_HOSTS = new Set(["borelandops.com", "www.borelandops.com"]);

function trimOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

function safeHostFromOrigin(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getAlCanonicalHost(): string {
  const explicitHost = process.env.AL_CANONICAL_HOST?.trim().toLowerCase();
  if (explicitHost) {
    return explicitHost;
  }

  const explicitOrigin = process.env.AL_CANONICAL_ORIGIN?.trim();
  if (explicitOrigin) {
    const host = safeHostFromOrigin(explicitOrigin);
    if (host) {
      return host;
    }
  }

  return "borelandops.com";
}

export function getAlCanonicalOrigin(): string {
  const explicitOrigin = process.env.AL_CANONICAL_ORIGIN?.trim();
  if (explicitOrigin) {
    return trimOrigin(explicitOrigin);
  }
  return `https://${getAlCanonicalHost()}`;
}

export function normalizeHost(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function isCanonicalAlHost(host: string | null | undefined): boolean {
  return normalizeHost(host) === getAlCanonicalHost();
}

export function isBorelandRootHost(host: string | null | undefined): boolean {
  return BORELAND_ROOT_HOSTS.has(normalizeHost(host));
}

export function isPrivateAlSurfaceHost(host: string | null | undefined): boolean {
  return isCanonicalAlHost(host) || isBorelandRootHost(host);
}

export function getAlAppPrefixForHost(host: string | null | undefined): string {
  return isCanonicalAlHost(host) ? "" : "/al";
}

export function buildAlPath(
  host: string | null | undefined,
  targetPath: string,
): string {
  const normalizedTarget = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  const prefix = getAlAppPrefixForHost(host);
  return prefix ? `${prefix}${normalizedTarget}` : normalizedTarget;
}

export function resolveAlOrigin(input?: AlPlatformContextInput): string {
  if (input?.origin?.trim()) {
    return trimOrigin(input.origin.trim());
  }

  if (input?.host?.trim()) {
    const proto = input.proto?.trim() || "https";
    return trimOrigin(`${proto}://${input.host.trim()}`);
  }

  return getAlCanonicalOrigin();
}

export function resolveAlPlatformContext(input?: AlPlatformContextInput) {
  return {
    host: input?.host?.trim() || getAlCanonicalHost(),
    origin: resolveAlOrigin(input),
  };
}

export function buildAlUrl(
  input: AlPlatformContextInput | undefined,
  targetPath: string,
): string {
  const context = resolveAlPlatformContext(input);
  return `${context.origin}${buildAlPath(context.host, targetPath)}`;
}
