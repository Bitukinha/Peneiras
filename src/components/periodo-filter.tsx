import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PRESETS, periodoDoPreset, periodoLabel, type Periodo, type PeriodoPreset } from "@/lib/periodo";

export function PeriodoFilter({ value, onChange }: { value: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarRange className="size-4" /> Período:
      </Label>
      <Select
        value={value.preset}
        onValueChange={(v) => onChange(periodoDoPreset(v as PeriodoPreset, value))}
      >
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {value.preset === "personalizado" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            className="w-[160px]"
            value={value.de}
            max={value.ate || undefined}
            onChange={(e) => onChange({ ...value, de: e.target.value })}
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            className="w-[160px]"
            value={value.ate}
            min={value.de || undefined}
            onChange={(e) => onChange({ ...value, ate: e.target.value })}
          />
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{periodoLabel(value)}</span>
      )}
    </div>
  );
}
