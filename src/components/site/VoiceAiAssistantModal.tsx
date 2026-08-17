import * as React from "react";
import { Mic, MicOff, Volume2, Sparkles, Loader2 } from "lucide-react";
import { formatFcfa } from "@/data/catalog/company";
import {
  processVoiceQueryFn,
  type VoiceAiResponse,
} from "@/lib/voice-ai-agent.functions";

export function VoiceAiAssistantModal() {
  const [isListening, setIsListening] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState<"fr" | "fon">("fr");
  const userInput = "Mon écran d'ordinateur Dell est cassé et noir.";
  const [loading, setLoading] = React.useState(false);
  const [conversation, setConversation] = React.useState<VoiceAiResponse | null>(null);

  const handleVoiceQuery = async (queryText: string) => {
    setLoading(true);
    try {
      const res = await processVoiceQueryFn({
        data: {
          audioTranscript: queryText,
          language: selectedLanguage,
        },
      });
      setConversation(res);
    } finally {
      setLoading(false);
    }
  };

  const toggleListen = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleVoiceQuery(userInput);
      }, 1500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-base uppercase tracking-wide text-foreground">
              Allô Voice — Conseiller Vocal IA 24/7
            </h3>
            <p className="text-xs text-muted-foreground">
              Parlez directement à notre IA pour obtenir un pré-diagnostic et un chiffrage immédiat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {["fr", "fon"].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang as "fr" | "fon")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                selectedLanguage === lang
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "fr" ? "Français" : "Fɔ̀ngbé"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Mic Pulse Button ─── */}
      <div className="text-center py-4 space-y-4">
        <div className="relative inline-flex items-center justify-center">
          {isListening && (
            <div className="absolute size-24 rounded-full bg-primary/20 animate-ping" />
          )}
          <button
            type="button"
            onClick={toggleListen}
            disabled={loading}
            className={`size-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
              isListening
                ? "bg-destructive scale-110"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isListening ? (
              <MicOff className="size-7 animate-pulse" />
            ) : (
              <Mic className="size-7" />
            )}
          </button>
        </div>

        <div>
          <span className="font-bold text-xs text-foreground block">
            {isListening ? "Écoute en cours..." : "Appuyez pour parler à Allô Voice"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Ex : « Écran cassé sur mon Dell » ou « Mon PC a pris l'eau »
          </span>
        </div>
      </div>

      {/* ─── Assistant Response Display ─── */}
      {loading ? (
        <div className="p-4 rounded-xl bg-surface text-center space-y-2">
          <Loader2 className="size-5 text-primary animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Synthèse vocale et analyse en cours...</p>
        </div>
      ) : conversation ? (
        <div className="p-4 rounded-xl bg-surface/80 border border-border space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-2.5">
            <Volume2 className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-foreground block">Réponse d'Allô Voice :</span>
              <p className="text-foreground leading-relaxed italic">
                « {conversation.assistantVoiceText} »
              </p>
            </div>
          </div>

          {conversation.estimatedPriceFcfa && (
            <div className="pt-2 border-t border-border flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground">Tarif estimé de la pièce &amp; pose :</span>
              <strong className="font-mono text-sm font-extrabold text-primary">
                {formatFcfa(conversation.estimatedPriceFcfa)}
              </strong>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
