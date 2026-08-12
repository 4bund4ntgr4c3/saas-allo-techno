import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

/**
 * Floating back-to-top button. Appears after scrolling past 400px.
 * Uses smooth scroll for accessibility.
 */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 right-4 z-40 flex size-10 items-center justify-center border border-border bg-card shadow-lg transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:bottom-24"
      aria-label={t("header.backToTop")}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
