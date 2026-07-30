import React, { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Card } from '../ui';

/**
 * Freight lanes drawn across the backdrop. Coordinates are in the 1440×900
 * viewBox and deliberately start/end outside it, so the routes read as passing
 * through rather than beginning at the screen edge.
 */
const LANES = [
  { id: 'auth-lane-a', d: 'M -120 640 C 220 520 420 780 720 650 S 1180 400 1560 500', dur: '17s', begin: '0s' },
  { id: 'auth-lane-b', d: 'M -120 300 C 260 400 480 160 780 260 S 1200 440 1560 320', dur: '21s', begin: '-7s' },
  { id: 'auth-lane-c', d: 'M -120 810 C 300 720 580 890 900 790 S 1300 690 1560 760', dur: '25s', begin: '-13s' },
];

/**
 * The CSS animations are disabled by a media query, but SMIL (`animateMotion`)
 * ignores CSS entirely — the travelling dots have to be withheld from the tree
 * instead. Watched rather than read once, so toggling the OS setting takes
 * effect without a reload.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export function LoginView() {
  const reducedMotion = usePrefersReducedMotion();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofill = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setLocalError('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-canvas overflow-hidden">
      {/* Backdrop: a faint grid fading out at the edges, plus two slow accent
          glows. Drawn from tokens (never raw palette) so it re-tints itself in
          dark, and inert to pointer and screen reader alike. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--bd) / 0.6) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgb(var(--bd) / 0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, #000 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 45%, #000 35%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full blur-3xl bg-accent/[0.16] pointer-events-none animate-glow-a"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -right-32 w-[600px] h-[600px] rounded-full blur-3xl bg-violet/[0.14] pointer-events-none animate-glow-b"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl bg-pos/[0.09] pointer-events-none animate-glow-c"
      />

      {/* Freight lanes. The dashes slide along each route; a dot runs the whole
          length, so the screen has something actually moving through it. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {LANES.map((lane) => (
          <g key={lane.id}>
            <path
              id={lane.id}
              d={lane.d}
              stroke="rgb(var(--accent) / 0.30)"
              strokeWidth="1.5"
              strokeDasharray="14 18"
              strokeLinecap="round"
              className="animate-lane"
              style={{ animationDuration: lane.dur }}
            />
            {!reducedMotion && (
              <>
                <circle r="10" fill="rgb(var(--accent) / 0.18)">
                  <animateMotion dur={lane.dur} begin={lane.begin} repeatCount="indefinite">
                    <mpath href={`#${lane.id}`} />
                  </animateMotion>
                </circle>
                <circle r="3.5" fill="rgb(var(--accent) / 0.85)">
                  <animateMotion dur={lane.dur} begin={lane.begin} repeatCount="indefinite">
                    <mpath href={`#${lane.id}`} />
                  </animateMotion>
                </circle>
              </>
            )}
          </g>
        ))}
      </svg>

      <div className="relative w-full max-w-[380px]">
        {/* Brand sits above the card rather than in its own panel, so the whole
            screen is one column and the tokens carry both themes unaided. */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <span className="w-9 h-9 rounded-lg bg-accent-grad flex items-center justify-center shadow-btn">
            <Truck size={18} className="text-on-hero" />
          </span>
          <span className="text-[17px] font-semibold text-fg tracking-tight">TruckFlow</span>
        </div>

        <Card className="p-6" padded={false}>
          <h1 className="text-[20px] font-semibold text-fg tracking-tight mb-5">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nuneexpress.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              error={localError || undefined}
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-bd">
            <p className="text-[10.5px] text-fg-3 mb-2.5 text-center uppercase tracking-wide font-semibold">
              Quick-fill demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('admin@nuneexpress.com', 'admin123')}>
                Admin
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('marcus@nuneexpress.com', 'dispatcher123')}>
                Dispatcher
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => autofill('sarah.k@nuneexpress.com', 'driver123')}>
                Expiring
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
