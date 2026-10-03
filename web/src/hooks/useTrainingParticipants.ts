import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RoleTrack = "all" | "management" | "it" | "procurement" | "developer" | "ot";

export interface TrainingCompletion {
  id: string;
  user_id: string;
  role_track: string;
  topic_id: string;
  participant_name: string;
  participant_email: string;
  participant_role: string;
  completed_at: string;
  next_due_at: string;
  notes: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  role_track: string;
  participant_name: string;
  participant_email: string;
  score: number;
  total_questions: number;
  passed: boolean;
  taken_at: string;
}

export const useTrainingParticipants = () => {
  const { user, tenantId, viewAsUserId } = useAuth();
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Nur die eigene Organisation: eigene Zeilen + die des Org-Inhabers (Mandant).
    // Ohne Filter lieferte die RLS-Regel „has_role admin" einem Admin die
    // Schulungsnachweise ALLER Mandanten. In der Studierenden-Ansicht nur deren Zeilen.
    const owners = viewAsUserId ? [viewAsUserId] : [...new Set([user.id, tenantId].filter(Boolean) as string[])];
    const [c, q] = await Promise.all([
      supabase.from("training_completions").select("*").in("user_id", owners).order("completed_at", { ascending: false }),
      supabase.from("training_quiz_results").select("*").in("user_id", owners).order("taken_at", { ascending: false }),
    ]);
    if (c.data) setCompletions(c.data as TrainingCompletion[]);
    if (q.data) setQuizResults(q.data as QuizResult[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCompletion = async (input: {
    topic_id: string;
    role_track: string;
    participant_name: string;
    participant_email?: string;
    participant_role?: string;
    notes?: string;
  }) => {
    if (!user) return;
    const { error } = await supabase.from("training_completions").insert({
      user_id: user.id,
      topic_id: input.topic_id,
      role_track: input.role_track,
      participant_name: input.participant_name,
      participant_email: input.participant_email ?? "",
      participant_role: input.participant_role ?? "",
      notes: input.notes ?? "",
    });
    if (!error) await refresh();
    return error;
  };

  const deleteCompletion = async (id: string) => {
    const { error } = await supabase.from("training_completions").delete().eq("id", id);
    if (!error) await refresh();
    return error;
  };

  const addQuizResult = async (input: {
    role_track: string;
    participant_name: string;
    participant_email?: string;
    score: number;
    total_questions: number;
    passed: boolean;
    answers: Record<string, number>;
  }) => {
    if (!user) return;
    const { data, error } = await supabase.from("training_quiz_results").insert({
      user_id: user.id,
      role_track: input.role_track,
      participant_name: input.participant_name,
      participant_email: input.participant_email ?? "",
      score: input.score,
      total_questions: input.total_questions,
      passed: input.passed,
      answers: input.answers,
    }).select().maybeSingle();
    if (!error) await refresh();
    return { error, data };
  };

  return { completions, quizResults, loading, refresh, addCompletion, deleteCompletion, addQuizResult };
};
