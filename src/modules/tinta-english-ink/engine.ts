import { normalize, type Phrase } from "./content";
// Motor puro: un único reloj activo evita pérdidas de vida o puntos duplicados.
export interface Falling {
  phrase: Phrase;
  age: number;
  duration: number;
  lane: number;
}
export interface Run {
  active: Falling[];
  next: number;
  elapsed: number;
  spawn: number;
  lives: number;
  correct: string[];
  missed: Phrase[];
  swept: number;
  points: number;
  streak: number;
  best: number;
  stormAt: number;
  stormUsed: boolean;
  done: boolean;
  message: string;
  effect: string;
  effectUntil: number;
}
export type Pace = "normal" | "slow" | "untimed";
export function createRun(stormAt: number): Run {
  return {
    active: [],
    next: 0,
    elapsed: 0,
    spawn: 0,
    lives: 3,
    correct: [],
    missed: [],
    swept: 0,
    points: 0,
    streak: 0,
    best: 0,
    stormAt,
    stormUsed: false,
    done: false,
    message: "¡Lee y corrige la primera frase!",
    effect: "",
    effectUntil: 0,
  };
}
function finish(r: Run, bank: Phrase[]): Run {
  if (r.lives <= 0)
    return {
      ...r,
      done: true,
      missed: [...r.missed, ...r.active.map((a) => a.phrase), ...bank.slice(r.next)],
      active: [],
    };
  if (r.next === bank.length && r.active.length === 0)
    return { ...r, done: true, points: r.points + 300 };
  return r;
}
export function tick(run: Run, dt: number, bank: Phrase[], pace: Pace): Run {
  if (run.done) return run;
  let r = {
    ...run,
    elapsed: run.elapsed + dt,
    spawn: run.spawn - dt,
    active: run.active.map((a) => ({ ...a, age: pace === "untimed" ? 0 : a.age + dt })),
  };
  const expired = r.active.filter((a) => a.age >= a.duration);
  for (const a of expired) {
    r = {
      ...r,
      active: r.active.filter((b) => b.phrase.id !== a.phrase.id),
      missed: [...r.missed, a.phrase],
      lives: r.lives - 1,
      streak: 0,
      message: `Una página llegó al final. Quedan ${r.lives - 1} vidas; después podrás repasarla.`,
    };
    if (r.lives === 0) return finish(r, bank);
  }
  if (r.spawn <= 0 && r.active.length < 4) {
    const phrase = bank[r.next];
    if (phrase) {
      let lane = 0;
      while (r.active.some((a) => a.lane === lane)) lane++;
      r = {
        ...r,
        next: r.next + 1,
        spawn: 1.8,
        active: [
          ...r.active,
          {
            phrase,
            age: 0,
            duration: Math.max(r.next < 5 ? 18 : 14, phrase.right.length / 3 + 4) *
              (pace === "slow" ? 3 : 1),
            lane,
          },
        ],
      };
    }
  }
  return finish(r, bank);
}
export function submit(run: Run, text: string, bank: Phrase[]): Run {
  if (run.done || !text.trim()) return run;
  const value = normalize(text);
  if (value === "ink" && run.active.length > 0 && !run.stormUsed && run.elapsed >= run.stormAt)
    return finish(
      {
        ...run,
        active: [],
        swept: run.swept + run.active.length,
        points: run.points + 150,
        stormUsed: true,
        message: "✦ INK STORM! Páginas despejadas, sin contar como aciertos.",
        effect: "storm",
        effectUntil: run.elapsed + 3,
      },
      bank,
    );
  const match = run.active.find((a) => normalize(a.phrase.right) === value);
  if (!match)
    return {
      ...run,
      streak: 0,
      message: "✕ Try again! Revisa la frase y vuelve a intentarlo. No pierdes vidas.",
      effect: "error",
      effectUntil: run.elapsed + 0.6,
    };
  const streak = run.streak + 1;
  return finish(
    {
      ...run,
      active: run.active.filter((a) => a !== match),
      correct: [...run.correct, match.phrase.id],
      streak,
      best: Math.max(streak, run.best),
      points: run.points + 125 + Math.round(25 * (1 - match.age / match.duration)),
      message: "✓ ¡Correcto! " + match.phrase.right,
      effect: "success",
      effectUntil: run.elapsed + 3,
    },
    bank,
  );
}
