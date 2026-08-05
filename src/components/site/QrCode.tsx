import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export function QrCode({
  value,
  size = 128,
  label,
  caption,
}: {
  value: string;
  size?: number;
  label: string;
  caption?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: size, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } },
      (err) => {
        if (err) {
          console.error("[qr] generation failed", err);
          return;
        }
        setDataUrl(canvasRef.current?.toDataURL("image/png") ?? null);
      },
    );
  }, [value, size]);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="rounded-sm border border-border bg-white p-2">
        <canvas ref={canvasRef} role="img" aria-label={caption ?? label} />
      </div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {dataUrl ? (
        <button
          type="button"
          onClick={() => {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `allotechno-${label.toLowerCase().replace(/\s+/g, "-")}.png`;
            a.click();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-primary underline"
        >
          <Download className="size-3" />
          Télécharger le QR code
        </button>
      ) : null}
    </div>
  );
}
