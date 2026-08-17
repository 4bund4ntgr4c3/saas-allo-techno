import * as React from "react";
import { Laptop, Volume2, Eye, Keyboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BrowserHardwareTesterModal() {
  const [activeTab, setActiveTab] = React.useState<"screen" | "audio" | "keyboard">("screen");
  const [screenColor, setScreenColor] = React.useState<string>("red");
  const [pressedKeys, setPressedKeys] = React.useState<Set<string>>(new Set());

  // Keyboard test listener
  React.useEffect(() => {
    if (activeTab !== "keyboard") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => new Set([...prev, e.key.toUpperCase()]));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  // Stereo Audio test
  const playStereoTest = (channel: "left" | "right") => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const panNode = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Note La (440 Hz)

      if (panNode) {
        panNode.pan.setValueAtTime(channel === "left" ? -1 : 1, audioCtx.currentTime);
        osc.connect(panNode);
        panNode.connect(audioCtx.destination);
      } else {
        osc.connect(audioCtx.destination);
      }

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {}
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-7 rounded-2xl max-w-xl mx-auto space-y-6 shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Laptop className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Suite d'Auto-Diagnostic Matériel Navigateur
          </h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10">
          Zéro Logiciel à Installer
        </Badge>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "screen", label: "Pixels Écran", icon: Eye },
          { id: "audio", label: "Haut-Parleurs", icon: Volume2 },
          { id: "keyboard", label: "Test Clavier", icon: Keyboard },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as "screen" | "audio" | "keyboard")}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === t.id
                  ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Screen Tab ─── */}
      {activeTab === "screen" && (
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Vérifiez l'absence de pixels morts ou bloqués en affichant des mires de couleur unies :
          </p>

          <div
            className="w-full h-32 rounded-xl border border-border flex items-center justify-center text-white font-bold transition-all shadow-inner"
            style={{ backgroundColor: screenColor }}
          >
            <span className="bg-black/40 px-3 py-1 rounded backdrop-blur-xs text-xs">
              Mire de test : {screenColor.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["red", "green", "blue", "white"].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setScreenColor(color)}
                className={`py-1.5 rounded-lg border text-center font-bold capitalize transition-all ${
                  screenColor === color ? "border-foreground ring-2 ring-primary" : "border-border"
                }`}
                style={{ backgroundColor: color, color: color === "white" ? "#000" : "#fff" }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Audio Tab ─── */}
      {activeTab === "audio" && (
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Testez la balance stéréo et la réponse de vos haut-parleurs gauche et droite :
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => playStereoTest("left")}
              className="w-full py-4 h-auto flex flex-col gap-1 border-border"
            >
              <Volume2 className="size-5 text-primary" />
              <strong className="text-xs">Canal GAUCHE (Left)</strong>
              <span className="text-[10px] text-muted-foreground">Bip 440 Hz</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => playStereoTest("right")}
              className="w-full py-4 h-auto flex flex-col gap-1 border-border"
            >
              <Volume2 className="size-5 text-primary" />
              <strong className="text-xs">Canal DROIT (Right)</strong>
              <span className="text-[10px] text-muted-foreground">Bip 440 Hz</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── Keyboard Tab ─── */}
      {activeTab === "keyboard" && (
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Appuyez sur n'importe quelle touche de votre clavier pour vérifier qu'elle répond instantanément :
          </p>

          <div className="bg-surface p-4 rounded-xl border border-border min-h-[90px] flex flex-wrap gap-1.5 items-center">
            {pressedKeys.size === 0 ? (
              <span className="text-muted-foreground italic text-xs">Tapez sur votre clavier physique...</span>
            ) : (
              Array.from(pressedKeys).map((k) => (
                <span
                  key={k}
                  className="font-mono text-xs font-bold px-2 py-1 rounded bg-primary text-primary-foreground border border-primary/40 shadow-xs animate-in zoom-in-95 duration-100"
                >
                  {k === " " ? "ESPACE" : k}
                </span>
              ))
            )}
          </div>

          {pressedKeys.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPressedKeys(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              <RefreshCw className="size-3 mr-1" /> Réinitialiser le test
            </Button>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <Button
          asChild
          variant="technical"
          className="w-full font-bold uppercase tracking-wider text-xs h-9"
        >
          <a
            href="https://wa.me/22960000000?text=Bonjour%20All%C3%B4%20Techno,%20suite%20%C3%A0%20l'auto-diagnostic%20en%20ligne,%20j'ai%20d%C3%A9tect%C3%A9%20une%20anomalie%20mat%C3%A9rielle%20sur%20mon%20ordinateur."
            target="_blank"
            rel="noopener noreferrer"
          >
            Prendre Rendez-vous en Atelier &rarr;
          </a>
        </Button>
      </div>
    </div>
  );
}
