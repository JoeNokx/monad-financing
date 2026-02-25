import { ResponsiveContainer, Line, LineChart as ReLineChart, Tooltip, XAxis, YAxis } from 'recharts';

export type LineChartPoint = { name: string; value: number };

export function LineChart({ data }: { data: LineChartPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} dot={false} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
