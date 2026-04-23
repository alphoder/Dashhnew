'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * A subtle hover-lift wrapper for interactive cards. Translates the element
 * up 4 px and scales it 1.01 on hover. Lightweight, classy, not arcade-y.
 */
export function HoverLift({
  children,
  className,
  scale = 1.012,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      whileHover={{ y: -4, scale, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
