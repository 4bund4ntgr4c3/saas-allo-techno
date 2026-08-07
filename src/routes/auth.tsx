import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/data/catalog";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Espace client — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace client Allô Techno pour suivre vos réservations de réparation et gérer vos rendez-vous.",
      },
      { property: "og:title", content: "Espace client — Allô Techno" },
      {
        property: "og:description",
        content: "Connexion et création de compte pour suivre vos réparations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/auth") }],
  }),
  component: AuthPage,
});

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { locale } = useI18n();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/mon-compte", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await router.invalidate();
        navigate({ to: "/mon-compte", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: nom, phone: telephone },
          },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/mon-compte", replace: true });
        } else {
          setSent(true);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error("Connexion Google impossible");
    }
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">Espace client</span>
        <h1 className="at-display text-3xl md:text-4xl">
          {mode === "login" ? "Se connecter" : "Créer un compte"}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Suivez vos réparations, retrouvez vos numéros de dossier et gérez vos rendez-vous.
        </p>

        {sent ? (
          <div className="mt-8 border border-success/40 bg-success/10 p-6">
            <p className="text-sm font-bold">Vérifiez votre boîte mail.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nous avons envoyé un lien de confirmation à {email}. Cliquez dessus pour activer votre
              compte, puis revenez vous connecter.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-8 space-y-5 border border-border bg-card p-8">
              {mode === "signup" && (
                <>
                  <div>
                    <label htmlFor="nom" className="at-eyebrow mb-2 block">
                      Nom complet *
                    </label>
                    <input
                      id="nom"
                      required
                      className={field}
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="tel" className="at-eyebrow mb-2 block">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      id="tel"
                      required
                      inputMode="tel"
                      placeholder="+229 01 …"
                      className={field}
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="at-eyebrow mb-2 block">
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="at-eyebrow mb-2 block">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primaryBlock"
                size="lg"
                className="w-full"
                disabled={busy}
              >
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </Button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase text-muted-foreground">ou</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={onGoogle}
              >
                Continuer avec Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}
              <button
                type="button"
                className="font-bold text-primary underline"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Créer un compte" : "Se connecter"}
              </button>
            </p>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Vous pouvez aussi{" "}
          <Link to="/$locale/reservation" params={{ locale }} className="text-primary underline">
            réserver sans compte
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
