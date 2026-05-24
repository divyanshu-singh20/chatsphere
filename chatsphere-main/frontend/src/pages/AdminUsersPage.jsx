import { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiShield, FiUserCheck, FiUserX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import api from '../services/api';
import { Input, PrimaryButton } from '../components/ui';

const statusStyles = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  approved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  blocked: 'border-rose-400/30 bg-rose-400/10 text-rose-200'
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 220);

  const filtered = useMemo(() => users, [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { q: debouncedQuery } });
      setUsers(data.users || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const updateStatus = async (userId, action) => {
    setBusyId(userId);
    try {
      const { data } = await api.put(`/admin/user/${userId}/${action}`);
      setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...data.user } : user)));
      toast.success(`User ${action === 'approve' ? 'approved' : action === 'block' ? 'blocked' : 'reset to pending'}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update user');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] border border-[var(--wa-border)] bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.16),transparent_36%),linear-gradient(180deg,rgba(15,15,15,0.96),rgba(8,8,8,0.96))] p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--wa-text-secondary)]">Moderation console</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Admin user approvals</h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--wa-text-secondary)]">Approve new users, block abusive accounts, and reset users back to pending when needed.</p>
            </div>
            <div className="w-full sm:max-w-sm">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--wa-text-secondary)]" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, username, email, phone" className="pl-11" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(255,255,255,0.03)] p-8 text-center text-[var(--wa-text-secondary)]">Loading users...</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((user) => (
              <div key={user.id} className="rounded-[1.75rem] border border-[var(--wa-border)] bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--wa-border)] bg-[rgba(255,255,255,0.04)] text-lg font-semibold text-white">
                      {String(user.fullName || user.username || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">{user.fullName}</h2>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] ${statusStyles[user.status] || statusStyles.pending}`}>
                          {user.status}
                        </span>
                        <span className="rounded-full border border-[var(--wa-border)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--wa-text-secondary)]">
                          {user.role}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--wa-text-secondary)]">@{user.username} · {user.email} · {user.phoneNumber}</p>
                      <p className="mt-2 max-w-2xl text-sm text-[var(--wa-text-secondary)]">{user.bio || 'No bio provided.'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <PrimaryButton type="button" disabled={busyId === user.id || user.status === 'approved'} onClick={() => updateStatus(user.id, 'approve')} className="bg-[rgba(16,185,129,0.9)] hover:bg-[rgba(16,185,129,1)]">
                      <FiUserCheck className="mr-2" /> Approve
                    </PrimaryButton>
                    <PrimaryButton type="button" disabled={busyId === user.id || user.status === 'blocked'} onClick={() => updateStatus(user.id, 'block')} className="bg-[rgba(244,63,94,0.92)] hover:bg-[rgba(244,63,94,1)]">
                      <FiUserX className="mr-2" /> Block
                    </PrimaryButton>
                    <PrimaryButton type="button" disabled={busyId === user.id || user.status === 'pending'} onClick={() => updateStatus(user.id, 'pending')} className="bg-[rgba(245,158,11,0.92)] hover:bg-[rgba(245,158,11,1)]">
                      <FiShield className="mr-2" /> Pending
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            ))}

            {!filtered.length ? (
              <div className="rounded-[1.75rem] border border-[var(--wa-border)] bg-[rgba(255,255,255,0.03)] p-8 text-center text-[var(--wa-text-secondary)]">No users match your search.</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
