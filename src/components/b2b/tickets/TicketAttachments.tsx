import * as React from "react";
import { Paperclip, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export interface TicketAttachment {
  id: string;
  url: string;
  kind: string | null;
  stage: string | null;
  caption: string | null;
  created_at: string;
}

export interface TicketAttachmentsProps {
  attachments: TicketAttachment[];
  attachmentUrls?: Record<string, string> | undefined;
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
}

export function TicketAttachments({
  attachments,
  attachmentUrls,
  onUpload,
  isUploading = false,
}: TicketAttachmentsProps) {
  const { t } = useI18n();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const urls = attachmentUrls ?? {};

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Paperclip className="size-5 text-primary" />
          {t("org.tickets.detail.attachments")}
        </h2>
        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) onUpload(files);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInput.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Upload className="size-4 mr-1.5 text-primary" />
            )}
            {isUploading ? "Envoi..." : t("org.tickets.detail.addAttachment")}
          </Button>
        </div>
      </div>
      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("org.tickets.detail.attachments.empty")}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {attachments.map((a) => (
            <li key={a.id}>
              <a
                href={urls[a.url] ?? a.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-border p-3 text-sm transition-colors hover:border-primary rounded-md"
              >
                {a.kind === "video" ? (
                  <video
                    src={urls[a.url] ?? a.url}
                    controls
                    className="mb-2 aspect-video w-full bg-black rounded"
                  />
                ) : null}
                <p className="truncate font-medium text-foreground">{a.caption ?? "Pièce jointe"}</p>
                <p className="text-xs text-muted-foreground">
                  {a.kind ?? a.stage ?? "—"} ·{" "}
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
