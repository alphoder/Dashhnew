'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  className?: string;
};

/**
 * Scroll-triggered fade-up. The default 24px rise + 0.6s cubic-ease gives
 * content a polished, unhurried entrance without feeling gimmicky.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
  className,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const variants: Variants = reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: [0.16, 1, 0.3, 1], delay },
        },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container + item pair for staggering grids. Use `<Stagger>` as the wrapper
 * and `<StaggerItem>` as each child.
 */
export function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
}) {
  const variants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 20,
  className,
}: {
  children: ReactNode;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const variants: Variants = reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      };
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
