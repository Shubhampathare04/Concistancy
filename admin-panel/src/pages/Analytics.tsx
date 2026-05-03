import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../services/api';
import { TaskAnalytics } from '../types';

export default function Analytics() {
  const { data: taskAnalytics } = useQuery<TaskAnalytics>({
    queryKey: ['task-analytics'],
    queryFn: () => adminAPI.getTaskAnalytics().then(r => r.data)
  });

  const { data: growth } = useQuery({
    queryKey: ['growth-90'],
    queryFn: () => adminAPI.getUserGrowth(90).then(r => r.data)
  });

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Analytics</h1>

      <div className="grid grid-3">
        <div className="card">
          <p style={{ fontSize: 14, color: '#718096' }}>Total Tasks</p>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{taskAnalytics?.total_tasks || 0}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 14, color: '#718096' }}>Completion Rate</p>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{taskAnalytics?.completion_rate || 0}%</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 14, color: '#718096' }}>Avg Difficulty</p>
          <p style={{ fontSize: 32, fontWeight: 700 }}>{taskAnalytics?.avg_difficulty || 0}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>User Growth (90 Days)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="new_users" stroke="#3182ce" name="New Users" strokeWidth={2} />
            <Line type="monotone" dataKey="total_users" stroke="#38a169" name="Total Users" strokeWidth={2} />
            <Line type="monotone" dataKey="dau" stroke="#d69e2e" name="DAU" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Task Completions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { name: 'Today', value: taskAnalytics?.completions_today || 0 },
            { name: '7 Days', value: taskAnalytics?.completions_7d || 0 },
            { name: 'Total', value: taskAnalytics?.total_completions || 0 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
