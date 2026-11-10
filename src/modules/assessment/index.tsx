/* ============================================================
 * Módulo de evaluaciones (Plus / Super) — sección 10
 * Un mismo componente sirve "weekly-exam", "official-mock" y
 * "advanced-training" (según props.moduleId).
 * ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, GraduationCap, Lightbulb, Volume2, XCircle } from "lucide-react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { ProgressBar } from "@/components/ludik/bits";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LiveRegion,
  ResultsScreen,
  percent,
  shuffle,
  speak,
  speechSupported,
  starsFor,
  useElapsed,
  useStopSpeechOnUnmount,
} from "@/modules/_shared/kit";
import { EXAMS, isTextCorrect, type Exam, type ExamQuestion } from "./content";

export default function Assessment(props: ModuleProps) {
  const [run, setRun] = useState(0);
  const exam = EXAMS[props.moduleId as Exam["id"]];
  if (!exam)
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-2xl">Evaluación no disponible</h1>
        <Button className="mt-4" onClick={props.onExit}>
          Volver al camino
        </Button>
      </section>
    );
  return (
    <Run key={`${exam.id}-${run}`} {...props} exam={exam} retry={() => setRun((r) => r + 1)} />
  );
}

interface Answer {
  value: string;
  correct: boolean;
}

function Run(props: ModuleProps & { exam: Exam; retry: () => void }) {
  const { exam } = props;
  useStopSpeechOnUnmount();
  const elapsed = useElapsed();
  const [screen, setScreen] = useState<"start" | "play" | "results">("start");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [text, setText] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [clock, setClock] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const sent = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const tts = speechSupported();

  const q = exam.questions[i];
  const total = exam.questions.length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const score = percent(correct, total);
  const stars = starsFor(score);
  const xp = Math.round((exam.xp * score) / 100);
  const coins = stars * 10;
  const failedTopics = exam.questions
    .filter((x) => answers[x.id] && !answers[x.id]?.correct)
    .map((x) => x.topic);
  const current = q ? answers[q.id] : undefined;
  const options = useMemo(() => (q?.kind === "choice" ? shuffle(q.options) : []), [q]);

  // Reloj informativo (sin límite): muestra el tiempo sugerido del examen.
  useEffect(() => {
    if (screen !== "play") return;
    const t = window.setInterval(() => setClock(elapsed()), 1000);
    return () => window.clearInterval(t);
  }, [screen, elapsed]);

  useEffect(() => {
    if (screen === "play") heading.current?.focus();
    if (screen === "play" && q?.audio && q.passage) {
      const t = window.setTimeout(() => speak(q.passage ?? "", { rate: 0.95 }), 400);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [screen, q]);

  useEffect(() => {
    if (screen !== "results" || sent.current) return;
    sent.current = true;
    props.onComplete({
      moduleId: props.moduleId,
      levelId: props.levelId,
      stage: exam.id,
      score,
      xp,
      coins,
      stars,
      correct,
      total,
      timeSeconds: seconds,
      failedTopics,
      completed: true,
    });
  }, [screen, props, exam.id, score, xp, coins, stars, correct, total, seconds, failedTopics]);

  function submit(value: string, question: ExamQuestion) {
    if (answers[question.id]) return;
    const ok =
      question.kind === "choice" ? value === question.answer : isTextCorrect(question, value);
    setAnswers((a) => ({ ...a, [question.id]: { value, correct: ok } }));
  }

  function next() {
    setText("");
    setShowTranscript(false);
    if (i + 1 < total) setI((x) => x + 1);
    else {
      setSeconds(elapsed());
      setScreen("results");
    }
  }

  if (screen === "results") {
    const sections = [...new Set(exam.questions.map((x) => x.section))];
    return (
      <ResultsScreen
        skillId={props.skillId}
        levelLabel={exam.level}
        title={score >= 70 ? "¡Examen aprobado!" : "¡Buen intento!"}
        score={score}
        stars={stars}
        xp={xp}
        coins={coins}
        timeSeconds={seconds}
        stages={sections.map((s) => {
          const qs = exam.questions.filter((x) => x.section === s);
          return {
            label: s,
            correct: qs.filter((x) => answers[x.id]?.correct).length,
            total: qs.length,
          };
        })}
        failedTopics={failedTopics}
        note="Tu ruta recomendada se actualiza en Mi progreso con los temas a repasar."
        onRetry={props.retry}
        onNext={props.onNext}
        onExit={props.onExit}
      />
    );
  }

  if (screen === "start")
    return (
      <section className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:grid-cols-[1fr_2fr] sm:p-10">
        <span className="spotlight mx-auto rounded-3xl px-4 pt-2">
          <CharacterArt id={props.skillId} mood="feliz" decorative className="w-44" />
        </span>
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-yellow px-3 py-1 text-sm font-extrabold text-strong">
            <GraduationCap aria-hidden className="size-4" />{" "}
            {props.plan === "super" ? "Ludik Super" : "Ludik Plus"} · {exam.level}
          </p>
          <h1 className="font-display text-3xl text-strong">{exam.title}</h1>
          <p className="text-lg">{exam.intro}</p>
          <ul className="space-y-1 text-sm font-bold text-strong">
            <li>
              • {total} preguntas · tiempo sugerido {exam.suggestedMinutes} min (sin límite
              estricto)
            </li>
            <li>• Corrección en tiempo real con explicación de cada error</li>
            <li>• Aprobado con 70 % o más</li>
          </ul>
          <Button size="lg" onClick={() => setScreen("play")}>
            Empezar evaluación
          </Button>
        </div>
      </section>
    );

  if (!q) return null;
  const mins = Math.floor(clock / 60);
  const secs = clock % 60;

  return (
    <section className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
          <span>
            Pregunta {i + 1} de {total} · <span className="text-ink-blue">{q.section}</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              clock > exam.suggestedMinutes * 60 && "text-ink-orange",
            )}
          >
            <Clock aria-hidden className="size-4" />
            {mins}:{String(secs).padStart(2, "0")} / {exam.suggestedMinutes}:00
          </span>
        </div>
        <ProgressBar
          value={percent(Object.keys(answers).length, total)}
          label="Avance del examen"
        />
      </div>

      <article className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
        {q.passage && q.audio && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="teal"
              onClick={() => speak(q.passage ?? "", { rate: 0.95 })}
              disabled={!tts}
            >
              <Volume2 aria-hidden /> Escuchar audio
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowTranscript((v) => !v)}
              aria-expanded={showTranscript || !tts}
            >
              {showTranscript || !tts ? "Ocultar transcripción" : "Ver transcripción"}
            </Button>
          </div>
        )}
        {q.passage && (!q.audio || showTranscript || !tts || current) && (
          <blockquote
            lang="en"
            className="rounded-2xl bg-muted p-4 text-lg leading-relaxed text-strong"
          >
            {q.passage}
          </blockquote>
        )}
        <h2 ref={heading} tabIndex={-1} className="font-display text-2xl text-strong">
          <span lang={/[¿áéíóúñ]/i.test(q.prompt) ? "es" : "en"}>{q.prompt}</span>
        </h2>

        {q.kind === "choice" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((o) => {
              const isAns = o === q.answer;
              const picked = current?.value === o;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={!!current}
                  onClick={() => submit(o, q)}
                  className={cn(
                    "btn-3d flex min-h-13 items-center gap-2 rounded-2xl border-2 px-4 py-3 text-left font-extrabold text-strong [--btn-shadow:var(--color-border)]",
                    current && isAns
                      ? "border-success bg-success-soft"
                      : current && picked
                        ? "border-destructive bg-warning-soft"
                        : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {current && isAns && (
                    <CheckCircle2 aria-hidden className="size-5 shrink-0 text-success" />
                  )}
                  {current && picked && !isAns && (
                    <XCircle aria-hidden className="size-5 shrink-0 text-destructive" />
                  )}
                  {o}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) submit(text, q);
            }}
          >
            <label htmlFor={`ans-${q.id}`} className="sr-only">
              Tu respuesta
            </label>
            <Input
              id={`ans-${q.id}`}
              lang="en"
              value={text}
              disabled={!!current}
              onChange={(e) => setText(e.target.value)}
              placeholder={q.placeholder ?? "Escribe tu respuesta en inglés"}
              autoComplete="off"
              className="min-h-12 flex-1 text-lg"
              aria-describedby={current ? `fb-${q.id}` : undefined}
            />
            <Button type="submit" disabled={!!current || !text.trim()}>
              Comprobar
            </Button>
          </form>
        )}

        {current && (
          <div
            id={`fb-${q.id}`}
            role="status"
            className={cn(
              "flex flex-wrap items-start gap-3 rounded-2xl border-2 p-4",
              current.correct ? "border-success bg-success-soft" : "border-warning bg-warning-soft",
            )}
          >
            {current.correct ? (
              <CheckCircle2 aria-hidden className="mt-0.5 size-5 text-success" />
            ) : (
              <Lightbulb aria-hidden className="mt-0.5 size-5 text-ink-yellow" />
            )}
            <div className="min-w-0 flex-1 basis-56 text-strong">
              <p className="font-extrabold">{current.correct ? "¡Correcto!" : "Corrección:"}</p>
              {!current.correct && (
                <p lang="en" className="font-bold">
                  {q.kind === "choice" ? q.answer : q.accepted[0]}
                </p>
              )}
              <p>{q.explanation}</p>
            </div>
            <Button onClick={next} autoFocus>
              {i + 1 < total ? "Siguiente" : "Ver resultados"}
            </Button>
          </div>
        )}
      </article>
      <LiveRegion
        message={current ? (current.correct ? "Correcto" : `Incorrecto. ${q.explanation}`) : ""}
      />
    </section>
  );
}
