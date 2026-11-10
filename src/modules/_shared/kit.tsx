/* ============================================================
 * Kit compartido de módulos (Fases 4–8)
 * Piezas comunes para que todos los minijuegos se sientan Ludik:
 * pantalla de resultados, voz del navegador (TTS) y utilidades.
 * Los módulos NO conocen el router ni el store: solo usan ModuleProps.
 * ============================================================ */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Home, RotateCcw, Sparkles, Coins, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { CefrBadge, Stars } from "@/components/ludik/bits";
import { CHARACTERS } from "@/data/characters";
import { starsFor } from "@/services/rules";
import type { SkillId } from "@/types/ludik";

export { starsFor };

/** Porcentaje entero seguro (0 si total = 0). */
export const percent = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) : 0;

/** Segundos transcurridos desde que se montó el módulo. */
export function useElapsed() {
  const start = useRef(Date.now());
  return useCallback(() => Math.round((Date.now() - start.current) / 1000), []);
}

/** Baraja una copia del arreglo (Fisher–Yates). */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

/* ---------- Voz del navegador (Web Speech API · síntesis) ---------- */

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Lee un texto en voz alta con una voz del idioma indicado. Devuelve false si no hay soporte. */
export function speak(
  text: string,
  opts: { lang?: string; rate?: number; onEnd?: () => void } = {},
) {
  if (!speechSupported()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const lang = opts.lang ?? "en-US";
  u.lang = lang;
  u.rate = opts.rate ?? 0.95;
  const voice = synth
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
  if (voice) u.voice = voice;
  if (opts.onEnd) u.onend = opts.onEnd;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Detiene cualquier lectura pendiente al desmontar el módulo. */
export function useStopSpeechOnUnmount() {
  useEffect(() => () => stopSpeaking(), []);
}

/* ---------- Región aria-live para anunciar cambios ---------- */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p aria-live="polite" role="status" className="sr-only">
      {message}
    </p>
  );
}

/* ---------- Pantalla de resultados común ---------- */

export interface StageSummary {
  label: string;
  correct: number;
  total: number;
}

export function ResultsScreen({
  skillId,
  levelLabel,
  title = "¡Misión completada!",
  score,
  stars,
  xp,
  coins,
  timeSeconds,
  stages,
  failedTopics,
  note,
  onRetry,
  onNext,
  nextLabel = "Siguiente nivel",
  onExit,
  children,
}: {
  skillId: SkillId;
  levelLabel: string;
  title?: string;
  score: number;
  stars: number;
  xp: number;
  coins?: number;
  timeSeconds?: number;
  stages: StageSummary[];
  failedTopics: string[];
  note?: string;
  onRetry(): void;
  onNext?: (() => void) | undefined;
  nextLabel?: string;
  onExit(): void;
  children?: ReactNode;
}) {
  const c = CHARACTERS[skillId];
  const mins = timeSeconds !== undefined ? Math.floor(timeSeconds / 60) : null;
  const secs = timeSeconds !== undefined ? timeSeconds % 60 : null;
  return (
    <section
      aria-labelledby="results-title"
      className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-8"
    >
      <span className="spotlight inline-block rounded-2xl px-6 pt-2">
        <CharacterArt
          id={skillId}
          mood={stars >= 2 ? "feliz" : "animando"}
          decorative
          className="size-32"
        />
      </span>
      <h2 id="results-title" className="mt-3 font-display text-3xl text-strong">
        {title}
      </h2>
      <p className="mt-1 flex items-center justify-center gap-2 text-lg">
        {c.name} · <CefrBadge level={levelLabel} className="text-xs" />
      </p>
      <div className="mt-4 flex justify-center">
        <Stars count={stars} />
      </div>
      <p className="mt-2 text-lg font-bold text-strong" aria-live="polite">
        Puntaje: {score}%
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted p-3">
          <dt className="flex items-center justify-center gap-1 text-sm font-bold text-ui-gray">
            <Sparkles aria-hidden className="size-4 text-ink-blue" /> XP
          </dt>
          <dd className="font-display text-2xl text-strong">+{xp}</dd>
        </div>
        {coins !== undefined && (
          <div className="rounded-2xl bg-muted p-3">
            <dt className="flex items-center justify-center gap-1 text-sm font-bold text-ui-gray">
              <Coins aria-hidden className="size-4 text-ink-yellow" /> Monedas
            </dt>
            <dd className="font-display text-2xl text-strong">+{coins}</dd>
          </div>
        )}
        {mins !== null && secs !== null && (
          <div className="col-span-2 rounded-2xl bg-muted p-3 sm:col-span-1">
            <dt className="flex items-center justify-center gap-1 text-sm font-bold text-ui-gray">
              <Clock aria-hidden className="size-4" /> Tiempo
            </dt>
            <dd className="font-display text-2xl text-strong">
              {mins}:{String(secs).padStart(2, "0")}
            </dd>
          </div>
        )}
      </dl>

      {stages.length > 0 && (
        <div className="mt-5 text-left">
          <h3 className="font-extrabold text-strong">Resumen por etapa</h3>
          <ul className="mt-2 space-y-2">
            {stages.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
              >
                <span className="flex items-center gap-2 font-bold text-strong">
                  <CheckCircle2 aria-hidden className="size-5 text-success" /> {s.label}
                </span>
                <span className="font-extrabold text-strong">
                  {s.correct}/{s.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 rounded-2xl bg-accent px-4 py-3 text-left font-bold text-strong">
        {failedTopics.length
          ? `Repasa: ${failedTopics.slice(0, 3).join(", ")}.`
          : "¡Todo perfecto! Sigue así."}
      </p>
      {note && <p className="mt-3 text-sm text-ui-gray">{note}</p>}
      {children}

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw aria-hidden /> Repetir
        </Button>
        {onNext && (
          <Button onClick={onNext}>
            {nextLabel} <ArrowRight aria-hidden />
          </Button>
        )}
        <Button variant="secondary" onClick={onExit}>
          <Home aria-hidden /> Volver al camino
        </Button>
      </div>
    </section>
  );
}

/** Pequeño hook para "tic" de estado de reproducción/escucha. */
export function useToggle(initial = false) {
  const [v, setV] = useState(initial);
  return [v, () => setV((x) => !x), setV] as const;
}
