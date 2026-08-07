import { createFileRoute, redirect } from "@tanstack/react-router";
import { toLocalePath } from "@/lib/i18n/locales";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: toLocalePath("/") });
  },
  component: () => null,
});
