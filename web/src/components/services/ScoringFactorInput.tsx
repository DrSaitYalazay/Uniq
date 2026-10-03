import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Option {
  value: number;
  label: string;
}

interface ScoringFactorInputProps {
  label: string;
  description?: string;
  value: number;
  options: Option[];
  onChange: (value: number) => void;
}

const ScoringFactorInput = ({ label, description, value, options, onChange }: ScoringFactorInputProps) => {
  return (
    <div className="space-y-2 py-3 border-b border-border last:border-0">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <RadioGroup
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
        className="flex flex-col gap-1.5 mt-1"
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={String(opt.value)} id={`${label}-${opt.value}`} />
            <Label htmlFor={`${label}-${opt.value}`} className="text-sm font-normal cursor-pointer">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ScoringFactorInput;
