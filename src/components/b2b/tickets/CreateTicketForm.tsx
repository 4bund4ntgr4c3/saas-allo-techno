import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EquipmentItem, B2BTicketPriority, B2BTicketType } from "@/lib/org.functions";
import { B2B_TICKET_PRIORITIES, B2B_TICKET_TYPES } from "@/lib/org.functions";
import { useI18n } from "@/lib/i18n/context";

export interface CreateTicketFormData {
  equipment_id: string;
  ticket_type: B2BTicketType;
  priority: B2BTicketPriority;
  issue: string;
  location: string;
  contact_phone: string;
  contact_email: string;
  message: string;
}

export interface CreateTicketFormProps {
  equipmentList: EquipmentItem[];
  initialEquipmentId?: string;
  onSubmit: (data: CreateTicketFormData) => void;
  isPending?: boolean;
}

export function CreateTicketForm({
  equipmentList,
  initialEquipmentId = "",
  onSubmit,
  isPending = false,
}: CreateTicketFormProps) {
  const { t } = useI18n();

  const [form, setForm] = React.useState<CreateTicketFormData>({
    equipment_id: initialEquipmentId,
    ticket_type: "panne",
    priority: "normale",
    issue: "",
    location: "",
    contact_phone: "",
    contact_email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      className="grid gap-4 border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3 rounded-lg shadow-sm animate-in fade-in duration-150 text-xs"
      onSubmit={handleSubmit}
    >
      <div>
        <Label>{t("org.tickets.form.equipment")}</Label>
        <Select
          value={form.equipment_id || "none"}
          onValueChange={(v) => setForm({ ...form, equipment_id: v === "none" ? "" : v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Choisir équipement..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— {t("org.tickets.form.noneEquipment")} —</SelectItem>
            {equipmentList.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} {[e.brand, e.model].filter(Boolean).join(" ")} ({e.qr_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t("org.tickets.form.type")}</Label>
        <Select
          value={form.ticket_type}
          onValueChange={(v) => setForm({ ...form, ticket_type: v as B2BTicketType })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {B2B_TICKET_TYPES.map((ty) => (
              <SelectItem key={ty} value={ty}>
                {t(`org.tickets.type.${ty}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t("org.tickets.form.priority")}</Label>
        <Select
          value={form.priority}
          onValueChange={(v) => setForm({ ...form, priority: v as B2BTicketPriority })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {B2B_TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`org.tickets.priority.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="ticket-issue">{t("org.tickets.form.issue")}</Label>
        <Input
          id="ticket-issue"
          required
          className="mt-1.5"
          placeholder="Ex: Écran bleu au démarrage, ventilateur bruyant"
          value={form.issue}
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="ticket-loc">{t("org.tickets.form.location")}</Label>
        <Input
          id="ticket-loc"
          className="mt-1.5"
          placeholder="Ex: Bureau 204, Siège Cotonou"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="ticket-phone">{t("org.tickets.form.phone")}</Label>
        <Input
          id="ticket-phone"
          className="mt-1.5"
          placeholder="+229 ..."
          value={form.contact_phone}
          onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="ticket-email">{t("org.tickets.form.email")}</Label>
        <Input
          id="ticket-email"
          type="email"
          className="mt-1.5"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="ticket-msg">{t("org.tickets.form.message")}</Label>
        <Textarea
          id="ticket-msg"
          rows={3}
          className="mt-1.5"
          placeholder="Détails complémentaires sur la panne constatée..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin mr-1.5" />
          ) : (
            <Send className="size-4 mr-1.5" />
          )}
          {t("org.tickets.form.submit")}
        </Button>
      </div>
    </form>
  );
}
