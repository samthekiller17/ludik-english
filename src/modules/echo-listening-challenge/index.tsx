/* ============================================================
 * Módulo Echo — Listening Challenge (Anexo C, versión React)
 * Mismo contenido, preguntas y criterios que el HTML sin JS:
 * audio nativo + transcripción desplegable + 4 preguntas
 * (opción múltiple, palabras escuchadas, V/F, completar).
 * Audios provisionales generados por voz sintética (reemplazables).
 * ============================================================ */
import { useEffect, useRef, useState } from "react";
import { Award, CheckCircle2, Coins, Ear, Headphones, Play, Sparkles, XCircle } from "lucide-react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { CefrBadge, ProgressBar } from "@/components/ludik/bits";
import { LiveRegion, ResultsScreen, percent, starsFor, useElapsed } from "@/modules/_shared/kit";
import { cn } from "@/lib/utils";
import content from "./content.json";
import a1Audio from "@/assets/audio/echo-a1.mp3.asset.json";
import b1Audio from "@/assets/audio/echo-b1.mp3.asset.json";
import c1Audio from "@/assets/audio/echo-c1.mp3.asset.json";
import { isAnswerCorrect, type ListeningQuestion } from "./scoring";

const AUDIO: Record<string, string> = { A1: a1Audio.url, B1: b1Audio.url, C1: c1Audio.url };
const KIND_LABEL = [
  "Opción múltiple",
  "Palabras escuchadas",
  "Verdadero o falso",
  "Completa la frase",
];

type Level = (typeof content.levels)[number];
type Answer = { picked: string[]; correct: boolean };

export default function EchoListening(props: ModuleProps) {
  const [run, setRun] = useState(0);
  const level = content.levels.find((l) => l.id === props.levelId);
  if (!level)
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-2xl">Nivel no disponible</h1>
        <Button className="mt-4" onClick={props.onExit}>
          Volver al camino
        </Button>
      </section>
    );
  return (
    <Run key={`${level.id}-${run}`} {...props} level={level} retry={() => setRun((r) => r + 1)} />
  );
}

