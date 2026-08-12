import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Pen, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

export function SignatureCapture({
  onSign,
  onCancel,
  width = 400,
  height = 200,
}: SignaturePadProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255, 255, 255, 0)",
      penColor: "#1a1a1a",
    });

    pad.addEventListener("beginStroke", () => setHasSignature(true));
    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, [width, height]);

  const handleClear = () => {
    padRef.current?.clear();
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL("image/png");
    onSign(dataUrl);
  };

  return (
    <div className="rounded-sm border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Pen className="size-4" />
          {t("signature.title")}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={handleClear} disabled={!hasSignature}>
            <RotateCcw className="mr-1 size-3" />
            {t("signature.clear")}
          </Button>
          <Button variant="technical" size="sm" onClick={handleSign} disabled={!hasSignature}>
            <Check className="mr-1 size-3" />
            {t("signature.validate")}
          </Button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-border">
        <canvas ref={canvasRef} className="cursor-crosshair" style={{ touchAction: "none" }} />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">{t("signature.instruction")}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {t("signature.cancel")}
        </Button>
      </div>
    </div>
  );
}
