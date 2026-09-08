import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/cn';
import { Wordmark } from './Wordmark';

export interface LandingHeaderProps {
  onSignIn: () => void;
  /** Scrolls to a section id, honouring prefers-reduced-motion. */
  onNavigate: (id: string) => void;
}

const NAV = [
  { id: 'product', label: 'Product' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'who-its-for', label: "Who it's for" },
];

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onSignIn, onNavigate }) => {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The border and blur only appear once the page has moved, so the header sits
  // flush against the hero at rest instead of drawing a line across it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  const navLinkClass =
    'text-[13px] font-medium text-fg-2 hover:text-fg transition-colors rounded-ctl px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-200',
        scrolled ? 'bg-surface/85 backdrop-blur-md border-b border-bd' : 'bg-transparent',
      )}
    >
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Wordmark />

        <nav aria-label="Sections" className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => go(item.id)} className={navLinkClass}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid place-items-center w-9 h-9 rounded-ctl text-fg-2 hover:text-fg hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Button onClick={onSignIn} className="h-9 px-4 text-[13px]">
            Sign in
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden grid place-items-center w-9 h-9 rounded-ctl text-fg-2 hover:text-fg hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="landing-menu" className="md:hidden border-t border-bd bg-surface">
          <nav aria-label="Sections" className="mx-auto max-w-[1120px] px-5 py-3 flex flex-col">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className="text-left text-[14px] font-medium text-fg-2 hover:text-fg py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-ctl"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
