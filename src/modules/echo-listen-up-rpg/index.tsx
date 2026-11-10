/* ============================================================
 * Módulo Echo — Listen Up! Ultimate Battle RPG (Anexo D, versión web)
 * Campaña por región (levelId = forest | volcano | frozen):
 * preparación (inventario), mapa de 4 combates, combate por turnos
 * con desafío auditivo en cada turno, resultados de región.
 * Audio: voz del navegador (provisional, reemplazable por MP3).
 * ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Crown,
  Flame,
  Gauge,
  Headphones,
  HeartPulse,
  Lock,
  Radar,
  Repeat,
  Shield,
  ShieldHalf,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Swords,
  Target,
  Turtle,
  Volume2,
  Zap,
} from "lucide-react";
import type { ModuleProps } from "@/types/ludik";
import { Button } from "@/components/ui/button";
import { CefrBadge, Stars } from "@/components/ludik/bits";
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
import {
  ABILITIES,
  COMPANIONS,
  ENERGY_MAX,
  HERO_MAX_HP,
  WEAPONS,
  afterHeroCheck,
  combatStars,
  comboMultiplier,
  createCombat,
  echoBlast,
  enemyTurn,
  heroAttack,
  pickTarget,
  applyHealingStation,
  applySonicShield,
  type AbilityId,
  type CombatEvent,
  type CombatState,
  type CompanionId,
  type Element,
  type Loadout,
  type SpriteKey,
  type WeaponId,
} from "./engine";
import { ELEMENT_ES, REGIONS, type Challenge, type Encounter, type Region } from "./content";

import heroImg from "@/assets/rpg/hero.webp.asset.json";
import arenaForest from "@/assets/rpg/arena-forest.webp.asset.json";
import arenaVolcano from "@/assets/rpg/arena-volcano.webp.asset.json";
import arenaFrozen from "@/assets/rpg/arena-frozen.webp.asset.json";
import goblin from "@/assets/rpg/enemy-goblin.webp.asset.json";
import slime from "@/assets/rpg/enemy-slime.webp.asset.json";
import archer from "@/assets/rpg/enemy-archer.webp.asset.json";
import imp from "@/assets/rpg/enemy-imp.webp.asset.json";
import golem from "@/assets/rpg/enemy-golem.webp.asset.json";
import shieldbearer from "@/assets/rpg/enemy-shieldbearer.webp.asset.json";
import wolf from "@/assets/rpg/enemy-wolf.webp.asset.json";
import witch from "@/assets/rpg/enemy-witch.webp.asset.json";
import crystal from "@/assets/rpg/enemy-crystal.webp.asset.json";
import guardian from "@/assets/rpg/boss-guardian.webp.asset.json";
import titan from "@/assets/rpg/boss-titan.webp.asset.json";
import dragon from "@/assets/rpg/boss-dragon.webp.asset.json";

const SPRITES: Record<SpriteKey, string> = {
  goblin: goblin.url,
  slime: slime.url,
  archer: archer.url,
  imp: imp.url,
  golem: golem.url,
  shieldbearer: shieldbearer.url,
  wolf: wolf.url,
  witch: witch.url,
  crystal: crystal.url,
  guardian: guardian.url,
  titan: titan.url,
  dragon: dragon.url,
};
const ARENAS: Record<Region["arena"], string> = {
  forest: arenaForest.url,
  volcano: arenaVolcano.url,
  frozen: arenaFrozen.url,
};
const REGION_TONE: Record<Region["id"], string> = {
  forest: "var(--ludik-teal)",
  volcano: "var(--ludik-orange)",
  frozen: "var(--ludik-blue)",
};

const ABILITY_ICON: Record<AbilityId, typeof Flame> = {
  fire: Flame,
  ice: Snowflake,
  thunder: Zap,
  double: Swords,
};
const ELEMENT_WORD: Record<Exclude<Element, "none">, string> = {
  fire: "fire",
  ice: "ice",
  thunder: "thunder",
};

type GadgetId = "scanner" | "shield" | "drone" | "heal";
const GADGETS: Record<
  GadgetId,
  { name: string; description: string; icon: typeof Radar; tone: string }
> = {
  scanner: {
    name: "Echo Scanner",
    description: "Descarta una respuesta incorrecta.",
    icon: Radar,
    tone: "bg-teal",
  },
  shield: {
    name: "Sonic Shield",
    description: "Bloquea el próximo golpe (incluso flechas).",
    icon: ShieldHalf,
    tone: "bg-blue",
  },
  drone: {
    name: "Replay Drone",
    description: "Repite el audio despacio y muestra el texto.",
    icon: Repeat,
    tone: "bg-yellow",
  },
  heal: {
    name: "Healing Station",
    description: "Recupera 30 de vida.",
    icon: HeartPulse,
    tone: "bg-salmon",
  },
};
const MODE_LABEL: Record<Challenge["mode"], string> = {
  act: "LISTEN AND ACT",
  understand: "LISTEN AND UNDERSTAND",
  conversation: "LISTEN TO THE CONVERSATION",
};

interface CombatRecord {
  stars: number;
  correct: number;
  answered: number;
}

/* ============================================================ */

export default function ListenUp(props: ModuleProps) {
  const [run, setRun] = useState(0);
  const region = REGIONS[props.levelId as Region["id"]];
  if (!region)
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="font-display text-2xl">Región no disponible</h1>
        <Button className="mt-4" onClick={props.onExit}>
          Volver al camino
        </Button>
      </section>
    );
  return (
    <Campaign
      key={`${region.id}-${run}`}
      {...props}
      region={region}
      retry={() => setRun((r) => r + 1)}
    />
  );
}

