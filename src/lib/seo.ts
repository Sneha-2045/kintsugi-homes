export const SITE_ORIGIN = "https://rylestate.com";

export function canonicalUrl(pathname: string): string {
  const path = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return new URL(path, SITE_ORIGIN).toString();
}

export function canonicalLink(pathname: string) {
  return { rel: "canonical", href: canonicalUrl(pathname) };
}
