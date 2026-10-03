import { CriticalityResult } from "@/lib/criticalityEngine";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { classificationBadgeColor } from "@/lib/criticalityEngine";

interface CalculationNotesProps {
  result: CriticalityResult;
  lang: "de" | "en";
  userOverride?: string | null;
}

const CalculationNotes = ({ result, lang, userOverride }: CalculationNotesProps) => {
  const de = lang === "de";

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{de ? "Faktor" : "Factor"}</TableHead>
            <TableHead className="text-center">{de ? "Wert" : "Score"}</TableHead>
            <TableHead className="text-center">Max</TableHead>
            <TableHead className="text-center">{de ? "Normalisiert" : "Normalized"}</TableHead>
            <TableHead className="text-center">{de ? "Gewicht" : "Weight"}</TableHead>
            <TableHead className="text-center">{de ? "Gewichtet" : "Weighted"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.breakdown.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium text-sm">{item.factor}</TableCell>
              <TableCell className="text-center">{item.rawScore}</TableCell>
              <TableCell className="text-center">{item.maxScore}</TableCell>
              <TableCell className="text-center">{item.normalizedScore.toFixed(2)}</TableCell>
              <TableCell className="text-center">{(item.weight * 100).toFixed(0)}%</TableCell>
              <TableCell className="text-center font-mono">{item.weightedScore.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 font-bold">
            <TableCell colSpan={5} className="text-right">
              {de ? "Gesamtpunktzahl" : "Total Score"}
            </TableCell>
            <TableCell className="text-center font-mono">{result.score.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{de ? "Ergebnis:" : "Result:"}</span>
        <Badge variant="outline" className={classificationBadgeColor(result.classification)}>
          {result.classification}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground italic">{result.explanation}</p>

      {userOverride && (
        <div className="p-3 rounded-md st-teilweise-tint border st-teilweise-border text-sm">
          <span className="font-medium st-teilweise-text">
            {de ? "Benutzer-Override:" : "User Override:"}
          </span>{" "}
          <span className="st-teilweise-text">{userOverride}</span>
        </div>
      )}
    </div>
  );
};

export default CalculationNotes;
