import { BRANDS } from "@/data/catalog";

export function BrandLogo({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const brand = BRANDS.find((b) => b.slug === slug);
  if (brand?.icon) {
    return (
      <span
        className={className}
        aria-label={name}
        dangerouslySetInnerHTML={{ __html: brand.icon }}
      />
    );
  }
  return (
    <span
      className={className}
      aria-label={name}
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <svg viewBox="0 0 24 24" className="size-full" fill="currentColor">
        <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor">
          {name.slice(0, 6).toUpperCase()}
        </text>
      </svg>
    </span>
  );
}
