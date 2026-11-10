/* ============================================================
 * Listen Up! — motor de combate por turnos (lógica pura, testeable)
 * Daño, ECHO COMBO, ECHO ENERGY, escudos, debilidades, fases de
 * jefe, comportamientos de enemigos y condiciones de victoria.
 * No conoce React: recibe un estado y devuelve el siguiente + eventos.
 * ============================================================ */

export type Element = "fire" | "ice" | "thunder" | "none";
export type Behaviour =
  | "basic" // ataques simples y frecuentes
  | "fast" // golpea 1,5× al fallar
  | "ranged" // ataca a distancia: ignora el bloqueo de Ice Shield
  | "charger" // carga un golpe enorme cada 3 turnos (se interrumpe acertando)
  | "healer" // cura al aliado más herido
  | "protector" // mientras vive, protege a sus aliados
  | "debuff" // magia: te debilita 2 turnos
  | "tank"; // mucha vida, golpe medio
export type Objective =
  "defeat" | "target" | "survive" | "shield" | "weakness" | "protect" | "boss";
export type SpriteKey =
  | "goblin"
  | "slime"
  | "archer"
  | "imp"
  | "golem"
  | "shieldbearer"
  | "wolf"
  | "witch"
  | "crystal"
  | "guardian"
  | "titan"
  | "dragon";

export interface EnemyDef {
  id: string;
  name: string;
  sprite: SpriteKey;
  hp: number;
  atk: number;
  behaviour: Behaviour;
  weakness?: Element;
  resist?: Element;
  /** Golpes necesarios para romper el escudo antes de hacer daño. */
  shield?: number;
  /** Objetivo prioritario (p. ej. el slime peligroso). */
  dangerous?: boolean;
  /** Tamaño visual relativo. */
  scale?: number;
}

export interface BossPhase {
  /** Fracción de vida (0–1) por debajo de la cual empieza esta fase. */
  below: number;
  name: string;
  line: string;
  atkMul: number;
  behaviour: Behaviour;
  /** Enemigo pequeño que invoca al entrar en la fase. */
  summon?: EnemyDef;
}

export type AbilityId = "fire" | "ice" | "thunder" | "double";
export type WeaponId = "sword" | "hammer" | "staff" | "blaster";
export type CompanionId = "pip" | "flame" | "frosty" | "spark";

export interface Ability {
  id: AbilityId;
  name: string;
  element: Element;
  power: number;
  hits: number;
  blocks?: boolean;
  description: string;
}

export const ABILITIES: Record<AbilityId, Ability> = {
  fire: {
    id: "fire",
    name: "Fire Punch",
    element: "fire",
    power: 20,
    hits: 1,
    description: "Golpe de fuego.",
  },
  ice: {
    id: "ice",
    name: "Ice Shield",
    element: "ice",
    power: 12,
    hits: 1,
    blocks: true,
    description: "Golpe de hielo y bloquea el próximo ataque.",
  },
  thunder: {
    id: "thunder",
    name: "Thunder Strike",
    element: "thunder",
    power: 20,
    hits: 1,
    description: "Rayo eléctrico.",
  },
  double: {
    id: "double",
    name: "Double Attack",
    element: "none",
    power: 11,
    hits: 2,
    description: "Dos golpes: ideal para romper escudos.",
  },
};

export const WEAPONS: Record<
  WeaponId,
  { name: string; nameEs: string; rarity: string; description: string }
> = {
  sword: {
    name: "Echo Sword",
    nameEs: "Espada Eco",
    rarity: "Común",
    description: "+15 % de daño.",
  },
  hammer: {
    name: "Quake Hammer",
    nameEs: "Martillo Sísmico",
    rarity: "Rara",
    description: "Cada golpe rompe 1 escudo extra.",
  },
  staff: {
    name: "Sound Staff",
    nameEs: "Bastón Sonoro",
    rarity: "Rara",
    description: "+10 de Echo Energy por acierto.",
  },
  blaster: {
    name: "Wave Blaster",
    nameEs: "Bláster de Ondas",
    rarity: "Épica",
    description: "+30 % de daño contra jefes.",
  },
};

export const COMPANIONS: Record<CompanionId, { name: string; description: string }> = {
  pip: { name: "Pip", description: "Te cura 10 de vida cada 3 aciertos seguidos." },
  flame: { name: "Flame", description: "Tus ataques de fuego hacen +25 % de daño." },
  frosty: { name: "Frosty", description: "Empiezas cada combate con un bloqueo de hielo." },
  spark: { name: "Spark", description: "+10 de Echo Energy por acierto." },
};

