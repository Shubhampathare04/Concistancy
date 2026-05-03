import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { User, PaginatedResponse } from '../types';

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', page, search, status],
    queryFn: () => adminAPI.getUsers({ page, page_size: 20, search, status }).then(r => r.data)
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminAPI.banUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const unbanMutation = useMutation({
    mutationFn: (id: number) => adminAPI.unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const handleBan = (id: number) => {
    const reason = prompt('Ban reason:');
    if (reason) banMutation.mutate({ id, reason });
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 200 }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="inactive">Inactive</option>
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
                  <th>Email</th>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Streak</th>
                  <th>Completions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.name || '-'}</td>
                    <td>{user.level}</td>
                    <td>{user.current_streak}</td>
                    <td>{user.total_completions}</td>
                    <td>
                      {user.banned_at ? (
                        <span className="badge badge-danger">Banned</span>
                      ) : user.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-warning">Inactive</span>
                      )}
                    </td>
                    <td>
                      {user.banned_at ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => unbanMutation.mutate(user.id)}
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleBan(user.id)}
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          Ban
                        </button>
                      )}
                    </td>
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
