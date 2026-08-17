import * as React from "react";
import { Camera, CameraOff, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QrCameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

export function QrCameraScanner({ onScan, onClose }: QrCameraScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = React.useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isCancelled = false;

    async function startCamera() {
      try {
        setErrorMsg(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          startQrDetection();
        }
      } catch (err) {
        console.error("Erreur acces camera", err);
        setErrorMsg("Impossible d'accéder à la caméra. Vérifiez vos autorisations navigateur.");
      }
    }

    async function startQrDetection() {
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const detector = new (
            window as unknown as {
              BarcodeDetector: new (opts: { formats: string[] }) => {
                detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
              };
            }
          ).BarcodeDetector({ formats: ["qr_code"] });
          const scanLoop = async () => {
            if (isCancelled || !videoRef.current) return;
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0]?.rawValue) {
                  const raw = barcodes[0].rawValue;
                  if ("vibrate" in navigator) {
                    try {
                      navigator.vibrate(50);
                    } catch {
                      /* ignore */
                    }
                  }
                  onScan(raw);
                  return;
                }
              } catch {
                /* ignore */
              }
            }
            animationFrameId = requestAnimationFrame(scanLoop);
          };
          scanLoop();
          return;
        } catch {
          /* ignore */
        }
      }
    }

    void startCamera();

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, onScan]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-black text-white shadow-2xl">
      {/* ─── Video Preview ─── */}
      <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />

        {/* ─── Laser Target Frame Overlay ─── */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
          <div className="relative size-56 sm:size-64 rounded-xl border-2 border-primary/80 bg-primary/5 shadow-2xl">
            {/* Coins décoratifs de visée */}
            <div className="absolute -left-1 -top-1 size-5 border-l-4 border-t-4 border-primary" />
            <div className="absolute -right-1 -top-1 size-5 border-r-4 border-t-4 border-primary" />
            <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-primary" />
            <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-primary" />

            {/* Ligne laser animée */}
            <div className="absolute left-2 right-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[bounce_2s_infinite]" />
          </div>
        </div>

        {/* ─── Header Controls ─── */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-mono text-xs font-semibold backdrop-blur-md">
            <Camera className="size-3.5 text-primary" />
            Scanner QR Matériel
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleCamera}
              className="size-8 rounded-full border-white/20 bg-black/60 text-white hover:bg-white/20"
              title="Changer de caméra"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onClose}
                className="size-8 rounded-full border-white/20 bg-black/60 text-white hover:bg-white/20"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ─── Bottom Status / Helper ─── */}
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <p className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md">
            Pointez la caméra vers le sticker QR de l'équipement
          </p>
        </div>

        {/* ─── Error Message Overlay ─── */}
        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/85 text-center space-y-3">
            <CameraOff className="size-10 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
