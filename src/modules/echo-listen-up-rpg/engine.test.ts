import { describe, expect, it } from "vitest";
import {
  comboAfterMiss,
  comboMultiplier,
  createCombat,
  echoBlast,
  enemyTurn,
  heroAttack,
  type CombatSetup,
  type Loadout,
} from "./engine";
import { ALL_CHALLENGES, REGIONS } from "./content";

const plain: Loadout = { weapon: "staff", companion: "pip" };

describe("Listen Up! engine", () => {
  it("combo multiplier: 1× → 1.25× (2) → 1.5× (3) → 2× (5+)", () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.25);
    expect(comboMultiplier(3)).toBe(1.5);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(9)).toBe(2);
  });

  it("a miss halves the combo instead of resetting it", () => {
    expect(comboAfterMiss(6)).toBe(3);
    expect(comboAfterMiss(1)).toBe(0);
  });

  it("a 3-hit shield absorbs three single hits before any damage", () => {
    const setup: CombatSetup = {
      objective: "shield",
      enemies: [
        {
          id: "b",
          name: "Bearer",
          sprite: "shieldbearer",
          hp: 50,
          atk: 10,
          behaviour: "protector",
          shield: 3,
        },
      ],
    };
    let s = createCombat(setup, plain);
    for (let i = 0; i < 3; i++) s = heroAttack(s, setup, plain, "fire").state;
    expect(s.enemies[0]?.shield).toBe(0);
    expect(s.enemies[0]?.hp).toBe(50);
    s = heroAttack(s, setup, plain, "fire").state;
    expect(s.enemies[0]?.hp).toBeLessThan(50);
  });

  it("weakness doubles damage and resistance halves it", () => {
    const setup: CombatSetup = {
      objective: "weakness",
      enemies: [
        {
          id: "g",
          name: "Golem",
          sprite: "golem",
          hp: 200,
          atk: 10,
          behaviour: "tank",
          weakness: "thunder",
          resist: "fire",
        },
      ],
    };
    const s0 = createCombat(setup, plain);
    const thunder = heroAttack(s0, setup, plain, "thunder").state.enemies[0]?.hp ?? 0;
    const fire = heroAttack(s0, setup, plain, "fire").state.enemies[0]?.hp ?? 0;
    expect(200 - thunder).toBe(40); // 20 × 2
    expect(200 - fire).toBe(10); // 20 × 0.5
  });

  it("a charger releases its big hit on turn 3 unless you answer correctly", () => {
    const setup: CombatSetup = {
      objective: "weakness",
      enemies: [
        { id: "g", name: "Golem", sprite: "golem", hp: 200, atk: 10, behaviour: "charger" },
      ],
    };
    let s = createCombat(setup, plain);
    s = enemyTurn(s, setup, true).state;
    s = enemyTurn(s, setup, true).state;
    const interrupted = enemyTurn(s, setup, true);
    expect(interrupted.events.some((e) => e.kind === "interrupt")).toBe(true);
    expect(interrupted.state.heroHp).toBe(100);
    const hit = enemyTurn(s, setup, false);
    expect(hit.state.heroHp).toBe(75); // 10 × 2.5
  });

  it("Echo Blast needs a full meter and hits every enemy for 50", () => {
    const setup = REGIONS.forest.encounters[1] as CombatSetup;
    const s0 = createCombat(setup, plain);
    expect(echoBlast(s0, setup).events).toHaveLength(0);
    const full = { ...s0, energy: 100 };
    const r = echoBlast(full, setup);
    expect(r.state.energy).toBe(0);
    expect(r.state.status).toBe("won"); // 40/20/20 HP slimes
  });

  it("survive objective is won after the required turns", () => {
    const setup = REGIONS.forest.encounters[2] as CombatSetup;
    let s = createCombat(setup, plain);
    for (let i = 0; i < 5; i++) s = enemyTurn(s, setup, true).state;
    expect(s.status).toBe("won");
  });

  it("campaign has 12 encounters and 60 distinct listening challenges", () => {
    const encounters = Object.values(REGIONS).flatMap((r) => r.encounters);
    expect(encounters).toHaveLength(12);
    expect(encounters.filter((e) => e.kind === "boss")).toHaveLength(3);
    expect(new Set(ALL_CHALLENGES.map((c) => c.audio)).size).toBe(60);
  });
});
