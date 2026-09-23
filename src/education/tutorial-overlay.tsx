import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTutorialEngine } from "./tutorial-engine";
import { Button } from "@/components/ui/button";

function TargetHighlight({ targetId }: { targetId: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function update() {
      const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }

    update();
    const interval = setInterval(update, 500);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [targetId]);

  if (!rect) return null;

  const padding = 4;

  return createPortal(
    <div
      className="fixed pointer-events-none z-[45]"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }}
    >
      <div
        className="absolute inset-0 rounded-lg border-2 border-primary-400"
        style={{
          animation: "tutorial-pulse 2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(96, 165, 250, 0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export function TutorialOverlay() {
  const { activeTutorial, tutorial, currentStep, progress, nextStep, exitTutorial } =
    useTutorialEngine();

  if (!activeTutorial || !tutorial || !currentStep) return null;

  if (activeTutorial.completed) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-surface-raised border border-green-800/50 rounded-xl shadow-2xl p-6 max-w-md text-center">
          <div className="text-2xl mb-2">Completed</div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {tutorial.title}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            You've completed this tutorial. Great work!
          </p>
          <Button variant="primary" onClick={exitTutorial}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentStep.targetElement && (
        <TargetHighlight targetId={currentStep.targetElement} />
      )}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-surface-raised border border-border rounded-xl shadow-2xl p-5 max-w-lg w-[440px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {tutorial.title}
              </h3>
              <p className="text-[11px] text-text-muted">
                Step {progress?.current} of {progress?.total}
              </p>
            </div>
            <button
              onClick={exitTutorial}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Exit
            </button>
          </div>

          <div className="h-1 bg-surface-overlay rounded-full mb-4">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${progress?.percent ?? 0}%` }}
            />
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-text-primary mb-1.5">
              {currentStep.title}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {currentStep.description}
            </p>

            {currentStep.whyItMatters && (
              <div className="mt-3 p-2.5 bg-primary-950/30 border border-primary-900/30 rounded-lg">
                <p className="text-[11px] text-primary-300">
                  <span className="font-semibold">Why this matters: </span>
                  {currentStep.whyItMatters}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={nextStep}>
              {activeTutorial.currentStep >= activeTutorial.totalSteps - 1
                ? "Finish"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
