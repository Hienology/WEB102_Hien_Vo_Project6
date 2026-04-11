import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#22d3ee'];

function AirlineShareChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 md:p-5">
      <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-3">Airline Market Share</h3>
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
                <Cell key={`${entry.name}-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Flights']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AirlineShareChart;