export const HERO_MAX_HP = 100;
export const ENERGY_MAX = 100;
export const ECHO_BLAST_POWER = 50;

export interface EnemyState {
  def: EnemyDef;
  hp: number;
  maxHp: number;
  shield: number;
  charge: number;
}

export interface CombatSetup {
  enemies: EnemyDef[];
  objective: Objective;
  surviveTurns?: number;
  ally?: { name: string; hp: number };
  phases?: BossPhase[];
  isBoss?: boolean;
}

export interface Loadout {
  weapon: WeaponId;
  companion: CompanionId;
}

export interface CombatState {
  heroHp: number;
  enemies: EnemyState[];
  ally: { name: string; hp: number; maxHp: number } | null;
  turn: number;
  combo: number;
  bestCombo: number;
  energy: number;
  blockNext: boolean;
  weakenedTurns: number;
  phase: number;
  status: "playing" | "won" | "lost";
}

export type CombatEvent =
  | {
      kind: "hit";
      target: number;
      amount: number;
      element: Element;
      effective: "weak" | "resist" | "normal";
    }
  | { kind: "shield"; target: number; left: number }
  | { kind: "defeat"; target: number }
  | { kind: "blast"; amount: number }
  | { kind: "heroHurt"; amount: number; by: string }
  | { kind: "allyHurt"; amount: number; by: string }
  | { kind: "blocked"; by: string }
  | { kind: "heal"; amount: number; who: "hero" | "enemy" | "ally"; name: string }
  | { kind: "charge"; by: string; level: number }
  | { kind: "interrupt"; by: string }
  | { kind: "debuff"; by: string }
  | { kind: "phase"; name: string; line: string }
  | { kind: "summon"; name: string };

/* ---------- Reglas básicas ---------- */

/** Multiplicador del ECHO COMBO según aciertos consecutivos. */
export function comboMultiplier(combo: number): number {
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  if (combo >= 2) return 1.25;
  return 1;
}

/** Un error no arruina la partida: el combo se reduce a la mitad. */
export const comboAfterMiss = (combo: number) => Math.floor(combo / 2);

export function energyGain(loadout: Loadout): number {
  return 25 + (loadout.weapon === "staff" ? 10 : 0) + (loadout.companion === "spark" ? 10 : 0);
}

export function elementMultiplier(
  def: EnemyDef,
  element: Element,
): { mul: number; effective: "weak" | "resist" | "normal" } {
  if (element !== "none" && def.weakness === element) return { mul: 2, effective: "weak" };
  if (element !== "none" && def.resist === element) return { mul: 0.5, effective: "resist" };
  return { mul: 1, effective: "normal" };
}

export function createCombat(setup: CombatSetup, loadout: Loadout): CombatState {
  return {
    heroHp: HERO_MAX_HP,
    enemies: setup.enemies.map(toEnemyState),
    ally: setup.ally ? { name: setup.ally.name, hp: setup.ally.hp, maxHp: setup.ally.hp } : null,
    turn: 0,
    combo: 0,
    bestCombo: 0,
    energy: 0,
    blockNext: loadout.companion === "frosty",
    weakenedTurns: 0,
    phase: 0,
    status: "playing",
  };
}

function toEnemyState(def: EnemyDef): EnemyState {
  return { def, hp: def.hp, maxHp: def.hp, shield: def.shield ?? 0, charge: 0 };
}

const alive = (e: EnemyState) => e.hp > 0;

/** Objetivo prioritario: protector vivo → enemigo peligroso → primero vivo. */
export function pickTarget(enemies: EnemyState[]): number {
  const protector = enemies.findIndex((e) => alive(e) && e.def.behaviour === "protector");
  if (protector >= 0) return protector;
  const danger = enemies.findIndex((e) => alive(e) && e.def.dangerous);
  if (danger >= 0) return danger;
  return enemies.findIndex(alive);
}

function cloneState(s: CombatState): CombatState {
  return { ...s, enemies: s.enemies.map((e) => ({ ...e })), ally: s.ally ? { ...s.ally } : null };
}

/* ---------- Ataque del héroe (respuesta correcta) ---------- */

