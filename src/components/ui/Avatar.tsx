import React from 'react';
import { cn } from '../../lib/cn';

const TONES = [
  'bg-accent-weak text-accent',
  'bg-violet-bg text-violet',
  'bg-pos-bg text-pos',
  'bg-warn-bg text-warn',
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Same name always gets the same tone, so tables read consistently. */
function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

export interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 22, className }) => (
  <span
    style={{ width: size, height: size, fontSize: size * 0.42 }}
    className={cn(
      'inline-flex items-center justify-center rounded-full font-semibold shrink-0',
      toneFor(name),
      className,
    )}
  >
    {initials(name)}
  </span>
);
