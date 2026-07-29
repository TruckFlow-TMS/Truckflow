import React from 'react';
import { Load } from '../../types/tms';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, Download } from 'lucide-react';
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

  const handleExportCSV = () => {
    const headers = 'LoadNumber,Broker,Status,GrossRateUSD,LoadedMiles,DeadheadMiles\n';
    const rows = loads
      .map((l) => `${l.loadNumber},"${l.brokerName}",${l.status},${(l.rateMinor / 100).toFixed(2)},${l.loadedMiles},${l.deadheadMiles}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nune_Express_TMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <Button variant="secondary" icon={<Download size={13} />} onClick={handleExportCSV}>
            Export CSV report
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total distance traveled"
          value={`${totalMiles.toLocaleString()} mi`}
          sub={`${totalLoaded.toLocaleString()} loaded mi`}
        />
        <StatCard
          label="Deadhead share"
          value={`${deadheadPercentage}%`}
          sub={`Non-revenue cost miles (${totalDeadhead} mi)`}
        />
        <StatCard
          label="Avg revenue / loaded mile"
          value={`$${totalLoaded ? ((loads.reduce((s, l) => s + l.rateMinor, 0) / 100) / totalLoaded).toFixed(2) : '0.00'}`}
          sub="Target > $3.20 / mi"
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
