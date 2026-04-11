import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function HourlyDepartureChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 md:p-5">
      <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-3">Hourly Departure Pattern (UTC)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="departuresFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={2} />
            <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
            />
            <Area type="monotone" dataKey="departures" stroke="#38bdf8" fill="url(#departuresFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default HourlyDepartureChart;
