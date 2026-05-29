import { FiMoreVertical, FiPhone, FiSearch, FiSlash, FiVideo } from 'react-icons/fi';
import Avatar from './Avatar';
import useCall from '../hooks/useCall';
import { getPresenceLabel } from '../utils/lastSeen';
import { useAuth } from '../context/AuthContext';
import MobileAccountMenu from './MobileAccountMenu';

/* Design System: ChatHeader
 * - Responsive: 56px mobile, 60px desktop
 * - Colors: bg-[var(--wa-surface)], text-[var(--wa-text)], border-[var(--wa-border-strong)]
 * - Icons: 40px circular buttons with 18px icons
 * - Spacing: var(--space-lg) padding, var(--space-md) gaps
 * - Dark mode: Automatically supported via CSS variables
 */

export default function ChatHeader({ chat, onlineUsers = [], currentUserId, onBack, onBlockUser }) {
  const { call, startCall } = useCall();
  const { user, logout } = useAuth();

  if (!chat) {
    return (
      <div className="flex h-[60px] items-center justify-between border-b border-white/5 bg-[rgba(17,27,33,0.98)] px-[var(--space-lg)] py-[var(--space-md)]">
        <div>
          <p className="text-[14px] font-[var(--fw-semibold)] text-[var(--wa-text)]">Select a chat</p>
          <p className="text-[12px] text-[var(--wa-text-secondary)]">Your conversations appear here.</p>
        </div>
      </div>
    );
  }

  const isOnline = (chat.members || [])
    .filter((member) => Number(member?.id) !== Number(currentUserId))
    .some((member) => onlineUsers.includes(member.id));
  const isDirectChat = !chat.isGroup && (chat.members || []).length <= 2;
  const callDisabled = !isDirectChat || call.status !== 'idle';
  const peer = (chat.members || []).find((member) => Number(member?.id) !== Number(currentUserId)) || chat;
  const presenceLabel = getPresenceLabel({ isOnline, lastSeenAt: peer?.lastSeenAt || chat.lastSeenAt });

  return (
    <div className="flex h-[60px] items-center justify-between border-b border-white/5 bg-[rgba(17,27,33,0.98)] px-[var(--space-lg)] py-[var(--space-md)] transition-all md:h-[60px] lg:h-[60px]">
      <div className="flex items-center gap-[var(--space-md)] min-w-0">
        <button onClick={() => (typeof onBack === 'function' ? onBack() : window.history.back())} className="lg:hidden md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[var(--wa-green)] transition-all active:scale-95 hover:bg-white/10" aria-label="Back to chats">
          ←
        </button>
        <Avatar src={chat.avatar} name={chat.name} online={isOnline} size="header" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] md:text-[15px] font-[var(--fw-semibold)] text-[var(--wa-text)] truncate">{chat.name}</p>
          <p className={`text-[12px] truncate ${isOnline ? 'text-[var(--wa-accent)]' : 'text-[var(--wa-text-secondary)]'}`}>{presenceLabel}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 text-[var(--wa-text-secondary)]">
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[18px] text-[var(--wa-green)] transition-all active:scale-95 hover:bg-white/10" title="Search in chat" aria-label="Search in chat">
          <FiSearch />
        </button>
        <button
          disabled={callDisabled}
          onClick={() => startCall({ chat, type: 'voice' })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[18px] text-[var(--wa-green)] transition-all active:scale-95 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          title="Voice call"
          aria-label="Start voice call"
        >
          <FiPhone />
        </button>
        <button
          disabled={callDisabled}
          onClick={() => startCall({ chat, type: 'video' })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[18px] text-[var(--wa-green)] transition-all active:scale-95 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          title="Video call"
          aria-label="Start video call"
        >
          <FiVideo />
        </button>
        {isDirectChat ? (
          <button
            type="button"
            onClick={() => onBlockUser?.(chat)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 text-[13px] font-medium text-rose-200 transition-all active:scale-95 hover:bg-rose-500/15"
            title="Block user"
            aria-label="Block user"
          >
            <FiSlash />
            Block
          </button>
        ) : null}
        <div className="lg:hidden">
          <MobileAccountMenu user={user} logout={logout} />
        </div>
        <button className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[18px] text-[var(--wa-green)] transition-all active:scale-95 hover:bg-white/10 lg:inline-flex" title="More options" aria-label="More options">
          <FiMoreVertical />
        </button>
      </div>
    </div>
  );
}