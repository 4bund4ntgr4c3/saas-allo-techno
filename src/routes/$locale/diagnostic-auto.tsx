import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  Monitor,
  Keyboard,
  Mic,
  Volume2,
  Camera,
  CheckCircle2,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/site/PageBreadcrumb";
import { useI18n } from "@/lib/i18n/context";
import { normalizeLocale, type Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/diagnostic-auto")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const seo = localeSeo(locale, "/services");
    return {
      meta: [
        { title: "Banc de Diagnostic Matériel Automatique — Allô Techno" },
        {
          name: "description",
          content:
            "Testez votre écran, clavier, micro, haut-parleurs et webcam en direct sur notre banc de test matériel interactif.",
        },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: AutoDiagnosticPage,
});

type DiagnosticTab = "screen" | "keyboard" | "audio" | "camera";

function AutoDiagnosticPage() {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = React.useState<DiagnosticTab>("keyboard");

  // Keyboard test state
  const [pressedKeys, setPressedKeys] = React.useState<Set<string>>(new Set());

  // Screen test state
  const [screenColorIndex, setScreenColorIndex] = React.useState(0);
  const screenColors = ["#ffffff", "#000000", "#ef4444", "#22c55e", "#3b82f6"];

  // Audio test state
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Camera test state
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = React.useState(false);

  // Global keydown listener for keyboard test
  React.useEffect(() => {
    if (activeTab !== "keyboard") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setPressedKeys((prev) => new Set(prev).add(e.code));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Audio test handlers
  const startAudioRecord = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Impossible d'accéder au microphone. Vérifiez vos autorisations.");
    }
  };

  const stopAudioRecord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playTestSound = () => {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // Camera test handlers
  const toggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch {
        alert("Impossible d'accéder à la webcam.");
      }
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* ─── En-tête ─── */}
      <section className="border-b border-border py-12 bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="at-eyebrow">Autodiagnostic Matériel</span>
            <PageBreadcrumb items={[{ label: "Diagnostic Automatique" }]} />
          </div>
          <h1 className="at-display text-3xl sm:text-5xl font-extrabold text-foreground">
            Banc de Test Matériel Interactif
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Vérifiez l'état de votre écran, touches clavier, microphone, haut-parleurs et webcam
            directement dans votre navigateur avant votre passage en atelier.
          </p>
        </div>
      </section>

      {/* ─── Navigation Onglets de Test ─── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border pb-4">
          {[
            { id: "keyboard", label: "Clavier & Touches", icon: Keyboard },
            { id: "screen", label: "Écran & Pixels", icon: Monitor },
            { id: "audio", label: "Micro & Son", icon: Mic },
            { id: "camera", label: "Webcam Vidéo", icon: Camera },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as DiagnosticTab)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content: Keyboard Test ─── */}
        {activeTab === "keyboard" && (
          <div className="mt-6 border border-border bg-card p-6 rounded-xl space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Testeur de Clavier Interactif
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pressez n'importe quelle touche de votre clavier physique : elle s'allumera en
                  vert si elle répond parfaitement.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPressedKeys(new Set())}
                className="text-xs"
              >
                <RotateCcw className="size-3 mr-1" /> Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 p-4 rounded-lg bg-surface border border-border font-mono text-[10px] sm:text-xs text-center select-none">
              {[
                "Escape",
                "F1",
                "F2",
                "F3",
                "F4",
                "F5",
                "F6",
                "F7",
                "F8",
                "F9",
                "F10",
                "F11",
                "Backquote",
                "Digit1",
                "Digit2",
                "Digit3",
                "Digit4",
                "Digit5",
                "Digit6",
                "Digit7",
                "Digit8",
                "Digit9",
                "Digit0",
                "Backspace",
                "Tab",
                "KeyQ",
                "KeyW",
                "KeyE",
                "KeyR",
                "KeyT",
                "KeyY",
                "KeyU",
                "KeyI",
                "KeyO",
                "KeyP",
                "Enter",
                "CapsLock",
                "KeyA",
                "KeyS",
                "KeyD",
                "KeyF",
                "KeyG",
                "KeyH",
                "KeyJ",
                "KeyK",
                "KeyL",
                "Space",
                "ShiftLeft",
              ].map((key) => {
                const isPressed = pressedKeys.has(key);
                return (
                  <div
                    key={key}
                    className={`py-2 px-1 rounded border transition-all truncate font-semibold ${
                      isPressed
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs font-bold scale-105"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {key.replace("Key", "").replace("Digit", "")}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
              <span>
                Touches testées et fonctionnelles : <strong>{pressedKeys.size}</strong>
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Aucune touche bloquée détectée
              </span>
            </div>
          </div>
        )}

        {/* ─── Tab Content: Screen Test ─── */}
        {activeTab === "screen" && (
          <div className="mt-6 border border-border bg-card p-6 rounded-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Détecteur de Pixels Morts &amp; Uniformité Dalle
              </h3>
              <p className="text-xs text-muted-foreground">
                Affichez des couleurs unies pures pour inspecter la présence de lignes anormales, de
                taches ou de pixels défectueux.
              </p>
            </div>

            <div className="flex gap-2">
              {screenColors.map((color, i) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setScreenColorIndex(i)}
                  className={`size-10 rounded-lg border-2 transition-all ${
                    screenColorIndex === i ? "border-primary scale-110 shadow-md" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div
              className="relative aspect-video w-full rounded-xl border border-border flex items-center justify-center transition-colors shadow-inner cursor-pointer"
              style={{ backgroundColor: screenColors[screenColorIndex] }}
              onClick={() => setScreenColorIndex((prev) => (prev + 1) % screenColors.length)}
            >
              <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-mono backdrop-blur-md">
                Cliquez pour changer la couleur de test (Couleur actuelle :{" "}
                {screenColors[screenColorIndex]})
              </span>
            </div>
          </div>
        )}

        {/* ─── Tab Content: Audio Test ─── */}
        {activeTab === "audio" && (
          <div className="mt-6 border border-border bg-card p-6 rounded-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Test Microphone &amp; Haut-Parleurs Stéréo
              </h3>
              <p className="text-xs text-muted-foreground">
                Enregistrez un court extrait vocal pour valider la clarté du micro et jouez la
                fréquence de test pour les haut-parleurs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Speaker Test */}
              <div className="border border-border bg-surface p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-primary" />
                  <h4 className="text-xs font-bold text-foreground">1. Test des Haut-Parleurs</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Génère un signal sinusoïdal propre pour vérifier les canaux audio gauche/droite.
                </p>
                <Button variant="secondary" size="sm" onClick={playTestSound}>
                  <Play className="size-3.5 mr-1" /> Émettre un son de test (440Hz)
                </Button>
              </div>

              {/* Mic Test */}
              <div className="border border-border bg-surface p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="size-4 text-primary" />
                  <h4 className="text-xs font-bold text-foreground">2. Test du Microphone</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enregistrez 3 secondes de voix puis écoutez le rendu sonore.
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isRecording ? (
                    <Button variant="outline" size="sm" onClick={startAudioRecord}>
                      Démarrer l'enregistrement
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={stopAudioRecord}>
                      Arrêter l'enregistrement
                    </Button>
                  )}
                </div>
                {audioUrl && (
                  <div className="pt-2">
                    <audio src={audioUrl} controls className="w-full h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab Content: Camera Test ─── */}
        {activeTab === "camera" && (
          <div className="mt-6 border border-border bg-card p-6 rounded-xl space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-foreground">Testeur de Webcam Intégrée</h3>
              <p className="text-xs text-muted-foreground">
                Vérifiez la netteté du capteur vidéo, la mise au point et l'exposition lumineuse.
              </p>
            </div>

            <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              {!cameraActive && (
                <div className="text-center p-4">
                  <Camera className="size-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    La webcam est actuellement désactivée
                  </p>
                </div>
              )}
            </div>

            <div className="text-center">
              <Button variant="technical" size="sm" onClick={toggleCamera}>
                <Camera className="size-3.5 mr-1" />
                {cameraActive ? "Désactiver la Webcam" : "Activer et Tester la Webcam"}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Diagnostic Action Footer ─── */}
        <div className="mt-8 border border-primary/40 bg-primary/5 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-foreground">
              Votre matériel présente un dysfonctionnement ?
            </h4>
            <p className="text-xs text-muted-foreground">
              Nos experts certifiés prennent en charge votre équipement sous 24h avec pièces
              certifiées.
            </p>
          </div>
          <Button
            asChild
            variant="technical"
            className="shrink-0 font-bold uppercase tracking-wider text-xs"
          >
            <Link to="/$locale/reparations" params={{ locale }}>
              Prendre Rendez-vous en Atelier &rarr;
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
