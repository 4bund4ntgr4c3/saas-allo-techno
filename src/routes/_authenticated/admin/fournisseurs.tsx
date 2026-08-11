import { createFileRoute } from "@tanstack/react-router";
import { AdminSuppliers } from "@/components/admin/AdminSuppliers";

export const Route = createFileRoute("/_authenticated/admin/fournisseurs")({
  component: AdminSuppliers,
});
