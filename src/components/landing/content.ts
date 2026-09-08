/**
 * Every word on the landing page.
 *
 * Kept apart from the markup for two reasons: the copy will be revised far more
 * often than the layout, and holding all the claims in one file makes them
 * auditable — each one has to map to a feature that exists in the app today.
 */

export interface Capability {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  points: string[];
}

export interface LifecycleStage {
  /** Matches LoadStatus in types/tms.ts — the dispatch board's real six columns. */
  status: 'OPEN' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'INVOICED' | 'PAID';
  label: string;
  /** The document or event this stage produces. */
  artifact: string;
}

export interface Audience {
  size: string;
  heading: string;
  body: string;
}

export const HERO = {
  headline: 'Every load, from booking to paid.',
  sub: 'TruckHQ is the dispatch, billing and payroll system for carriers still running the whole operation out of three spreadsheets and a phone.',
  primaryCta: 'See how it works',
  secondaryCta: 'Sign in',
} as const;

export const PROBLEM = {
  heading: 'The whiteboard stops working around truck number six.',
  body: 'It holds up until a delivered load sits uninvoiced for three weeks, a detention charge never gets billed, or a driver disputes a settlement and nobody can reconstruct the numbers. The information exists — it is just spread across a spreadsheet, an inbox and somebody’s memory.',
} as const;

/** The board's actual six columns, taken from DispatchBoardView.tsx. */
export const LIFECYCLE: LifecycleStage[] = [
  { status: 'OPEN', label: 'Unassigned', artifact: 'Rate confirmation' },
  { status: 'DISPATCHED', label: 'Dispatched', artifact: 'Driver + truck assigned' },
  { status: 'IN_TRANSIT', label: 'In transit', artifact: 'Bill of lading' },
  { status: 'DELIVERED', label: 'Delivered', artifact: 'Proof of delivery' },
  { status: 'INVOICED', label: 'Invoiced', artifact: 'Broker invoice' },
  { status: 'PAID', label: 'Paid', artifact: 'Payment applied' },
];

export const CAPABILITIES: Capability[] = [
  {
    id: 'dispatch',
    eyebrow: 'Dispatch & loads',
    heading: 'Move every load across one board.',
    body: 'Six stages, left to right. Drag a load to advance it, and each stage asks for the document it needs — rate confirmation on dispatch, BOL in transit, POD on delivery. Nothing advances on a promise.',
    points: [
      'Drag-and-drop board with six stages',
      'Driver and truck assigned together',
      'Stops, miles and rate held on the load',
      'Documents captured at the stage that produces them',
    ],
  },
  {
    id: 'fleet',
    eyebrow: 'Drivers & fleet',
    heading: 'Know who can legally run tomorrow.',
    body: 'CDL and medical expiry dates are tracked per driver and surface before they lapse — not after a roadside inspection. Trucks and trailers are linked, so assigning a driver assigns the equipment with them.',
    points: [
      'Driver roster with licence and medical dates',
      'Expiry warnings raised ahead of the date',
      'Trucks linked to the trailers they pull',
      'Equipment records per unit',
    ],
  },
  {
    id: 'money',
    eyebrow: 'Billing & payroll',
    heading: 'Bill it, factor it, settle it.',
    body: 'Every invoice carries the load it came from. Submit to your factoring company, track the advance against the reserve, and see what a load actually earned once the driver’s pay and fuel come out of it.',
    points: [
      'Broker invoicing with payment terms',
      'Factoring submission and advance tracking',
      'Driver settlements and payroll runs',
      'Profitability per load, not just per month',
    ],
  },
  {
    id: 'control',
    eyebrow: 'Records & control',
    heading: 'One account of who changed what.',
    body: 'Roles decide what each person can see and edit. Company compliance documents — operating authority, insurance certificates, W-9 — sit in one place with their expiry dates. Every status change is logged against the user who made it.',
    points: [
      'Roles and permissions per user',
      'Broker and customer records with terms',
      'Company compliance documents and expiries',
      'Audit log of status changes',
    ],
  },
];

export const AUDIENCES: Audience[] = [
  {
    size: '1–3 trucks',
    heading: 'Owner-operator',
    body: 'You are the dispatcher, the driver and the billing department. TruckHQ mainly replaces the spreadsheet: one place for loads, invoices and the documents brokers keep asking you to resend.',
  },
  {
    size: '4–25 trucks',
    heading: 'Small fleet',
    body: 'The size the product is built around. Enough loads that status stops fitting on a whiteboard, and enough drivers that settlements need to be reconstructible months after the fact.',
  },
  {
    size: '25+ trucks',
    heading: 'Growing fleet',
    body: 'Roles, the audit log and per-load profitability hold up as you add dispatchers. Know the current limits: there is no ELD or telematics integration yet, and no EDI with brokers — loads are entered rather than received.',
  },
];

export const FOOTER = {
  heading: 'Accounts are created by your administrator.',
  body: 'If your company already runs TruckHQ, sign in with the credentials your administrator issued you.',
  cta: 'Sign in',
  legal: 'TruckHQ — trucking management system.',
} as const;
