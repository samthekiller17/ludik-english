/* Pruebas de las reglas de gamificación, planes y registro de módulos (sección 16.7). */
import { describe, expect, it } from "vitest";
import { applyResult, nodeStatus, starsFor, updateStreak, visibleStreak } from "@/services/rules";
import { formatCop, hasFeature, hasPlan, PLANS } from "@/data/plans";
import { PATHS, ALL_NODES } from "@/data/paths";
import { getModule, isLevelPlayable } from "@/data/modules.registry";
import { createSeedState } from "@/store/seed";
import type { ModuleResult, PathNode } from "@/types/ludik";

const node = (id: string, extra: Partial<PathNode> = {}): PathNode => ({
  id,
  skillId: "lexi",
  order: 1,
  title: id,
  description: "",
  level: "A1",
  moduleId: "lexi-repairing-library",
  levelId: "A1-1",
  type: "lesson",
  minutes: 5,
  reward: { xp: 10, coins: 1 },
  ...extra,
});

describe("estrellas", () => {
  it("3 estrellas desde 90 %", () => {
    expect(starsFor(90)).toBe(3);
    expect(starsFor(89)).toBe(2);
  });
  it("2 estrellas desde 70 %, 1 por debajo", () => {
    expect(starsFor(70)).toBe(2);
    expect(starsFor(69)).toBe(1);
    expect(starsFor(0)).toBe(1);
  });
});

describe("desbloqueo de niveles", () => {
  const path = [node("a"), node("b"), node("c", { requiresPlan: "plus" })];
  it("el primer nivel siempre está disponible", () => {
    expect(nodeStatus(path, 0, {}, "free")).toBe("available");
  });
  it("el siguiente se abre con 2 estrellas en el anterior", () => {
    const p1 = { a: { stars: 1, bestScore: 60, attempts: 1, lastPlayed: "" } };
    const p2 = { a: { stars: 2, bestScore: 75, attempts: 1, lastPlayed: "" } };
    expect(nodeStatus(path, 1, p1, "free")).toBe("locked");
    expect(nodeStatus(path, 1, p2, "free")).toBe("available");
  });
  it("el contenido Plus queda bloqueado para el plan Gratis", () => {
    expect(nodeStatus(path, 2, {}, "free")).toBe("plan-locked");
    expect(nodeStatus(path, 2, {}, "super")).not.toBe("plan-locked");
  });
});

describe("racha diaria", () => {
  it("suma un día si jugaste ayer", () => {
    const s = updateStreak({ current: 4, best: 4, lastActiveDate: "2026-03-09" }, "2026-03-10");
    expect(s).toEqual({ current: 5, best: 5, lastActiveDate: "2026-03-10" });
  });
  it("vuelve a 1 si se rompió, conservando la mejor", () => {
    const s = updateStreak({ current: 4, best: 9, lastActiveDate: "2026-03-01" }, "2026-03-10");
    expect(s.current).toBe(1);
    expect(s.best).toBe(9);
  });
  it("se muestra en 0 si pasó más de un día", () => {
    expect(visibleStreak({ current: 4, best: 4, lastActiveDate: "2026-03-07" }, "2026-03-10")).toBe(
      0,
    );
  });
});

describe("guardar resultado", () => {
  it("suma XP y monedas y conserva las mejores estrellas", () => {
    const state = createSeedState();
    const result: ModuleResult = {
      userId: state.user.id,
      skillId: "lexi",
      moduleId: "lexi-repairing-library",
      levelId: "A1-2",
      nodeId: "lexi-a1-2",
      stage: "final",
      score: 95,
      xp: 80,
      coins: 12,
      stars: 3,
      correct: 10,
      total: 10,
      timeSeconds: 200,
      date: new Date().toISOString(),
      failedTopics: [],
      completed: true,
    };
    const next = applyResult(state, result, "2026-03-10");
    expect(next.xp).toBe(state.xp + 80);
    expect(next.coins).toBe(state.coins + 12);
    expect(next.progress["lexi-a1-2"]?.stars).toBe(3);
    const worse = applyResult(next, { ...result, stars: 1, score: 40 }, "2026-03-10");
    expect(worse.progress["lexi-a1-2"]?.stars).toBe(3);
  });
});

describe("planes", () => {
  it("precios oficiales en pesos colombianos", () => {
    expect(PLANS.map((p) => [p.id, p.price])).toEqual([
      ["free", 0],
      ["plus", 30000],
      ["super", 50000],
    ]);
    expect(formatCop(30000)).toBe("$30.000");
  });
  it("evaluaciones semanales desde Plus y simulacros solo en Super", () => {
    expect(hasFeature("free", "weeklyExams")).toBe(false);
    expect(hasFeature("plus", "weeklyExams")).toBe(true);
    expect(hasFeature("plus", "officialMocks")).toBe(false);
    expect(hasFeature("super", "officialMocks")).toBe(true);
    expect(hasPlan("super", "plus")).toBe(true);
  });
});

describe("registro de módulos", () => {
  it("todos los niveles del mapa (salvo cofres) tienen un ejercicio jugable", () => {
    const missing = ALL_NODES.filter((n) => n.type !== "chest")
      .filter((n) => !isLevelPlayable(getModule(n.moduleId), n.levelId))
      .map((n) => n.id);
    expect(missing).toEqual([]);
  });
  it("las cuatro habilidades tienen camino", () => {
    expect(Object.keys(PATHS).sort()).toEqual(["echo", "fono", "lexi", "tinta"]);
  });
});
