const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  prefetched.add(path);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  link.as = "document";
  document.head.appendChild(link);
}
