import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTrainingParticipants } from "@/hooks/useTrainingParticipants";
import { getQuizForTrack, PASS_THRESHOLD, RoleQuiz } from "@/data/training/quizzes";
import { generateCertificatePDF } from "@/lib/trainingCertificate";
import { CheckCircle2, XCircle, Award, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  topicId: string;
  topicLabel: string;
  roleTrack: string;
  roleTrackLabel: string;
  companyName?: string;
}

type Phase = "form" | "quiz" | "result";

const TrainingCompletionDialog = ({ open, onOpenChange, topicId, topicLabel, roleTrack, roleTrackLabel, companyName }: Props) => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { isStudent, isAdmin, isLecturer, viewAsUserId } = useAuth();
  const studentLimited = (isStudent && !isAdmin && !isLecturer) || !!viewAsUserId;
  const { addCompletion, addQuizResult } = useTrainingParticipants();

  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participantRole, setParticipantRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  const quiz: RoleQuiz | undefined = useMemo(() => getQuizForTrack(roleTrack), [roleTrack]);

  const reset = () => {
    setPhase("form");
    setName(""); setEmail(""); setParticipantRole("");
    setAnswers({}); setQuizResult(null); setBusy(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleStart = () => {
    if (!name.trim()) {
      toast.error(de ? "Bitte Name eingeben" : "Please enter a name");
      return;
    }
    if (quiz) setPhase("quiz");
    else void handleFinish(undefined);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    const total = quiz.questions.length;
    let score = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctIndex) score++;
    }
    const passed = score / total >= PASS_THRESHOLD;
    setQuizResult({ score, total, passed });
    setPhase("result");

    setBusy(true);
    await addQuizResult({
      role_track: roleTrack,
      participant_name: name,
      participant_email: email,
      score, total_questions: total, passed,
      answers,
    });
    if (passed) {
      await handleFinish({ score, total });
    }
    setBusy(false);
  };

  const handleFinish = async (qs?: { score: number; total: number }) => {
    setBusy(true);
    const err = await addCompletion({
      topic_id: topicId,
      role_track: roleTrack,
      participant_name: name,
      participant_email: email,
      participant_role: participantRole,
    });
    setBusy(false);
    if (err) {
      toast.error(de ? "Fehler beim Speichern" : "Save failed");
      return;
    }
    toast.success(de ? "Teilnahme erfasst" : "Participation recorded");
    if (!qs && !quiz) {
      onOpenChange(false);
      reset();
    }
  };

  const handleDownloadCert = () => {
    if (studentLimited) {
      toast.error(de
        ? "Studierende dürfen keine Teilnahmezertifikate herunterladen."
        : "Students cannot download participation certificates.");
      return;
    }
    generateCertificatePDF({
      participantName: name,
      participantEmail: email,
      roleTrackLabel,
      topicLabels: [topicLabel],
      quizScore: quizResult ? { score: quizResult.score, total: quizResult.total } : undefined,
      completedDate: new Date().toISOString(),
      companyName,
      lang,
    });
  };

  const allAnswered = quiz ? quiz.questions.every(q => answers[q.id] !== undefined) : true;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {phase === "form" && (de ? "Teilnehmer erfassen" : "Record participant")}
            {phase === "quiz" && (de ? "Wissensabfrage" : "Knowledge check")}
            {phase === "result" && (de ? "Ergebnis" : "Result")}
          </DialogTitle>
          <DialogDescription>{topicLabel} · {roleTrackLabel}</DialogDescription>
        </DialogHeader>

        {phase === "form" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="p-name" className="text-xs">{de ? "Vor- und Nachname *" : "Full name *"}</Label>
              <Input id="p-name" value={name} onChange={e => setName(e.target.value)} placeholder={de ? "z.B. Anna Müller" : "e.g. Anna Smith"} />
            </div>
            <div>
              <Label htmlFor="p-email" className="text-xs">{de ? "E-Mail (optional)" : "Email (optional)"}</Label>
              <Input id="p-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="p-role" className="text-xs">{de ? "Rolle / Abteilung (optional)" : "Role / Department (optional)"}</Label>
              <Input id="p-role" value={participantRole} onChange={e => setParticipantRole(e.target.value)} />
            </div>
            {quiz ? (
              <div className="rounded-md border st-teilweise-border st-teilweise-tint/40 p-3 text-xs text-foreground">
                {de
                  ? `Anschließend folgt eine ${quiz.questions.length}-Fragen-Wissensabfrage. Bestehensgrenze: ${Math.round(PASS_THRESHOLD * 100)} %.`
                  : `A ${quiz.questions.length}-question knowledge check follows. Pass threshold: ${Math.round(PASS_THRESHOLD * 100)}%.`}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {de ? "Für diese Zielgruppe ist keine Wissensabfrage hinterlegt — Teilnahme wird direkt erfasst." : "No knowledge check defined for this audience — participation will be recorded directly."}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => handleClose(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
              <Button onClick={handleStart} disabled={busy}>{quiz ? (de ? "Quiz starten" : "Start quiz") : (de ? "Teilnahme speichern" : "Save participation")}</Button>
            </div>
          </div>
        )}

        {phase === "quiz" && quiz && (
          <div className="space-y-5">
            {quiz.questions.map((q, qi) => (
              <Card key={q.id} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">{qi + 1}. {de ? q.questionDe : q.questionEn}</p>
                  <RadioGroup
                    value={answers[q.id]?.toString() ?? ""}
                    onValueChange={(v) => setAnswers(prev => ({ ...prev, [q.id]: parseInt(v) }))}
                  >
                    {(de ? q.optionsDe : q.optionsEn).map((opt, oi) => (
                      <div key={oi} className="flex items-start gap-2">
                        <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} className="mt-0.5" />
                        <Label htmlFor={`${q.id}-${oi}`} className="text-xs leading-relaxed cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPhase("form")}>{de ? "Zurück" : "Back"}</Button>
              <Button onClick={handleSubmitQuiz} disabled={!allAnswered || busy}>
                {de ? "Quiz abgeben" : "Submit quiz"}
              </Button>
            </div>
          </div>
        )}

        {phase === "result" && quizResult && (
          <div className="space-y-4 text-center py-4">
            {quizResult.passed ? (
              <>
                <CheckCircle2 className="h-16 w-16 st-ja-text mx-auto" />
                <p className="text-2xl font-heading font-bold st-ja-text">{de ? "Bestanden!" : "Passed!"}</p>
                <p className="text-sm text-foreground">
                  {quizResult.score} / {quizResult.total} ({Math.round((quizResult.score / quizResult.total) * 100)} %)
                </p>
                <Badge className="st-ja-tint st-ja-text">
                  {de ? "Teilnahme erfasst" : "Participation recorded"}
                </Badge>
                <div className="flex gap-2 justify-center pt-4">
                  <Button variant="outline" onClick={() => handleClose(false)}>{de ? "Schließen" : "Close"}</Button>
                  <Button onClick={handleDownloadCert} className="gap-1.5">
                    <Award className="h-4 w-4" />
                    {de ? "Zertifikat herunterladen" : "Download certificate"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 st-nein-text mx-auto" />
                <p className="text-2xl font-heading font-bold st-nein-text">{de ? "Nicht bestanden" : "Not passed"}</p>
                <p className="text-sm text-foreground">
                  {quizResult.score} / {quizResult.total} — {de ? `mind. ${Math.ceil(PASS_THRESHOLD * quizResult.total)} erforderlich` : `min. ${Math.ceil(PASS_THRESHOLD * quizResult.total)} required`}
                </p>
                <p className="text-xs text-muted-foreground">{de ? "Ergebnis wurde gespeichert. Teilnahme nicht angerechnet." : "Result saved. Participation not credited."}</p>
                <div className="flex gap-2 justify-center pt-4">
                  <Button variant="outline" onClick={() => handleClose(false)}>{de ? "Schließen" : "Close"}</Button>
                  <Button onClick={() => { setAnswers({}); setQuizResult(null); setPhase("quiz"); }}>
                    {de ? "Erneut versuchen" : "Try again"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrainingCompletionDialog;
