import { describe, it, expect } from "vitest";
import { BANKS } from "./content";
import { createRun, tick, submit } from "./engine";
describe("English Ink", () => {
  it("has twenty unique phrases per level", () => {
    for (const bank of Object.values(BANKS)) {
      expect(bank).toHaveLength(20);
      expect(new Set(bank.map((p) => p.id)).size).toBe(20);
    }
  });
  it("normalizes input without duplicate rewards", () => {
    let r = tick(createRun(10), 0, BANKS.A1, "normal");
    r = submit(r, "  SHE   IS HAPPY. ", BANKS.A1);
    expect(r.correct).toHaveLength(1);
    const points = r.points;
    r = submit(r, "She is happy.", BANKS.A1);
    expect(r.points).toBe(points);
    expect(r.lives).toBe(3);
  });
  it("finishes after three missed pages", () => {
    let r = createRun(10);
    for (let i = 0; i < 2000 && !r.done; i++) r = tick(r, 0.02, BANKS.A1, "normal");
    expect(r.done).toBe(true);
    expect(r.lives).toBe(0);
    expect(r.missed).toHaveLength(20);
  });
  it("clears only active pages once with INK", () => {
    let r = tick(createRun(0), 0, BANKS.A1, "normal");
    r = submit(r, "INK", BANKS.A1);
    expect(r.swept).toBe(1);
    expect(r.correct).toHaveLength(0);
    expect(r.next).toBe(1);
    expect(r.points).toBe(150);
    r = submit(r, "INK", BANKS.A1);
    expect(r.points).toBe(150);
  });
  it("can finish all levels without a time limit", () => {
    for (const bank of Object.values(BANKS)) {
      let r = createRun(10);
      for (let i = 0; i < 20; i++) {
        r = tick(r, 2, bank, "untimed");
        const p = r.active[0];
        expect(p).toBeDefined();
        if (p) r = submit(r, p.phrase.right, bank);
      }
      expect(r.correct).toHaveLength(20);
      expect(r.done).toBe(true);
      expect(r.lives).toBe(3);
    }
  });
  it("limits concurrency and switches speed after five pages", () => {
    let r = createRun(10);
    for (let i = 0; i < 600; i++) {
      r = tick(r, 0.02, BANKS.A1, "untimed");
      expect(r.active.length).toBeLessThanOrEqual(4);
    }
    expect(r.active[0]?.duration).toBe(6.5);
  });
});
