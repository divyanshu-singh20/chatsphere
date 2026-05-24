import { FiClock, FiPhone, FiPhoneIncoming, FiRefreshCw, FiVideo } from 'react-icons/fi';
import Avatar from '../Avatar';

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const formatTimestamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const statusLabel = (call) => {
  if (call.status === 'missed' || call.endedReason === 'missed') return 'Missed';
  if (call.status === 'rejected') return 'Rejected';
  if (call.status === 'ended') return 'Ended';
  if (call.status === 'accepted') return 'Connected';
  return 'Ringed';
};

export default function CallHistoryScreen({ calls = [], loading = false, onRefresh }) {
  return (
    <div className="glass-panel flex min-h-[calc(100dvh-2rem)] flex-col rounded-none border-0 p-4 lg:rounded-3xl lg:border lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">Call history</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">WhatsApp-style call log</h2>
        </div>
        <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[rgba(10,132,255,0.12)]">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? <div className="rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-6 text-center text-[var(--wa-text-secondary)]">Loading calls...</div> : null}

        {!loading && calls.length === 0 ? (
          <div className="rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-8 text-center text-[var(--wa-text-secondary)]">
            <FiPhone className="mx-auto text-3xl text-[var(--wa-text-secondary)]" />
            <p className="mt-4 text-lg font-medium text-white">No call history yet</p>
            <p className="mt-2 text-sm text-[var(--wa-text-secondary)]">Incoming, outgoing, missed, and connected calls will appear here.</p>
          </div>
        ) : null}

        {calls.map((call) => {
          const peer = call.counterpart || {};
          const isVideo = call.type === 'video';
          const incoming = call.direction === 'incoming';
          const missed = call.status === 'missed' || call.endedReason === 'missed';

          return (
            <div key={call.id} className="flex items-center gap-4 rounded-3xl border border-[var(--wa-border)] bg-[var(--wa-chat-bg)] p-4 transition hover:bg-[var(--wa-card-hover)]">
              <Avatar src={peer.avatar} name={peer.fullName || peer.username || 'User'} size="lg" />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{peer.fullName || peer.username || 'Unknown user'}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[var(--wa-text-secondary)]">
                      {incoming ? <FiPhoneIncoming className="text-[var(--wa-accent)]" /> : <FiPhone className="text-[var(--wa-primary)]" />}
                      {incoming ? 'Incoming' : 'Outgoing'} {isVideo ? 'video' : 'voice'} • {statusLabel(call)}
                    </p>
                  </div>

                  <div className="text-right text-xs text-[var(--wa-text-secondary)]">
                    <p className="inline-flex items-center gap-1 rounded-full border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-2 py-1 text-white">
                      {isVideo ? <FiVideo /> : <FiPhone />} {isVideo ? 'Video' : 'Voice'}
                    </p>
                    <p className="mt-2 flex items-center justify-end gap-1 text-[var(--wa-text-secondary)]"><FiClock /> {formatTimestamp(call.startedAt)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--wa-text-secondary)]">
                  <span className={`rounded-full px-2 py-1 ${missed ? 'bg-[rgba(255,69,58,0.15)] text-[#ff8f86]' : 'bg-[rgba(10,132,255,0.12)] text-white'}`}>{missed ? 'Missed call' : `${formatDuration(call.durationSeconds)} duration`}</span>
                  <span>{call.chat?.name || 'Direct call'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}