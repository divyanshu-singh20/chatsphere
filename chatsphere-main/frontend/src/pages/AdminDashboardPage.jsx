import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiXCircle, FiSlash, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import StatCard from '../components/StatCard';
import { getSocket } from '../services/socket';
import { SOCKET_EVENTS } from '../utils/constants';

const actionConfig = {
  approve: {
    label: 'Approve',
    icon: FiCheckCircle,
    className: 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
  },
  reject: {
    label: 'Reject',
    icon: FiXCircle,
    className: 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
  },
  block: {
    label: 'Block',
    icon: FiSlash,
    className: 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
  },
  unblock: {
    label: 'Unblock',
    icon: FiCheckCircle,
    className: 'bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
  }
};

const statusTone = {
  pending: 'bg-amber-500/15 text-amber-200',
  approved: 'bg-emerald-500/15 text-emerald-200',
  rejected: 'bg-slate-500/20 text-slate-200',
  blocked: 'bg-rose-500/15 text-rose-200'
};

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [userList, setUserList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');

  const dedupeUsersById = useCallback((list = []) => {
    const seen = new Set();
    return list.filter((entry) => {
      const id = Number(entry?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, []);

  const mergePendingUserIntoState = useCallback((payload) => {
    const pendingUser = payload?.user || payload;
    if (!pendingUser?.id) return;

    const status = pendingUser.status || payload?.status || 'pending';
    setDashboard((current) => {
      if (!current) return current;

      const isNewPending = status === 'pending';
      const next = {
        ...current,
        totalUsers: isNewPending ? Number(current.totalUsers || 0) + 1 : current.totalUsers,
        pendingUsers: isNewPending ? Number(current.pendingUsers || 0) + 1 : current.pendingUsers,
        approvedUsers: current.approvedUsers,
        rejectedUsers: current.rejectedUsers,
        blockedUsers: current.blockedUsers,
        recentUsers: dedupeUsersById([pendingUser, ...(current.recentUsers || [])]).slice(0, 12)
      };
      return next;
    });

    setUserList((current) => {
      const nextUsers = [pendingUser, ...current.filter((entry) => Number(entry.id) !== Number(pendingUser.id))];
      if (activeFilter && activeFilter !== 'all' && activeFilter !== status) {
        return current;
      }
      return dedupeUsersById(nextUsers);
    });
  }, [activeFilter, dedupeUsersById]);

  const loadDashboard = async () => {
    const { data } = await api.get('/admin/dashboard');
    setDashboard(data.dashboard);
  };

  const loadUsers = async (filter = activeFilter) => {
    const params = filter && filter !== 'all' ? { status: filter } : undefined;
    const { data } = await api.get('/admin/users', { params });
    setUserList(data.users || []);
    return data.users || [];
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const [dashboardResponse, users] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users', { params: activeFilter && activeFilter !== 'all' ? { status: activeFilter } : undefined })
        ]);

        if (!mounted) return;

        setDashboard(dashboardResponse.data.dashboard);
        setUserList(users.data.users || []);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load admin dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      const token = localStorage.getItem('chatsphere_token') || localStorage.getItem('token');
      if (token) socket.auth = { token };
      socket.connect();
    }

    const handlePendingUserAdded = (payload) => {
      mergePendingUserIntoState(payload);
    };

    socket.off('pending-user-added');
    socket.off('user:registered');
    socket.on('pending-user-added', handlePendingUserAdded);
    socket.on('user:registered', handlePendingUserAdded);

    return () => {
      socket.off('pending-user-added', handlePendingUserAdded);
      socket.off('user:registered', handlePendingUserAdded);
    };
  }, [mergePendingUserIntoState]);

  const runAction = async (action, userId) => {
    console.log('admin action start', action, userId);
    setBusyKey(`${action}:${userId}`);

    const previousUserList = userList;
    setUserList((list) => list.map((u) => (u.id === userId ? { ...u, status: action === 'unblock' || action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'block' ? 'blocked' : u.status } : u)));

    try {
      const { data } = await api.patch(`/admin/${action}/${userId}`);
      toast.success(data?.message || 'User updated');

      setDashboard((current) => {
        if (!current) return current;
        const nextStatus = action === 'unblock' || action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'block' ? 'blocked' : undefined;
        if (!nextStatus) return current;

        const delta = {
          pending: action === 'approve' || action === 'reject' || action === 'block' ? -1 : 0,
          approved: action === 'approve' || action === 'unblock' ? 1 : action === 'block' ? -1 : 0,
          rejected: action === 'reject' ? 1 : 0,
          blocked: action === 'block' ? 1 : action === 'unblock' ? -1 : 0
        };

        return {
          ...current,
          pendingUsers: Math.max(0, Number(current.pendingUsers || 0) + delta.pending),
          approvedUsers: Math.max(0, Number(current.approvedUsers || 0) + delta.approved),
          rejectedUsers: Math.max(0, Number(current.rejectedUsers || 0) + delta.rejected),
          blockedUsers: Math.max(0, Number(current.blockedUsers || 0) + delta.blocked)
        };
      });

      setUserList((current) => {
        const updated = current
          .map((entry) => (Number(entry.id) === Number(userId) ? { ...entry, status: action === 'unblock' || action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'blocked' } : entry))
          .filter((entry) => activeFilter === 'all' || activeFilter === entry.status);
        return dedupeUsersById(updated);
      });
    } catch (error) {
      // revert optimistic update on failure
      setUserList(previousUserList);
      const msg = error?.response?.data?.message || 'Action failed';
      toast.error(msg);
      console.error('admin action failed', action, userId, error);
    } finally {
      setBusyKey('');
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    loadUsers(filter).catch((error) => {
      toast.error(error?.response?.data?.message || 'Failed to load users');
    });
  };

  const getRecentUserAction = (recentUser) => {
    if (recentUser.role === 'admin') return null;
    if (recentUser.status === 'blocked') {
      return 'unblock';
    }

    return 'block';
  };

  if (loading) {
    return <LoadingScreen label="Loading admin dashboard" />;
  }

  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(10,132,255,0.18),transparent_30%),linear-gradient(180deg,rgba(8,8,8,1),rgba(14,14,14,1))] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(16,16,16,0.9)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--wa-primary)]">Admin console</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Approval dashboard</h1>
            <p className="mt-1 text-sm text-[var(--wa-text-secondary)]">Review pending registrations and keep the workspace clean.</p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-[rgba(10,132,255,0.2)]" />
            <div>
              <p className="text-sm font-medium text-white">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-[var(--wa-text-secondary)]">{user?.email || 'admin@chatapp.com'}</p>
            </div>
            <button onClick={() => logout()} className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--wa-border)] text-[var(--wa-text-secondary)] transition hover:text-white">
              <FiLogOut />
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total users" value={dashboard?.totalUsers ?? 0} onClick={() => handleFilterClick('all')} active={activeFilter === 'all'} />
          <StatCard label="Pending" value={dashboard?.pendingUsers ?? 0} delta="Review now" onClick={() => handleFilterClick('pending')} active={activeFilter === 'pending'} />
          <StatCard label="Approved" value={dashboard?.approvedUsers ?? 0} onClick={() => handleFilterClick('approved')} active={activeFilter === 'approved'} />
          <StatCard label="Rejected" value={dashboard?.rejectedUsers ?? 0} onClick={() => handleFilterClick('rejected')} active={activeFilter === 'rejected'} />
          <StatCard label="Blocked" value={dashboard?.blockedUsers ?? 0} onClick={() => handleFilterClick('blocked')} active={activeFilter === 'blocked'} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(16,16,16,0.9)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Pending approvals</h2>
                <p className="mt-1 text-sm text-[var(--wa-text-secondary)]">New users stay locked until you approve them.</p>
              </div>
              <span className="rounded-full border border-[rgba(10,132,255,0.22)] bg-[rgba(10,132,255,0.12)] px-3 py-1 text-xs uppercase tracking-[0.28em] text-[var(--wa-primary)]">
                {dashboard?.pendingUsers ?? 0} waiting
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {userList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-8 text-center text-sm text-[var(--wa-text-secondary)]">
                  No users match this filter
                </div>
              ) : (
                userList.map((u) => (
                  <div key={u.id} className="rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(10,132,255,0.16)] text-sm font-semibold text-white">
                          {(u.fullName || u.username || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{u.fullName}</p>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] ${statusTone[u.status] || statusTone.pending}`}>
                              {u.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--wa-text-secondary)]">@{u.username} · {u.email}</p>
                          <p className="mt-1 text-xs text-[var(--wa-text-secondary)]">Joined {new Date(u.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/** actions depend on status */}
                        {u.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={busyKey === `approve:${u.id}`}
                              onClick={() => runAction('approve', u.id)}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.approve.className}`}>
                              {(() => { const Icon = actionConfig.approve.icon; return <Icon />; })()}
                              {busyKey === `approve:${u.id}` ? 'Approving...' : actionConfig.approve.label}
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `reject:${u.id}`}
                              onClick={() => runAction('reject', u.id)}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.reject.className}`}>
                              {(() => { const Icon = actionConfig.reject.icon; return <Icon />; })()}
                              {busyKey === `reject:${u.id}` ? 'Rejecting...' : actionConfig.reject.label}
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `block:${u.id}`}
                              onClick={() => runAction('block', u.id)}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.block.className}`}>
                              {(() => { const Icon = actionConfig.block.icon; return <Icon />; })()}
                              {busyKey === `block:${u.id}` ? 'Blocking...' : actionConfig.block.label}
                            </button>
                          </>
                        )}

                        {u.status === 'approved' && (
                          <button
                            type="button"
                            disabled={busyKey === `block:${u.id}`}
                            onClick={() => runAction('block', u.id)}
                            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.block.className}`}>
                            {(() => { const Icon = actionConfig.block.icon; return <Icon />; })()}
                            {busyKey === `block:${u.id}` ? 'Blocking...' : actionConfig.block.label}
                          </button>
                        )}

                        {u.status === 'rejected' && (
                          <>
                            <button
                              type="button"
                              disabled={busyKey === `approve:${u.id}`}
                              onClick={() => runAction('approve', u.id)}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.approve.className}`}>
                              {(() => { const Icon = actionConfig.approve.icon; return <Icon />; })()}
                              {busyKey === `approve:${u.id}` ? 'Approving...' : actionConfig.approve.label}
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `block:${u.id}`}
                              onClick={() => runAction('block', u.id)}
                              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.block.className}`}>
                              {(() => { const Icon = actionConfig.block.icon; return <Icon />; })()}
                              {busyKey === `block:${u.id}` ? 'Blocking...' : actionConfig.block.label}
                            </button>
                          </>
                        )}

                        {u.status === 'blocked' && (
                          <button
                            type="button"
                            disabled={busyKey === `unblock:${u.id}`}
                            onClick={() => runAction('unblock', u.id)}
                            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionConfig.unblock.className}`}>
                            {(() => { const Icon = actionConfig.unblock.icon; return <Icon />; })()}
                            {busyKey === `unblock:${u.id}` ? 'Unblocking...' : actionConfig.unblock.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(16,16,16,0.9)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <h2 className="text-xl font-semibold text-white">Recent users</h2>
            <p className="mt-1 text-sm text-[var(--wa-text-secondary)]">A quick view of the newest account activity.</p>

            <div className="mt-5 space-y-3">
              {(dashboard?.recentUsers || []).slice(0, 8).map((recentUser) => {
                const recentAction = getRecentUserAction(recentUser);
                const recentActionConfig = recentAction ? actionConfig[recentAction] : null;
                const recentBusy = recentAction ? busyKey === `${recentAction}:${recentUser.id}` : false;

                return (
                  <div key={recentUser.id} className="rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{recentUser.fullName}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] ${statusTone[recentUser.status] || statusTone.pending}`}>
                            {recentUser.status}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--wa-text-secondary)]">@{recentUser.username} · {recentUser.email}</p>
                      </div>

                      {recentAction && recentActionConfig ? (
                        (() => {
                          const Icon = recentActionConfig.icon;
                          return (
                        <button
                          type="button"
                          disabled={recentBusy}
                          onClick={() => runAction(recentAction, recentUser.id)}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${recentActionConfig.className}`}
                        >
                          <Icon />
                          {recentBusy ? (recentAction === 'unblock' ? 'Unblocking...' : 'Blocking...') : recentActionConfig.label}
                        </button>
                          );
                        })()
                      ) : (
                        <span className="inline-flex items-center rounded-2xl border border-[var(--wa-border)] px-4 py-2 text-sm text-[var(--wa-text-secondary)]">
                          No actions
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
