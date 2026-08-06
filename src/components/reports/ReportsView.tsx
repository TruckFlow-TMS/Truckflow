import React from 'react';
import { Load } from '../../types/tms';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, FileDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button, Card, PageHeader, StatCard } from '../ui';

interface ReportsViewProps {
  loads: Load[];
}

const cssVar = (name: string) =>
  `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()})`;

const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
/** The print document is assembled as a string, so every value goes through here. */
const esc = (value: unknown) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

const usd = (amount: number) =>
  amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const ReportsView: React.FC<ReportsViewProps> = ({ loads }) => {
  const { theme } = useTheme();

  const chartData = loads.map((l) => ({
    name: l.loadNumber,
    revenue: l.rateMinor / 100,
    loadedMiles: l.loadedMiles,
    deadheadMiles: l.deadheadMiles,
  }));

  const totalLoaded = loads.reduce((sum, l) => sum + l.loadedMiles, 0);
  const totalDeadhead = loads.reduce((sum, l) => sum + l.deadheadMiles, 0);
  const totalMiles = totalLoaded + totalDeadhead || 1;
  const deadheadPercentage = ((totalDeadhead / totalMiles) * 100).toFixed(1);
  const grossRevenue = loads.reduce((sum, l) => sum + l.rateMinor, 0) / 100;
  const loadedSharePct = Math.round((totalLoaded / totalMiles) * 1000) / 10;
  const revPerLoadedMile = totalLoaded ? grossRevenue / totalLoaded : 0;

  /**
   * Printed rather than generated: the browser's own print pipeline writes the
   * PDF (and offers a real printer besides) without pulling a PDF library into
   * the bundle for one button. Rendered in an off-screen frame so what gets
   * printed is this report, not the application chrome around it.
   */
  const handleExportPDF = () => {
    const issued = new Date();
    const stamp = issued.toISOString().split('T')[0];

    const summary = [
      ['Gross revenue', usd(grossRevenue)],
      ['Loads', String(loads.length)],
      ['Revenue / loaded mile', usd(revPerLoadedMile)],
      ['Loaded miles', `${totalLoaded.toLocaleString()} mi`],
      ['Deadhead miles', `${totalDeadhead.toLocaleString()} mi`],
      ['Deadhead share', `${deadheadPercentage}%`],
    ]
      .map(([k, v]) => `<div class="kpi"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join('');

    const rows = loads
      .map(
        (l) => `<tr>
          <td class="mono">${esc(l.loadNumber)}</td>
          <td>${esc(l.brokerName)}</td>
          <td>${esc(l.status.replace(/_/g, ' '))}</td>
          <td class="num">${esc(usd(l.rateMinor / 100))}</td>
          <td class="num">${esc(l.loadedMiles.toLocaleString())}</td>
          <td class="num">${esc(l.deadheadMiles.toLocaleString())}</td>
          <td class="num">${esc(l.loadedMiles ? usd(l.rateMinor / 100 / l.loadedMiles) : '—')}</td>
        </tr>`,
      )
      .join('');

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Nune Express — Profitability report ${stamp}</title>
<style>
  @page { size: letter landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 12px/1.45 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #14161a; margin: 0; }
  header { border-bottom: 2px solid #14161a; padding-bottom: 10px; margin-bottom: 16px; }
  h1 { font-size: 19px; margin: 0 0 3px; letter-spacing: -0.2px; }
  .meta { font-size: 11px; color: #6b7280; }
  dl.kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 0 0 18px; }
  .kpi { border: 1px solid #d5d9e0; border-radius: 6px; padding: 8px 10px; }
  .kpi dt { font-size: 9.5px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; margin: 0 0 3px; }
  .kpi dd { font-size: 14px; font-weight: 700; margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  caption { text-align: left; font-size: 12px; font-weight: 700; padding-bottom: 6px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e3e6eb; text-align: left; }
  thead th { background: #f4f5f8; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #4b5563; }
  tfoot td { font-weight: 700; border-top: 2px solid #14161a; border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-variant-numeric: tabular-nums; font-weight: 600; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  footer { margin-top: 14px; font-size: 10px; color: #6b7280; }
</style></head>
<body>
  <header>
    <h1>Profitability &amp; Operational Analytics</h1>
    <p class="meta">Nune Express &middot; generated ${esc(issued.toLocaleString('en-US'))} &middot; ${loads.length} load${loads.length === 1 ? '' : 's'}</p>
  </header>
  <dl class="kpis">${summary}</dl>
  <table>
    <caption>Load detail</caption>
    <thead><tr>
      <th>Load #</th><th>Broker</th><th>Status</th>
      <th class="num">Gross rate</th><th class="num">Loaded mi</th>
      <th class="num">Deadhead mi</th><th class="num">Rev / loaded mi</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="7">No loads in this report.</td></tr>'}</tbody>
    <tfoot><tr>
      <td colspan="3">Totals</td>
      <td class="num">${esc(usd(grossRevenue))}</td>
      <td class="num">${esc(totalLoaded.toLocaleString())}</td>
      <td class="num">${esc(totalDeadhead.toLocaleString())}</td>
      <td class="num">${esc(usd(revPerLoadedMile))}</td>
    </tr></tfoot>
  </table>
  <footer>Deadhead share ${esc(deadheadPercentage)}% of ${esc(totalMiles.toLocaleString())} total miles run.</footer>
</body></html>`;

    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    frame.srcdoc = html;
    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) return;
      const cleanup = () => frame.remove();
      // afterprint is the accurate signal, but Safari has historically skipped
      // it — the timer is the backstop so the frame is never left behind.
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      setTimeout(cleanup, 60_000);
    };
    document.body.appendChild(frame);
  };

  // Read the design tokens fresh on every render so a theme toggle updates
  // the chart's colors immediately — recharts takes colors as props, not
  // classes, so it cannot consume Tailwind tokens directly.
  const axisLine = cssVar('bd');
  const axisTick = { fill: cssVar('fg-3'), fontSize: 11 };
  const tooltipStyle = {
    backgroundColor: cssVar('surface'),
    borderColor: cssVar('bd'),
    borderRadius: '0.75rem',
    fontSize: '12px',
    color: cssVar('fg'),
  };
  const accentColor = cssVar('accent');
  const posColor = cssVar('pos');

  return (
    <div className="space-y-3.5">
      <PageHeader
        title="Profitability & Operational Analytics"
        subtitle="Revenue per loaded mile, deadhead share, broker margins, & truck profitability."
        actions={
          <Button variant="secondary" icon={<FileDown size={13} />} onClick={handleExportPDF}>
            Export PDF report
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          variant="hero"
          label="Gross revenue"
          value={`$${grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          sub={`Across ${loads.length} loads · ${totalMiles.toLocaleString()} mi run`}
        />
        <StatCard
          label="Avg revenue / loaded mile"
          value={`$${revPerLoadedMile.toFixed(2)}`}
          sub={
            revPerLoadedMile >= 3.2
              ? <span className="text-pos font-semibold">Above the $3.20 target</span>
              : <span className="text-warn font-semibold">Below the $3.20 target</span>
          }
        />
        <StatCard
          variant="ring"
          ringPct={loadedSharePct}
          label="Loaded mile share"
          value={`${loadedSharePct}%`}
          sub={`${totalLoaded.toLocaleString()} of ${totalMiles.toLocaleString()} mi`}
        />
        <StatCard
          label="Deadhead share"
          value={`${deadheadPercentage}%`}
          sub={`Non-revenue cost miles (${totalDeadhead.toLocaleString()} mi)`}
        />
      </div>

      <Card
        header={
          <h3 className="text-[13.5px] font-semibold text-fg flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" />
            <span>Gross rate ($) per load comparison</span>
          </h3>
        }
      >
        <div className="h-64 w-full">
          <ResponsiveContainer key={theme} width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisLine} tick={axisTick} />
              <YAxis stroke={axisLine} tick={axisTick} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Gross Rate']}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? accentColor : posColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
