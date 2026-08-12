import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Send, X, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ContactTarget {
  reference: string;
  customer_name: string;
  phone: string;
  device: string;
  quote_amount?: number | null;
}

interface AdminQuickContactProps {
  data: ContactTarget;
  variant?: "button" | "icon";
}

export function AdminQuickContact({ data, variant = "button" }: AdminQuickContactProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  const cleanPhone = data.phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
  // Normalize Benin format if needed (+229)
  const formattedPhone = cleanPhone.startsWith("+")
    ? cleanPhone.slice(1)
    : cleanPhone.startsWith("229")
    ? cleanPhone
    : `229${cleanPhone}`;

  const trackingUrl = `https://allotechno.africa/suivi?ref=${data.reference}`;

  const TEMPLATES = [
    {
      title: "Prise en charge confirmée",
      text: `Bonjour ${data.customer_name}, votre appareil ${data.device} a bien été réceptionné à l'atelier Allô Techno (Dossier ${data.reference}). Vous pouvez suivre son avancement en direct ici : ${trackingUrl}`,
    },
    {
      title: "Devis prêt à valider",
      text: `Bonjour ${data.customer_name}, le diagnostic de votre ${data.device} est terminé et le devis est prêt${
        data.quote_amount ? ` (${data.quote_amount.toLocaleString()} FCFA)` : ""
      }. Consultez-le et validez-le ici : ${trackingUrl}`,
    },
    {
      title: "En attente de pièces",
      text: `Bonjour ${data.customer_name}, nous avons commandé les pièces spécifiques pour votre ${data.device}. Nous vous informerons dès réception à l'atelier. Suivi : ${trackingUrl}`,
    },
    {
      title: "Appareil réparé & prêt",
      text: `Bonjour ${data.customer_name}, bonne nouvelle ! Votre ${data.device} (Dossier ${data.reference}) est réparé et testé avec succès. Vous pouvez passer le récupérer à l'atelier Allô Techno Abomey-Calavi.`,
    },
  ];

  const openWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, "_blank");
  };

  const openSms = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`sms:${data.phone}?body=${encoded}`, "_blank");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "icon" ? (
            <Button
              variant="outline"
              size="sm"
              className="size-7 p-0 text-success hover:text-success hover:bg-success/10"
              title="Contacter le client (WhatsApp / SMS)"
            >
              <MessageSquare className="size-3.5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-success border-success/30 hover:bg-success/10 hover:text-success"
            >
              <MessageSquare className="size-3.5" />
              <span>Contacter</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs font-bold flex items-center justify-between">
            <span>Contacter {data.customer_name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{data.phone}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">
            Modèles WhatsApp
          </div>

          {TEMPLATES.map((tmpl, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => openWhatsApp(tmpl.text)}
              className="text-xs cursor-pointer flex items-center justify-between"
            >
              <span>{tmpl.title}</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setCustomMsg(`Bonjour ${data.customer_name}, concernant votre ${data.device} (${data.reference}) : `);
              setCustomOpen(true);
            }}
            className="text-xs cursor-pointer font-medium text-primary"
          >
            ✏️ Message personnalisé...
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => openSms(`Allô Techno (Dossier ${data.reference}) : Bonjour ${data.customer_name}, votre appareil est prêt.`)}
            className="text-xs cursor-pointer flex items-center justify-between text-muted-foreground"
          >
            <span>Envoyer un SMS classique</span>
            <Phone className="size-3" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal message personnalisé */}
      {customOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-card border border-border p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-bold text-sm">Message WhatsApp à {data.customer_name}</h4>
              <button
                onClick={() => setCustomOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <textarea
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={4}
              className="w-full text-xs p-3 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomOpen(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-success text-white hover:bg-success/90 gap-1.5"
                onClick={() => {
                  openWhatsApp(customMsg);
                  setCustomOpen(false);
                }}
              >
                <Send className="size-3.5" />
                <span>Ouvrir WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
