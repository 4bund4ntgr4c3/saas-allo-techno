import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, type Html5QrcodeCameraConfig } from "html5-qrcode";
import { Camera, X, ScanLine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  /** Optional: restrict to QR only (default scans QR + barcodes) */
  qrOnly?: boolean;
}

const SCAN_CONFIG: Html5QrcodeCameraConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
};

export function QrScanner({ onScan, onClose, qrOnly }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scanner = new Html5Qrcode("qr-scanner-region");
    scannerRef.current = scanner;

    const formats = qrOnly
      ? undefined
      : undefined; // default scans all supported formats

    scanner
      .start(
        { facingMode: "environment" },
        SCAN_CONFIG,
        (decodedText) => {
          setScanning(false);
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => { /* ignore scan errors during active scanning */ },
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setError("Caméra refusée. Autorisez l'accès dans les paramètres de votre navigateur.");
        } else if (msg.includes("NotFound")) {
          setError("Aucune caméra détectée.");
        } else {
          setError("Impossible de démarrer le scanner.");
        }
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan, qrOnly]);

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-sm rounded-sm bg-card p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Camera className="size-4" />
            Scanner un code
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-sm">
            <X className="size-4" />
          </button>
        </div>

        {error ? (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 size-6 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <div
              id="qr-scanner-region"
              ref={containerRef}
              className="overflow-hidden rounded-sm border"
            />
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ScanLine className="size-3 animate-pulse" />
              {scanning ? "Alignez le code dans le cadre…" : "Code détecté !"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
