import { useState, useEffect, useRef } from "react";

/**
 * Animated number count-up hook.
 * @param {number} targetValue The target number to count up to.
 * @param {number} duration Animation duration in milliseconds.
 * @param {boolean} startTrigger Triggers the animation when true.
 */
export function useCountUp(targetValue, duration = 1200, startTrigger = false) {
  const [count, setCount] = useState(0);
  const animationRef = useRef(null);
  
  // Keep track of parameters in ref to avoid re-triggering animation if they change slightly
  const paramsRef = useRef({ targetValue, duration });
  paramsRef.current = { targetValue, duration };

  useEffect(() => {
    if (!startTrigger) {
      setCount(0);
      return;
    }

    const { targetValue: target, duration: dur } = paramsRef.current;

    // Respect reduced motion settings
    const prefersReducedMotion =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / dur, 1);

      // easeOutCubic: f(t) = 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentValue = target * ease;

      setCount(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startTrigger]);

  return count;
}
