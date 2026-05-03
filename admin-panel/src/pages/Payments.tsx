import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Payment, PaginatedResponse } from '../types';

export default function Payments() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ['payments', page, status],
    queryFn: () => adminAPI.getPayments({ page, page_size: 20, status }).then(r => r.data)
  });

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Payments</h1>

      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
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
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Provider</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.user_email}</td>
                    <td>
                      {payment.amount.toFixed(2)} {payment.currency}
                    </td>
                    <td>
                      <span className={`badge ${
                        payment.status === 'completed' ? 'badge-success' :
                        payment.status === 'failed' ? 'badge-danger' :
                        payment.status === 'refunded' ? 'badge-warning' : ''
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.provider}</td>
                    <td>{new Date(payment.created_at).toLocaleString()}</td>
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
