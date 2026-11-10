/* ============================================================
 * Fono · Eco de Voz — evaluación por reglas (sin IA ni APIs)
 * Coincidencia de palabras con tolerancia (sección 14).
 * ============================================================ */

/** Minúsculas, sin puntuación y contracciones expandidas. */
export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\b(i'm)\b/g, "i am")
    .replace(/\b(it's)\b/g, "it is")
    .replace(/\b(he's)\b/g, "he is")
    .replace(/\b(she's)\b/g, "she is")
    .replace(/\b(don't)\b/g, "do not")
    .replace(/\b(can't)\b/g, "cannot")
    .replace(/\b(i'd)\b/g, "i would")
    .replace(/\b(what's)\b/g, "what is")
    .replace(/\b(that's)\b/g, "that is")
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j] ?? 0;
      row[j] = Math.min(
        (row[j] ?? 0) + 1,
        (row[j - 1] ?? 0) + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[b.length] ?? 0;
}

/** Dos palabras "coinciden" si son iguales o casi (1 error en palabras de 4+ letras). */
export function wordsMatch(target: string, heard: string): boolean {
  if (target === heard) return true;
  if (target.length >= 4 && levenshtein(target, heard) <= 1) return true;
  return false;
}

export interface WordResult {
  word: string;
  ok: boolean;
}

/** Compara la frase modelo con lo reconocido: palabra a palabra, sin importar el orden exacto. */
export function compareSentence(
  target: string,
  heard: string,
): { score: number; words: WordResult[] } {
  const want = normalize(target);
  const got = normalize(heard);
  const pool = [...got];
  const words = want.map((w) => {
    const idx = pool.findIndex((h) => wordsMatch(w, h));
    if (idx >= 0) pool.splice(idx, 1);
    return { word: w, ok: idx >= 0 };
  });
  const ok = words.filter((w) => w.ok).length;
  return { score: want.length ? Math.round((ok / want.length) * 100) : 0, words };
}

/** Respuesta libre: cuenta qué grupos de palabras clave aparecen (cualquier sinónimo del grupo vale). */
export function scoreAnswer(
  keywords: string[][],
  heard: string,
): { score: number; found: boolean[] } {
  const got = normalize(heard);
  const found = keywords.map((group) =>
    group.some((k) => {
      const parts = normalize(k);
      return parts.every((p) => got.some((g) => wordsMatch(p, g)));
    }),
  );
  const hits = found.filter(Boolean).length;
  return { score: keywords.length ? Math.round((hits / keywords.length) * 100) : 0, found };
}

/** Elige la mejor alternativa de reconocimiento. */
export function bestOf<T extends { score: number }>(results: T[]): T | undefined {
  return results.reduce<T | undefined>(
    (best, r) => (!best || r.score > best.score ? r : best),
    undefined,
  );
}

export const PASS_SCORE = 60;

/** Consejos cariñosos de pronunciación según las palabras por mejorar. */
const TIPS: [RegExp, string, string][] = [
  [/th/, "th", "¡Casi! Para la “th”, pon la lengua suavemente entre los dientes y sopla."],
  [/^v|v/, "v", "La “v” en inglés vibra: muerde suave tu labio de abajo, como en “very”."],
  [/sh/, "sh", "Para “sh”, junta los labios hacia adelante, como cuando pides silencio."],
  [/ed$/, "-ed", "En pasado, la “-ed” casi no se oye: “walked” suena “wokt”."],
  [/^h/, "h", "La “h” inglesa es un soplido suave, como cuando empañas un vidrio."],
  [/r/, "r", "La “r” inglesa no vibra: lleva la lengua hacia atrás sin tocar el paladar."],
  [/^s[ptkcl]/, "s+consonante", "No agregues “e” al inicio: di “school”, no “eschool”."],
];

export function tipFor(missed: string[]): { sound: string; tip: string } | null {
  for (const [re, sound, tip] of TIPS) {
    if (missed.some((w) => re.test(w))) return { sound, tip };
  }
  return missed.length
    ? {
        sound: "ritmo",
        tip: "¡Muy bien! Repite despacio, palabra por palabra, y luego más rápido.",
      }
    : null;
}
