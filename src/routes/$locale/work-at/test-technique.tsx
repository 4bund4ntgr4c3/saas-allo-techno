import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/work-at/test-technique")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/work-at");
    return {
      meta: [
        { title: "Test Technique de Recrutement — Allô Techno Labs" },
        {
          name: "description",
          content:
            "Passez le test technique d'évaluation en micro-soudure et électronique pour rejoindre l'équipe Allô Techno.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: TechAssessmentPage,
});

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question:
      "Sur une carte mère MacBook, une ligne PPBUS_G3H mesurée à 0V avec une impédance de 0.2 Ohm à la masse indique généralement :",
    options: [
      "Un fusible d'entrée ouvert sans dommage secondaire",
      "Un court-circuit franc sur un condensateur de découplage ou un MOSFET de puissance",
      "Un défaut de configuration du contrôleur SMC / T2",
      "Une batterie complètement déchargée",
    ],
    correctIndex: 1,
    explanation:
      "Une impédance quasi-nulle (0.2 Ohm) caractérise un court-circuit franc à la masse (souvent un condensateur céramique ou un transistor MOSFET en claquage).",
  },
  {
    id: 2,
    question:
      "Quelle température de buse d'air chaud et quel flux d'air sont généralement préconisés pour dessouder un connecteur plastique FPC sans le faire fondre ?",
    options: [
      "450°C avec flux d'air maximal",
      "330°C-350°C avec flux d'air modéré, apport d'étain basse fusion (138°C) et buse orientée sous la carte",
      "200°C pendant 5 minutes sans flux décapant",
      "Uniquement au fer à souder panne large 500°C",
    ],
    correctIndex: 1,
    explanation:
      "L'abaissement du point de fusion avec un alliage étain/bismuth (138°C) et un chauffage doux par le dessous protègent le plastique fragile du connecteur.",
  },
  {
    id: 3,
    question:
      "Lors d'une désoxydation d'une carte mère tombée dans l'eau, pourquoi le nettoyage aux ultrasons doit-il être suivi d'un séchage sous étuve ?",
    options: [
      "Pour améliorer la brillance des pistes en cuivre",
      "Pour évaporer totalement l'eau et le solvant piégés sous les puces BGA (GPU, CPU, RAM) avant mise sous tension",
      "Pour reprogrammer la puce BIOS EFI",
      "Ce n'est pas nécessaire si on utilise un compresseur d'air",
    ],
    correctIndex: 1,
    explanation:
      "L'humidité résiduelle sous les billes d'étain BGA provoque des micro-courts-circuits instantanés dès la première impulsion électrique.",
  },
  {
    id: 4,
    question:
      "Sur un PC portable Dell ou HP qui démarre avec écran noir et clignotement LED 3 blancs / 2 ambrés, le code d'erreur indique :",
    options: [
      "Échec de détection ou défaut de la mémoire RAM",
      "Panne du ventilateur CPU",
      "Défaut de charge de la batterie CMOS",
      "Disque dur plein",
    ],
    correctIndex: 0,
    explanation:
      "Le code 3-2 sur Dell/HP correspond au standard diagnostic de non-détection ou corruption de barrette mémoire RAM.",
  },
  {
    id: 5,
    question:
      "Quelle précaution absolue est indispensable AVANT de déconnecter la nappe d'écran d'un MacBook ou PC moderne ?",
    options: [
      "Augmenter la luminosité au maximum",
      "Débrancher impérativement le connecteur de la batterie principale pour couper le rail rétroéclairage 50V",
      "Fermer le capot de l'ordinateur",
      "Débrancher uniquement le câble RJ45",
    ],
    correctIndex: 1,
    explanation:
      "Le rail d'alimentation du rétroéclairage LED (Backlight 35V-50V) reste sous tension permanente si la batterie est branchée : débrancher la nappe sous tension détruit instantanément le circuit driver rétroéclairage.",
  },
];

