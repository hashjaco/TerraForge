import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resolveTarget, useTutorialEngine, type ChapterProgress } from "./tutorial-engine";
import type { TutorialStep } from "./tutorials";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/components/ui/close-button";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 12;
const LARGE_TARGET_FRACTION = 0.25;

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

// Targets appear, move and resize as panels open and layouts change, so the rect is
// re-measured every frame while a tutorial runs; state only updates when it changes.
function useTargetRect(step: TutorialStep | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  const lastRef = useRef<Rect | null>(null);

  useEffect(() => {
    if (!step) {
      lastRef.current = null;
      setRect(null);
      return;
    }
    let frame = 0;
    function measure() {
      const id = resolveTarget(step);
      const el = id ? document.querySelector(`[data-tutorial-id="${id}"]`) : null;
      const box = el?.getBoundingClientRect();
      const next =
        box && box.width > 0 && box.height > 0
          ? { top: box.top, left: box.left, width: box.width, height: box.height }
          : null;
      if (!sameRect(next, lastRef.current)) {
        lastRef.current = next;
        setRect(next);
      }
      frame = requestAnimationFrame(measure);
    }
    measure();
    return () => cancelAnimationFrame(frame);
  }, [step]);

  return rect;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function placeCard(target: Rect | null, cardW: number, cardH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const centeredX = (vw - cardW) / 2;

  if (!target) {
    const center = { x: centeredX, y: clamp(vh * 0.28, VIEWPORT_MARGIN, vh - cardH - VIEWPORT_MARGIN) };
    return center;
  }

  const midY = clamp(target.top + target.height / 2 - cardH / 2, VIEWPORT_MARGIN, vh - cardH - VIEWPORT_MARGIN);
  const midX = clamp(target.left + target.width / 2 - cardW / 2, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN);
  const right = target.left + target.width + CARD_GAP;
  const left = target.left - CARD_GAP - cardW;
  const below = target.top + target.height + CARD_GAP;
  const above = target.top - CARD_GAP - cardH;

  const isLarge = target.width * target.height > vw * vh * LARGE_TARGET_FRACTION;
  const candidates = isLarge
    ? []
    : [
        { x: right, y: midY, fits: right + cardW <= vw - VIEWPORT_MARGIN },
        { x: midX, y: below, fits: below + cardH <= vh - VIEWPORT_MARGIN },
        { x: left, y: midY, fits: left >= VIEWPORT_MARGIN },
        { x: midX, y: above, fits: above >= VIEWPORT_MARGIN },
      ];
  const fitting = candidates.find((c) => c.fits);
  if (fitting) return fitting;

  // Large targets such as the 3D viewport: dock the card inside their lower-left corner.
  const inside = {
    x: clamp(target.left + 16, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN),
    y: clamp(target.top + target.height - cardH - 16, VIEWPORT_MARGIN, vh - cardH - VIEWPORT_MARGIN),
  };
  return inside;
}

function Spotlight({ rect }: { rect: Rect | null }) {
  if (!rect) {
    return <div aria-hidden className="fixed inset-0 z-[45] pointer-events-none bg-black/45 animate-overlay-in" />;
  }
  return (
    <div
      aria-hidden
      className="fixed left-0 top-0 z-[45] pointer-events-none rounded-lg transition-[transform,width,height] duration-500 ease-[var(--ease-out-expo)]"
      style={{
        transform: `translate(${rect.left - SPOTLIGHT_PADDING}px, ${rect.top - SPOTLIGHT_PADDING}px)`,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
        boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.5)",
      }}
    >
      <div className="absolute inset-0 rounded-lg ring-2 ring-[var(--tf-accent)] animate-[tutorial-pulse_2s_ease-in-out_infinite]" />
    </div>
  );
}

function ChapterBar({ chapters, total }: { chapters: ChapterProgress[]; total: number }) {
  const current = chapters.find((c) => c.isCurrent);
  return (
    <div>
      <div className="flex gap-1" role="presentation">
        {chapters.map((c) => (
          <div
            key={c.name}
            className="h-1 rounded-full bg-surface-overlay overflow-hidden"
            style={{ flexGrow: c.stepCount / Math.max(total, 1) }}
          >
            <div
              className="h-full rounded-full bg-primary-500 transition-[width] duration-500 ease-[var(--ease-out-expo)]"
              style={{ width: `${(c.completedSteps / c.stepCount) * 100}%` }}
            />
          </div>
        ))}
      </div>
      {current && chapters.length > 1 && (
        <p className="mt-1.5 text-[10px] uppercase tracking-wider text-primary-400 font-semibold">
          {current.name}
        </p>
      )}
    </div>
  );
}

