import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { CtaBand, MobileMoneyBar } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { COMPANY } from "@/data/catalog";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & atelier — Allô Techno Abomey-Calavi" },
      {
        name: "description",
        content:
          "Adresse, horaires, téléphone et WhatsApp de l'atelier Allô Techno à Zogbadjè, Abomey-Calavi. Diagnostic gratuit sans rendez-vous.",
      },
      { property: "og:title", content: "Contact — Allô Techno Abomey-Calavi" },
      {
        property: "og:description",
        content: "Venez à l'atelier de Zogbadjè ou écrivez-nous sur WhatsApp pour un diagnostic gratuit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const tel = COMPANY.phone.replace(/\s/g, "");
  const wa = COMPANY.whatsapp.replace(/\D/g, "");
  const map = `https://www.openstreetmap.org/export/embed.html?bbox=${COMPANY.lng - 0.01}%2C${COMPANY.lat - 0.01}%2C${COMPANY.lng + 0.01}%2C${COMPANY.lat + 0.01}&layer=mapnik&marker=${COMPANY.lat}%2C${COMPANY.lng}`;

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">Nous trouver</span>
          <h1 className="at-display text-4xl md:text-6xl">Contact & atelier</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Passez sans rendez-vous pour un diagnostic gratuit, ou contactez-nous avant de vous
            déplacer.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="space-y-px border border-border bg-border">
            <div className="flex gap-4 bg-card p-6">
              <MapPin className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">Adresse</span>
                <p className="mt-1 text-sm">{COMPANY.address}</p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Phone className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">Téléphone</span>
                <p className="mt-1 font-mono text-sm">
                  <a href={`tel:${tel}`} className="hover:text-primary">
                    {COMPANY.phone}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <MessageCircle className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">WhatsApp</span>
                <p className="mt-1 text-sm">
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    Démarrer une conversation
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Mail className="size-5 shrink-0 text-primary" />
              <div>
                <span className="at-eyebrow">E-mail</span>
                <p className="mt-1 text-sm">
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                    {COMPANY.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4 bg-card p-6">
              <Clock className="size-5 shrink-0 text-primary" />
              <div className="w-full">
                <span className="at-eyebrow">Horaires</span>
                <ul className="mt-2 space-y-1 text-xs font-medium text-muted-foreground">
                  {COMPANY.hours.map((h) => (
                    <li key={h.d} className="flex justify-between gap-6">
                      <span>{h.d}</span>
                      <span className="font-mono">{h.h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-border">
            <iframe
              title="Carte de l'atelier Allô Techno à Abomey-Calavi"
              src={map}
              loading="lazy"
              className="h-full min-h-96 w-full"
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
          <MobileMoneyBar />
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="at-eyebrow mb-4 block">Écrivez-nous</span>
            <h2 className="at-display text-3xl">Envoyez un message</h2>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Une question sur une réparation, un prix, un accessoire ? Nous
              répondons rapidement — généralement sous une heure ouvrée.
            </p>
          </div>
          <LeadForm
            source="contact"
            title="Contact direct"
            description="Message envoyé directement à l'équipe de l'atelier."
            successText="Merci ! Nous revenons vers vous rapidement."
          />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
