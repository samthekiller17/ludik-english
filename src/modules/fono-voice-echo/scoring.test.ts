import { describe, expect, it } from "vitest";
import { compareSentence, scoreAnswer, tipFor, wordsMatch } from "./scoring";
import { MISSIONS } from "./content";

describe("Fono scoring", () => {
  it("a perfect repetition scores 100 regardless of punctuation and case", () => {
    expect(compareSentence("I am fine, thank you.", "i'm fine thank you").score).toBe(100);
  });

  it("missing one of five words scores 80 and marks that word", () => {
    const r = compareSentence("How are you today please", "how are you please");
    expect(r.score).toBe(80);
    expect(r.words.find((w) => w.word === "today")?.ok).toBe(false);
  });

  it("tolerates one letter off in longer words but not in short ones", () => {
    expect(wordsMatch("brothers", "brother")).toBe(true);
    expect(wordsMatch("cat", "cut")).toBe(false);
  });

  it("free answers score by keyword groups", () => {
    expect(scoreAnswer([["from", "live"]], "I am from Cali").score).toBe(100);
    expect(scoreAnswer([["online", "store"], ["because"]], "online").score).toBe(50);
  });

  it("gives the 'th' tip when a th-word was missed", () => {
    expect(tipFor(["thank"])?.sound).toBe("th");
  });

  it("has 6 missions (A1, A2, B1 × 2) with 3 stages each", () => {
    expect(MISSIONS).toHaveLength(6);
    expect(MISSIONS.every((m) => m.stages.length === 3)).toBe(true);
  });
});