function ActionCallout({ action, satisfied, autoAdvancing }: { action: string; satisfied: boolean; autoAdvancing: boolean }) {
  if (satisfied) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-success/10 border border-success/30 text-[12px] text-success animate-pop-in">
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 7.5l3 3 6-7" />
        </svg>
        {autoAdvancing ? "Done — moving on…" : "Already done"}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2 bg-primary-500/10 border border-primary-500/25 text-[12px] text-text-primary">
      <span className="relative mt-1 flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
      </span>
      <span>
        <span className="font-semibold">Your turn: </span>
        {action}
      </span>
    </div>
  );
}

function CompletionCard({ title, chapters, onClose }: { title: string; chapters: ChapterProgress[]; onClose: () => void }) {
  return (
    <>
      <div aria-hidden className="fixed inset-0 z-[45] pointer-events-none bg-black/45 animate-overlay-in" />
      <div
        role="dialog"
        aria-labelledby="tutorial-complete-title"
        className="fixed left-1/2 top-[28vh] -translate-x-1/2 z-[55] w-[min(420px,calc(100vw-32px))] glass rounded-2xl shadow-elev-3 p-6 text-center animate-pop-in"
      >
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-success/15 text-success">
          <svg aria-hidden width="22" height="22" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 7.5l3 3 6-7" />
          </svg>
        </div>
        <h3 id="tutorial-complete-title" className="text-base font-semibold text-text-primary">
          Tutorial complete
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{title}</p>
        {chapters.length > 1 && (
          <ul className="mt-4 space-y-1.5 text-left">
            {chapters.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-[12px] text-text-secondary">
                <span className="text-success">✓</span>
                {c.name}
              </li>
            ))}
          </ul>
        )}
        <Button variant="primary" className="mt-5 w-full" onClick={onClose} autoFocus>
          Close
        </Button>
      </div>
    </>
  );
}

export function TutorialOverlay() {
  const engine = useTutorialEngine();
  const { tutorial, currentStep, isComplete } = engine;
  const rect = useTargetRect(isComplete ? null : currentStep);
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) {
      setPosition(null);
      setSettled(false);
      return;
    }
    const next = placeCard(rect, card.offsetWidth, card.offsetHeight);
    setPosition((prev) => (prev && prev.x === next.x && prev.y === next.y ? prev : next));
  }, [rect, engine.stepKey, engine.satisfied, isComplete]);

  // Enable glide transitions only after the first placement, so the card doesn't sweep in from the corner.
  useEffect(() => {
    if (!position || settled) return;
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, [position, settled]);

  if (!engine.activeTutorial || !tutorial) return null;

  if (isComplete) {
    return createPortal(
      <CompletionCard title={tutorial.title} chapters={engine.chapters} onClose={engine.exit} />,
      document.body,
    );
  }

  if (!currentStep) return null;

  return createPortal(
    <>
      <Spotlight rect={rect} />
      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby="tutorial-step-title"
        className={`fixed left-0 top-0 z-[55] w-[min(380px,calc(100vw-24px))] glass rounded-xl shadow-elev-3 p-4 ${
          settled ? "transition-transform duration-500 ease-[var(--ease-out-expo)]" : ""
        }`}
        style={{
          transform: position ? `translate(${position.x}px, ${position.y}px)` : undefined,
          visibility: position ? "visible" : "hidden",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] text-text-muted truncate">{tutorial.title}</p>
            <p className="text-[10px] text-text-muted tabular">
              Step {engine.progress.current} of {engine.progress.total}
            </p>
          </div>
          <CloseButton onClick={engine.exit} label="Exit tutorial" />
        </div>

        <ChapterBar chapters={engine.chapters} total={engine.progress.total} />

        <div key={engine.stepKey} className="mt-3 space-y-3 animate-fade-up" aria-live="polite">
          <h4 id="tutorial-step-title" className="text-sm font-semibold text-text-primary">
            {currentStep.title}
          </h4>
          <p className="text-[12px] leading-relaxed text-text-secondary">{currentStep.description}</p>
          {currentStep.action && <ActionCallout action={currentStep.action} satisfied={engine.satisfied} autoAdvancing={engine.autoAdvancing} />}
          {currentStep.whyItMatters && (
            <p className="text-[11px] leading-relaxed text-text-muted border-l-2 border-primary-500/50 pl-2.5">
              <span className="font-semibold text-text-secondary">Why it matters: </span>
              {currentStep.whyItMatters}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={engine.back} disabled={engine.stepIndex === 0}>
            Back
          </Button>
          <div className="flex-1" />
          {engine.waitingForAction ? (
            <Button variant="ghost" size="sm" onClick={engine.next}>
              Skip step
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={engine.next} disabled={engine.autoAdvancing}>
              {engine.isLastStep ? "Finish" : "Next"}
            </Button>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
