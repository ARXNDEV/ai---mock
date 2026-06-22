import * as React from 'react';
import { cn } from '@/lib/utils';

// New design variants: accent (primary CTA), ink (dark), line (outline), paper, ghost.
// Legacy names (primary/glass/outline) are aliased so existing call sites keep working.
type Variant = 'accent' | 'ink' | 'line' | 'paper' | 'ghost' | 'primary' | 'glass' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  accent: 'btn-accent',
  primary: 'btn-accent',
  ink: 'btn-ink',
  line: 'btn-line',
  outline: 'btn-line',
  glass: 'btn-line',
  paper: 'btn-paper',
  ghost: 'btn-ghost',
};

const sizeClass: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'accent', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn', variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
