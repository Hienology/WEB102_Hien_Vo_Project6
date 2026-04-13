import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const DURATION_COLORS = {
  'Short Haul': '#22d3ee',
  'Medium Haul': '#f59e0b',
  'Long Haul': '#f43f5e',
};

function HaulTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0].payload;
  const flights = entry?.value ?? 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-white">{entry?.name || 'Unknown'}</p>
      <p className="text-xs text-gray-300 mt-1">{flights} flights</p>
    </div>
  );
}

function AirlineShareChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 md:p-5">
      <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-3">Haul Classification</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={2}
            >
              {data.map((entry, idx) => (
                <Cell key={`${entry.name}-${idx}`} fill={DURATION_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip content={<HaulTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AirlineShareChart;
