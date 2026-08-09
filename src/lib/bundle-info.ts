export function logBundleInfo() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.log("[bundle] Development mode — chunks are not optimized");
  }
}
