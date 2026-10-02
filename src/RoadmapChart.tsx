import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ChartKind = 'hours' | 'completion' | 'tracks' | 'velocity'
export type ChartDatum = { week?: string; track?: string; hours?: number; done?: number; velocity?: number }

export default function RoadmapChart({ kind, data }: { kind: ChartKind; data: ChartDatum[] }) {
  const horizontal = kind === 'tracks'
  const key = kind === 'hours' ? 'hours' : kind === 'completion' ? 'done' : kind === 'tracks' ? 'done' : 'velocity'
  const chartData = kind === 'tracks' ? data.map((item) => ({ ...item, name: item.track })) : data
  const grid = <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 5" />
  const axes = <>
    {horizontal ? <><XAxis type="number" hide /><YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} width={78} /></> : <><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} interval={kind === 'hours' ? 0 : 2} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} /></>}
    <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }} />
  </>
  return <ResponsiveContainer width="100%" height="100%">
    {kind === 'hours' || kind === 'completion' ? <AreaChart data={chartData} margin={kind === 'hours' ? { top: 8, right: 4, left: -22, bottom: 0 } : undefined}>
      {kind === 'completion' && <defs><linearGradient id="completionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c7f36b" stopOpacity={0.25} /><stop offset="100%" stopColor="#c7f36b" stopOpacity={0} /></linearGradient></defs>}
      {grid}{axes}<Area type="monotone" dataKey={key} stroke="#c7f36b" strokeWidth={2.5} fill={kind === 'hours' ? 'none' : 'url(#completionFill)'} />
    </AreaChart> : <BarChart data={chartData} layout={horizontal ? 'vertical' : 'horizontal'} margin={horizontal ? { left: 12 } : undefined}>
      {grid}{axes}<Bar dataKey={key} fill={kind === 'velocity' ? '#a9b2c0' : '#c7f36b'} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
    </BarChart>}
  </ResponsiveContainer>
}