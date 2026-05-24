import { useMemo } from 'react';
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

export default function MessageList({ messages, currentUserId }) {
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

  if (!uniqueMessages.length) {
    return <EmptyState title="No messages yet" description="Start the conversation with a text, image, or voice note." />;
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-2 py-4">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="message-separator animate-fadeIn">
            {formatDateSeparator(date)}
          </div>
          <div className="space-y-1">
            {dateMessages.map((message) => (
              <div key={message.id} className="animate-slideInUp">
                <MessageBubble message={message} mine={message.senderId === currentUserId} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}