import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const PREFIX_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#22d3ee'];

const CALLSIGN_PREFIX_NAMES = {
  AAL: 'American Airlines',
  AAY: 'Allegiant Air',
  ACA: 'Air Canada',
  ACF: 'Aero Calafia',
  AEA: 'Air Europa',
  AFR: 'Air France',
  AGA: 'Air Georgian',
  AIC: 'Air India',
  ALC: 'Atlas Air',
  AMX: 'Aeromexico',
  ANG: 'Air Niugini',
  AUA: 'Austrian Airlines',
  AWE: 'American Eagle',
  AZA: 'ITA Airways',
  BAW: 'British Airways',
  BEE: 'Jet2.com',
  BEL: 'Brussels Airlines',
  BER: 'Air Berlin',
  BWA: 'Caribbean Airlines',
  CAL: 'Cathay Pacific Cargo',
  CCA: 'Air China',
  CES: 'China Eastern Airlines',
  EDV: 'Endeavor Air',
  CPA: 'Cathay Pacific',
  CSN: 'China Southern Airlines',
  DAL: 'Delta Air Lines',
  DLH: 'Lufthansa',
  EWG: 'Eurowings',
  ELY: 'El Al',
  EIN: 'Aer Lingus',
  ETD: 'Etihad Airways',
  EVA: 'EVA Air',
  FDX: 'FedEx Express',
  GLO: 'GOL Linhas Aereas',
  HAL: 'Hawaiian Airlines',
  ICE: 'Icelandair',
  IBE: 'Iberia',
  JBU: 'JetBlue Airways',
  JJA: 'Jeju Air',
  KAL: 'Korean Air',
  KLM: 'KLM Royal Dutch Airlines',
  LRC: 'Lynden Air Cargo',
  LPE: 'LAP Airlines',
  NKS: 'Spirit Airlines',
  NWA: 'Northwest Airlines',
  QFA: 'Qantas',
  QTR: 'Qatar Airways',
  RPA: 'Republic Airways',
  RZO: 'Sata Air Acores',
  SIA: 'Singapore Airlines',
  SKW: 'SkyWest Airlines',
  SVA: 'Saudia',
  SWA: 'Southwest Airlines',
  TAP: 'TAP Air Portugal',
  THY: 'Turkish Airlines',
  UAL: 'United Airlines',
  VOI: 'Volaris',
  VIR: 'Virgin Atlantic',
  WJA: 'WestJet',
  WZZ: 'Wizz Air',
  YVJ: 'Mesa Airlines',
  ASA: 'Alaska Airlines',
  AAR: 'Asiana Airlines',
  FFT: 'Frontier Airlines',
  JBU: 'JetBlue Airways',
  KAL: 'Korean Air',
  NKS: 'Spirit Airlines',
  SKW: 'SkyWest Airlines',
  SWA: 'Southwest Airlines',
  UAL: 'United Airlines',
};

function getDisplayName(prefix) {
  if (!prefix || prefix === 'N/A') {
    return 'Unknown operator';
  }

  const airlineName = CALLSIGN_PREFIX_NAMES[prefix] || prefix;
  return `${airlineName} (${prefix})`;
}

function CallsignTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0].payload;
  const flights = entry?.value ?? 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-white">{getDisplayName(entry?.name)}</p>
      <p className="text-xs text-gray-300 mt-1">{flights} flights</p>
    </div>
  );
}

function AirlineShareChart({ data }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 md:p-5">
      <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-3">Callsign Prefix Distribution</h3>
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
                <Cell key={`${entry.name}-${idx}`} fill={PREFIX_COLORS[idx % PREFIX_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CallsignTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AirlineShareChart;
