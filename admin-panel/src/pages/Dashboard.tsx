import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../services/api';
import { AnalyticsOverview, UserGrowth } from '../types';

export default function Dashboard() {
  const { data: overview } = useQuery<AnalyticsOverview>({
    queryKey: ['overview'],
    queryFn: () => adminAPI.getOverview().then(r => r.data)
  });

  const { data: growth } = useQuery<UserGrowth[]>({
    queryKey: ['growth'],
    queryFn: () => adminAPI.getUserGrowth(30).then(r => r.data)
  });

  const { data: streaks } = useQuery({
    queryKey: ['streaks'],
    queryFn: () => adminAPI.getStreakDistribution().then(r => r.data)
  });

  const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5'];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>

      <div className="grid grid-4">
        <KPICard title="Total Users" value={overview?.total_users || 0} />
        <KPICard title="DAU" value={overview?.active_users_today || 0} />
        <KPICard title="Total Tasks" value={overview?.total_tasks || 0} />
        <KPICard title="Completion Rate" value={`${overview?.completion_rate || 0}%`} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>User Growth (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="new_users" stroke="#3182ce" name="New Users" />
              <Line type="monotone" dataKey="total_users" stroke="#38a169" name="Total Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Streak Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={streaks} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label>
                {streaks?.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <KPICard title="Total Revenue" value={`$${overview?.total_revenue || 0}`} />
        <KPICard title="MRR" value={`$${overview?.mrr || 0}`} />
        <KPICard title="Active Subscriptions" value={overview?.active_subscriptions || 0} />
        <KPICard title="Avg Streak" value={overview?.avg_streak || 0} />
      </div>
    </div>
  );
}

function KPICard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card">
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 32, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
