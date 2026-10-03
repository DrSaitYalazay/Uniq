import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFramework } from "@/contexts/FrameworkContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrainingParticipants, TrainingCompletion } from "@/hooks/useTrainingParticipants";
import { Trash2, UserPlus, Award, Mail, Calendar, AlertCircle } from "lucide-react";
import TrainingCompletionDialog from "./TrainingCompletionDialog";
import { generateCertificatePDF } from "@/lib/trainingCertificate";
import { toast } from "sonner";

interface Props {
  topicId: string;
  topicLabel: string;
  roleTrack: string;
  roleTrackLabel: string;
  companyName?: string;
}

const TopicParticipantsList = ({ topicId, topicLabel, roleTrack, roleTrackLabel, companyName }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { active } = useFramework();
  const refs = [
    active.some(f => f.key === "NIS2") && "NIS2 Art. 21(2)(g)",
    active.some(f => f.key === "ISO27001") && "ISO 27001 A.6.3",
    active.some(f => f.key === "DORA") && "DORA Art. 13",
  ].filter(Boolean).join(", ");
  const hintSuffix = refs ? (de ? ` (z. B. ${refs})` : ` (e.g. ${refs})`) : "";
  const { isStudent, isAdmin, isLecturer, viewAsUserId } = useAuth();
  const studentLimited = (isStudent && !isAdmin && !isLecturer) || !!viewAsUserId;
  const { completions, quizResults, deleteCompletion } = useTrainingParticipants();
  const [dialogOpen, setDialogOpen] = useState(false);

  const topicParticipants = useMemo(
    () => completions.filter(c => c.topic_id === topicId),
    [completions, topicId]
  );

  const findQuizFor = (name: string): { score: number; total: number } | undefined => {
    const q = quizResults.find(qr => qr.participant_name === name && qr.role_track === roleTrack && qr.passed);
    return q ? { score: q.score, total: q.total_questions } : undefined;
  };

  const handleDelete = async (c: TrainingCompletion) => {
    if (!confirm(de ? `Eintrag für "${c.participant_name}" löschen?` : `Delete entry for "${c.participant_name}"?`)) return;
    await deleteCompletion(c.id);
    toast.success(de ? "Eintrag gelöscht" : "Entry deleted");
  };

  const handleCert = (c: TrainingCompletion) => {
    if (studentLimited) {
      toast.error(de
        ? "Studierende dürfen keine Teilnahmezertifikate herunterladen."
        : "Students cannot download participation certificates.");
      return;
    }
    generateCertificatePDF({
      participantName: c.participant_name,
      participantEmail: c.participant_email,
      roleTrackLabel,
      topicLabels: [topicLabel],
      quizScore: findQuizFor(c.participant_name),
      completedDate: c.completed_at,
      companyName,
      lang,
    });
  };

  const dueStatus = (next: string) => {
    const days = Math.ceil((new Date(next).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: de ? `${Math.abs(days)} T. überfällig` : `${Math.abs(days)} d overdue`, cls: "st-nein-tint st-nein-text" };
    if (days <= 30) return { label: de ? `in ${days} T. fällig` : `due in ${days} d`, cls: "st-teilweise-tint st-teilweise-text" };
    return { label: de ? `gültig bis ${new Date(next).toLocaleDateString("de-DE")}` : `valid until ${new Date(next).toLocaleDateString("en-GB")}`, cls: "st-ja-tint st-ja-text" };
  };

  return (
    <div className="rounded-lg border st-ja-border st-ja-tint/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 st-ja-text" />
          <h4 className="text-sm font-heading font-semibold text-foreground">
            {de ? "Teilnehmer & Wissensabfrage" : "Participants & knowledge check"}
          </h4>
          <Badge variant="outline" className="text-[10px]">{topicParticipants.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5 h-7 text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          {de ? "Teilnehmer hinzufügen" : "Add participant"}
        </Button>
      </div>

      {topicParticipants.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          {de ? `Noch keine Teilnehmer erfasst. Es wird empfohlen, pro Mitarbeiter einen Schulungsnachweis zu führen${hintSuffix}.` : `No participants recorded yet. Per-employee training records are recommended${hintSuffix}.`}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {topicParticipants.map(c => {
            const due = dueStatus(c.next_due_at);
            const quiz = findQuizFor(c.participant_name);
            return (
              <li key={c.id} className="flex items-center gap-2 rounded-md bg-card border border-border/60 px-2.5 py-1.5 text-xs">
                <span className="font-medium text-foreground flex-1 truncate">{c.participant_name}</span>
                {c.participant_email && (
                  <span className="hidden md:flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />{c.participant_email}
                  </span>
                )}
                {quiz && (
                  <Badge className="st-ja-tint st-ja-text text-[10px]">
                    Quiz {quiz.score}/{quiz.total}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-muted-foreground text-[10px]">
                  <Calendar className="h-3 w-3" />
                  {new Date(c.completed_at).toLocaleDateString(de ? "de-DE" : "en-GB")}
                </span>
                <Badge className={`text-[10px] ${due.cls}`}>{due.label}</Badge>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title={de ? "Zertifikat" : "Certificate"} onClick={() => handleCert(c)}>
                  <Award className="h-3.5 w-3.5 st-teilweise-text" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title={de ? "Löschen" : "Delete"} onClick={() => handleDelete(c)}>
                  <Trash2 className="h-3.5 w-3.5 st-nein-text" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <TrainingCompletionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        topicId={topicId}
        topicLabel={topicLabel}
        roleTrack={roleTrack}
        roleTrackLabel={roleTrackLabel}
        companyName={companyName}
      />
    </div>
  );
};

export default TopicParticipantsList;
