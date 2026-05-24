import { FiMoreVertical, FiPhone, FiSearch, FiVideo } from 'react-icons/fi';
import Avatar from './Avatar';
import useCall from '../hooks/useCall';
import { getPresenceLabel } from '../utils/lastSeen';

/* Design System: ChatHeader
 * - Responsive: 56px mobile, 60px desktop
 * - Colors: bg-[var(--wa-surface)], text-[var(--wa-text)], border-[var(--wa-border-strong)]
 * - Icons: 40px circular buttons with 18px icons
 * - Spacing: var(--space-lg) padding, var(--space-md) gaps
 * - Dark mode: Automatically supported via CSS variables
 */

export default function ChatHeader({ chat, onlineUsers = [], currentUserId, onBack }) {
  const { call, startCall } = useCall();

  if (!chat) {
    return (
      <div className="flex h-[60px] items-center justify-between border-b border-[var(--wa-border-strong)] bg-[var(--wa-chat-bg)] px-[var(--space-lg)] py-[var(--space-md)]">
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
    <div className="flex h-[60px] items-center justify-between border-b border-[var(--wa-border-strong)] bg-[var(--wa-chat-bg)] px-[var(--space-lg)] py-[var(--space-md)] transition-all md:h-[60px] lg:h-[60px]">
      <div className="flex items-center gap-[var(--space-md)] min-w-0">
        <button onClick={() => (typeof onBack === 'function' ? onBack() : window.history.back())} className="lg:hidden md:hidden inline-flex h-11 w-11 items-center justify-center rounded-[9999px] bg-[var(--wa-card-hover)] text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.12)]" aria-label="Back to chats">
          ←
        </button>
        <Avatar src={chat.avatar} name={chat.name} online={isOnline} size="header" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] md:text-[15px] font-[var(--fw-semibold)] text-[var(--wa-text)] truncate">{chat.name}</p>
          <p className={`text-[12px] truncate ${isOnline ? 'text-[var(--wa-accent)]' : 'text-[var(--wa-text-secondary)]'}`}>{presenceLabel}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 text-[var(--wa-text-secondary)]">
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.14)]" title="Search in chat" aria-label="Search in chat">
          <FiSearch />
        </button>
        <button
          disabled={callDisabled}
          onClick={() => startCall({ chat, type: 'voice' })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.14)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          title="Voice call"
          aria-label="Start voice call"
        >
          <FiPhone />
        </button>
        <button
          disabled={callDisabled}
          onClick={() => startCall({ chat, type: 'video' })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.14)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          title="Video call"
          aria-label="Start video call"
        >
          <FiVideo />
        </button>
        <button className="inline-flex h-11 w-11 items-center justify-center rounded-[9999px] text-[18px] text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.14)]" title="More options" aria-label="More options">
          <FiMoreVertical />
        </button>
      </div>
    </div>
  );
}