import { memo } from 'react';
import Avatar from './Avatar';

const formatTime = (value) => {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const defaultReactions = ['👍', '❤️', '😂', '😮'];

const MessageBubbleComponent = ({ message, mine, onReply, onReact, onEdit, onDelete }) => {
  const isAudioMessage = message.mediaType === 'audio';
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const statusText = message.deletedForEveryone
    ? 'Deleted'
    : message.status === 'seen' || message.seenAt
      ? 'Seen'
      : message.status === 'delivered' || message.deliveredAt
        ? 'Delivered'
        : message.status === 'sent'
          ? 'Sent'
          : '';

  return (
    <div className={`flex min-w-0 w-full items-end gap-2 transition-all ${mine ? 'justify-end' : 'justify-start'} group`}>
      {!mine ? (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Avatar src={message.sender?.avatar} name={message.sender?.fullName} size="sm" />
        </div>
      ) : null}
      
      <div className={`flex min-w-0 w-full flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <div className={`inline-flex w-fit max-w-[70%] min-w-0 flex-col gap-1.5 whitespace-normal break-words px-4 py-3 md:max-w-[60%] lg:max-w-[45%] ${mine ? 'rounded-2xl rounded-br-md bubble-sent' : 'rounded-2xl rounded-bl-md bubble-received'} transition-all duration-200 hover:translate-y-[-1px] animate-slideInUp`}>
          {message.replyTo ? (
            <div className="mb-[var(--space-md)] pb-[var(--space-md)] border-l-2 border-current border-opacity-30 pl-[var(--space-md)]">
              <p className="text-[11px] opacity-75 font-[var(--fw-medium)]">Replying to</p>
              <p className="text-[11px] opacity-70 truncate">{message.replyTo.content}</p>
            </div>
          ) : null}
          
          {message.mediaUrl ? (
            message.mediaType === 'image' ? (
              <div className="mb-[var(--space-md)] rounded-[var(--radius-md)] overflow-hidden max-h-64">
                <img src={message.mediaUrl} alt="attachment" className="w-full h-auto object-cover transition-transform hover:scale-105" loading="lazy" />
              </div>
            ) : isAudioMessage ? (
              <div className="mb-[var(--space-md)] space-y-2 rounded-[var(--radius-md)] border border-current border-opacity-15 bg-black/5 px-[var(--space-md)] py-[var(--space-sm)]">
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.25em] text-[var(--wa-text-secondary)]">
                  <span>Voice note</span>
                  <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-80">
                    Open
                  </a>
                </div>
                <audio controls preload="metadata" className="w-full min-w-0" src={message.mediaUrl} />
              </div>
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="mb-[var(--space-md)] block rounded-[var(--radius-md)] border border-current border-opacity-20 px-[var(--space-md)] py-[var(--space-sm)] text-[13px] underline transition-all hover:opacity-80">
                📎 Open attachment
              </a>
            )
          ) : null}
          
          {message.content ? (
            <p className={`whitespace-pre-wrap break-words leading-relaxed text-[14px] ${message.deletedForEveryone ? 'italic opacity-75' : 'text-[var(--wa-text)]'}`}>{message.content}</p>
          ) : null}

          {reactions.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {reactions.map((reaction) => (
                <button
                  type="button"
                  key={reaction.emoji}
                  onClick={() => onReact?.(message, reaction.emoji)}
                  className="inline-flex items-center gap-1 rounded-full border border-current border-opacity-10 bg-black/5 px-2 py-1 text-[11px] leading-none transition hover:bg-black/10"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count || 1}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
            {defaultReactions.map((emoji) => (
              <button key={emoji} type="button" onClick={() => onReact?.(message, emoji)} className="rounded-full border border-current border-opacity-10 bg-black/5 px-2 py-1 text-[11px] leading-none hover:bg-black/10">
                {emoji}
              </button>
            ))}
            <button type="button" onClick={() => onReply?.(message)} className="rounded-full border border-current border-opacity-10 bg-black/5 px-2 py-1 text-[11px] leading-none hover:bg-black/10">
              Reply
            </button>
            {mine ? (
              <>
                <button type="button" onClick={() => onEdit?.(message)} className="rounded-full border border-current border-opacity-10 bg-black/5 px-2 py-1 text-[11px] leading-none hover:bg-black/10">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete?.(message)} className="rounded-full border border-current border-opacity-10 bg-black/5 px-2 py-1 text-[11px] leading-none hover:bg-black/10">
                  Delete
                </button>
              </>
            ) : null}
          </div>
          
          <div className="mt-0 flex items-center justify-end gap-[var(--space-xs)] whitespace-nowrap text-[11px] leading-none text-[var(--wa-text-secondary)]">
            <span>{formatTime(message.createdAt || Date.now())}</span>
            {mine ? <span className="font-[var(--fw-semibold)] text-[var(--wa-primary)]">{message.seenAt ? '✓✓' : message.deliveredAt ? '✓✓' : '✓'}</span> : null}
            {statusText ? <span className="uppercase tracking-[0.18em]">{statusText}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MessageBubbleComponent);