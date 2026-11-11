/* ============================================================
 * Módulo Fono — "Eco de Voz" (Speaking, sección 14 · propuesto)
 * 3 etapas por misión: escucha y repite, lee en voz alta, responde.
 * Micrófono con reconocimiento del navegador (Web Speech API) o
 * modo autoevaluación (grabación local con MediaRecorder).
 * Sin presión de tiempo, subtítulos siempre visibles.
 * ============================================================ */
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Ear,
  Mic,
  MicOff,
  RefreshCw,
  ShieldCheck,
  Square,
  ThumbsUp,
  Turtle,
  Volume2,
} from "lucide-react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { CefrBadge, ProgressBar } from "@/components/ludik/bits";
import { cn } from "@/lib/utils";
import {
  LiveRegion,
  ResultsScreen,
  percent,
  speak,
  speechSupported,
  starsFor,
  useStopSpeechOnUnmount,
} from "@/modules/_shared/kit";
import { MISSIONS, STAGE_LABELS, type FonoMission, type SpeakItem } from "./content";
import {
  PASS_SCORE,
  bestOf,
  compareSentence,
  scoreAnswer,
  tipFor,
  type WordResult,
} from "./scoring";

/* ---------- Reconocimiento de voz (tipos mínimos) ---------- */
interface RecAlt {
  transcript: string;
}
interface RecEvent {
  results: ArrayLike<ArrayLike<RecAlt>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Mode = "mic" | "self";
interface Attempt {
  stage: number;
  score: number;
  topic: string;
}

export default function FonoVoiceEcho(props: ModuleProps) {
  const [run, setRun] = useState(0);
  const mission = MISSIONS.find((m) => m.id === props.levelId);
  if (!mission)
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-2xl">Misión no disponible</h1>
        <Button className="mt-4" onClick={props.onExit}>
          Volver al camino
        </Button>
      </section>
    );
  return (
    <Run
      key={`${mission.id}-${run}`}
      {...props}
      mission={mission}
      retry={() => setRun((r) => r + 1)}
    />
  );
}

