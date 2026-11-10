/* ============================================================
 * Pantalla principal (sección 8): trayectoria (izq.) + personajes (der.)
 * ============================================================ */
import { ArrowRight, Flame, Star, Target, Trophy } from "lucide-react";
import { CHARACTERS, SKILL_ORDER } from "@/data/characters";
import { ALL_NODES, PATHS } from "@/data/paths";
import { Button } from "@/components/ui/button";
import { CharacterArt } from "@/components/ludik/CharacterArt";
import { Card, CefrBadge, ProgressBar, SectionTitle } from "@/components/ludik/bits";
import { LearningPath } from "@/features/learning-path/LearningPath";
import { SkillSelector } from "@/features/skills/SkillSelector";
import { nodeStatus, pathStats, UNLOCK_STARS } from "@/services/rules";
import { useLudik } from "@/store/ludik-store";
import { cn } from "@/lib/utils";
import type { SkillId } from "@/types/ludik";

export function Hub({
  skillId,
  onSelect,
}: {
  skillId: SkillId | null;
  onSelect(id: SkillId): void;
}) {
  const { state, reducedMotion } = useLudik();
  const c = skillId ? CHARACTERS[skillId] : null;
  const stats = skillId
    ? pathStats(PATHS[skillId], state.progress)
    : pathStats(ALL_NODES, state.progress);
  const firstName = state.user.name.split(" ")[0] ?? state.user.name;

  const subtitle = (() => {
    if (!skillId || !c) return "Elige a tu guía para ver su camino. ¡Cada paso cuenta!";
    const path = PATHS[skillId];
    const statuses = path.map((_, i) => nodeStatus(path, i, state.progress, state.plan));
    const nextIdx = statuses.findIndex((s) => s === "available");
    const next = path[nextIdx];
    if (stats.completed === 0)
      return `¡Empieza tu aventura con ${c.name}! Tu primer reto te espera.`;
    if (next) return `¡Vas muy bien! Un paso más: «${next.title}» y ganas nuevas estrellas.`;
    // Nada disponible: o bien falta subir estrellas, o todo está completo.
    const blockIdx = statuses.findIndex((s) => s === "locked");
    const blocker = path[blockIdx - 1];
    if (blocker)
      return `¡Casi! Consigue ${UNLOCK_STARS} estrellas en «${blocker.title}» para abrir el siguiente nivel.`;
    return "¡Increíble! Completaste todo lo disponible. Repite niveles para ganar más estrellas.";
  })();

  const heroColor = c?.tone.cssVar ?? "var(--ludik-orange)";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
      {/* Selector compacto: móvil y tablet, fijo bajo el header */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <SkillSelector variant="compact" value={skillId} onChange={onSelect} />
      </div>

      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:pt-8">
        {/* ---------- COLUMNA IZQUIERDA: TRAYECTORIA ---------- */}
        <section aria-labelledby="path-title" className="min-w-0">
          <div
            className="surface-hero relative overflow-hidden rounded-3xl border border-border/80 p-5 shadow-card sm:p-7"
            style={{ ["--hero-color" as string]: heroColor }}
          >
            <div className="relative z-10 max-w-[34rem] sm:pr-40">
              <p className="text-sm font-extrabold uppercase tracking-wider text-ui-gray">
                {c ? `${c.skill} · ${c.skillEs}` : `¡Hola, ${firstName}!`}
              </p>
              <SectionTitle as="h1" color={heroColor} className="mt-1 text-2xl sm:text-3xl">
                <span id="path-title">{c ? c.pathTitle : "CONOCIMIENTOS GENERALES"}</span>
              </SectionTitle>
              <p className="mt-3 text-lg text-strong/90">{subtitle}</p>
              <div className="mt-5 flex items-center gap-3">
                <ProgressBar
                  value={stats.percent}
                  color={heroColor}
                  label={c ? `Progreso de ${c.skillEs}` : "Progreso general"}
                  className="bg-card/80"
                />
                <span className="shrink-0 font-display text-xl text-strong">{stats.percent}%</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm font-extrabold text-strong">
                <li className="inline-flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 shadow-soft">
                  <Trophy aria-hidden className="size-4 text-ink-orange" />
                  {stats.completed} de {stats.total} niveles
                </li>
                <li className="inline-flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 shadow-soft">
                  <Star aria-hidden className="size-4 fill-yellow text-ink-yellow" />
                  {stats.stars} de {stats.maxStars} estrellas
                </li>
              </ul>
            </div>

            {/* Ilustración: personaje elegido o los cuatro juntos */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 right-2 hidden sm:block"
            >
              {c && skillId ? (
                <span className="char-halo block">
                  <CharacterArt
                    key={skillId}
                    id={skillId}
                    mood="feliz"
                    decorative
                    eager
                    className={cn("size-44 drop-shadow-xl", !reducedMotion && "animate-float")}
                  />
                </span>
              ) : (
                <span className="flex items-end -space-x-6">
                  {SKILL_ORDER.map((id, i) => (
                    <CharacterArt
                      key={id}
                      id={id}
                      decorative
                      eager
                      className={cn("drop-shadow-lg", i % 2 ? "size-24" : "size-28")}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6">
            {skillId ? (
              <Card className="relative overflow-hidden px-2 py-6 sm:px-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-60"
                  style={{
                    background: `linear-gradient(180deg, color-mix(in oklab, ${heroColor} 18%, transparent), transparent)`,
                  }}
                />
                <LearningPath key={skillId} skillId={skillId} />
              </Card>
            ) : (
              <Overview onSelect={onSelect} />
            )}
          </div>
        </section>

        {/* ---------- COLUMNA DERECHA: PERSONAJES ---------- */}
        <aside aria-label="Personajes y habilidades" className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-5">
            <Card>
              <SectionTitle as="h2" className="mb-4 text-xl sm:text-2xl">
                ¿Con quién practicas hoy?
              </SectionTitle>
              <SkillSelector variant="full" value={skillId} onChange={onSelect} />
            </Card>
            <ConstancyCard />
          </div>
        </aside>
      </div>

      <div className="mt-8 lg:hidden">
        <ConstancyCard />
      </div>
    </div>
  );
}

/* Vista general cuando no hay habilidad seleccionada */
function Overview({ onSelect }: { onSelect(id: SkillId): void }) {
  const { state } = useLudik();
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {SKILL_ORDER.map((id, idx) => {
        const c = CHARACTERS[id];
        const path = PATHS[id];
        const s = pathStats(path, state.progress);
        const next = path.find(
          (_, i) => nodeStatus(path, i, state.progress, state.plan) === "available",
        );
        return (
          <article
            key={id}
            className="card-lift animate-rise flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-card"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <div
              className="relative flex h-28 items-end justify-between px-5 pb-3"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${c.tone.cssVar} 55%, var(--card)), color-mix(in oklab, ${c.tone.cssVar} 18%, var(--card)))`,
              }}
            >
              <div>
                <h2 className="font-display text-2xl text-strong">{c.name}</h2>
                <p className="text-sm font-extrabold text-strong/80">
                  {c.skill} · {c.skillEs}
                </p>
              </div>
              <CharacterArt id={id} decorative className="-mb-8 size-28 drop-shadow-lg" />
            </div>
            <div className="flex flex-1 flex-col p-5 pt-4">
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={s.percent}
                  color={c.tone.cssVar}
                  label={`Progreso con ${c.name}`}
                />
                <span className="text-sm font-extrabold text-ui-gray">
                  {s.completed}/{s.total}
                </span>
              </div>
              <p className="mt-3 flex-1 text-foreground">
                {next ? (
                  <>
                    Siguiente: <strong className="text-strong">{next.title}</strong>{" "}
                    <CefrBadge level={next.level} className="ml-1 px-1.5 text-xs" />
                  </>
                ) : (
                  "¡Todo al día por aquí! Repite para ganar más estrellas."
                )}
              </p>
              <Button
                variant={c.tone.buttonVariant}
                className="mt-4 w-full"
                onClick={() => onSelect(id)}
              >
                Practicar con {c.name} <ArrowRight aria-hidden />
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* Racha y meta diaria — "constancia activa" */
function ConstancyCard() {
  const { state, streakToday, todayXp, ready } = useLudik();
  const goal = state.prefs.dailyGoalXp;
  const pct = Math.min(100, Math.round((todayXp / goal) * 100));
  // Últimos 7 días: encendido si hubo actividad ese día (según la racha visible).
  const week = Array.from({ length: 7 }, (_, i) => i < Math.min(streakToday, 7));
  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-orange/20 blur-2xl"
      />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-orange node-3d [--node-shadow:var(--color-ink-orange)]">
          <Flame aria-hidden className="size-8 fill-yellow text-strong" />
        </span>
        <div>
          <p className="font-display text-2xl text-strong">
            {streakToday} {streakToday === 1 ? "día" : "días"}
          </p>
          <p className="text-sm font-bold text-ui-gray">
            {ready && streakToday === 0
              ? "¡Empieza una nueva racha hoy!"
              : `Mejor racha: ${state.streak.best} días`}
          </p>
        </div>
      </div>
      <ol aria-label="Actividad de la semana" className="relative mt-4 grid grid-cols-7 gap-1.5">
        {week.map((on, i) => (
          <li
            key={i}
            className={cn(
              "flex h-8 items-center justify-center rounded-lg text-xs font-extrabold",
              on ? "bg-orange/25 text-strong" : "bg-muted text-ui-gray",
            )}
          >
            {on ? <Flame aria-hidden className="size-4 fill-orange text-ink-orange" /> : "·"}
            <span className="sr-only">{on ? "día con práctica" : "día sin práctica"}</span>
          </li>
        ))}
      </ol>
      <div className="relative mt-4">
        <p className="mb-1.5 flex items-center gap-1.5 font-bold text-strong">
          <Target aria-hidden className="size-5 text-ink-orange" /> Meta de hoy: {todayXp}/{goal} XP
        </p>
        <ProgressBar value={pct} label="Meta diaria de XP" />
        <p className="mt-1.5 text-sm text-ui-gray">
          {pct >= 100
            ? "¡Meta cumplida! Eres pura constancia."
            : "Completa un nivel para sumar a tu meta."}
        </p>
      </div>
    </Card>
  );
}
