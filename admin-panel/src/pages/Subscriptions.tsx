import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Subscription, PaginatedResponse } from '../types';

export default function Subscriptions() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Subscription>>({
    queryKey: ['subscriptions', page, status],
    queryFn: () => adminAPI.getSubscriptions({ page, page_size: 20, status }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminAPI.createSubscription(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  });

  const handleCreate = () => {
    const userId = prompt('User ID:');
    const plan = prompt('Plan (free/pro/elite):');
    const days = prompt('Duration (days):');
    
    if (userId && plan && days) {
      createMutation.mutate({
        user_id: parseInt(userId),
        plan,
        duration_days: parseInt(days)
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Subscriptions</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          Create Subscription
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Expires At</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.id}</td>
                    <td>
                      {sub.user_name || sub.user_email}
                      <br />
                      <small style={{ color: '#718096' }}>{sub.user_email}</small>
                    </td>
                    <td>
                      <span className={`badge ${
                        sub.plan === 'elite' ? 'badge-success' :
                        sub.plan === 'pro' ? 'badge-warning' : ''
                      }`}>
                        {sub.plan.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        sub.status === 'active' ? 'badge-success' :
                        sub.status === 'expired' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '-'}</td>
                    <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {data?.total_pages}</span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => p + 1)}
                disabled={page === data?.total_pages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