function Run(props: ModuleProps & { mission: FonoMission; retry: () => void }) {
  const { mission } = props;
  useStopSpeechOnUnmount();
  const [screen, setScreen] = useState<"start" | "play" | "results">("start");
  const [mode, setMode] = useState<Mode>("self");
  const [hasRecognition, setHasRecognition] = useState(false);
  const [stage, setStage] = useState(0);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  const started = useRef(0);
  const sent = useRef(false);

  useEffect(() => setHasRecognition(getRecognitionCtor() !== null), []);

  const items = mission.stages[stage] as SpeakItem[];
  const item = items[index];
  const total = mission.stages.reduce((n, s) => n + s.length, 0);
  const done = attempts.length;
  const avg = attempts.length
    ? Math.round(attempts.reduce((a, x) => a + x.score, 0) / attempts.length)
    : 0;
  const correct = attempts.filter((a) => a.score >= PASS_SCORE).length;
  const score = avg;
  const stars = starsFor(score);
  const xp = Math.round((mission.xp * score) / 100);
  const coins = stars * 5;
  const failedTopics = [...new Set(attempts.filter((a) => a.score < 90).map((a) => a.topic))];

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

  function record(scoreValue: number, topic: string) {
    setAttempts((a) => [...a, { stage, score: scoreValue, topic }]);
    if (index + 1 < items.length) setIndex((i) => i + 1);
    else if (stage < 2) {
      setStage((s) => s + 1);
      setIndex(0);
    } else {
      setSeconds(Math.round((Date.now() - started.current) / 1000));
      setScreen("results");
    }
  }

  if (screen === "results")
    return (
      <ResultsScreen
        skillId="fono"
        levelLabel={mission.cefr}
        title="¡Tu voz brilla!"
        score={score}
        stars={stars}
        xp={xp}
        coins={coins}
        timeSeconds={seconds}
        stages={mission.stages.map((s, i) => ({
          label: STAGE_LABELS[i] ?? "",
          correct: attempts.filter((a) => a.stage === i && a.score >= PASS_SCORE).length,
          total: s.length,
        }))}
        failedTopics={failedTopics}
        note={
          mode === "self"
            ? "Puntaje por autoevaluación: tú decides con honestidad cómo te salió. ¡Eso también es aprender!"
            : "Puntaje calculado por coincidencia de palabras (sin IA)."
        }
        onRetry={props.retry}
        onNext={props.onNext}
        onExit={props.onExit}
      />
    );

  if (screen === "start")
    return (
      <section className="grid items-center gap-6 rounded-3xl border border-border bg-card p-6 shadow-card sm:grid-cols-[1fr_2fr] sm:p-10">
        <span className="spotlight mx-auto rounded-3xl px-4 pt-2">
          <CharacterArt id="fono" mood="feliz" decorative className="w-44 sm:w-56" />
        </span>
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-2 font-bold text-ink-blue">
            ¡Hola! Soy Fono y me encanta escucharte.{" "}
            <CefrBadge level={mission.cefr} className="text-xs" />
          </p>
          <h1 className="font-display text-3xl text-strong">{mission.title}</h1>
          <ol className="grid gap-2 sm:grid-cols-3">
            {STAGE_LABELS.map((l, i) => (
              <li key={l} className="rounded-2xl bg-blue/15 p-3 font-bold text-strong">
                <span className="mr-1 inline-flex size-6 items-center justify-center rounded-full bg-blue text-sm">
                  {i + 1}
                </span>
                {l}
              </li>
            ))}
          </ol>
          <p>
            Sin límite de tiempo. Puedes escuchar el modelo las veces que quieras y repetir cada
            frase.
          </p>

          <fieldset className="space-y-2">
            <legend className="font-extrabold text-strong">¿Cómo quieres practicar?</legend>
            <ModeOption
              checked={mode === "mic"}
              disabled={!hasRecognition}
              onSelect={() => setMode("mic")}
              icon={<Mic aria-hidden className="size-5" />}
              title="Con micrófono: Fono te escucha"
              text={
                hasRecognition
                  ? "Tu navegador convierte tu voz en texto y Fono compara las palabras. Ludik no guarda tu audio, pero el navegador puede usar su servicio de voz en internet."
                  : "Tu navegador no tiene reconocimiento de voz. Usa la autoevaluación."
              }
            />
            <ModeOption
              checked={mode === "self"}
              onSelect={() => setMode("self")}
              icon={<ShieldCheck aria-hidden className="size-5" />}
              title="Autoevaluación (privado)"
              text="Grabas tu voz solo en este dispositivo, la escuchas y comparas con el modelo. Nada sale de tu equipo."
            />
          </fieldset>
          <Button
            size="lg"
            variant="blue"
            onClick={() => {
              started.current = Date.now();
              setScreen("play");
            }}
          >
            ¡Empezar!
          </Button>
        </div>
      </section>
    );

  if (!item) return null;

  return (
    <section className="space-y-5">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
          <span>
            Etapa {stage + 1} de 3 · {index + 1}/{items.length}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-ui-gray">
            {mode === "mic" ? (
              <Mic aria-hidden className="size-4" />
            ) : (
              <ShieldCheck aria-hidden className="size-4" />
            )}
            {mode === "mic" ? "Micrófono" : "Autoevaluación"}
          </span>
        </div>
        <ProgressBar
          value={percent(done, total)}
          color="var(--ludik-blue)"
          label="Avance de la misión"
        />
      </div>
      {notice && (
        <p role="status" className="rounded-2xl bg-warning-soft p-3 font-bold text-strong">
          {notice}
        </p>
      )}
      <SpeakCard
        key={`${stage}-${index}`}
        item={item}
        stageLabel={STAGE_LABELS[stage] ?? ""}
        mode={mode}
        reducedMotion={props.reducedMotion}
        onFallback={(msg) => {
          setMode("self");
          setNotice(msg);
        }}
        onDone={record}
      />
    </section>
  );
}

function ModeOption({
  checked,
  disabled,
  onSelect,
  icon,
  title,
  text,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect(): void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-2xl border-2 p-3 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cobalt",
        checked ? "border-blue bg-blue/15" : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="radio"
        name="fono-mode"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue text-strong">
        {icon}
      </span>
      <span>
        <span className="flex items-center gap-1 font-extrabold text-strong">
          {checked && <CheckCircle2 aria-hidden className="size-4 text-ink-blue" />} {title}
        </span>
        <span className="text-sm">{text}</span>
      </span>
    </label>
  );
}

/* ============================================================
 * Tarjeta de práctica de una frase
 * ============================================================ */