function TechAssessmentPage() {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const score = React.useMemo(() => {
    let count = 0;
    QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) count += 1;
    });
    return count;
  }, [selectedAnswers]);

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const isComplete = Object.keys(selectedAnswers).length === QUESTIONS.length;

  return (
    <div className="min-h-screen pb-16">
      {/* ─── Hero ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow text-primary font-bold">Laboratoire &amp; Recrutement</span>
            <PageBreadcrumb
              items={[{ label: "Rejoindre l'équipe" }, { label: "Test Technique" }]}
            />
          </div>
          <h1 className="at-display text-3xl sm:text-4xl font-extrabold text-foreground">
            Évaluation Technique &amp; Micro-Soudure
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Testez vos connaissances en diagnostic de composants, électronique de puissance et
            architecture informatique pour postuler chez Allô Techno.
          </p>
        </div>
      </section>

      {/* ─── Questions List ─── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 mt-8 space-y-6">
        {QUESTIONS.map((q, idx) => {
          const userAnswer = selectedAnswers[q.id];
          const isCorrect = userAnswer === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`border p-5 sm:p-6 rounded-2xl space-y-4 shadow-xs transition-all ${
                submitted
                  ? isCorrect
                    ? "border-emerald-600/40 bg-emerald-600/5"
                    : "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-foreground">
                  Question {idx + 1} : {q.question}
                </h3>
                {submitted && (
                  <Badge
                    variant="outline"
                    className={
                      isCorrect
                        ? "text-emerald-600 border-emerald-600/40"
                        : "text-destructive border-destructive/40"
                    }
                  >
                    {isCorrect ? "Correct (+1)" : "Incorrect"}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isAnswerCorrect = optIdx === q.correctIndex;

                  let btnStyle =
                    "border-border bg-surface text-muted-foreground hover:text-foreground";
                  if (submitted) {
                    if (isAnswerCorrect)
                      btnStyle = "border-emerald-600 bg-emerald-600/20 text-emerald-800 font-bold";
                    else if (isSelected)
                      btnStyle = "border-destructive bg-destructive/20 text-destructive font-bold";
                  } else if (isSelected) {
                    btnStyle =
                      "border-primary bg-primary text-primary-foreground font-bold shadow-xs";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="font-mono font-bold shrink-0">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="text-xs p-3 rounded-lg bg-background border border-border text-muted-foreground space-y-1">
                  <strong className="text-foreground block">Explication technique :</strong>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* ─── Submission Bar ─── */}
        <div className="border border-border bg-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          {!submitted ? (
            <>
              <div className="text-xs text-muted-foreground">
                Questions répondues :{" "}
                <strong>
                  {Object.keys(selectedAnswers).length} / {QUESTIONS.length}
                </strong>
              </div>
              <Button
                variant="technical"
                disabled={!isComplete}
                onClick={() => setSubmitted(true)}
                className="font-bold uppercase tracking-wider text-xs"
              >
                Valider et Voir mes Résultats &rarr;
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg font-mono">
                  {score}/{QUESTIONS.length}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {score >= 4 ? "Excellent niveau technique !" : "Niveau intermédiaire"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Score :{" "}
                    <strong>
                      {Math.round((score / QUESTIONS.length) * 100)}% de bonnes réponses
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                  <RotateCcw className="size-3 mr-1" /> Recommencer
                </Button>
                <Button asChild variant="technical" size="sm" className="text-xs font-bold">
                  <a
                    href={`https://wa.me/22960000000?text=${encodeURIComponent(
                      `Bonjour Allô Techno RH, je viens de passer le test technique de recrutement avec un score de ${score}/${QUESTIONS.length} (${Math.round(
                        (score / QUESTIONS.length) * 100,
                      )}%). Je souhaite postuler en tant que Technicien Atelier.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Envoyer ma Candidature sur WhatsApp &rarr;
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
