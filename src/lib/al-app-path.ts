export function alAppPrefix(pathname: string | null | undefined): string {
  return pathname === "/al" || String(pathname || "").startsWith("/al/") ? "/al" : "";
}

export function withAlAppPrefix(
  pathname: string | null | undefined,
  targetPath: string,
): string {
  const normalizedTarget = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  const prefix = alAppPrefix(pathname);
  return prefix ? `${prefix}${normalizedTarget}` : normalizedTarget;
}
