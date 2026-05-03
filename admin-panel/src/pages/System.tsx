import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

export default function System() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => adminAPI.getSystemHealth().then(r => r.data),
    refetchInterval: 30000 // Refresh every 30s
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => adminAPI.getSystemMetrics().then(r => r.data),
    refetchInterval: 30000
  });

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>System Health</h1>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Services Status</h3>
        <div className="grid grid-3">
          <ServiceStatus name="MySQL" status={health?.mysql} />
          <ServiceStatus name="Redis" status={health?.redis} />
          <ServiceStatus name="MongoDB" status={health?.mongodb} />
        </div>
        <div style={{ marginTop: 20 }}>
          <p><strong>API Latency:</strong> {health?.api_latency_ms?.toFixed(2)} ms</p>
          <p><strong>Overall Status:</strong> <span className={`badge ${
            health?.status === 'healthy' ? 'badge-success' : 'badge-warning'
          }`}>{health?.status}</span></p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Metrics (24h)</h3>
        <div className="grid grid-2">
          <div>
            <p style={{ fontSize: 14, color: '#718096' }}>Total Requests</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{metrics?.total_requests_24h || 0}</p>
          </div>
          <div>
            <p style={{ fontSize: 14, color: '#718096' }}>Error Rate</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{metrics?.error_rate?.toFixed(2) || 0}%</p>
          </div>
          <div>
            <p style={{ fontSize: 14, color: '#718096' }}>Avg Response Time</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{metrics?.avg_response_time_ms?.toFixed(2) || 0} ms</p>
          </div>
          <div>
            <p style={{ fontSize: 14, color: '#718096' }}>Cache Hit Rate</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{metrics?.cache_hit_rate?.toFixed(2) || 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status?: boolean }) {
  return (
    <div className="card">
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 8 }}>{name}</p>
      <span className={`badge ${status ? 'badge-success' : 'badge-danger'}`}>
        {status ? 'Healthy' : 'Down'}
      </span>
    </div>
  );
}
