import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface MismatchWarningProps {
  userMarked: boolean;
  systemClassification: string;
  lang: "de" | "en";
  onOverride: (classification: string, reason: string) => void;
  onAccept: () => void;
}

const MismatchWarning = ({ userMarked, systemClassification, lang, onOverride, onAccept }: MismatchWarningProps) => {
  const de = lang === "de";
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");

  const isMismatch = (!userMarked && (systemClassification === "High" || systemClassification === "Critical"))
    || (userMarked && (systemClassification === "Low" || systemClassification === "Medium"));

  if (!isMismatch) return null;

  const userLabel = userMarked
    ? (de ? "Kritisch" : "Critical")
    : (de ? "Nicht kritisch" : "Not Critical");

  return (
    <div className="p-4 rounded-lg border-2 st-teilweise-border st-teilweise-tint space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 st-teilweise-text mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium st-teilweise-text">
            {de ? "Abweichung erkannt" : "Mismatch Detected"}
          </p>
          <p className="st-teilweise-text mt-1">
            {de
              ? `Benutzer sagt: ${userLabel} — System berechnet: ${systemClassification}. Bitte prüfen oder explizit überschreiben.`
              : `User says: ${userLabel} — System says: ${systemClassification}. Please review or explicitly override.`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onAccept}>
          {de ? "System-Ergebnis akzeptieren" : "Accept system result"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowOverride(!showOverride)}>
          {de ? "Überschreiben" : "Override"}
        </Button>
      </div>

      {showOverride && (
        <div className="space-y-2">
          <Textarea
            placeholder={de ? "Begründung für die Überschreibung..." : "Reason for override..."}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-sm"
          />
          <Button
            size="sm"
            disabled={!reason.trim()}
            onClick={() => {
              onOverride(userMarked ? "Critical" : "Low", reason);
              setShowOverride(false);
            }}
          >
            {de ? "Override bestätigen" : "Confirm Override"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MismatchWarning;
