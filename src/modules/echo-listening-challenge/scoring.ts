/* Validación de respuestas del Listening Challenge (pura y testeable). */
export interface ListeningQuestion {
  kind: "single" | "multi";
  topic: string;
  prompt: string;
  promptEs: string;
  options: string[];
  answer: string[];
  explanation: string;
}

/** Correcta solo si el conjunto elegido coincide exactamente con el esperado. */
export function isAnswerCorrect(
  q: Pick<ListeningQuestion, "answer">,
  picked: readonly string[],
): boolean {
  const want = new Set(q.answer);
  const got = new Set(picked);
  if (want.size !== got.size) return false;
  for (const w of want) if (!got.has(w)) return false;
  return true;
}
