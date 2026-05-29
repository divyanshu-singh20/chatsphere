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

function MessageList({ messages, currentUserId, onReply, onReact, onEdit, onDelete }) {
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
    return <EmptyState variant="conversation" title="No messages yet" description="Send a text, photo, or voice note to start the chat." />;
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-1 py-4 md:px-2">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="space-y-3">
          <div className="message-separator animate-fadeIn">
            {formatDateSeparator(date)}
          </div>
          <div className="space-y-1.5">
            {dateMessages.map((message) => (
              <div key={message.id} className="animate-messageIn">
                <MessageBubble
                  message={message}
                  mine={message.senderId === currentUserId}
                  onReply={onReply}
                  onReact={onReact}
                  onEdit={onEdit}
                  onDelete={onDelete}
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