import { useEffect, useRef } from "react";

/**
 * Hook to reveal elements on scroll using Intersection Observer.
 * It can observe the element itself, or find elements with class `reveal-on-scroll`
 * inside the container.
 */
export function useScrollReveal(options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Respect user's preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;

    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Find all targets: check the container itself + any elements inside it with reveal classes
    const targets = [];
    
    const isTarget = (el) => 
      el.classList.contains("reveal-fade-up") || 
      el.classList.contains("reveal-fade-left") || 
      el.classList.contains("reveal-fade-right") || 
      el.classList.contains("reveal-scale");

    if (isTarget(currentContainer)) {
      targets.push(currentContainer);
    }

    const childTargets = currentContainer.querySelectorAll(
      ".reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-scale"
    );
    childTargets.forEach(el => targets.push(el));

    if (prefersReducedMotion) {
      targets.forEach(target => target.classList.add("is-visible"));
      return;
    }

    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    targets.forEach(target => observer.observe(target));

    return () => {
      targets.forEach(target => {
        try {
          observer.unobserve(target);
        } catch (e) {
          // Ignore if already unobserved
        }
      });
    };
  }, [options]);

  return containerRef;
}
