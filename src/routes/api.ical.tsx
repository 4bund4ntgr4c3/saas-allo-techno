import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isStaff } from "@/lib/rbac";

/** Échappe les champs texte ICS (CRLF, point-virgule, virgule). */
function icalEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export const Route = createFileRoute("/api/ical")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: claims } = await supabaseAdmin.auth.getClaims(token);
        if (!claims?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!(await isStaff(supabaseAdmin))) {
          return new Response("Forbidden", { status: 403 });
        }

        const { data: reservations, error } = await supabaseAdmin
          .from("reservations")
          .select(
            "id, reference, customer_name, device, issue, slot_date, slot_hour, status, assigned_technician_id",
          )
          .not("slot_date", "is", null)
          .not("status", "in", ["annulee", "livre", "terminee"])
          .order("slot_date", { ascending: true })
          .limit(200);

        if (error) {
          return new Response("Error fetching reservations", { status: 500 });
        }

        const now = new Date();
        const dtstamp = formatIcalDate(now);
        const lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Allô Techno//Reservations//FR",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "X-WR-CALNAME:Allô Techno — Réservations",
          "X-WR-TIMEZONE:Africa/Porto-Novo",
        ];

        for (const r of reservations ?? []) {
          if (!r.slot_date) continue;
          const dateStr = r.slot_date.replace(/-/g, "");
          const hour = r.slot_hour ?? "09:00";
          const [h, m] = hour.split(":").map(Number);
          const start = `${dateStr}T${String(h ?? 9).padStart(2, "0")}${String(m ?? 0).padStart(2, "0")}00`;
          const endHour = (h ?? 9) + 1;
          const end = `${dateStr}T${String(endHour).padStart(2, "0")}${String(m ?? 0).padStart(2, "0")}00`;

          lines.push(
            "BEGIN:VEVENT",
            `UID:${r.id}@allo-techno.com`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART;TZID=Africa/Porto-Novo:${start}`,
            `DTEND;TZID=Africa/Porto-Novo:${end}`,
            `SUMMARY:${icalEscape(r.reference)} — ${icalEscape(r.device)}`,
            `DESCRIPTION:${icalEscape(r.customer_name)}\\n${icalEscape(r.issue ?? "")}\\nStatut: ${icalEscape(r.status)}`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
          );
        }

        lines.push("END:VCALENDAR");

        const body = lines.join("\r\n");
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="allo-techno-reservations.ics"',
            "Cache-Control": "private, max-age=300",
          },
        });
      },
    },
  },
});

function formatIcalDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
