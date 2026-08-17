import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Copy, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { formatFcfa } from "@/data/catalog/company";
import {
  getReferralStatsFn,
  requestPayoutMomoFn,
  type ReferralStats,
} from "@/lib/referral.functions";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/parrainage")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Programme de Parrainage & Affiliation — Allô Techno" },
        {
          name: "description",
          content:
            "Parrainez vos proches et recevez jusqu'à 5 000 FCFA par réparation réalisée directement sur votre compte Mobile Money MTN / Moov.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: ReferralPage,
});

function ReferralPage() {
  const phone = "97000000";
  const [stats, setStats] = React.useState<ReferralStats | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [payoutSuccess, setPayoutSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    getReferralStatsFn({ data: { userPhone: phone } })
      .then(setStats)
      .catch(() => {});
  }, [phone]);

  const copyLink = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async () => {
    if (!stats || stats.pendingPayoutFcfa < 5000) return;
    const res = await requestPayoutMomoFn({
      data: {
        phoneMomo: phone,
        amountFcfa: stats.pendingPayoutFcfa,
        provider: "mtn",
      },
    });
    if (res.success) {
      setPayoutSuccess(res.message);
      setStats((prev) => (prev ? { ...prev, pendingPayoutFcfa: 0 } : null));
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero Header ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow">Affiliation &amp; Récompenses</span>
            <PageBreadcrumb items={[{ label: "Programme de Parrainage" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Parrainez un Proche, Gagnez en Mobile Money
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Offrez <strong>2 000 FCFA de remise immédiate</strong> à vos amis sur leur première
            réparation et recevez <strong>jusqu'à 5 000 FCFA de commission</strong> versée sur MTN
            MoMo ou Moov Money dès la clôture du dossier.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 space-y-8">
        {/* ─── How it works steps ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border bg-card p-5 rounded-xl space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-sm text-foreground">Partagez votre lien</h3>
            <p className="text-xs text-muted-foreground">
              Envoyez votre lien unique ou votre code parrain à vos collègues, amis et sur WhatsApp.
            </p>
          </div>

          <div className="border border-border bg-card p-5 rounded-xl space-y-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-sm text-foreground">Votre ami économise</h3>
            <p className="text-xs text-muted-foreground">
              Il bénéficie d'un bon de réduction de 2 000 FCFA sur sa réparation ou son entretien de
              PC/Mac.
            </p>
          </div>

          <div className="border border-border bg-card p-5 rounded-xl space-y-2">
            <div className="size-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-sm text-foreground">Vous encaissez en Cash</h3>
            <p className="text-xs text-muted-foreground">
              Dès l'intervention terminée, votre commission est créditée et transférable sur votre
              compte MoMo.
            </p>
          </div>
        </div>

        {/* ─── Referral Dashboard Box ─── */}
        {stats && (
          <div className="border border-border bg-card p-6 rounded-2xl space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="at-eyebrow text-[10px] text-muted-foreground block">
                  Votre Lien de Parrainage Officiel
                </span>
                <strong className="text-base font-mono font-bold text-primary">
                  {stats.referralCode}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={stats.referralLink}
                  className="font-mono text-xs max-w-xs bg-surface"
                />
                <Button variant="technical" size="sm" onClick={copyLink} className="text-xs">
                  {copied ? (
                    <Check className="size-3.5 mr-1" />
                  ) : (
                    <Copy className="size-3.5 mr-1" />
                  )}
                  {copied ? "Copié !" : "Copier"}
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-surface p-3.5 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Filleuls Inscrits</span>
                <strong className="font-mono text-lg font-bold text-foreground">
                  {stats.totalReferrals}
                </strong>
              </div>
              <div className="bg-surface p-3.5 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">
                  Réparations Réalisées
                </span>
                <strong className="font-mono text-lg font-bold text-foreground">
                  {stats.completedRepairs}
                </strong>
              </div>
              <div className="bg-surface p-3.5 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Gains Cumulés</span>
                <strong className="font-mono text-lg font-bold text-emerald-600">
                  {formatFcfa(stats.totalEarnedFcfa)}
                </strong>
              </div>
              <div className="bg-primary/10 border border-primary/30 p-3.5 rounded-lg">
                <span className="text-[10px] text-primary block font-semibold">
                  Disponible pour Virement
                </span>
                <strong className="font-mono text-lg font-bold text-primary">
                  {formatFcfa(stats.pendingPayoutFcfa)}
                </strong>
              </div>
            </div>

            {/* Payout Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/80 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2.5">
                <Smartphone className="size-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Transférer mes gains vers Mobile Money
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Paiement instantané vers le numéro MTN/Moov (+229 {phone})
                  </p>
                </div>
              </div>
              <Button
                variant="technical"
                size="sm"
                disabled={stats.pendingPayoutFcfa < 5000}
                onClick={handleRequestPayout}
                className="text-xs font-bold"
              >
                Transférer {formatFcfa(stats.pendingPayoutFcfa)} &rarr;
              </Button>
            </div>

            {payoutSuccess && (
              <div className="p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-xs text-emerald-700 font-semibold animate-in fade-in duration-150">
                {payoutSuccess}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
