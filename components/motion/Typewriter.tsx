'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Types `text` out character by character (the streaming "alive" feel). Renders
 * the full text instantly under reduced motion. Re-types whenever `text` changes.
 */
export function Typewriter({
  text,
  speed = 18,
  className,
  style,
}: {
  text: string;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState('');
  const iRef = useRef(0);

  useEffect(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    setShown('');
    iRef.current = 0;
    const id = setInterval(() => {
      iRef.current += 1;
      setShown(text.slice(0, iRef.current));
      if (iRef.current >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, reduce]);

  return (
    <span className={className} style={style}>
      {shown}
    </span>
  );
}
