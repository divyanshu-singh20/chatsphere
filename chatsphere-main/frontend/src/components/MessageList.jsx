import { memo, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import EmptyState from './EmptyState';

const formatDateSeparator = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  
  const isToday = 
    now.getDate() === messageDate.getDate() &&
    now.getMonth() === messageDate.getMonth() &&
    now.getFullYear() === messageDate.getFullYear();
    
  const isYesterday = 
    now.getDate() - messageDate.getDate() === 1 &&
    now.getMonth() === messageDate.getMonth() &&
    now.getFullYear() === messageDate.getFullYear();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  
  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const groupMessagesByDate = (messages) => {
  if (!messages || messages.length === 0) return {};
  
  const groups = {};
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  });
  return groups;
};

function MessageList({ messages, currentUserId }) {
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return (messages || []).filter((message) => {
      const id = Number(message?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [messages]);

  const messageGroups = useMemo(() => groupMessagesByDate(uniqueMessages), [uniqueMessages]);
  const isMine = (message) => Number(message?.senderId) === Number(currentUserId);

  if (!uniqueMessages.length) {
    return <EmptyState variant="conversation" title="No messages yet" description="Send a text, photo, or voice note to start the chat." />;
  }

  return (
    <div className="flex w-full flex-col gap-1 px-2 py-1 md:px-2">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="space-y-1.5">
          <div className="message-separator sticky top-0 z-10 mx-auto w-fit rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
            {formatDateSeparator(date)}
          </div>
          <div className="space-y-1">
            {dateMessages.map((message) => (
              <div key={message.id} className="animate-messageIn px-0">
                <MessageBubble
                  message={message}
                  mine={isMine(message)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(MessageList);