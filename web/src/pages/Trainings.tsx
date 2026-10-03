/**
 * Schulungen — dedicated standalone tool (sidebar entry).
 *
 * Wraps the shared TrainingTab component so it can live outside of the
 * numbered pipeline steps. Full catalog + progress + certificates come from
 * TrainingTab itself; we only add a lightweight page header.
 */
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TrainingTab from "@/components/TrainingTab";
import TrainingControlBridge from "@/components/tools/TrainingControlBridge";

export default function Trainings() {
  const { lang } = useLanguage();
  const de = lang === "de";
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-6xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <GraduationCap className="text-primary" size={22} />
            {de ? "Schulungen" : "Trainings"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {de
              ? "Katalog der pflichtigen und empfohlenen Schulungen mit Fortschritts-Tracking, Teilnehmerlisten, Quiz und Zertifikaten."
              : "Catalogue of mandatory and recommended trainings with progress tracking, participant lists, quizzes and certificates."}
          </p>
        </header>
        {/* Konsistenz-Brücke: abgeschlossene Pflichtschulungen → Kontroll-Nachweis (Blob tool-suggestions) */}
        <TrainingControlBridge />
        <TrainingTab />
      </div>
    </div>
  );
}