function SpeakCard({
  item,
  stageLabel,
  mode,
  reducedMotion,
  onFallback,
  onDone,
}: {
  item: SpeakItem;
  stageLabel: string;
  mode: Mode;
  reducedMotion: boolean;
  onFallback(msg: string): void;
  onDone(score: number, topic: string): void;
}) {
  useStopSpeechOnUnmount();
  const modelText = item.kind === "answer" ? item.sample : item.text;
  const spoken = item.kind === "answer" ? item.question : item.text;
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; words: WordResult[] } | null>(null);
  const [recording, setRecording] = useState(false);
  const [pendingRecording, setPendingRecording] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const pending = useRef(false);
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const tts = speechSupported();

  useEffect(() => {
    heading.current?.focus();
    if (item.kind === "read") return undefined;
    const t = window.setTimeout(() => speak(spoken, { rate: 0.9 }), 400);
    return () => window.clearTimeout(t);
  }, [item, spoken]);

  // Al salir de la tarjeta: detener micrófono y grabación.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const rec = recRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      }
      if (recordingTimer.current !== null) clearTimeout(recordingTimer.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    };
  }, []);

  // Liberar la grabación anterior cuando se reemplaza.
  useEffect(
    () => () => {
      if (clip && clip !== "none") URL.revokeObjectURL(clip);
    },
    [clip],
  );

  function evaluate(alternatives: string[]) {
    const scored = alternatives.map((t) => {
      if (item.kind === "answer") {
        const r = scoreAnswer(item.keywords, t);
        const words: WordResult[] = item.keywords.map((g, i) => ({
          word: g[0] ?? "",
          ok: r.found[i] ?? false,
        }));
        return { text: t, score: r.score, words };
      }
      return { text: t, ...compareSentence(item.text, t) };
    });
    const best = bestOf(scored);
    if (!best) return;
    setHeard(best.text);
    setResult({ score: best.score, words: best.words });
    setLive(`Fono escuchó: ${best.text}. Puntaje ${best.score}.`);
  }

  function startMic() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onFallback("Tu navegador no tiene reconocimiento de voz. Cambiamos a autoevaluación.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      const first = e.results[0];
      const alts: string[] = [];
      if (first) for (let i = 0; i < first.length; i++) alts.push(first[i]?.transcript ?? "");
      evaluate(alts.filter(Boolean));
    };
    rec.onerror = (e) => {
      setListening(false);
      if (
        e.error === "not-allowed" ||
        e.error === "service-not-allowed" ||
        e.error === "audio-capture"
      )
        onFallback("No pudimos usar el micrófono. Sin problema: sigue con la autoevaluación.");
      else if (e.error === "no-speech")
        setLive("No te escuché. Acércate un poco y vuelve a intentarlo.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setHeard(null);
    setResult(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  async function toggleRecording() {
    if (pending.current) return;
    if (recording) {
      mediaRef.current?.stop();
      return;
    }
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setLive("Tu equipo no permite grabar. Dilo en voz alta y califícate.");
      setClip("none");
      return;
    }
    pending.current = true;
    setPendingRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        if (recordingTimer.current !== null) clearTimeout(recordingTimer.current);
        stream.getTracks().forEach((t) => t.stop());
        if (!mounted.current) return;
        setRecording(false);
        setClip(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })));
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      // Evita que el micrófono quede encendido si el estudiante olvida detenerlo.
      recordingTimer.current = setTimeout(() => {
        if (mr.state === "recording") mr.stop();
      }, 20000);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (!mounted.current) return;
      setLive("No pudimos usar el micrófono. Dilo en voz alta y califícate.");
      setClip("none");
    } finally {
      pending.current = false;
      if (mounted.current) setPendingRecording(false);
    }
  }

  const missed = result?.words.filter((w) => !w.ok).map((w) => w.word) ?? [];
  const tip = result ? tipFor(missed) : null;
  const topicFor = (score: number) =>
    score >= 90 ? stageLabel : tip ? `pronunciación de ${tip.sound}` : stageLabel.toLowerCase();

  return (
    <article className="grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-card sm:grid-cols-[auto_1fr] sm:p-8">
      <div className="flex flex-col items-center gap-2">
        <span
          className={cn("rounded-full p-2", listening || recording ? "bg-blue/25" : "bg-blue/10")}
        >
          <CharacterArt
            id="fono"
            mood={
              result
                ? result.score >= PASS_SCORE
                  ? "feliz"
                  : "animando"
                : listening || recording
                  ? "pensando"
                  : "neutral"
            }
            decorative
            className={cn(
              "w-28 sm:w-36",
              (listening || recording) && !reducedMotion && "animate-wiggle",
            )}
          />
        </span>
        {(listening || recording) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue px-3 py-1 text-sm font-extrabold text-strong">
            <Ear aria-hidden className="size-4" /> {listening ? "Te escucho…" : "Grabando…"}
          </span>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        <p className="text-sm font-extrabold uppercase tracking-wide text-ink-blue">{stageLabel}</p>
        <h2
          ref={heading}
          tabIndex={-1}
          lang="en"
          className="font-display text-2xl text-strong sm:text-3xl"
        >
          {item.kind === "answer" ? item.question : item.text}
        </h2>
        <p className="text-foreground">
          <span className="sr-only">Traducción: </span>
          {item.es}
        </p>
        {item.kind === "answer" && (
          <p className="rounded-2xl bg-muted p-3 text-sm">
            Responde con tus palabras. Ejemplo:{" "}
            <span lang="en" className="font-bold text-strong">
              “{item.sample}”
            </span>
          </p>
        )}
        {item.kind === "read" && (
          <p className="text-sm text-ui-gray">
            Léela tú primero. Si quieres, escucha el modelo después.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => speak(spoken, { rate: 0.9 })} disabled={!tts}>
            <Volume2 aria-hidden />{" "}
            {item.kind === "answer" ? "Escuchar pregunta" : "Escuchar modelo"}
          </Button>
          <Button variant="outline" onClick={() => speak(modelText, { rate: 0.6 })} disabled={!tts}>
            <Turtle aria-hidden /> {item.kind === "answer" ? "Ejemplo despacio" : "Más despacio"}
          </Button>
        </div>
        {!tts && (
          <p className="text-sm font-bold text-strong">
            Tu navegador no puede leer en voz alta: guíate por el texto.
          </p>
        )}

        {/* ---------- Micrófono ---------- */}
        {mode === "mic" && (
          <div className="space-y-3">
            <Button
              size="lg"
              variant="blue"
              onClick={listening ? () => recRef.current?.stop() : startMic}
            >
              {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}{" "}
              {listening ? "Detener" : heard ? "Intentar otra vez" : "Hablar"}
            </Button>
            {result && (
              <div
                className={cn(
                  "space-y-3 rounded-2xl border-2 p-4",
                  result.score >= PASS_SCORE
                    ? "border-success bg-success-soft"
                    : "border-warning bg-warning-soft",
                )}
                role="status"
              >
                <p className="font-extrabold text-strong">
                  {result.score >= 90
                    ? "¡Perfecto!"
                    : result.score >= PASS_SCORE
                      ? "¡Muy bien!"
                      : "¡Casi! Vamos otra vez."}{" "}
                  {result.score}/100
                </p>
                <p className="text-sm">
                  Fono escuchó:{" "}
                  <span lang="en" className="font-bold text-strong">
                    “{heard}”
                  </span>
                </p>
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label={item.kind === "answer" ? "Ideas clave" : "Palabras"}
                >
                  {result.words.map((w, i) => (
                    <li
                      key={`${w.word}-${i}`}
                      lang="en"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-strong",
                        w.ok ? "bg-card" : "bg-salmon/40",
                      )}
                    >
                      {w.ok ? (
                        <CheckCircle2 aria-hidden className="size-4 text-success" />
                      ) : (
                        <RefreshCw aria-hidden className="size-4 text-ink-salmon" />
                      )}
                      {w.word}
                      <span className="sr-only">{w.ok ? " (bien)" : " (por mejorar)"}</span>
                    </li>
                  ))}
                </ul>
                {tip && result.score < 100 && (
                  <p className="text-sm font-bold text-strong">{tip.tip}</p>
                )}
                <Button onClick={() => onDone(result.score, topicFor(result.score))}>
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ---------- Autoevaluación ---------- */}
        {mode === "self" && (
          <div className="space-y-3">
            {clip !== "none" && (
              <Button size="lg" variant="blue" onClick={toggleRecording} disabled={pendingRecording}>
                {recording ? <Square aria-hidden /> : <Mic aria-hidden />}{" "}
                {pendingRecording ? "Esperando micrófono…" : recording ? "Terminar grabación" : clip ? "Grabar otra vez" : "Grabar mi voz"}
              </Button>
            )}
            {clip && clip !== "none" && (
              <div className="rounded-2xl bg-muted p-3">
                <p className="text-sm font-bold text-strong">Escúchate y compara con el modelo:</p>
                <audio controls src={clip} className="mt-2 w-full">
                  <track kind="captions" />
                </audio>
              </div>
            )}
            {!recording && !pendingRecording && (
              <div className="rounded-2xl border border-border p-3">
                <p className="font-extrabold text-strong">¿Cómo te salió?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="teal" onClick={() => onDone(100, stageLabel)}>
                    <ThumbsUp aria-hidden /> Lo dije bien
                  </Button>
                  <Button
                    variant="yellow"
                    onClick={() => onDone(65, `${stageLabel.toLowerCase()} (repasar)`)}
                  >
                    Más o menos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setClip(null);
                      speak(modelText, { rate: 0.8 });
                    }}
                  >
                    <RefreshCw aria-hidden /> Quiero repetir
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <LiveRegion message={live} />
      </div>
    </article>
  );
}
