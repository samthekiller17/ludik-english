import { useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { CefrBadge, ProgressBar } from "@/components/ludik/bits";
import { LiveRegion, ResultsScreen, percent, starsFor } from "@/modules/_shared/kit";
import { missions, type Question } from "./content";
const labels = ["Lee y responde", "Completa la frase", "Caza el error"];
type Attempt = { stage: number; correct: boolean; topic: string };
// Una instancia independiente por misión; repetir limpia todo el estado local.
export default function LexiLibrary(props: ModuleProps) {
  const [run, setRun] = useState(0);
  const mission = missions.find((m) => m.id === props.levelId);
  if (!mission)
    return (
      <section className="p-6">
        <h1 className="font-display text-2xl">Misión no disponible</h1>
        <Button onClick={props.onExit}>Volver al camino</Button>
      </section>
    );
  return (
    <Run
      key={`${props.levelId}-${run}`}
      {...props}
      mission={mission}
      retry={() => setRun((r) => r + 1)}
    />
  );
}
function Run(props: ModuleProps & { mission: (typeof missions)[number]; retry: () => void }) {
  const { mission } = props;
  const [screen, setScreen] = useState<"start" | "play" | "results">("start");
  const [stage, setStage] = useState(0),
    [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [word, setWord] = useState<number | null>(null);
  const [hints, setHints] = useState(0),
    [removed, setRemoved] = useState<string[]>([]);
  const [points, setPoints] = useState(0),
    [streak, setStreak] = useState(0),
    [bonus, setBonus] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const started = useRef(0),
    sent = useRef(false),
    locked = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = mission.stages[stage]?.[index];
  const total = mission.stages.reduce((n, s) => n + s.length, 0);
  const correct = attempts.filter((a) => a.correct).length;
  const score = percent(correct, total),
    stars = starsFor(score);
  const failedTopics = [...new Set(attempts.filter((a) => !a.correct).map((a) => a.topic))];
  const xp = Math.round((mission.xp * score) / 100) + bonus;
  const coins = stars * 5;
  useEffect(() => {
    if (screen === "play") heading.current?.focus();
  }, [stage, index, screen]);
  // La notificación ocurre solo al mostrar resultados, incluso en StrictMode.
  useEffect(() => {
    if (screen !== "results" || sent.current) return;
    sent.current = true;
    props.onComplete({
      moduleId: props.moduleId,
      levelId: props.levelId,
      stage: 3,
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
  }, [screen, props, score, xp, coins, stars, correct, total, seconds, failedTopics]);
  function answer(value: string, q: Question) {
    if (locked.current) return;
    locked.current = true;
    const ok = value === q.answer;
    const next = ok ? streak + 1 : 0;
    const earned = ok && next > 1 ? 2 : 0;
    setStreak(next);
    setBonus((b) => b + earned);
    setPoints((p) => p + (ok ? 10 + earned : 0));
    setAttempts((a) => [...a, { stage, correct: ok, topic: q.topic }]);
    setFeedback({
      correct: ok,
      text: `${ok ? "¡Correcto!" : "¡Sigamos reparando!"} Respuesta: ${q.answer}. ${q.explanation}`,
    });
  }
  function advance() {
    if (index + 1 < (mission.stages[stage]?.length ?? 0)) setIndex((i) => i + 1);
    else if (stage < 2) {
      setStage((s) => s + 1);
      setIndex(0);
    } else {
      setSeconds(Math.round((Date.now() - started.current) / 1000));
      setScreen("results");
    }
    setFeedback(null);
    setRemoved([]);
    setWord(null);
    locked.current = false;
  }
  function hint() {
    if (!current || feedback || hints >= 2) return;
    const bad = current.options.find((o) => o !== current.answer && !removed.includes(o));
    if (!bad) return;
    setRemoved((r) => [...r, bad]);
    setHints((h) => h + 1);
    setPoints((p) => Math.max(0, p - 3));
  }
  if (screen === "results")
    return (
      <ResultsScreen
        skillId={props.skillId}
        levelLabel={mission.id}
        title="¡Biblioteca reparada!"
        score={score}
        stars={stars}
        xp={xp}
        coins={coins}
        timeSeconds={seconds}
        stages={mission.stages.map((s, i) => ({
          label: labels[i] ?? "",
          correct: attempts.filter((a) => a.stage === i && a.correct).length,
          total: s.length,
        }))}
        failedTopics={failedTopics}
        note={`Puntos: ${points}. Bonus de racha: ${bonus} XP. ${failedTopics.length ? "Repasa: " + failedTopics.join(", ") : "¡Excelente trabajo con Lexi!"}`}
        onRetry={props.retry}
        onNext={props.onNext}
        onExit={props.onExit}
      />
    );
  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 text-foreground sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen aria-hidden className="text-ink-yellow" />
          <span className="font-bold">Reparando la Biblioteca</span>
        </div>
        <CefrBadge level={mission.cefr} />
      </header>
      {screen === "start" ? (
        <div className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:grid-cols-[1fr_2fr] sm:p-10">
          <CharacterArt id="lexi" mood="feliz" decorative className="mx-auto w-44 sm:w-60" />
          <div className="space-y-5">
            <p className="font-bold text-ink-yellow">¡Hola! Soy Lexi. ¿Reparamos mis libros?</p>
            <h1 className="font-display text-3xl text-strong">{mission.title}</h1>
            <p>
              Lee una página, completa sus frases y encuentra los errores. ¡Sin vidas ni límite de
              tiempo!
            </p>
            <ol className="list-inside list-decimal space-y-2">
              {labels.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ol>
            <p className="text-sm">
              Dos pistas por misión: cada una descarta una opción y cuesta 3 puntos. Los aciertos
              consecutivos suman un bonus de 2 puntos y 2 XP desde el segundo acierto.
            </p>
            <p className="text-sm">
              Hasta {mission.xp} XP base · 70% para 2 estrellas · 90% para 3
            </p>
            <Button
              size="lg"
              onClick={() => {
                started.current = Date.now();
                setScreen("play");
              }}
            >
              Jugar
            </Button>
          </div>
        </div>
      ) : current ? (
        <>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-bold">
                Etapa {stage + 1} de 3 · {index + 1}/{mission.stages[stage]?.length}
              </span>
              <span>
                {points} puntos · Racha {streak}
              </span>
            </div>
            <ProgressBar value={percent(attempts.length, total)} label="Páginas reparadas" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1
                ref={heading}
                tabIndex={-1}
                className="font-display text-2xl text-strong focus-visible:outline-2"
              >
                {labels[stage]}
              </h1>
              <Button
                variant="outline"
                onClick={hint}
                disabled={
                  hints >= 2 ||
                  !!feedback ||
                  (current.kind === "error" && word !== current.wrongWord)
                }
              >
                <Lightbulb aria-hidden className="size-4" />
                Pista ({2 - hints}) · −3 puntos
              </Button>
            </div>
          </div>
          <p>
            {stage === 0
              ? "Lee con calma y elige la respuesta. Si se pide una oración, tócala en el texto."
              : stage === 1
                ? "Elige la opción que completa la frase."
                : "Toca primero la palabra incorrecta. Después, elige su corrección."}
          </p>
          {stage === 0 && (
            <article
              lang="en"
              aria-label="Texto de lectura"
              className="space-y-2 rounded-3xl border border-border bg-card p-5 text-lg leading-relaxed shadow-card"
            >
              {mission.text.map((s, i) =>
                current.kind === "sentence" ? (
                  <button
                    key={i}
                    disabled={!!feedback || removed.includes(s)}
                    className="block min-h-11 w-full rounded-xl border border-border p-3 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                    onClick={() => answer(s, current)}
                  >
                    {s}
                    {removed.includes(s) ? " — opción descartada" : ""}
                  </button>
                ) : (
                  <span key={i}>{s} </span>
                ),
              )}
            </article>
          )}
          <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-card">
            <h2 lang="en" className="text-xl font-extrabold text-strong">
              {current.prompt}
            </h2>
            {current.kind === "error" && (
              <div
                lang="en"
                aria-label="Selecciona la palabra incorrecta"
                className="flex flex-wrap gap-2"
              >
                {current.prompt.split(" ").map((w, i) => (
                  <button
                    key={i}
                    aria-pressed={word === i}
                    disabled={!!feedback}
                    className={`min-h-11 rounded-xl border border-border px-3 font-bold focus-visible:outline-2 ${word === i ? "bg-yellow text-strong" : "bg-muted"}`}
                    onClick={() => setWord(i)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
            {current.kind === "error" && word !== null && word !== current.wrongWord && (
              <p role="status" className="text-warning">
                ↻ Esa palabra está bien. Busca el error de gramática; aún no cuenta como respuesta.
              </p>
            )}
            {current.kind !== "sentence" &&
              (current.kind !== "error" || word === current.wrongWord) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...current.options]
                    .sort((a, b) => a.localeCompare(b))
                    .map((o) => (
                      <button
                        lang="en"
                        key={o}
                        disabled={!!feedback || removed.includes(o)}
                        className={`min-h-12 rounded-2xl border border-border p-4 text-left font-bold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${feedback && o === current.answer ? "bg-success-soft" : "bg-muted hover:bg-accent"}`}
                        onClick={() => answer(o, current)}
                      >
                        {o}
                        {removed.includes(o) ? " — descartada" : ""}
                        {feedback && o === current.answer ? " ✓" : ""}
                      </button>
                    ))}
                </div>
              )}
          </div>
          {feedback && (
            <div
              role="status"
              className={`flex flex-wrap items-center gap-4 rounded-2xl border border-border p-5 ${feedback.correct ? "bg-success-soft" : "bg-warning-soft"}`}
            >
              <CharacterArt
                id="lexi"
                mood={feedback.correct ? "feliz" : "animando"}
                decorative
                className="w-20"
              />
              {feedback.correct ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}
              <p className="min-w-0 flex-1 basis-48">
                {!feedback.correct && <strong>Incorrecto. </strong>}
                {feedback.text}
              </p>
              <Button onClick={advance}>
                {attempts.length === total ? "Ver resultados" : "Continuar"}
              </Button>
            </div>
          )}
          <LiveRegion
            message={
              removed.length
                ? `Pista: ${removed.join(", ")} descartada. Quedan ${2 - hints} pistas.`
                : ""
            }
          />
        </>
      ) : null}
    </section>
  );
}
