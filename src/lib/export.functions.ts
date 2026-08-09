// Export CSV serveur (administration) : dossiers de réparation et leads.
// Réservé au personnel, vérifié côté serveur (isStaff) + limiteur de débit.

import { createServerFn } from "@tanstack/react-start";
import { isStaff } from "@/lib/rbac";
import { rateLimit } from "@/lib/security";

/** Échappe une valeur CSV : entre guillemets, doublons les guillemets internes. */
function escapeCsv(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Série de lignes CSV (en-tête + corps), BOM UTF-8 pour Excel, CRLF. */
function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
  return "\uFEFF" + lines.join("\r\n");
}

/** Export des dossiers de réparation (derniers 2000), réservé au personnel. */
export const exportReservationsCsv = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
  if (!rateLimit("admin-export", 5))
    throw new Error("Trop de demandes. Réessayez dans une minute.");

  const { data, error } = await supabaseAdmin
    .from("reservations")
    .select(
      "reference, customer_name, phone, email, device, issue, mode, payment, slot_date, slot_period, slot_hour, status, staff_notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error("Export impossible");

  const header = [
    "Reference",
    "Client",
    "Telephone",
    "Email",
    "Appareil",
    "Panne",
    "Mode",
    "Paiement",
    "Date",
    "Periode",
    "Heure",
    "Statut",
    "Notes",
    "Cree le",
  ];
  const rows = (data ?? []).map((r) => [
    r.reference,
    r.customer_name,
    r.phone,
    r.email,
    r.device,
    r.issue,
    r.mode,
    r.payment,
    r.slot_date,
    r.slot_period,
    r.slot_hour,
    r.status,
    r.staff_notes,
    r.created_at,
  ]);

  return { csv: toCsv(header, rows) };
});

/** Export des leads (derniers 2000), réservé au personnel. */
export const exportLeadsCsv = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
  if (!rateLimit("admin-export", 5))
    throw new Error("Trop de demandes. Réessayez dans une minute.");

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("reference, source, name, phone, email, status, created_at, message")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error("Export impossible");

  const header = [
    "Reference",
    "Source",
    "Nom",
    "Telephone",
    "Email",
    "Statut",
    "Cree le",
    "Message",
  ];
  const rows = (data ?? []).map((r) => [
    r.reference,
    r.source,
    r.name,
    r.phone,
    r.email,
    r.status,
    r.created_at,
    r.message,
  ]);

  return { csv: toCsv(header, rows) };
});

// ---------------------------------------------------------------------------
// Export comptable : paiements
// ---------------------------------------------------------------------------

/** Export CSV des paiements (comptabilite), reserve au personnel. */
export const exportPaymentsCsv = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisee");
  if (!rateLimit("admin-export", 5))
    throw new Error("Trop de demandes. Reessayez dans une minute.");

  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("created_at, reference, amount, method, status, tx_ref, source")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error("Export impossible");

  const references = [...new Set((data ?? []).map((p) => p.reference).filter(Boolean))];
  const clientMap: Record<string, string> = {};
  if (references.length > 0) {
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("reference, customer_name")
      .in("reference", references as string[]);
    for (const r of reservations ?? []) {
      clientMap[r.reference] = r.customer_name;
    }
  }

  const header = [
    "Date",
    "Reference dossier",
    "Client",
    "Montant (FCFA)",
    "Methode",
    "Statut",
    "Reference transaction",
    "Source",
  ];
  const rows = (data ?? []).map((p) => [
    p.created_at,
    p.reference,
    clientMap[p.reference ?? ""] ?? "",
    p.amount,
    p.method,
    p.status,
    p.tx_ref ?? "",
    p.source,
  ]);

  return { csv: toCsv(header, rows) };
});

/** Export du dashboard complet en Excel (.xlsx), réservé au personnel. */
export const exportDashboardXlsx = createServerFn({ method: "POST" }).handler(async () => {
  const XLSX = await import("xlsx");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!(await isStaff(supabaseAdmin))) throw new Error("Action non autorisée");
  if (!rateLimit("admin-export", 5))
    throw new Error("Trop de demandes. Réessayez dans une minute.");

  const wb = XLSX.utils.book_new();

  // Sheet 1: Réservations
  const { data: reservations } = await supabaseAdmin
    .from("reservations")
    .select("reference, customer_name, phone, device, issue, status, slot_date, payment, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  const resRows = (reservations ?? []).map((r) => ({
    Reference: r.reference,
    Client: r.customer_name,
    Telephone: r.phone,
    Appareil: r.device,
    Panne: r.issue,
    Statut: r.status,
    "Date RDV": r.slot_date,
    Paiement: r.payment,
    "Cree le": r.created_at,
  }));
  const wsRes = XLSX.utils.json_to_sheet(resRows);
  XLSX.utils.book_append_sheet(wb, wsRes, "Reservations");

  // Sheet 2: Paiements
  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("amount, status, method, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  const payRows = (payments ?? []).map((p) => ({
    Date: p.created_at,
    Montant: p.amount,
    Methode: p.method,
    Statut: p.status,
  }));
  const wsPay = XLSX.utils.json_to_sheet(payRows);
  XLSX.utils.book_append_sheet(wb, wsPay, "Payments");

  // Sheet 3: Leads
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("source, name, phone, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  const leadRows = (leads ?? []).map((l) => ({
    Source: l.source,
    Nom: l.name,
    Telephone: l.phone,
    Email: l.email,
    Statut: l.status,
    "Cree le": l.created_at,
  }));
  const wsLeads = XLSX.utils.json_to_sheet(leadRows);
  XLSX.utils.book_append_sheet(wb, wsLeads, "Leads");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { base64, filename: `dashboard-allotechno-${new Date().toISOString().slice(0, 10)}.xlsx` };
});
