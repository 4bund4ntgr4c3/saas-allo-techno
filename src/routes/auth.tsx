import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import "@/lib/i18n/segments/auth";

type AuthMode = "login" | "signup" | "forgot" | "reset-sent" | "update-password";

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
      { name: "robots", content: "noindex, nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const field =
  "h-11 w-full rounded-sm border border-border bg-card px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
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
      } else if (mode === "signup") {
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
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=update-password`,
        });
        if (error) throw error;
        setMode("reset-sent");
      } else if (mode === "update-password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success(t("auth.updatePassword.success"));
        navigate({ to: "/mon-compte", replace: true });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("auth.error.login");
      toast.error(msg);
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
      toast.error(t("auth.error.google"));
    }
  };

  // Check for update-password mode from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("update-password");
    }
  }, []);

  const isUpdatePassword = mode === "update-password";
  const isForgot = mode === "forgot" || mode === "reset-sent";
  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">{t("auth.eyebrow")}</span>
        <h1 className="at-display text-3xl md:text-4xl">
          {isUpdatePassword
            ? t("auth.updatePassword.title")
            : isForgot
              ? t("auth.resetPassword.title")
              : isLogin
                ? t("auth.login.title")
                : t("auth.signup.title")}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {isUpdatePassword ? "" : isForgot ? "" : t("auth.subtitle")}
        </p>

        {sent && !isForgot ? (
          <div className="mt-8 border border-success/40 bg-success/10 p-6">
            <p className="text-sm font-bold">{t("auth.confirmEmail.title")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.confirmEmail.body").replace("{email}", email)}
            </p>
          </div>
        ) : mode === "reset-sent" ? (
          <div className="mt-8 border border-success/40 bg-success/10 p-6">
            <p className="text-sm font-bold">{t("auth.resetPassword.sent.title")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.resetPassword.sent.body")}
            </p>
            <button
              type="button"
              className="mt-4 text-sm font-bold text-primary underline"
              onClick={() => setMode("login")}
            >
              {t("auth.resetPassword.back")}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="mt-8 space-y-5 border border-border bg-card p-8">
              {isSignup && (
                <>
                  <div>
                    <label htmlFor="nom" className="at-eyebrow mb-2 block">
                      {t("auth.name")}
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
                      {t("auth.phone")}
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
                  {t("auth.email")}
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
              {(isLogin || isSignup || isUpdatePassword) && (
                <div>
                  <label htmlFor="password" className="at-eyebrow mb-2 block">
                    {t("auth.password")}
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
              )}

              <Button
                type="submit"
                variant="primaryBlock"
                size="lg"
                className="w-full"
                disabled={busy}
              >
                {isUpdatePassword
                  ? t("auth.updatePassword.btn")
                  : isForgot
                    ? t("auth.resetPassword.btn")
                    : isLogin
                      ? t("auth.login.btn")
                      : t("auth.signup.btn")}
              </Button>

              {!isForgot && !isUpdatePassword && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {t("auth.or")}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={onGoogle}
                  >
                    {t("auth.google")}
                  </Button>
                </>
              )}
            </form>

            {isLogin && !isForgot && (
              <p className="mt-4 text-center text-sm">
                <button
                  type="button"
                  className="font-bold text-primary underline"
                  onClick={() => setMode("forgot")}
                >
                  {t("auth.forgotPassword")}
                </button>
              </p>
            )}

            {!isForgot && !isUpdatePassword && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  className="font-bold text-primary underline"
                  onClick={() => setMode(isLogin ? "signup" : "login")}
                >
                  {isLogin ? t("auth.createAccount") : t("auth.signIn")}
                </button>
              </p>
            )}
          </>
        )}

        {!isForgot && !isUpdatePassword && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.guest")}{" "}
            <Link to="/$locale/reservation" params={{ locale }} className="text-primary underline">
              {t("auth.guest.link")}
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
