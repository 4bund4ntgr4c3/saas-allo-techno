import * as React from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export interface TechnicianProfile {
  id: string;
  fullName: string;
  role: string;
  matricule: string;
  certifications: string[];
  interventionsCompleted: number;
  rating: number;
}

export const DEFAULT_TECH_PROFILE: TechnicianProfile = {
  id: "tech-01",
  fullName: "Koffi Mensah",
  role: "Expert Micro-Soudure & Architecte Réseau",
  matricule: "AT-TECH-2026-08",
  certifications: [
    "Apple Certified Mac Technician (ACMT)",
    "Spécialiste Micro-Soudure SMD & Reballing BGA",
    "Certification Dell ProSupport IT & Serveurs PowerEdge",
  ],
  interventionsCompleted: 482,
  rating: 4.9,
};

export function TechnicianBadgeModal({
  tech = DEFAULT_TECH_PROFILE,
}: {
  tech?: TechnicianProfile;
}) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    QRCode.toDataURL(`https://allotechno.africa/fr/tech-verify?id=${tech.matricule}`, {
      width: 140,
      margin: 1,
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [tech.matricule]);

  return (
    <div className="border border-border bg-card p-6 rounded-2xl max-w-sm mx-auto shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
      {/* ─── Badge Top Header ─── */}
      <div className="bg-foreground text-background p-4 -m-6 mb-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <span className="font-extrabold text-xs tracking-wider uppercase">
            Accréditation Officielle
          </span>
        </div>
        <span className="font-mono text-[10px] text-primary bg-primary/20 px-2 py-0.5 rounded font-bold">
          ACTIF
        </span>
      </div>

      {/* ─── Tech Profile Info ─── */}
      <div className="text-center space-y-2">
        <div className="size-20 mx-auto rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
          {tech.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <h3 className="font-extrabold text-base text-foreground">{tech.fullName}</h3>
          <p className="text-xs text-primary font-semibold">{tech.role}</p>
          <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
            Matricule : {tech.matricule}
          </span>
        </div>
      </div>

      {/* ─── Stats Pills ─── */}
      <div className="grid grid-cols-2 gap-2 text-center bg-surface p-2.5 rounded-lg text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block">Interventions</span>
          <strong className="font-mono font-bold text-foreground">
            {tech.interventionsCompleted}+
          </strong>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Score Qualité</span>
          <strong className="font-mono font-bold text-emerald-600">★ {tech.rating} / 5.0</strong>
        </div>
      </div>

      {/* ─── Certifications List ─── */}
      <div className="space-y-1.5">
        <span className="at-eyebrow text-muted-foreground text-[10px] block">
          Habilitations &amp; Certifications :
        </span>
        <ul className="space-y-1 text-xs text-foreground">
          {tech.certifications.map((cert, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px]">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{cert}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ─── QR Code Verification ─── */}
      {qrDataUrl && (
        <div className="border-t border-border pt-4 text-center space-y-2">
          <img
            src={qrDataUrl}
            alt="QR Accréditation"
            className="size-24 mx-auto rounded-md border border-border"
          />
          <p className="text-[10px] text-muted-foreground">
            Scannez ce QR Code pour authentifier l'agent Allô Techno sur le registre officiel.
          </p>
        </div>
      )}
    </div>
  );
}
