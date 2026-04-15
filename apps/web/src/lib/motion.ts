import type { Transition, Variants } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export function useMotionSettings() {
  const reduceMotion = useReducedMotion();
  return {
    reduceMotion,
    itemTransition: (index = 0): Transition =>
      reduceMotion ? { duration: 0 } : { duration: 0.2, delay: Math.min(index, 6) * 0.03 },
    fadeSlide: (y = 8): Variants =>
      reduceMotion
        ? {
            hidden: { opacity: 1, y: 0 },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 1, y: 0 },
          }
        : {
            hidden: { opacity: 0, y },
            visible: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -y / 2 },
          },
  };
}