export function heroAttack(
  prev: CombatState,
  setup: CombatSetup,
  loadout: Loadout,
  abilityId: AbilityId,
): { state: CombatState; events: CombatEvent[] } {
  const s = cloneState(prev);
  const events: CombatEvent[] = [];
  const ability = ABILITIES[abilityId];
  s.combo += 1;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  s.energy = Math.min(ENERGY_MAX, s.energy + energyGain(loadout));
  if (ability.blocks) s.blockNext = true;

  const t = pickTarget(s.enemies);
  const target = s.enemies[t];
  if (target) {
    for (let h = 0; h < ability.hits && target.hp > 0; h++) {
      if (target.shield > 0) {
        target.shield = Math.max(0, target.shield - 1 - (loadout.weapon === "hammer" ? 1 : 0));
        events.push({ kind: "shield", target: t, left: target.shield });
        continue;
      }
      const amount = damageFor(target.def, ability, s, setup, loadout);
      target.hp = Math.max(0, target.hp - amount);
      events.push({
        kind: "hit",
        target: t,
        amount,
        element: ability.element,
        effective: elementMultiplier(target.def, ability.element).effective,
      });
      if (target.hp === 0) events.push({ kind: "defeat", target: t });
    }
  }

  if (loadout.companion === "pip" && s.combo > 0 && s.combo % 3 === 0) {
    const healed = Math.min(10, HERO_MAX_HP - s.heroHp);
    if (healed > 0) {
      s.heroHp += healed;
      events.push({ kind: "heal", amount: healed, who: "hero", name: "Pip" });
    }
  }
  applyPhase(s, setup, events);
  return { state: s, events };
}

export function damageFor(
  def: EnemyDef,
  ability: Ability,
  s: Pick<CombatState, "combo" | "weakenedTurns">,
  setup: Pick<CombatSetup, "isBoss">,
  loadout: Loadout,
): number {
  let dmg = ability.power * comboMultiplier(s.combo) * elementMultiplier(def, ability.element).mul;
  if (loadout.weapon === "sword") dmg *= 1.15;
  if (loadout.weapon === "blaster" && setup.isBoss) dmg *= 1.3;
  if (loadout.companion === "flame" && ability.element === "fire") dmg *= 1.25;
  if (s.weakenedTurns > 0) dmg *= 0.7;
  return Math.max(1, Math.round(dmg));
}

/** Ataque definitivo: daña a todos los enemigos y rompe escudos. */
export function echoBlast(
  prev: CombatState,
  setup: CombatSetup,
): { state: CombatState; events: CombatEvent[] } {
  if (prev.energy < ENERGY_MAX) return { state: prev, events: [] };
  const s = cloneState(prev);
  const events: CombatEvent[] = [{ kind: "blast", amount: ECHO_BLAST_POWER }];
  s.energy = 0;
  s.enemies.forEach((e, i) => {
    if (!alive(e)) return;
    e.shield = 0;
    e.hp = Math.max(0, e.hp - ECHO_BLAST_POWER);
    events.push({
      kind: "hit",
      target: i,
      amount: ECHO_BLAST_POWER,
      element: "none",
      effective: "normal",
    });
    if (e.hp === 0) events.push({ kind: "defeat", target: i });
  });
  applyPhase(s, setup, events);
  s.status = checkStatus(s, setup);
  return { state: s, events };
}

/** Cambio de fase del jefe según la vida restante del primer enemigo (el jefe). */
function applyPhase(s: CombatState, setup: CombatSetup, events: CombatEvent[]) {
  const boss = s.enemies[0];
  if (!setup.phases?.length || !boss || boss.hp <= 0) return;
  const frac = boss.hp / boss.maxHp;
  let next = s.phase;
  setup.phases.forEach((p, i) => {
    if (frac <= p.below && i + 1 > next) next = i + 1;
  });
  while (s.phase < next) {
    s.phase += 1;
    const p = setup.phases[s.phase - 1];
    if (!p) break;
    events.push({ kind: "phase", name: p.name, line: p.line });
    boss.charge = 0;
    if (p.summon) {
      s.enemies.push(toEnemyState(p.summon));
      events.push({ kind: "summon", name: p.summon.name });
    }
  }
}

/** Comportamiento actual de un enemigo (los jefes cambian por fase). */
export function currentBehaviour(s: CombatState, setup: CombatSetup, index: number): Behaviour {
  const e = s.enemies[index];
  if (!e) return "basic";
  if (index === 0 && setup.phases && s.phase > 0)
    return setup.phases[s.phase - 1]?.behaviour ?? e.def.behaviour;
  return e.def.behaviour;
}

function atkMul(s: CombatState, setup: CombatSetup, index: number) {
  if (index === 0 && setup.phases && s.phase > 0) return setup.phases[s.phase - 1]?.atkMul ?? 1;
  return 1;
}

/* ---------- Turno enemigo (tras cada respuesta) ---------- */

