import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { LiveRegion, ResultsScreen, percent, starsFor } from "@/modules/_shared/kit";
import { BANKS, type InkLevel } from "./content";
import { createRun, submit, tick, type Pace } from "./engine";
import "./ink.css";

export default function EnglishInk(props: ModuleProps) {
  const level: InkLevel = props.levelId === "A2" ? "A2" : props.levelId === "B1" ? "B1" : "A1";
  const bank = BANKS[level];
  const [screen, setScreen] = useState<"welcome" | "play" | "pause" | "results">("welcome");
  const [pace, setPace] = useState<Pace>("normal");
  const [run, setRun] = useState(() => createRun(12));
  const live = useRef(run);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [review, setReview] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const reported = useRef(false);
  const screenRef = useRef(screen);
  screenRef.current = screen;
  function start() {
    const fresh = createRun(8 + Math.random() * 10);
    live.current = fresh;
    setRun(fresh);
    reported.current = false;
    setText("");
    setReview(false);
    setScreen("play");
  }
  function commit(next: typeof run) {
    live.current = next;
    setRun(next);
    if (next.done) setScreen("results");
  }
  // El reloj excluye las pausas y las pestañas ocultas.
  useEffect(() => {
    if (screen !== "play") return;
    input.current?.focus();
    let previous: number | null = null;
    let frame = 0;
    function animate(now: number) {
      if (previous !== null && !document.hidden && screenRef.current === "play")
        commit(tick(live.current, (now - previous) / 1000, bank, pace));
      previous = now;
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [screen, bank, pace]);
  useEffect(() => {
    function hidden() {
      if (document.hidden && screenRef.current === "play") {
        screenRef.current = "pause";
        setScreen("pause");
      }
    }
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  useEffect(() => {
    if (screen === "pause") continueButton.current?.focus();
  }, [screen]);
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setTyping(false), 500);
    return () => clearTimeout(timer);
  }, [typing]);
  const score = percent(run.correct.length, 20);
  const stars = starsFor(score);
  const xp =
    Math.round(({ A1: 60, A2: 80, B1: 100 }[level] * score) / 100) +
    Math.min(15, Math.floor(run.points / 300));
  const coins = Math.floor(run.points / 200);
  const failedTopics = [...new Set(run.missed.map((p) => p.topic))];
  useEffect(() => {
    if (screen !== "results" || reported.current) return;
    reported.current = true;
    props.onComplete({
      moduleId: props.moduleId,
      levelId: props.levelId,
      stage: level,
      score,
      xp,
      coins,
      stars,
      correct: run.correct.length,
      total: 20,
      timeSeconds: Math.round(run.elapsed),
      failedTopics: [...new Set(run.missed.map((p) => p.topic))],
      completed: true,
    });
  }, [screen, props, run, level, score, xp, coins, stars]);
  function answer(event: FormEvent) {
    event.preventDefault();
    commit(submit(live.current, text, bank));
    setText("");
    input.current?.focus();
  }
  const effect = run.elapsed < run.effectUntil ? run.effect : "";
  const proximity = Math.max(0, ...run.active.map((a) => a.age / a.duration));
  if (screen === "results")
    return (
      <ResultsScreen
        skillId={props.skillId}
        levelLabel={level}
        title={run.lives === 0 ? "¡Buen intento!" : "¡Excelente trabajo!"}
        score={score}
        stars={stars}
        xp={xp}
        coins={coins}
        timeSeconds={Math.round(run.elapsed)}
        stages={[
          {
            label: "Primeras páginas",
            correct: bank.slice(0, 5).filter((p) => run.correct.includes(p.id)).length,
            total: 5,
          },
          {
            label: "Más tinta",
            correct: bank.slice(5).filter((p) => run.correct.includes(p.id)).length,
            total: 15,
          },
        ]}
        failedTopics={failedTopics}
        note="Cada página es una oportunidad para aprender. Las páginas despejadas con INK no cuentan como aciertos."
        onRetry={start}
        onNext={props.onNext}
        onExit={props.onExit}
      >
        <div className="mt-4 text-left">
          <p>
            Puntos de tinta: {run.points} · Mejor racha: {run.best}
          </p>
          <p>
            Corregidas: {run.correct.length} · No corregidas: {20 - run.correct.length} · INK:{" "}
            {run.swept}
          </p>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => setReview(!review)}
            aria-expanded={review}
          >
            Revisar mis errores
          </Button>
          {review && (
            <div className="mt-3 space-y-3">
              {run.missed.length === 0 ? (
                <p>No hay errores pendientes de repaso.</p>
              ) : (
                run.missed.map((p) => (
                  <article key={p.id} className="rounded-2xl border border-border p-4">
                    <p lang="en">
                      <s>{p.wrong}</s>
                    </p>
                    <p lang="en" className="font-bold">
                      ✓ {p.right}
                    </p>
                    <p>
                      {p.topic}: {p.explanation}
                    </p>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
      </ResultsScreen>
    );
  return (
    <section
      className="english-ink rounded-3xl"
      data-reduced={props.reducedMotion}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (screen === "play") setScreen("pause");
          else if (screen === "pause") setScreen("play");
        }
      }}
      aria-label="English Ink"
    >
      {screen === "welcome" ? (
        <div className="ink-welcome">
          <p className="ink-eyebrow">EL TALLER DE TINTA · {level}</p>
          <CharacterArt id="tinta" mood="feliz" decorative className="mx-auto size-36" />
          <h1>ENGLISH INK</h1>
          <p className="ink-quote" lang="en">
            Every mistake leaves a mark.
            <br />
            Every correction makes you better.
          </p>
          <p>
            Corrige las frases en inglés antes de que desaparezcan entre las páginas. Aprende,
            mejora tu precisión y demuestra cuánto sabes.
          </p>
          <h2 className="mt-6 font-bold">¿CÓMO SE JUEGA?</h2>
          <ol className="ink-steps">
            <li>
              <b>01 · LEE</b>Observa las frases.
            </li>
            <li>
              <b>02 · CORRIGE</b>Escribe y pulsa Enter.
            </li>
            <li>
              <b>03 · SIGUE</b>Evita el borde inferior.
            </li>
            <li>
              <b>04 · APRENDE</b>Repasa al terminar.
            </li>
          </ol>
          <p>
            20 frases · 3 vidas · +100 por corrección · Escribe INK cuando aparezca para activar un
            poder de un solo uso.
          </p>
          <label className="mt-5 block font-bold" htmlFor="ink-pace">
            Tu ritmo de escritura
          </label>
          <select id="ink-pace" value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
            <option value="normal">Clásico · 6,5 s / 4,5 s</option>
            <option value="slow">Tranquilo · triple de tiempo</option>
            <option value="untimed">Sin presión de tiempo</option>
          </select>
          <p className="mt-2">
            Se ignoran mayúsculas y espacios extra. Conserva la puntuación de la frase.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={start}>COMENZAR A JUGAR</Button>
            <Button variant="outline" onClick={props.onExit}>
              Volver al camino
            </Button>
          </div>
        </div>
      ) : screen === "pause" ? (
        <div className="ink-welcome" aria-labelledby="ink-pause-title">
          <p className="ink-eyebrow">UNA PAUSA ENTRE PÁGINAS</p>
          <h2 id="ink-pause-title">Tu tinta puede esperar</h2>
          <p>El reloj y todas las frases están detenidos. Continúa cuando quieras.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button ref={continueButton} onClick={() => setScreen("play")}>
              CONTINUAR
            </Button>
            <Button variant="outline" onClick={start}>
              REINICIAR PARTIDA
            </Button>
            <Button variant="outline" onClick={props.onExit}>
              SALIR AL MENÚ
            </Button>
          </div>
        </div>
      ) : (
        <>
          <header className="ink-header">
            <div>
              <p className="ink-eyebrow">TALLER DE ESCRITURA · {level}</p>
              <h1>ENGLISH INK</h1>
            </div>
            <Button variant="outline" onClick={() => setScreen("pause")}>
              Pausa · Esc
            </Button>
          </header>
          <div className="ink-stats">
            <span>Páginas {run.correct.length + run.missed.length + run.swept}/20</span>
            <span aria-label={`${run.lives} vidas de 3`}>
              {"♥".repeat(run.lives)}
              {"♡".repeat(3 - run.lives)} · {run.lives} vidas
            </span>
            <span>{run.points} puntos</span>
            <span>
              Racha ×{run.streak} {run.streak >= 6 ? "· ¡EN RACHA!" : ""}
            </span>
          </div>
          <div className={`ink-arena ${typing ? "ink-typing" : ""}`} aria-label="Frases activas">
            {run.active.map((a) => (
              <article
                key={a.phrase.id}
                className="ink-slip"
                style={{
                  top: `${props.reducedMotion ? a.lane * 24 : Math.min(82, (a.age / a.duration) * 82)}%`,
                  left: `${props.reducedMotion ? 0 : a.lane * 2}%`,
                  zIndex: a.lane + 1,
                }}
              >
                <span className="ink-number">{a.phrase.id}</span>
                <p lang="en">{a.phrase.wrong}</p>
                {props.reducedMotion && (
                  <span className="ink-time">
                    {pace === "untimed"
                      ? "Sin límite"
                      : `${Math.ceil(a.duration - a.age)} s restantes`}
                  </span>
                )}
              </article>
            ))}
            {effect === "storm" && (
              <div className="ink-storm" aria-hidden="true">
                INK STORM!
              </div>
            )}
            {effect === "success" && (
              <span className="ink-trail" aria-hidden="true">
                ✦
              </span>
            )}
          </div>
          <div
            className="ink-writing"
            data-effect={effect}
            data-danger={proximity > 0.85 ? "high" : proximity > 0.65 ? "near" : "none"}
          >
            {!run.stormUsed && run.elapsed >= run.stormAt && (
              <p className="ink-power">
                ✦ Poder disponible: escribe <b lang="en">INK</b> para despejar las frases visibles
                (+150).
              </p>
            )}
            <p className="ink-warning">
              {proximity > 0.85
                ? "⚠ ¡Una página está por llegar!"
                : proximity > 0.65
                  ? "⚠ Una página se acerca al borde."
                  : pace === "untimed"
                    ? "Sin presión: tómate tu tiempo."
                    : "Corrige cualquier frase visible."}
            </p>
            <form onSubmit={answer}>
              <label htmlFor="ink-answer">Escribe la frase correcta en inglés</label>
              <div className="ink-input-row">
                <input
                  ref={input}
                  id="ink-answer"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTyping(true);
                  }}
                  placeholder="Write the correct sentence..."
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-describedby="ink-feedback"
                />
                <Button type="submit">CORREGIR</Button>
              </div>
            </form>
            <p id="ink-feedback" role="status" className="ink-feedback">
              {run.message}
            </p>
          </div>
          <LiveRegion
            message={`Frases visibles: ${run.active.map((a) => a.phrase.wrong).join(" ")} `}
          />
        </>
      )}
    </section>
  );
}