function Run(props: ModuleProps & { level: Level; retry: () => void }) {
  const { level } = props;
  const questions = level.questions as ListeningQuestion[];
  const [screen, setScreen] = useState<"start" | "play" | "results">("start");
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [streak, setStreak] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [live, setLive] = useState("");
  const [seconds, setSeconds] = useState(0);
  const elapsed = useElapsed();
  const sent = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const total = questions.length;
  const score = percent(correct, total);
  const stars = starsFor(score);
  const xp = Math.round((level.xp * score) / 100) + bonus;
  const coins = stars * 5;
  const done = answered === total;
  const failedTopics = questions
    .filter((_, i) => answers[i] && !answers[i]?.correct)
    .map((q) => q.topic);

  useEffect(() => {
    if (screen === "play") heading.current?.focus();
  }, [screen]);

  useEffect(() => {
    if (screen !== "results" || sent.current) return;
    sent.current = true;
    props.onComplete({
      moduleId: props.moduleId,
      levelId: props.levelId,
      stage: "listening",
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

  function submit(index: number, picked: string[]) {
    const q = questions[index];
    if (!q || answers[index]) return;
    const ok = isAnswerCorrect(q, picked);
    const next = ok ? streak + 1 : 0;
    const earned = ok && next > 1 ? 5 : 0;
    setStreak(next);
    setBonus((b) => b + earned);
    setAnswers((a) => ({ ...a, [index]: { picked, correct: ok } }));
    setLive(
      ok
        ? `Pregunta ${index + 1}: ¡correcto!`
        : `Pregunta ${index + 1}: incorrecto. Escucha de nuevo.`,
    );
  }

  if (screen === "results")
    return (
      <ResultsScreen
        skillId="echo"
        levelLabel={level.id}
        title="¡Nivel completado!"
        score={score}
        stars={stars}
        xp={xp}
        coins={coins}
        timeSeconds={seconds}
        stages={questions.map((q, i) => ({
          label: KIND_LABEL[i] ?? q.topic,
          correct: answers[i]?.correct ? 1 : 0,
          total: 1,
        }))}
        failedTopics={failedTopics}
        note={`Insignia: ${level.badge}${stars >= 2 ? " ganada" : " (consigue 2 estrellas para ganarla)"}. Bonus de racha: ${bonus} XP.`}
        onRetry={props.retry}
        onNext={props.onNext}
        onExit={props.onExit}
      />
    );

  if (screen === "start")
    return (
      <section className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:grid-cols-[1fr_2fr] sm:p-10">
        <span className="spotlight mx-auto rounded-3xl px-4 pt-2">
          <CharacterArt id="echo" mood="feliz" decorative className="w-44 sm:w-56" />
        </span>
        <div className="space-y-4">
          <p className="flex items-center gap-2 font-bold text-ink-teal">
            <Headphones aria-hidden className="size-5" /> Ludik · Listening Challenge
          </p>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-3xl text-strong">
            <span lang="en">{level.title}</span> <CefrBadge level={level.id} />
          </h1>
          <p className="text-lg">
            {/[.!?]$/.test(level.titleEs) ? level.titleEs : `${level.titleEs}.`} {level.context}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Temas">
            {level.topics.map((t) => (
              <li
                key={t}
                className="rounded-full bg-teal/25 px-3 py-1 text-sm font-bold text-strong"
              >
                {t}
              </li>
            ))}
          </ul>
          <ol className="list-inside list-decimal space-y-1">
            <li>Escucha el audio (puedes repetirlo cuantas veces quieras).</li>
            <li>Si lo necesitas, abre la transcripción como ayuda.</li>
            <li>Responde las 4 preguntas. ¡Cada acierto suma XP!</li>
          </ol>
          <p className="text-sm text-ui-gray">
            Hasta {level.xp} XP + bonus de racha · 70 % para 2 estrellas · 90 % para 3. Sin límite
            de tiempo.
          </p>
          <Button size="lg" variant="teal" onClick={() => setScreen("play")}>
            <Play aria-hidden /> Comenzar
          </Button>
        </div>
      </section>
    );

  return (
    <section className="space-y-6">
      <header className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1
            ref={heading}
            tabIndex={-1}
            className="flex items-center gap-2 font-display text-2xl text-strong"
          >
            <span lang="en">{level.title}</span> <CefrBadge level={level.id} className="text-xs" />
          </h1>
          <span className="font-bold text-strong">
            {answered}/{total} respondidas · Racha {streak}
          </span>
        </div>
        <ProgressBar
          value={percent(answered, total)}
          color="var(--ludik-teal)"
          label="Preguntas respondidas"
        />
      </header>

      {/* Reproductor con Echo asomándose */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-teal bg-card p-5 pb-6 shadow-card sm:pr-44">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-strong">
          <Ear aria-hidden className="size-6 text-ink-teal" /> Escucha con atención
        </h2>
        <p className="mt-1 text-ui-gray">Puedes pausar, retroceder y repetir el audio.</p>
        <audio
          controls
          preload="metadata"
          className="mt-4 w-full"
          aria-label={`Audio del nivel ${level.id}: ${level.title}`}
        >
          <source src={AUDIO[level.id]} type="audio/mpeg" />
          Tu navegador no puede reproducir audio. Usa la transcripción.
        </audio>
        <details className="mt-4 rounded-2xl bg-muted p-4">
          <summary className="cursor-pointer font-bold text-strong">
            Ver transcripción (ayuda)
          </summary>
          <dl lang="en" className="mt-3 space-y-2">
            {level.script.map((line, i) => (
              <div key={i} className="grid gap-1 sm:grid-cols-[6rem_1fr]">
                <dt className="font-extrabold text-ink-teal">{line.speaker}</dt>
                <dd>{line.text}</dd>
              </div>
            ))}
          </dl>
        </details>
        <CharacterArt
          id="echo"
          mood="neutral"
          decorative
          className="pointer-events-none absolute -bottom-6 right-2 hidden w-40 sm:block"
        />
      </div>

      <ol className="space-y-5">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            q={q}
            answer={answers[i]}
            onSubmit={(p) => submit(i, p)}
          />
        ))}
      </ol>

      {done && (
        <div
          role="status"
          className="animate-pop-in flex flex-wrap items-center gap-5 rounded-3xl border-2 border-teal bg-success-soft p-6"
        >
          <CharacterArt id="echo" mood="feliz" decorative className="w-24" />
          <div className="min-w-0 flex-1 basis-60">
            <p className="font-display text-2xl text-strong">¡Nivel completado!</p>
            <p className="mt-1 flex flex-wrap gap-4 font-bold text-strong">
              <span className="inline-flex items-center gap-1">
                <Sparkles aria-hidden className="size-5 text-ink-blue" /> +{xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Coins aria-hidden className="size-5 text-ink-yellow" /> +{coins} monedas
              </span>
              <span className="inline-flex items-center gap-1">
                <Award aria-hidden className="size-5 text-ink-teal" />{" "}
                {stars >= 2 ? level.badge : "Insignia: casi"}
              </span>
            </p>
          </div>
          <Button
            variant="teal"
            onClick={() => {
              setSeconds(elapsed());
              setScreen("results");
            }}
          >
            Ver resultados
          </Button>
        </div>
      )}
      <LiveRegion message={live} />
    </section>
  );
}

function QuestionCard({
  index,
  q,
  answer,
  onSubmit,
}: {
  index: number;
  q: ListeningQuestion;
  answer: Answer | undefined;
  onSubmit(picked: string[]): void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const locked = !!answer;
  const titleId = `q-${index}-title`;
  return (
    <li className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm font-extrabold uppercase tracking-wide text-ink-teal">
        {index + 1}. {KIND_LABEL[index]}
      </p>
      <h3 id={titleId} lang="en" className="mt-1 text-xl font-extrabold text-strong">
        {q.prompt}
      </h3>
      <p className="text-ui-gray">{q.promptEs}</p>

      <div
        role={q.kind === "multi" ? "group" : "radiogroup"}
        aria-labelledby={titleId}
        className={cn(
          "mt-4 grid gap-3",
          q.options.length > 3 ? "sm:grid-cols-3" : "sm:grid-cols-1",
        )}
      >
        {q.options.map((o) => {
          const isPicked = locked ? answer.picked.includes(o) : picked.includes(o);
          const isRight = q.answer.includes(o);
          const state = !locked ? "idle" : isRight ? "right" : isPicked ? "wrong" : "idle";
          return (
            <button
              key={o}
              lang="en"
              type="button"
              role={q.kind === "multi" ? "checkbox" : "radio"}
              aria-checked={isPicked}
              disabled={locked}
              onClick={() => {
                if (q.kind === "single") onSubmit([o]);
                else setPicked((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
              }}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-2xl border-2 p-3 text-left font-bold transition-colors",
                state === "right" && "border-success bg-success-soft text-strong",
                state === "wrong" && "border-destructive bg-warning-soft text-strong",
                state === "idle" &&
                  (isPicked
                    ? "border-teal bg-teal/20 text-strong"
                    : "border-border bg-muted hover:bg-accent"),
                locked && state === "idle" && "opacity-70",
              )}
            >
              {q.kind === "multi" && (
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded border-2 border-strong text-xs",
                    isPicked && "bg-strong text-card",
                  )}
                >
                  {isPicked ? "✓" : ""}
                </span>
              )}
              <span className="flex-1">{o}</span>
              {state === "right" && (
                <CheckCircle2 aria-label="correcta" className="size-5 text-success" />
              )}
              {state === "wrong" && (
                <XCircle
                  aria-label="tu respuesta, incorrecta"
                  className="size-5 text-destructive"
                />
              )}
            </button>
          );
        })}
      </div>

      {q.kind === "multi" && !locked && (
        <Button
          className="mt-4"
          variant="teal"
          disabled={picked.length === 0}
          onClick={() => onSubmit(picked)}
        >
          Comprobar
        </Button>
      )}

      {answer && (
        <p
          className={cn(
            "mt-4 flex items-start gap-2 rounded-2xl p-3 font-bold text-strong",
            answer.correct ? "bg-success-soft" : "bg-warning-soft",
          )}
        >
          {answer.correct ? (
            <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
          ) : (
            <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
          )}
          <span>
            {answer.correct ? "¡Correcto! +XP. " : "Escucha de nuevo. "}
            <span className="font-normal">{q.explanation}</span>
          </span>
        </p>
      )}
    </li>
  );
}
