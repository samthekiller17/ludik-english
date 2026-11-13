import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Fono from "@/modules/fono-voice-echo";
import Assessment from "@/modules/assessment";
import ListenUp from "@/modules/echo-listen-up-rpg";
import { LazyModule } from "@/features/module-shell/ModuleShell";
import type { ModuleEntry } from "@/data/modules.registry";
import type { ModuleProps } from "@/types/ludik";

const props: ModuleProps = {
  skillId: "fono",
  moduleId: "fono-voice-echo",
  levelId: "A1-1",
  nodeId: "test",
  language: "en",
  plan: "super",
  user: { id: "test", name: "Test" },
  reducedMotion: true,
  onComplete: vi.fn(),
  onExit: vi.fn(),
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("game lifecycle regressions", () => {
  it("remounts a game when the next level reuses the same module", async () => {
    let starts = 0;
    function Probe() {
      const [id] = React.useState(() => ++starts);
      return <span>Run {id}</span>;
    }
    const entry: ModuleEntry = {
      id: "level-reset-test",
      name: "Test",
      skillId: "tinta",
      summary: "",
      load: async () => ({ default: Probe }),
    };
    const view = render(<LazyModule entry={entry} props={{ ...props, levelId: "A2" }} />);
    await screen.findByText("Run 1");
    view.rerender(<LazyModule entry={entry} props={{ ...props, levelId: "B1" }} />);
    await screen.findByText("Run 2");
    expect(starts).toBe(2);
  });
  it("starts the assessment clock when playing, excluding the introduction", () => {
    vi.useFakeTimers();
    render(<Assessment {...props} moduleId="weekly-exam" />);
    act(() => vi.advanceTimersByTime(60000));
    fireEvent.click(screen.getByRole("button", { name: "Empezar evaluación" }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/0:01 \/ /)).toBeInTheDocument();
  });
  it("releases a microphone permission request resolved after leaving", async () => {
    let grant: ((stream: MediaStream) => void) | undefined;
    const stop = vi.fn();
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          grant = resolve;
        }),
    );
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    const start = vi.fn();
    vi.stubGlobal(
      "MediaRecorder",
      class {
        state = "inactive";
        start = start;
        stop = vi.fn();
      },
    );
    const view = render(<Fono {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "¡Empezar!" }));
    fireEvent.click(screen.getByRole("button", { name: "Grabar mi voz" }));
    view.unmount();
    await act(async () => {
      grant?.({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    });
    expect(stop).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });
  it("does not unlock a region after winning only its first encounter", () => {
    const complete = vi.fn();
    render(
      <ListenUp
        {...props}
        skillId="echo"
        moduleId="echo-listen-up-rpg"
        levelId="forest"
        onComplete={complete}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "¡A luchar!" }));
    fireEvent.click(screen.getByRole("button", { name: /Empezar a escuchar/ }));
    for (const answer of ["Attack", "Defend", "Your sword"]) {
      fireEvent.click(screen.getByRole("button", { name: answer }));
      fireEvent.click(screen.getByRole("button", { name: /Siguiente|Continuar|Ver resultado/ }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Continuar la campaña/ }));
    fireEvent.click(screen.getByRole("button", { name: "Terminar y guardar" }));
    expect(complete).toHaveBeenCalledWith(expect.objectContaining({ completed: false, stars: 1 }));
  });
});
