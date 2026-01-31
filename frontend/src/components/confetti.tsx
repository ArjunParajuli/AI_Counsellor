"use client";

import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

type ConfettiType = "celebration" | "achievement" | "fireworks" | "stars";

export function useConfetti() {
    const fire = useCallback((type: ConfettiType = "celebration") => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999,
        };

        switch (type) {
            case "celebration":
                confetti({
                    ...defaults,
                    spread: 100,
                    particleCount: count,
                    colors: ["#6366f1", "#a855f7", "#22d3ee", "#10b981", "#f59e0b"],
                });
                break;

            case "achievement":
                // Gold and silver confetti
                const end = Date.now() + 1000;
                const colors = ["#ffd700", "#c0c0c0", "#cd7f32"];

                (function frame() {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.65 },
                        colors: colors,
                        zIndex: 9999,
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.65 },
                        colors: colors,
                        zIndex: 9999,
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                })();
                break;

            case "fireworks":
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const intervalDefaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    confetti({
                        ...intervalDefaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    });
                    confetti({
                        ...intervalDefaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    });
                }, 250);
                break;

            case "stars":
                confetti({
                    ...defaults,
                    particleCount: 100,
                    spread: 70,
                    shapes: ["star"],
                    colors: ["#ffd700", "#ffb700", "#ff8c00"],
                });
                confetti({
                    ...defaults,
                    particleCount: 50,
                    spread: 100,
                    shapes: ["circle"],
                    colors: ["#6366f1", "#a855f7"],
                    scalar: 0.75,
                });
                break;
        }
    }, []);

    return { fire };
}

// Hook for triggering confetti on mount (for completion pages)
export function Confetti({
    trigger,
    type = "celebration",
}: {
    trigger: boolean;
    type?: ConfettiType;
}) {
    const { fire } = useConfetti();

    useEffect(() => {
        if (trigger) {
            fire(type);
        }
    }, [trigger, type, fire]);

    return null;
}
