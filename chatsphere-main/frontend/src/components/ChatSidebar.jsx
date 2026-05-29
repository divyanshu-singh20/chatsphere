import { FiSearch, FiUsers } from 'react-icons/fi';
import Avatar from './Avatar';
import { Input } from './ui';
import useDebounce from '../hooks/useDebounce';
import { useMemo, useState, memo } from 'react';
import { getPresenceLabel } from '../utils/lastSeen';

const getEntityId = (entry) => {
  const rawId = entry?.id ?? entry?._id ?? null;
  const parsedId = Number(rawId);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
};

function ChatSidebar({ chats, users = [], selectedChat, onSelect, onlineUsers = [], currentUserId, loading, onStartDirect, loadingUsers }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const filteredChats = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat) => {
      const target = [chat.name, chat.lastMessage?.content, ...(chat.members || []).map((member) => member.fullName)].join(' ').toLowerCase();
      return target.includes(query);
    });
  }, [chats, debouncedSearch]);

  const directChatUserIds = useMemo(() => {
    const ids = new Set();
    (chats || []).forEach((chat) => {
      if (chat?.isGroup) return;
      (chat.members || []).forEach((member) => {
        const id = getEntityId(member);
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [chats]);

  const uniqueUsers = useMemo(() => {
    const seen = new Set();
    return (users || []).filter((entry) => {
      const id = getEntityId(entry);
      if (!id || seen.has(id)) return false;
      if (directChatUserIds.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [users, directChatUserIds]);

  const uniqueChats = useMemo(() => {
    const seen = new Set();
    return (filteredChats || []).filter((chat) => {
      const id = Number(chat?.id);
      if (!id) return false;

      const memberIds = (chat.members || [])
        .map((member) => Number(member?.id))
        .filter((value) => Number.isInteger(value) && value > 0);

      const key = chat?.isGroup
        ? `group:${id}`
        : `direct:${Array.from(new Set(memberIds)).sort((a, b) => a - b).join(':') || id}`;

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [filteredChats]);

  return (
    <div className="flex h-screen flex-col bg-[rgba(17,27,33,0.98)]">
      <div className="flex h-16 items-center justify-between border-b border-white/5 bg-[rgba(17,27,33,0.98)] px-4 py-2 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-semibold text-[var(--wa-text)]">Chats</h2>
          <p className="text-xs text-[var(--wa-muted)]">{onlineUsers.length} online</p>
        </div>
        <div className="flex gap-1">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[var(--wa-green)] transition hover:bg-white/10"><FiSearch /></button>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/5 text-[var(--wa-green)] transition hover:bg-white/10"><FiUsers /></button>
        </div>
      </div>
      <div className="px-4 py-3 border-b border-[var(--wa-border)]">
        <div className="relative">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search or start new chat" className="rounded-full border border-white/5 bg-[rgba(32,44,51,0.92)] pl-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]" />
        </div>
      </div>
      <div className="mt-0 flex-1 overflow-y-auto px-2 py-2 wa-scroll">
        {/* Users list */}
        {loadingUsers ? <div className="py-2 text-center text-[var(--wa-text-secondary)]">Loading users...</div> : null}
        {!loadingUsers && uniqueUsers.length === 0 ? <div className="py-2 text-center text-[var(--wa-text-secondary)]">No users found.</div> : null}
        {uniqueUsers.map((u) => {
          const userId = getEntityId(u);
          const isActive = selectedChat?.members?.some((m) => getEntityId(m) === userId) && !selectedChat?.isGroup;
          const isOnline = onlineUsers.includes(userId);
          const presenceLabel = getPresenceLabel({ isOnline, lastSeenAt: u.lastSeenAt });
          return (
            <button
              key={`user-${userId}`}
              onClick={async () => {
                if (onStartDirect && userId) await onStartDirect(userId);
              }}
              className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-2.5 transition-all duration-200 ${isActive ? 'chat-left-active bg-[rgba(37,211,102,0.12)]' : 'hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]'}`}
            >
              <Avatar src={u.avatar} name={u.fullName} online={isOnline} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-[14px] text-[var(--wa-text)]">{u.fullName || u.username}</p>
                </div>
                <p className={`truncate text-[13px] ${isOnline ? 'text-[var(--wa-accent)]' : 'text-[var(--wa-muted)]'}`}>{presenceLabel}</p>
              </div>
            </button>
          );
        })}

        {loading ? <div className="py-8 text-center text-[var(--wa-text-secondary)]">Loading chats...</div> : null}
        {!loading && uniqueChats.length === 0 ? (
          <div className="py-8 text-center text-[var(--wa-text-secondary)]">No chats found.</div>
        ) : null}
        {uniqueChats.map((chat) => {
          const isActive = selectedChat?.id === chat.id;
          const isOnline = (chat.members || [])
            .filter((member) => getEntityId(member) !== Number(currentUserId))
            .some((member) => onlineUsers.includes(getEntityId(member)));
          const peer = (chat.members || []).find((member) => getEntityId(member) !== Number(currentUserId)) || chat;
          const presenceLabel = getPresenceLabel({ isOnline, lastSeenAt: peer?.lastSeenAt || chat.lastSeenAt });
          const unreadCount = Number(chat.unreadCount || 0);
          return (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`flex w-full items-center gap-3 rounded-[20px] px-3 py-2.5 transition-all duration-200 ${isActive ? 'chat-left-active bg-[rgba(37,211,102,0.12)]' : 'hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]'}`}
            >
              <Avatar src={chat.avatar} name={chat.name} online={isOnline} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-[14px] text-[var(--wa-text)]">{chat.name}</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-[var(--wa-green)] px-2 py-0.5 text-xs font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                    <span className="text-xs text-[var(--wa-muted)]">{chat.updatedLabel || ''}</span>
                  </div>
                </div>
                <p className="truncate text-[13px] text-[var(--wa-muted)]">{chat.lastMessage?.content || presenceLabel || 'Start a conversation'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ChatSidebar);