import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  de: boolean;
  disabled?: boolean;
  onAdd: (assetName: string) => Promise<void> | void;
}

/**
 * Inline asset-row at the bottom of a service accordion.
 * Type + Enter (or click +) = quick-add with sensible defaults.
 * Detailed editing remains via the existing Edit dialog.
 */
export default function InlineAssetRow({ de, disabled, onAdd }: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const v = value.trim();
    if (!v || busy || disabled) return;
    setBusy(true);
    try {
      await onAdd(v);
      setValue("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 pt-1">
      <Input
        value={value}
        disabled={disabled || busy}
        placeholder={
          de
            ? "Asset-Name eingeben und Enter drücken (z. B. SAP ERP, Active Directory)…"
            : "Type asset name and press Enter (e.g. SAP ERP, Active Directory)…"
        }
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="h-8 text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 flex-shrink-0"
        disabled={!value.trim() || busy || disabled}
        onClick={submit}
      >
        <Plus className="h-3.5 w-3.5" />
        {de ? "Hinzufügen" : "Add"}
      </Button>
    </div>
  );
}
