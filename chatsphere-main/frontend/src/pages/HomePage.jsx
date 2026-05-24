import { useEffect, useMemo, useRef, useState } from 'react';
import useDebounce from '../hooks/useDebounce';
import HomeSearchBar from '../components/HomeSearchBar';
import MobileChatList from '../components/MobileChatList';

export default function HomePage({ chats = [], onlineUsers = [], currentUserId, onSelectChat, loading = false, storageKey = 'home-scroll' }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 180);
  const scrollRef = useRef(null);

  const filteredChats = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => {
      const haystack = [
        chat?.name,
        chat?.lastMessage?.content,
        chat?.lastMessage?.text,
        ...(chat?.members || []).map((member) => member?.fullName || member?.username)
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [chats, debouncedQuery]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const saved = Number(sessionStorage.getItem(storageKey) || 0);
    if (saved > 0) node.scrollTop = saved;

    const handleScroll = () => sessionStorage.setItem(storageKey, String(node.scrollTop));
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => node.removeEventListener('scroll', handleScroll);
  }, [storageKey]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--wa-bg)] text-[var(--wa-text)] lg:hidden">
      <HomeSearchBar value={query} onChange={setQuery} />

      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[92px] pt-[56px] wa-scroll">
        <MobileChatList
          chats={filteredChats}
          onlineUsers={onlineUsers}
          currentUserId={currentUserId}
          onSelectChat={onSelectChat}
          loading={loading}
        />
      </div>
    </div>
  );
}
