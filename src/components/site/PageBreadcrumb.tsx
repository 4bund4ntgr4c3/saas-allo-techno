import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useI18n } from "@/lib/i18n/context";

type Crumb = {
  label: string;
  to?: string;
};

export function PageBreadcrumb({ items }: { items: Crumb[] }) {
  const { locale, t } = useI18n();

  return (
    <Breadcrumb className="rounded-sm border border-border px-2 py-1">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/$locale" params={{ locale }}>{t("action.accueil")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, i) => (
          <BreadcrumbItem key={i}>
            <BreadcrumbSeparator />
            {item.to ? (
              <BreadcrumbLink asChild>
                <Link to={item.to} params={{ locale }}>{item.label}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
