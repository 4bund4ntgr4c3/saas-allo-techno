import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X, Tag } from "lucide-react";
import QRCode from "qrcode";

export interface DeviceLabelData {
  reference: string;
  customer_name: string;
  phone: string;
  device: string;
  issue: string;
  slot_date?: string;
  technician_name?: string;
}

interface AdminDeviceLabelProps {
  data: DeviceLabelData;
  onClose: () => void;
}

export function AdminDeviceLabel({ data, onClose }: AdminDeviceLabelProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [format, setFormat] = useState<"58mm" | "80mm">("80mm");
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate high resolution QR code for the label
    const trackingUrl = `https://allotechno.africa/suivi?ref=${data.reference}`;
    QRCode.toDataURL(trackingUrl, {
      margin: 1,
      width: 160,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(() => {});
  }, [data.reference]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            <h3 className="font-bold text-base">Étiquette Atelier & Pochette</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Format d'impression :</span>
          <div className="flex gap-1.5 bg-muted/40 p-1 rounded-lg border border-border">
            <button
              onClick={() => setFormat("58mm")}
              className={`px-3 py-1 rounded-md transition-all font-mono ${
                format === "58mm" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              58 mm
            </button>
            <button
              onClick={() => setFormat("80mm")}
              className={`px-3 py-1 rounded-md transition-all font-mono ${
                format === "80mm" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              80 mm (Standard)
            </button>
          </div>
        </div>

        {/* Printable Label Area */}
        <div className="flex justify-center bg-muted/10 p-4 rounded-lg border border-dashed border-border overflow-x-auto">
          <div
            id="device-thermal-label"
            ref={labelRef}
            className={`bg-white text-black p-4 rounded border border-black/20 shadow-sm flex flex-col justify-between font-sans ${
              format === "58mm" ? "w-[240px] text-[11px]" : "w-[320px] text-[13px]"
            }`}
          >
            {/* Header label */}
            <div className="text-center border-b border-black pb-1.5 mb-2">
              <p className="font-black text-sm uppercase tracking-widest leading-none">ALLÔ TECHNO</p>
              <p className="text-[9px] uppercase tracking-wider text-black/70 mt-0.5">Atelier Abomey-Calavi</p>
            </div>

            {/* Reference & QR */}
            <div className="flex items-center justify-between gap-2 border-b border-black/30 pb-2 mb-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-black/60 block">Dossier</span>
                <span className="font-mono text-base font-black tracking-tight">{data.reference}</span>
                <span className="text-[10px] text-black/70 block mt-0.5">
                  {data.slot_date ? `Date : ${data.slot_date}` : ""}
                </span>
              </div>
              {qrUrl && (
                <img src={qrUrl} alt="QR Code" className="size-16 shrink-0 border border-black/20 p-0.5" />
              )}
            </div>

            {/* Client & Device Details */}
            <div className="space-y-1 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold text-black/60 block">Client</span>
                <p className="font-bold leading-tight">{data.customer_name}</p>
                <p className="font-mono text-[11px] text-black/80">{data.phone}</p>
              </div>

              <div className="border-t border-dashed border-black/30 pt-1 mt-1">
                <span className="text-[9px] uppercase font-bold text-black/60 block">Appareil</span>
                <p className="font-extrabold text-[13px] leading-tight">{data.device}</p>
              </div>

              <div className="border-t border-dashed border-black/30 pt-1 mt-1">
                <span className="text-[9px] uppercase font-bold text-black/60 block">Panne signalée</span>
                <p className="text-[11px] leading-tight text-black/90 font-medium">{data.issue}</p>
              </div>

              {data.technician_name && (
                <div className="border-t border-dashed border-black/30 pt-1 mt-1 text-[10px] text-black/70">
                  <span>Tech : {data.technician_name}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center border-t border-black pt-1.5 mt-3 text-[8px] text-black/70 uppercase">
              Scannez le QR code pour suivre la réparation
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-4" />
            <span>Imprimer l'étiquette</span>
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #device-thermal-label, #device-thermal-label * {
            visibility: visible;
          }
          #device-thermal-label {
            position: fixed;
            left: 0;
            top: 0;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 80mm !important;
          }
        }
      `}</style>
    </div>
  );
}
