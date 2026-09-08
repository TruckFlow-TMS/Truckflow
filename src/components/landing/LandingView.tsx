import React from 'react';
import { Button } from '../ui';
import { HERO } from './content';

export interface LandingViewProps {
  onSignIn: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSignIn }) => (
  <div className="min-h-screen bg-canvas text-fg p-8">
    <h1 className="text-2xl font-semibold mb-4">{HERO.headline}</h1>
    <Button onClick={onSignIn}>{HERO.secondaryCta}</Button>
  </div>
);
