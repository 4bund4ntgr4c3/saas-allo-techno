import * as React from "react";
import { Laptop, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import {
  getAvailableCourtesyDevicesFn,
  bookCourtesyDeviceFn,
  type CourtesyDevice,
} from "@/lib/courtesy-devices.functions";

export function CourtesyDeviceBookingModal({ repairRef = "SAV-8492" }: { repairRef?: string }) {
  const [devices, setDevices] = React.useState<CourtesyDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>("cd-01");
  const [days, setDays] = React.useState(3);
  const [phone, setPhone] = React.useState("97000000");
  const [loading, setLoading] = React.useState(false);
  const [successResult, setSuccessResult] = React.useState<{ ref: string; message: string } | null>(null);

  React.useEffect(() => {
    getAvailableCourtesyDevicesFn().then((res) => {
      setDevices(res.devices);
      const firstAvail = res.devices.find((d) => d.isAvailable);
      if (firstAvail) setSelectedDeviceId(firstAvail.id);
    }).catch(() => {});
  }, []);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !selectedDevice.isAvailable) return;
    setLoading(true);
    try {
      const res = await bookCourtesyDeviceFn({
        data: {
          deviceId: selectedDevice.id,
          repairTicketRef: repairRef,
          customerPhone: phone,
          estimatedDays: days,
        },
      });
      if (res.success) {
        setSuccessResult({ ref: res.loanContractRef, message: res.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 sm:p-6 rounded-2xl max-w-xl mx-auto space-y-5 shadow-lg animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Laptop className="size-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">
            Ordinateur de Courtoisie &amp; Secours
          </h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10">
          Continuité d'Activité
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Ne restez pas bloqué pendant la réparation de votre machine. Empruntez un ordinateur prêt à l'emploi directement à l'atelier.
      </p>

      {/* ─── Device Selection Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {devices.map((device) => {
          const isSelected = selectedDeviceId === device.id;
          return (
            <button
              key={device.id}
              type="button"
              disabled={!device.isAvailable}
              onClick={() => setSelectedDeviceId(device.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                !device.isAvailable
                  ? "opacity-50 border-border bg-surface/40 cursor-not-allowed"
                  : isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-surface hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-primary">{device.brand}</span>
                <span className="text-[10px] text-muted-foreground">{device.os}</span>
              </div>
              <h4 className="text-xs font-bold text-foreground mt-1">{device.model}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">{device.specs}</p>

              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <strong className="text-foreground">{formatFcfa(device.dailyRateFcfa)} / jour</strong>
                <span className="text-[10px] text-muted-foreground">Caution : {formatFcfa(device.depositFcfa)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Booking Form ─── */}
      {selectedDevice && !successResult && (
        <form onSubmit={handleBooking} className="space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Numéro de Téléphone (MoMo) :</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 font-mono text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Durée estimée d'emprunt (jours) :</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="bg-surface p-3.5 rounded-xl border border-border flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Total Location ({days} jours) :</span>
              <strong className="font-mono text-foreground text-sm font-bold">
                {formatFcfa(selectedDevice.dailyRateFcfa * days)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Caution remboursable :</span>
              <span className="font-mono text-xs text-muted-foreground">{formatFcfa(selectedDevice.depositFcfa)}</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="technical"
            disabled={loading}
            className="w-full font-bold uppercase tracking-wider text-xs"
          >
            {loading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
            Réserver mon PC de Secours &rarr;
          </Button>
        </form>
      )}

      {successResult && (
        <div className="p-4 bg-emerald-600/10 border border-emerald-600/30 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CheckCircle2 className="size-4" /> Réservation Confirmée ({successResult.ref})
          </div>
          <p className="text-muted-foreground">{successResult.message}</p>
        </div>
      )}
    </div>
  );
}