export function enemyTurn(
  prev: CombatState,
  setup: CombatSetup,
  answeredCorrectly: boolean,
): { state: CombatState; events: CombatEvent[] } {
  const s = cloneState(prev);
  const events: CombatEvent[] = [];
  s.turn += 1;
  if (!answeredCorrectly) s.combo = comboAfterMiss(s.combo);

  const hasProtector = s.enemies.some((e) => alive(e) && e.def.behaviour === "protector");

  s.enemies.forEach((e, i) => {
    if (!alive(e)) return;
    const b = currentBehaviour(s, setup, i);
    const mul = atkMul(s, setup, i);
    const name = e.def.name;

    // Los cargadores acumulan cada turno; al tercero liberan su golpe.
    if (b === "charger") {
      e.charge += 1;
      if (e.charge >= 3) {
        e.charge = 0;
        if (answeredCorrectly) {
          events.push({ kind: "interrupt", by: name });
        } else {
          hurt(s, events, Math.round(e.def.atk * 2.5 * mul), name, setup, b);
        }
      } else {
        events.push({ kind: "charge", by: name, level: e.charge });
        if (!answeredCorrectly) hurt(s, events, Math.round(e.def.atk * 0.5 * mul), name, setup, b);
      }
      return;
    }

    if (answeredCorrectly) return; // esquivaste: solo actúan al fallar

    if (b === "healer") {
      const wounded = s.enemies
        .map((x, j) => ({ x, j }))
        .filter(({ x }) => alive(x) && x.hp < x.maxHp)
        .sort((a, c) => a.x.hp / a.x.maxHp - c.x.hp / c.x.maxHp)[0];
      if (wounded) {
        const amount = Math.min(15, wounded.x.maxHp - wounded.x.hp);
        wounded.x.hp += amount;
        events.push({ kind: "heal", amount, who: "enemy", name: wounded.x.def.name });
      }
      hurt(s, events, Math.round(e.def.atk * 0.5 * mul), name, setup, b);
      return;
    }
    if (b === "debuff") {
      s.weakenedTurns = 2;
      events.push({ kind: "debuff", by: name });
      hurt(s, events, Math.round(e.def.atk * mul), name, setup, b);
      return;
    }
    const factor = b === "fast" ? 1.5 : b === "protector" ? 0.5 : 1;
    // Un protector vivo reduce el daño que hacen sus aliados (está ocupado cubriéndolos).
    const cover = hasProtector && b !== "protector" ? 0.8 : 1;
    hurt(s, events, Math.round(e.def.atk * factor * cover * mul), name, setup, b);
  });

  if (s.weakenedTurns > 0 && answeredCorrectly) s.weakenedTurns -= 1;
  s.status = checkStatus(s, setup);
  return { state: s, events };
}

function hurt(
  s: CombatState,
  events: CombatEvent[],
  amount: number,
  by: string,
  setup: CombatSetup,
  b: Behaviour,
) {
  if (amount <= 0) return;
  if (s.blockNext && b !== "ranged") {
    s.blockNext = false;
    events.push({ kind: "blocked", by });
    return;
  }
  // En "proteger", el aliado recibe la mitad del golpe.
  if (setup.objective === "protect" && s.ally && s.ally.hp > 0) {
    const toAlly = Math.ceil(amount / 2);
    s.ally.hp = Math.max(0, s.ally.hp - toAlly);
    events.push({ kind: "allyHurt", amount: toAlly, by });
    amount -= toAlly;
  }
  s.heroHp = Math.max(0, s.heroHp - amount);
  events.push({ kind: "heroHurt", amount, by });
}

/* ---------- Gadgets ---------- */

export function applyHealingStation(prev: CombatState): CombatState {
  return { ...prev, heroHp: Math.min(HERO_MAX_HP, prev.heroHp + 30) };
}
export function applySonicShield(prev: CombatState): CombatState {
  return { ...prev, blockNext: true };
}

/* ---------- Victoria / derrota ---------- */

export function checkStatus(s: CombatState, setup: CombatSetup): CombatState["status"] {
  if (s.heroHp <= 0) return "lost";
  if (setup.objective === "protect" && s.ally && s.ally.hp <= 0) return "lost";
  if (s.enemies.every((e) => !alive(e))) return "won";
  if (setup.objective === "survive" && setup.surviveTurns && s.turn >= setup.surviveTurns)
    return "won";
  return "playing";
}

/** Tras el ataque del héroe, ¿ya ganó? (sin esperar al turno enemigo). */
export function afterHeroCheck(s: CombatState, setup: CombatSetup): CombatState {
  return { ...s, status: checkStatus(s, setup) };
}

/* ---------- Recompensas y puntaje ---------- */

export function combatStars(heroHp: number, correct: number, answered: number): 1 | 2 | 3 {
  const acc = answered ? correct / answered : 0;
  if (acc >= 0.9 && heroHp >= 50) return 3;
  if (acc >= 0.7) return 2;
  return 1;
}
