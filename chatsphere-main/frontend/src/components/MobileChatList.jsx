import { memo, useMemo } from 'react';
import Avatar from './Avatar';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MobileChatList({ chats = [], onlineUsers = [], currentUserId, onSelectChat, loading = false }) {
  const uniqueChats = useMemo(() => {
    const seen = new Set();
    return chats.filter((chat) => {
      const id = Number(chat?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [chats]);

  if (loading) {
    return <div className="px-4 py-8 text-center text-sm text-[var(--wa-text-secondary)]">Loading chats...</div>;
  }

  if (!uniqueChats.length) {
    return <div className="px-4 py-8 text-center text-sm text-[var(--wa-text-secondary)]">No chats yet.</div>;
  }

  return (
    <div className="space-y-1 px-2 pb-3 pt-2">
      {uniqueChats.map((chat) => {
        const isOnline = (chat.members || [])
          .filter((member) => Number(member?.id) !== Number(currentUserId))
          .some((member) => member?.isOnline || onlineUsers.includes(Number(member.id)));
        const unreadCount = Number(chat.unreadCount || 0);
        const lastMessage = chat.lastMessage?.content || chat.lastMessage?.text || 'Start a conversation';
        const timeLabel = formatTime(chat.lastMessage?.createdAt || chat.updatedAt || chat.lastMessageAt);

        return (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelectChat?.(chat)}
            className="flex w-full items-center gap-3 rounded-[24px] border border-transparent px-3 py-3 text-left transition-all duration-200 active:scale-[0.99] active:bg-[var(--wa-card-hover)] hover:-translate-y-0.5 hover:border-white/5 hover:bg-[rgba(255,255,255,0.04)]"
          >
            <Avatar src={chat.avatar} name={chat.name} online={isOnline} size="md" />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-[15px] font-semibold text-[var(--wa-text)]">{chat.name}</p>
                <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
                  <span className="text-[11px] text-[var(--wa-text-secondary)]">{timeLabel}</span>
                  {unreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--wa-green)] px-1.5 text-[11px] font-semibold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 truncate text-[13px] leading-5 text-[var(--wa-text-secondary)]">
                {lastMessage}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default memo(MobileChatList);