function Campaign(props: ModuleProps & { region: Region; retry: () => void }) {
  const { region } = props;
  useStopSpeechOnUnmount();
  const elapsed = useElapsed();
  const [screen, setScreen] = useState<"map" | "combat" | "results">("map");
  const [loadout, setLoadout] = useState<Loadout>({ weapon: "sword", companion: "pip" });
  const [records, setRecords] = useState<Record<string, CombatRecord>>({});
  const [selected, setSelected] = useState<string>(region.encounters[0]?.id ?? "");
  const [active, setActive] = useState<Encounter | null>(null);
  const [combatRun, setCombatRun] = useState(0);
  const [totals, setTotals] = useState({
    correct: 0,
    answered: 0,
    failed: [] as string[],
    bestCombo: 0,
  });
  const [seconds, setSeconds] = useState(0);
  const sent = useRef(false);

  const unlockedIndex = region.encounters.findIndex((e) => !records[e.id]);
  const isUnlocked = (i: number) => unlockedIndex === -1 || i <= unlockedIndex;
  const won = Object.keys(records).length;

  const xpEarned =
    region.encounters.reduce((a, e) => a + (records[e.id] ? e.reward.xp : 0), 0) +
    totals.correct * 2;
  const coinsEarned = region.encounters.reduce(
    (a, e) => a + (records[e.id] ? e.reward.coins : 0),
    0,
  );
  const score = percent(totals.correct, totals.answered);
  const stars = won === region.encounters.length ? starsFor(score) : Math.min(2, starsFor(score));
  const failedTopics = [...new Set(totals.failed)];

  useEffect(() => {
    if (screen !== "results" || sent.current) return;
    sent.current = true;
    props.onComplete({
      moduleId: props.moduleId,
      levelId: props.levelId,
      stage: won,
      score,
      xp: xpEarned,
      coins: coinsEarned,
      stars,
      correct: totals.correct,
      total: totals.answered,
      timeSeconds: seconds,
      failedTopics,
      completed: true,
    });
  }, [screen, props, won, score, xpEarned, coinsEarned, stars, totals, seconds, failedTopics]);

  function finish() {
    setSeconds(elapsed());
    setScreen("results");
  }

  if (screen === "results")
    return (
      <ResultsScreen
        skillId="echo"
        levelLabel={region.level}
        title={
          won === region.encounters.length ? `¡${region.nameEs} liberado!` : "¡Progreso guardado!"
        }
        score={score}
        stars={stars}
        xp={xpEarned}
        coins={coinsEarned}
        timeSeconds={seconds}
        stages={region.encounters
          .filter((e) => records[e.id])
          .map((e) => ({
            label: e.name,
            correct: records[e.id]?.correct ?? 0,
            total: records[e.id]?.answered ?? 0,
          }))}
        failedTopics={failedTopics}
        note={`Mejor ECHO COMBO: ${totals.bestCombo}. Combates ganados: ${won} de ${region.encounters.length}.${won < region.encounters.length ? " Para 3 estrellas, gana los 4 combates." : ""}`}
        onRetry={props.retry}
        onNext={props.onNext}
        onExit={props.onExit}
      />
    );

  if (screen === "combat" && active)
    return (
      <Combat
        key={`${active.id}-${combatRun}`}
        region={region}
        encounter={active}
        loadout={loadout}
        reducedMotion={props.reducedMotion}
        onAnswer={(ok, topic) =>
          setTotals((t) => ({
            ...t,
            correct: t.correct + (ok ? 1 : 0),
            answered: t.answered + 1,
            failed: ok ? t.failed : [...t.failed, topic],
          }))
        }
        onEnd={(result) => {
          if (result.won) {
            setRecords((r) => ({
              ...r,
              [active.id]: {
                stars: Math.max(r[active.id]?.stars ?? 0, result.stars),
                correct: result.correct,
                answered: result.answered,
              },
            }));
            const idx = region.encounters.findIndex((e) => e.id === active.id);
            const next = region.encounters[idx + 1];
            if (next) setSelected(next.id);
          }
          setTotals((t) => ({ ...t, bestCombo: Math.max(t.bestCombo, result.bestCombo) }));
          setActive(null);
          setScreen("map");
        }}
      />
    );

  const sel = region.encounters.find((e) => e.id === selected) ?? region.encounters[0];
  const selIndex = region.encounters.findIndex((e) => e.id === sel?.id);

  return (
    <section className="space-y-6" style={{ ["--region" as string]: REGION_TONE[region.id] }}>
      {/* ---------- Portada de la región + mapa de campaña ---------- */}
      <div
        className="arena-stage rounded-3xl border border-border shadow-pop"
        style={{ backgroundImage: `url(${ARENAS[region.arena]})` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-7">
          <div className="glass max-w-md rounded-2xl p-4 shadow-card">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-ui-gray">
              <Headphones aria-hidden className="size-4" /> Listen Up! · Campaña
            </p>
            <h1 className="mt-1 font-display text-3xl text-strong sm:text-4xl">{region.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-bold text-strong">
              {region.nameEs} <CefrBadge level={region.level} className="text-xs" />
            </p>
            <p className="mt-2 text-foreground">{region.tagline}</p>
          </div>
          <img
            src={heroImg.url}
            alt="Kai, el héroe de Listen Up!"
            className="sprite-shadow hidden w-40 animate-idle sm:block"
            width={512}
            height={512}
          />
        </div>

        <ol
          aria-label="Mapa de campaña"
          className="grid grid-cols-2 gap-3 p-4 pt-0 sm:grid-cols-4 sm:p-7 sm:pt-2"
        >
          {region.encounters.map((e, i) => {
            const rec = records[e.id];
            const open = isUnlocked(i);
            const isSel = sel?.id === e.id;
            const main = e.enemies[0];
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => open && setSelected(e.id)}
                  aria-disabled={!open}
                  aria-pressed={isSel}
                  aria-label={`Combate ${e.order}: ${e.name}. ${rec ? `Ganado, ${rec.stars} estrellas` : open ? "Disponible" : "Bloqueado: gana el combate anterior"}`}
                  className={cn(
                    "glass group relative flex w-full flex-col items-center rounded-2xl border-4 p-3 text-center transition",
                    isSel ? "border-yellow shadow-glow" : "border-transparent shadow-card",
                    open ? "hover:-translate-y-1" : "cursor-not-allowed opacity-70",
                  )}
                >
                  <span className="absolute left-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-strong text-sm font-extrabold text-card">
                    {e.order}
                  </span>
                  {e.kind === "boss" && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-salmon px-2 text-xs font-extrabold text-strong">
                      <Crown aria-hidden className="size-3.5" /> JEFE
                    </span>
                  )}
                  {e.kind === "special" && (
                    <span className="absolute right-2 top-2 rounded-full bg-yellow px-2 text-xs font-extrabold text-strong">
                      ESPECIAL
                    </span>
                  )}
                  <img
                    src={main ? SPRITES[main.sprite] : ""}
                    alt=""
                    className={cn(
                      "mt-4 h-20 w-20 object-contain sm:h-24 sm:w-24",
                      !open && "grayscale-char",
                    )}
                    loading="lazy"
                  />
                  <span className="mt-1 font-display text-base leading-tight text-strong">
                    {e.name}
                  </span>
                  <span className="mt-1 flex h-5 items-center gap-1 text-sm font-bold text-strong">
                    {rec ? (
                      <Stars count={rec.stars} size="sm" />
                    ) : open ? (
                      <>
                        <Swords aria-hidden className="size-4" /> ¡Lucha!
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden className="size-4" /> Bloqueado
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* ---------- Detalle del combate seleccionado ---------- */}
        {sel && (
          <article className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
            <p
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider text-strong"
              style={{ background: "color-mix(in oklab, var(--region) 30%, var(--card))" }}
            >
              <Target aria-hidden className="size-4" /> {sel.objectiveLabel}
            </p>
            <h2 className="mt-3 font-display text-2xl text-strong">
              Combate {sel.order}: {sel.name}
            </h2>
            <p className="mt-1 text-lg">{sel.intro}</p>
            <p className="mt-3 rounded-2xl bg-muted p-3 font-bold text-strong">
              {sel.objectiveText}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Enemigos">
              {sel.enemies.map((en, i) => (
                <li
                  key={en.id + i}
                  className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm font-bold text-strong"
                >
                  <img
                    src={SPRITES[en.sprite]}
                    alt=""
                    className="size-8 rounded-full bg-muted object-contain"
                  />
                  {en.name} · {en.hp} PV{en.shield ? ` · escudo ${en.shield}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex flex-wrap gap-4 text-sm font-bold text-ui-gray">
              <span className="inline-flex items-center gap-1">
                <Sparkles aria-hidden className="size-4 text-ink-blue" /> +{sel.reward.xp} XP
              </span>
              <span className="inline-flex items-center gap-1">
                <Star aria-hidden className="size-4 text-ink-yellow" /> +{sel.reward.coins} monedas
              </span>
              <span className="inline-flex items-center gap-1">
                <Headphones aria-hidden className="size-4" /> {sel.challenges.length} desafíos
                auditivos
              </span>
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="teal"
                disabled={!isUnlocked(selIndex)}
                onClick={() => {
                  setActive(sel);
                  setCombatRun((n) => n + 1);
                  setScreen("combat");
                }}
              >
                <Swords aria-hidden /> {records[sel.id] ? "Repetir combate" : "¡A luchar!"}
              </Button>
              {won > 0 && (
                <Button size="lg" variant="outline" onClick={finish}>
                  Terminar y guardar
                </Button>
              )}
            </div>
            {!isUnlocked(selIndex) && (
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-ui-gray">
                <Lock aria-hidden className="size-4" /> Gana el combate anterior para desbloquearlo.
              </p>
            )}
          </article>
        )}

        {/* ---------- Inventario: equipamiento y compañero ---------- */}
        <aside
          className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
          aria-labelledby="inv-title"
        >
          <h2 id="inv-title" className="font-display text-xl text-strong">
            Inventario
          </h2>
          <fieldset className="mt-3">
            <legend className="text-sm font-extrabold uppercase tracking-wide text-ui-gray">
              Arma
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(WEAPONS) as WeaponId[]).map((w) => (
                <ChoiceCard
                  key={w}
                  name="weapon"
                  checked={loadout.weapon === w}
                  onChange={() => setLoadout((l) => ({ ...l, weapon: w }))}
                  title={WEAPONS[w].nameEs}
                  subtitle={`${WEAPONS[w].rarity} · ${WEAPONS[w].description}`}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-sm font-extrabold uppercase tracking-wide text-ui-gray">
              Compañero
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(COMPANIONS) as CompanionId[]).map((c) => (
                <ChoiceCard
                  key={c}
                  name="companion"
                  checked={loadout.companion === c}
                  onChange={() => setLoadout((l) => ({ ...l, companion: c }))}
                  title={COMPANIONS[c].name}
                  subtitle={COMPANIONS[c].description}
                />
              ))}
            </div>
          </fieldset>
          <h3 className="mt-4 text-sm font-extrabold uppercase tracking-wide text-ui-gray">
            Gadgets (1 uso por combate)
          </h3>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(GADGETS) as GadgetId[]).map((g) => {
              const G = GADGETS[g];
              return (
                <li key={g} className="flex items-start gap-2 rounded-xl bg-muted p-2">
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-strong",
                      G.tone,
                    )}
                  >
                    <G.icon aria-hidden className="size-5" />
                  </span>
                  <span className="text-sm">
                    <strong className="block text-strong">{G.name}</strong>
                    {G.description}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  title,
  subtitle,
}: {
  name: string;
  checked: boolean;
  onChange(): void;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-11 cursor-pointer flex-col rounded-xl border-2 p-2 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cobalt",
        checked ? "border-teal bg-teal/15" : "border-border bg-card hover:bg-muted",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-center gap-1 font-extrabold text-strong">
        {checked && <Check aria-hidden className="size-4 text-ink-teal" />} {title}
      </span>
      <span className="text-xs leading-snug">{subtitle}</span>
    </label>
  );
}

/* ============================================================
 * Combate por turnos
 * ============================================================ */

interface Fx {
  id: number;
  target: "hero" | "ally" | number;
  text: string;
  tone: "dmg" | "heal" | "info";
}

function Combat({
  region,
  encounter,
  loadout,
  reducedMotion,
  onAnswer,
  onEnd,
}: {
  region: Region;
  encounter: Encounter;
  loadout: Loadout;
  reducedMotion: boolean;
  onAnswer(ok: boolean, topic: string): void;
  onEnd(r: {
    won: boolean;
    stars: number;
    correct: number;
    answered: number;
    bestCombo: number;
  }): void;
}) {
  const [cs, setCs] = useState<CombatState>(() => createCombat(encounter, loadout));
  const [q, setQ] = useState(0);
  const [ability, setAbility] = useState<AbilityId>("fire");
  const [phase, setPhase] = useState<"intro" | "question" | "feedback" | "end">("intro");
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string; text: string } | null>(
    null,
  );
  const [used, setUsed] = useState<Set<GadgetId>>(new Set());
  const [removed, setRemoved] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  const [fx, setFx] = useState<Fx[]>([]);
  const [anim, setAnim] = useState<{
    hero: "lunge" | "shake" | undefined;
    enemy: number | undefined;
    flash: boolean;
    key: number;
  }>({
    hero: undefined,
    enemy: undefined,
    flash: false,
    key: 0,
  });
  const [banner, setBanner] = useState<string | null>(null);
  const [live, setLive] = useState("");
  const [stats, setStats] = useState({ correct: 0, answered: 0, missed: [] as Challenge[] });
  const [weakKnown, setWeakKnown] = useState(false);
  const fxId = useRef(0);
  const qHeading = useRef<HTMLHeadingElement>(null);
  const tts = speechSupported();

  const challenge = encounter.challenges[q % encounter.challenges.length] as Challenge;
  const options = useMemo(() => shuffle([challenge.answer, ...challenge.distractors]), [challenge]);
  const target = pickTarget(cs.enemies);

  function play(rate = 0.9) {
    speak(challenge.audio, { lang: "en-US", rate });
  }

  // Al empezar cada pregunta: leer el audio y llevar el foco a la pregunta.
  useEffect(() => {
    if (phase !== "question") return;
    const t = window.setTimeout(() => play(), 350);
    qHeading.current?.focus();
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, phase]);

  function pushFx(items: Omit<Fx, "id">[]) {
    const withIds = items.map((f) => ({ ...f, id: ++fxId.current }));
    setFx((cur) => [...cur, ...withIds]);
    window.setTimeout(() => setFx((cur) => cur.filter((f) => !withIds.includes(f))), 1200);
  }

  function describe(events: CombatEvent[], state: CombatState): string {
    const parts: string[] = [];
    const fxs: Omit<Fx, "id">[] = [];
    events.forEach((e) => {
      const name = (i: number) => state.enemies[i]?.def.name ?? "enemigo";
      switch (e.kind) {
        case "hit":
          parts.push(
            `${name(e.target)} recibe ${e.amount} de daño${e.effective === "weak" ? " (¡súper eficaz!)" : e.effective === "resist" ? " (poco eficaz)" : ""}.`,
          );
          fxs.push({
            target: e.target,
            text: `-${e.amount}${e.effective === "weak" ? "!" : ""}`,
            tone: "dmg",
          });
          break;
        case "shield":
          parts.push(e.left > 0 ? `El escudo resiste: quedan ${e.left} golpes.` : "¡Escudo roto!");
          fxs.push({
            target: e.target,
            text: e.left > 0 ? `Escudo ${e.left}` : "¡Roto!",
            tone: "info",
          });
          break;
        case "defeat":
          parts.push(`¡${name(e.target)} derrotado!`);
          break;
        case "blast":
          parts.push("¡ECHO BLAST!");
          break;
        case "heroHurt":
          parts.push(`${e.by} te golpea: −${e.amount} de vida.`);
          fxs.push({ target: "hero", text: `-${e.amount}`, tone: "dmg" });
          break;
        case "allyHurt":
          parts.push(`${e.by} golpea a ${state.ally?.name ?? "tu aliado"}: −${e.amount}.`);
          fxs.push({ target: "ally", text: `-${e.amount}`, tone: "dmg" });
          break;
        case "blocked":
          parts.push(`¡Bloqueaste el ataque de ${e.by}!`);
          fxs.push({ target: "hero", text: "¡Bloqueo!", tone: "info" });
          break;
        case "heal":
          parts.push(`${e.name} recupera ${e.amount} de vida.`);
          if (e.who === "hero") fxs.push({ target: "hero", text: `+${e.amount}`, tone: "heal" });
          break;
        case "charge":
          parts.push(
            `${e.by} está cargando un ataque (${e.level}/3). ¡Acierta para interrumpirlo!`,
          );
          break;
        case "interrupt":
          parts.push(`¡Interrumpiste el gran ataque de ${e.by}!`);
          fxs.push({ target: 0, text: "¡Interrumpido!", tone: "info" });
          break;
        case "debuff":
          parts.push(`${e.by} te debilita durante 2 turnos.`);
          break;
        case "phase":
          parts.push(`${e.name}: “${e.line}”`);
          setBanner(`${e.name} — “${e.line}”`);
          break;
        case "summon":
          parts.push(`¡Aparece ${e.name}!`);
          break;
      }
    });
    pushFx(fxs);
    return parts.join(" ");
  }

  function animateFrom(events: CombatEvent[]) {
    if (reducedMotion) return;
    const hit = events.find((e) => e.kind === "hit" || e.kind === "shield");
    const hurt = events.some((e) => e.kind === "heroHurt");
    setAnim((a) => ({
      hero: hurt ? "shake" : hit ? "lunge" : undefined,
      enemy: hit && "target" in hit ? hit.target : undefined,
      flash: events.some((e) => e.kind === "blast"),
      key: a.key + 1,
    }));
  }

  function answer(opt: string) {
    if (phase !== "question") return;
    const ok = opt === challenge.answer;
    let s = cs;
    let events: CombatEvent[] = [];
    if (ok) {
      const r = heroAttack(s, encounter, loadout, ability);
      s = afterHeroCheck(r.state, encounter);
      events = r.events;
    }
    if (s.status === "playing") {
      const r = enemyTurn(s, encounter, ok);
      s = r.state;
      events = [...events, ...r.events];
    }
    if (
      ok &&
      encounter.weaknessHint &&
      encounter.weaknessHint !== "none" &&
      challenge.audio.toLowerCase().includes(ELEMENT_WORD[encounter.weaknessHint])
    )
      setWeakKnown(true);
    setCs(s);
    animateFrom(events);
    const text = describe(events, s);
    setLive(`${ok ? "¡Correcto!" : `Incorrecto. La respuesta era ${challenge.answer}.`} ${text}`);
    setFeedback({ ok, picked: opt, text });
    setStats((st) => ({
      correct: st.correct + (ok ? 1 : 0),
      answered: st.answered + 1,
      missed: ok ? st.missed : [...st.missed, challenge],
    }));
    onAnswer(ok, challenge.topic);
    setPhase("feedback");
  }

  function next() {
    setFeedback(null);
    setRemoved(null);
    setShowText(false);
    setBanner(null);
    if (cs.status !== "playing") {
      setPhase("end");
      return;
    }
    setQ((x) => x + 1);
    setPhase("question");
  }

  function blast() {
    if (cs.energy < ENERGY_MAX || phase !== "question") return;
    const r = echoBlast(cs, encounter);
    setCs(r.state);
    animateFrom(r.events);
    setLive(describe(r.events, r.state));
    if (r.state.status !== "playing") setPhase("end");
  }

  function gadget(g: GadgetId) {
    if (used.has(g) || phase !== "question") return;
    setUsed((u) => new Set(u).add(g));
    if (g === "scanner") {
      const wrong = options.find((o) => o !== challenge.answer);
      setRemoved(wrong ?? null);
      setLive(`Echo Scanner: “${wrong}” no es la respuesta.`);
    } else if (g === "drone") {
      setShowText(true);
      play(0.6);
      setLive("Replay Drone: audio lento y texto visible.");
    } else if (g === "shield") {
      setCs((s) => applySonicShield(s));
      setLive("Sonic Shield activado: bloqueará el próximo golpe.");
    } else {
      setCs((s) => applyHealingStation(s));
      pushFx([{ target: "hero", text: "+30", tone: "heal" }]);
      setLive("Healing Station: +30 de vida.");
    }
  }

  /* ---------- Fin del combate ---------- */
  if (phase === "end") {
    const wonCombat = cs.status === "won";
    const stars = combatStars(cs.heroHp, stats.correct, stats.answered);
    return (
      <section
        aria-labelledby="end-title"
        className="arena-stage mx-auto max-w-3xl rounded-3xl border border-border p-4 shadow-pop sm:p-8"
        style={{ backgroundImage: `url(${ARENAS[region.arena]})` }}
      >
        <div className="glass mx-auto max-w-xl rounded-3xl p-6 text-center shadow-card">
          <img
            src={wonCombat ? heroImg.url : SPRITES[encounter.enemies[0]?.sprite ?? "goblin"]}
            alt=""
            className={cn(
              "sprite-shadow mx-auto h-36 w-36 object-contain",
              wonCombat && !reducedMotion && "animate-bob",
            )}
          />
          <h2 id="end-title" className="mt-2 font-display text-3xl text-strong">
            {wonCombat ? "¡Victoria!" : "¡Inténtalo de nuevo!"}
          </h2>
          <p className="mt-1 text-lg">
            {wonCombat
              ? `Derrotaste a ${encounter.name}. ¡Tus oídos son tu mejor arma!`
              : cs.ally && cs.ally.hp <= 0
                ? `${cs.ally.name} necesita descansar. Repasa los audios y vuelve a intentarlo.`
                : "No pasa nada: cada intento entrena tu oído. Repasa y vuelve a intentarlo."}
          </p>
          {wonCombat && (
            <div className="mt-3 flex justify-center">
              <Stars count={stars} size="xl" animated={!reducedMotion} />
            </div>
          )}
          <p className="mt-3 font-bold text-strong">
            Aciertos: {stats.correct}/{stats.answered} · Mejor combo: {cs.bestCombo}
            {wonCombat ? ` · +${encounter.reward.xp} XP · +${encounter.reward.coins} monedas` : ""}
          </p>
          {stats.missed.length > 0 && (
            <div className="mt-4 rounded-2xl bg-muted p-3 text-left">
              <h3 className="font-extrabold text-strong">Repaso de lo que escuchaste</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {[...new Map(stats.missed.map((m) => [m.id, m])).values()].map((m) => (
                  <li key={m.id}>
                    <span lang="en" className="font-bold text-strong">
                      “{m.audio}”
                    </span>{" "}
                    — {m.es} <span className="text-ui-gray">(Respuesta: {m.answer})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            {!wonCombat && (
              <Button
                variant="teal"
                onClick={() =>
                  onEnd({
                    won: false,
                    stars: 0,
                    correct: stats.correct,
                    answered: stats.answered,
                    bestCombo: cs.bestCombo,
                  })
                }
              >
                Volver al mapa y reintentar
              </Button>
            )}
            {wonCombat && (
              <Button
                variant="teal"
                onClick={() =>
                  onEnd({
                    won: true,
                    stars,
                    correct: stats.correct,
                    answered: stats.answered,
                    bestCombo: cs.bestCombo,
                  })
                }
              >
                Continuar la campaña
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const weakness = encounter.weaknessHint;
  const comboMul = comboMultiplier(cs.combo + 1);

  return (
    <section className="space-y-4" aria-label={`Combate contra ${encounter.name}`}>
      {/* ---------- Arena ---------- */}
      <div
        className="arena-stage min-h-[20rem] rounded-3xl border border-border shadow-pop sm:min-h-[24rem]"
        style={{ backgroundImage: `url(${ARENAS[region.arena]})` }}
      >
        {anim.flash && (
          <span
            key={`f${anim.key}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 animate-flash bg-yellow"
          />
        )}

        {/* Barra superior: objetivo y turno */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold tracking-wider text-strong shadow-card">
            <Target aria-hidden className="size-4" /> {encounter.objectiveLabel}
            {encounter.objective === "survive" &&
              ` · ${Math.min(cs.turn, encounter.surviveTurns ?? 0)}/${encounter.surviveTurns} turnos`}
          </span>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold text-strong shadow-card">
            Turno {cs.turn + 1}
            {weakness && weakness !== "none" && (
              <span>· Debilidad: {weakKnown ? ELEMENT_ES[weakness] : "¿? (escucha)"}</span>
            )}
          </span>
        </div>

        {banner && (
          <p
            role="status"
            className="absolute inset-x-4 top-16 z-10 mx-auto max-w-lg animate-pop-in rounded-2xl bg-strong/85 px-4 py-3 text-center font-display text-lg text-card"
          >
            {banner}
          </p>
        )}

        <div className="flex items-end justify-between gap-2 px-3 pb-4 pt-6 sm:px-8">
          {/* Héroe + aliado */}
          <div className="relative flex w-[38%] flex-col items-center">
            <Bar label="Kai" value={cs.heroHp} max={HERO_MAX_HP} tone="hero" />
            <div className="relative">
              <img
                key={`h${anim.key}`}
                src={heroImg.url}
                alt="Kai, tu héroe"
                className={cn(
                  "sprite-shadow h-32 w-32 object-contain sm:h-48 sm:w-48",
                  !reducedMotion &&
                    (anim.hero === "lunge"
                      ? "animate-lunge"
                      : anim.hero === "shake"
                        ? "animate-shake"
                        : "animate-idle"),
                )}
              />
              {cs.blockNext && (
                <span
                  className="absolute -right-2 top-4 inline-flex size-9 items-center justify-center rounded-full bg-blue text-strong shadow-card"
                  title="Bloqueo activo"
                >
                  <Shield aria-hidden className="size-5" />
                  <span className="sr-only">Bloqueo activo</span>
                </span>
              )}
              {cs.weakenedTurns > 0 && (
                <span className="absolute -left-2 top-4 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-xs font-extrabold text-ink-blue shadow-card">
                  <Snowflake aria-hidden className="size-3.5" /> Lento {cs.weakenedTurns}
                </span>
              )}
              <FxLayer fx={fx} target="hero" />
            </div>
            {cs.ally && (
              <div className="relative mt-1 w-full max-w-36">
                <Bar
                  label={cs.ally.name}
                  value={cs.ally.hp}
                  max={cs.ally.maxHp}
                  tone="ally"
                  small
                />
                <FxLayer fx={fx} target="ally" />
              </div>
            )}
          </div>

          {/* Enemigos */}
          <ul className="flex w-[60%] flex-wrap items-end justify-end gap-1 sm:gap-3">
            {cs.enemies.map((e, i) => {
              const dead = e.hp <= 0;
              const big = encounter.isBoss && i === 0;
              const size = (e.def.scale ?? 1) * (cs.enemies.length > 2 ? 0.75 : 1);
              return (
                <li
                  key={`${e.def.id}-${i}`}
                  className={cn(
                    "relative flex flex-col items-center transition-opacity duration-500",
                    dead && "opacity-0",
                  )}
                  aria-hidden={dead}
                >
                  <Bar
                    label={`${e.def.name}${e.shield ? ` · escudo ${e.shield}` : ""}`}
                    value={e.hp}
                    max={e.maxHp}
                    tone={big ? "boss" : "enemy"}
                    small={!big}
                  />
                  {i === target && !dead && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow px-2 text-xs font-extrabold text-strong">
                      <Target aria-hidden className="size-3" /> Objetivo
                    </span>
                  )}
                  {e.def.behaviour === "charger" ||
                  (big && encounter.phases?.[cs.phase - 1]?.behaviour === "charger")
                    ? e.charge > 0 && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-salmon px-2 text-xs font-extrabold text-strong">
                          <Gauge aria-hidden className="size-3" /> Carga {e.charge}/3
                        </span>
                      )
                    : null}
                  <div className="relative">
                    <img
                      key={anim.enemy === i ? `e${anim.key}` : `e${i}`}
                      src={SPRITES[e.def.sprite]}
                      alt={e.def.name}
                      style={{ width: `${Math.round(9 * size)}rem` }}
                      className={cn(
                        "sprite-shadow max-w-[42vw] object-contain",
                        e.shield > 0 && "drop-shadow-[0_0_10px_var(--ludik-blue)]",
                        !reducedMotion && (anim.enemy === i ? "animate-shake" : "animate-idle"),
                      )}
                    />
                    <FxLayer fx={fx} target={i} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ---------- Medidores ---------- */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="flex items-center justify-between text-sm font-extrabold text-strong">
            <span className="inline-flex items-center gap-1">
              <Sparkles aria-hidden className="size-4 text-ink-blue" /> ECHO ENERGY
            </span>
            <span>
              {cs.energy}/{ENERGY_MAX}
            </span>
          </div>
          <div
            className="mt-1 h-4 overflow-hidden rounded-full bg-muted shadow-inset"
            role="progressbar"
            aria-label="Echo Energy"
            aria-valuemin={0}
            aria-valuemax={ENERGY_MAX}
            aria-valuenow={cs.energy}
          >
            <div
              className="energy-fill bar-shine h-full rounded-full transition-[width] duration-500"
              style={{ width: `${cs.energy}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-muted px-3 py-2 text-center">
            <span className="block text-xs font-extrabold text-ui-gray">ECHO COMBO</span>
            <span className="font-display text-xl text-strong">
              {cs.combo} <span className="text-sm">· ×{comboMul}</span>
            </span>
          </span>
          <Button
            variant="cobalt"
            disabled={cs.energy < ENERGY_MAX || phase !== "question"}
            onClick={blast}
            className={cn(cs.energy >= ENERGY_MAX && !reducedMotion && "animate-pulse-soft")}
          >
            <Sparkles aria-hidden /> Echo Blast
          </Button>
        </div>
      </div>

      {phase === "intro" ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <h2 className="font-display text-2xl text-strong">{encounter.name}</h2>
          <p className="mt-2 text-lg">{encounter.intro}</p>
          <p className="mt-2 font-bold text-strong">{encounter.objectiveText}</p>
          {!tts && (
            <p className="mt-3 rounded-xl bg-warning-soft p-3 text-sm font-bold text-strong">
              Tu navegador no puede leer en voz alta: verás el texto de cada audio.
            </p>
          )}
          <Button size="lg" variant="teal" className="mt-5" onClick={() => setPhase("question")}>
            <Volume2 aria-hidden /> Empezar a escuchar
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
          {/* ---------- Desafío auditivo ---------- */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs font-extrabold tracking-wider text-ink-teal">
              {MODE_LABEL[challenge.mode]}
            </p>
            <h2 ref={qHeading} tabIndex={-1} className="mt-1 font-display text-2xl text-strong">
              {challenge.question}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="teal" onClick={() => play()} disabled={!tts}>
                <Volume2 aria-hidden /> Escuchar
              </Button>
              <Button variant="outline" onClick={() => play(0.6)} disabled={!tts}>
                <Turtle aria-hidden /> Más despacio
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowText((v) => !v)}
                aria-expanded={showText || !tts}
              >
                {showText || !tts ? "Ocultar texto" : "Ver texto (ayuda)"}
              </Button>
            </div>
            {(showText || !tts || phase === "feedback") && (
              <p className="mt-3 rounded-2xl bg-muted p-3">
                <span lang="en" className="block font-bold text-strong">
                  “{challenge.audio}”
                </span>
                <span className="text-sm">{challenge.es}</span>
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="group" aria-label="Respuestas">
              {options.map((o) => {
                const isAnswer = o === challenge.answer;
                const picked = feedback?.picked === o;
                const out = removed === o;
                return (
                  <button
                    key={o}
                    lang="en"
                    type="button"
                    disabled={phase !== "question" || out}
                    onClick={() => answer(o)}
                    className={cn(
                      "btn-3d flex min-h-14 items-center gap-2 rounded-2xl border-2 px-4 py-3 text-left text-lg font-extrabold text-strong [--btn-shadow:var(--color-border)] disabled:cursor-default",
                      phase === "feedback" && isAnswer
                        ? "border-success bg-success-soft"
                        : phase === "feedback" && picked
                          ? "border-destructive bg-warning-soft"
                          : out
                            ? "border-border bg-muted line-through opacity-50"
                            : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    {phase === "feedback" && isAnswer && (
                      <Check aria-hidden className="size-5 shrink-0 text-success" />
                    )}
                    {phase === "feedback" && picked && !isAnswer && (
                      <Skull aria-hidden className="size-5 shrink-0 text-destructive" />
                    )}
                    {o}
                    {out && <span className="sr-only"> (descartada)</span>}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                role="status"
                className={cn(
                  "mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 p-4",
                  feedback.ok ? "border-success bg-success-soft" : "border-warning bg-warning-soft",
                )}
              >
                <p className="min-w-0 flex-1 basis-56 font-bold text-strong">
                  {feedback.ok
                    ? `¡Correcto! Kai usa ${ABILITIES[ability].name}. ${feedback.text}`
                    : `Casi. La respuesta era “${challenge.answer}”: ${challenge.es} ${feedback.text}`}
                </p>
                <Button onClick={next} autoFocus>
                  {cs.status === "playing" ? "Siguiente turno" : "Ver resultado"}
                </Button>
              </div>
            )}
          </div>

          {/* ---------- Habilidades y gadgets ---------- */}
          <div className="space-y-4">
            <fieldset className="rounded-3xl border border-border bg-card p-4 shadow-card">
              <legend className="sr-only">Habilidad para tu próximo acierto</legend>
              <p className="text-sm font-extrabold uppercase tracking-wide text-ui-gray">
                Habilidad al acertar
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(ABILITIES) as AbilityId[]).map((a) => {
                  const A = ABILITIES[a];
                  const Icon = ABILITY_ICON[a];
                  const on = ability === a;
                  return (
                    <label
                      key={a}
                      className={cn(
                        "flex min-h-11 cursor-pointer flex-col items-center rounded-xl border-2 p-2 text-center text-xs transition has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-cobalt",
                        on ? "border-orange bg-orange/20" : "border-border hover:bg-muted",
                      )}
                      title={A.description}
                    >
                      <input
                        type="radio"
                        name="ability"
                        className="sr-only"
                        checked={on}
                        onChange={() => setAbility(a)}
                        disabled={phase !== "question"}
                      />
                      <Icon aria-hidden className="size-6 text-strong" />
                      <span className="font-extrabold text-strong">{A.name}</span>
                      <span>{A.description}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
              <p className="text-sm font-extrabold uppercase tracking-wide text-ui-gray">Gadgets</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(GADGETS) as GadgetId[]).map((g) => {
                  const G = GADGETS[g];
                  const done = used.has(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      disabled={done || phase !== "question"}
                      onClick={() => gadget(g)}
                      className="flex min-h-11 flex-col items-center gap-1 rounded-xl border-2 border-border p-2 text-center text-xs font-bold text-strong hover:bg-muted disabled:opacity-45"
                      title={G.description}
                    >
                      <span
                        className={cn(
                          "inline-flex size-9 items-center justify-center rounded-lg",
                          G.tone,
                        )}
                      >
                        <G.icon aria-hidden className="size-5" />
                      </span>
                      {G.name}
                      <span className="font-normal">{done ? "Usado" : G.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      <LiveRegion message={live} />
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
  small,
}: {
  label: string;
  value: number;
  max: number;
  tone: "hero" | "enemy" | "boss" | "ally";
  small?: boolean;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const fill = {
    hero: "bg-teal",
    ally: "bg-yellow",
    enemy: "bg-salmon",
    boss: "bg-orange",
  }[tone];
  return (
    <div
      className={cn(
        "glass w-full rounded-xl px-2 py-1 shadow-card",
        small ? "max-w-36" : "max-w-56",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-strong">
        <span className="truncate">
          {tone === "boss" && <Crown aria-hidden className="mr-1 inline size-3.5" />}
          {label}
        </span>
        <span className="shrink-0">
          {value}/{max}
        </span>
      </div>
      <div
        className={cn("hp-track mt-0.5 overflow-hidden rounded-full", small ? "h-2" : "h-3")}
        role="progressbar"
        aria-label={`Vida de ${label}`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className={cn("bar-shine h-full rounded-full transition-[width] duration-500", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FxLayer({ fx, target }: { fx: Fx[]; target: Fx["target"] }) {
  const mine = fx.filter((f) => f.target === target);
  if (!mine.length) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3">
      {mine.map((f, i) => (
        <span
          key={f.id}
          style={{ top: `${i * -22}px` }}
          className={cn(
            "absolute left-1/2 animate-float-up whitespace-nowrap rounded-full px-2 font-display text-2xl",
            f.tone === "dmg"
              ? "bg-card text-destructive"
              : f.tone === "heal"
                ? "bg-card text-success"
                : "bg-yellow text-strong",
          )}
        >
          {f.text}
        </span>
      ))}
    </span>
  );
}
